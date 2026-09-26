/**
 * Jalur Tarot - Bot Pendengar TikTok Live
 *
 * Listener berjalan terpisah dari Cloudflare Worker, misalnya di Termux.
 * Tugas:
 *   1. Terhubung ke live TikTok berdasarkan username.
 *   2. Mendengarkan event gift & like.
 *   3. Mengirim trigger yang cocok ke POST /api/live/trigger.
 *
 * Aturan trigger (rev11):
 *   - GIFT: dipicu oleh nilai koin gift (diamondCount x repeatCount), BUKAN
 *     nama gift tertentu saja - kecuali TARGET_GIFT_NAME diisi nama spesifik.
 *     Nilai koin >= THREE_CARD_MIN_VALUE -> tarik 3 kartu, selain itu 1 kartu.
 *   - LIKE: setiap total like di sesi live menembus kelipatan LIKE_MILESTONE
 *     (mis. 1000, 2000, ...), otomatis tarik 1 kartu untuk pengirim like
 *     terakhir pada event tersebut.
 *
 * Jalankan:
 *   npm install
 *   cp .env.example .env
 *   npm start
 */

import 'dotenv/config';
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';

const {
  TIKTOK_USERNAME,
  WORKER_URL,
  LIVE_SECRET,
  TARGET_GIFT_NAME = '',
  MIN_GIFT_VALUE = '1',
  THREE_CARD_MIN_VALUE = '5',
  LIKE_MILESTONE = '1000',
  DEFAULT_SPREAD = 'single',
  SIGN_API_KEY = '',
} = process.env;

function requireEnv(name, value) {
  if (!value?.trim()) {
    console.error(`ERROR: ${name} belum diisi di file .env - lihat .env.example`);
    process.exit(1);
  }
}

requireEnv('TIKTOK_USERNAME', TIKTOK_USERNAME);
requireEnv('WORKER_URL', WORKER_URL);
requireEnv('LIVE_SECRET', LIVE_SECRET);

const username = TIKTOK_USERNAME.trim().replace(/^@+/, '');
const workerUrl = WORKER_URL.trim().replace(/\/+$/, '');

// Kosong atau "*" berarti: semua nama gift diterima (dibedakan lewat nilai koin, bukan nama).
const targetGiftRaw = TARGET_GIFT_NAME.trim();
const targetGiftLower = targetGiftRaw && targetGiftRaw !== '*' ? targetGiftRaw.toLowerCase() : null;

const minGiftValue = Number.parseInt(MIN_GIFT_VALUE, 10);
const threeCardMinValue = Number.parseInt(THREE_CARD_MIN_VALUE, 10);
const likeMilestone = LIKE_MILESTONE.trim() ? Number.parseInt(LIKE_MILESTONE, 10) : 0;

if (!Number.isInteger(minGiftValue) || minGiftValue < 0) {
  console.error('ERROR: MIN_GIFT_VALUE harus berupa angka >= 0.');
  process.exit(1);
}

if (!Number.isInteger(threeCardMinValue) || threeCardMinValue < 1) {
  console.error('ERROR: THREE_CARD_MIN_VALUE harus berupa angka >= 1.');
  process.exit(1);
}

if (LIKE_MILESTONE.trim() && (!Number.isInteger(likeMilestone) || likeMilestone < 1)) {
  console.error('ERROR: LIKE_MILESTONE harus berupa angka >= 1 atau dikosongkan.');
  process.exit(1);
}

const defaultSpread = DEFAULT_SPREAD === 'three-card' ? 'three-card' : 'single';

console.log('Jalur Tarot - Bot TikTok Live');
console.log(`  Akun target      : @${username}`);
console.log(`  Worker           : ${workerUrl}`);
console.log(`  Gift pemicu      : ${targetGiftLower ? `"${targetGiftRaw}" saja` : 'SEMUA gift (dibedakan lewat nilai koin)'}`);
console.log(`  Nilai gift min   : ${minGiftValue} koin`);
console.log(`  Ambang 3 kartu   : >= ${threeCardMinValue} koin (di bawah itu -> 1 kartu)`);
console.log(`  Like milestone   : ${likeMilestone ? `setiap ${likeMilestone} like -> 1 kartu` : 'nonaktif'}`);
console.log('');

let connection;
let reconnectTimer = null;
let reconnecting = false;
let shuttingDown = false;
let connected = false;

// Simpan trigger singkat untuk mencegah event yang sama memicu draw berulang.
// TTL pendek agar gift baru tetap dapat diproses.
const recentTriggers = new Map();
const DEDUPE_TTL_MS = 15000;

// Index kelipatan like yang sudah pernah memicu draw (reset tiap listener dijalankan ulang).
let lastLikeMilestoneIndex = 0;

function scheduleReconnect(delayMs, reason) {
  if (shuttingDown || reconnectTimer || reconnecting) return;

  console.log(`RECONNECT: ${reason} Mencoba lagi dalam ${Math.ceil(delayMs / 1000)} detik...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectWithRetry();
  }, delayMs);
}

function makeTriggerKey({ username: sender, kind, giftName, giftCount }) {
  return `${kind}|${sender}|${giftName}|${giftCount}`.toLowerCase();
}

function isDuplicateTrigger(key) {
  const now = Date.now();

  for (const [storedKey, timestamp] of recentTriggers) {
    if (now - timestamp > DEDUPE_TTL_MS) {
      recentTriggers.delete(storedKey);
    }
  }

  if (recentTriggers.has(key)) return true;

  recentTriggers.set(key, now);
  return false;
}

function pickSpreadByValue(coinValue) {
  return coinValue >= threeCardMinValue ? 'three-card' : 'single';
}

async function triggerDraw({ sender, giftName, giftCount, spreadId }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${workerUrl}/api/live/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Live-Secret': LIVE_SECRET.trim(),
      },
      body: JSON.stringify({
        username: sender,
        giftName,
        giftCount,
        spreadId,
      }),
      signal: controller.signal,
    });

    const responseText = await res.text().catch(() => '');

    if (!res.ok) {
      console.error(`WORKER ERROR: trigger ditolak (${res.status})${responseText ? ` - ${responseText.slice(0, 300)}` : ''}`);
      return false;
    }

    let data = null;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      console.error('WORKER ERROR: respons bukan JSON yang valid.');
      return false;
    }

    const cards = data?.draw?.cards?.map((card) => card.nameCn).filter(Boolean).join(', ') || '-';
    console.log(`DRAW OK: ${sender} -> ${cards}`);
    return true;
  } catch (err) {
    if (err?.name === 'AbortError') {
      console.error('WORKER ERROR: request timeout setelah 10 detik.');
    } else {
      console.error(`WORKER ERROR: gagal menghubungi Worker - ${err?.message || err}`);
    }
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function attachListeners() {
  connection.on(WebcastEvent.GIFT, (data) => {
    // Gift streakable dikirim berkali-kali dalam satu combo.
    // Tunggu repeatEnd agar satu combo tidak memicu banyak draw.
    if (data.giftType === 1 && !data.repeatEnd) return;

    const giftName = String(data.giftName || '').trim();
    const repeatCount = Number(data.repeatCount) || 1;
    const diamondCount = Number(data.diamondCount) || 0;
    const coinValue = diamondCount * repeatCount;
    const sender = String(data.user?.uniqueId || data.uniqueId || 'Penonton').trim() || 'Penonton';

    if (targetGiftLower && giftName.toLowerCase() !== targetGiftLower) return;
    if (coinValue < minGiftValue) return;

    const key = makeTriggerKey({ username: sender, kind: 'gift', giftName, giftCount: repeatCount });
    if (isDuplicateTrigger(key)) {
      console.log(`DUPLICATE: ${sender} - ${giftName} x${repeatCount} diabaikan.`);
      return;
    }

    console.log(`GIFT: ${sender} mengirim ${giftName} x${repeatCount} (${coinValue} koin)`);
    void triggerDraw({
      sender,
      giftName,
      giftCount: repeatCount,
      spreadId: pickSpreadByValue(coinValue),
    });
  });

  connection.on(WebcastEvent.LIKE, (data) => {
    if (!likeMilestone) return;

    const total = Number(data.totalLikeCount) || 0;
    const milestoneIndex = Math.floor(total / likeMilestone);
    if (milestoneIndex <= lastLikeMilestoneIndex) return;

    lastLikeMilestoneIndex = milestoneIndex;
    const sender = String(data.user?.uniqueId || data.uniqueId || 'Penonton').trim() || 'Penonton';
    const milestoneValue = milestoneIndex * likeMilestone;

    console.log(`LIKE MILESTONE: total ${total} like (>= ${milestoneValue}), dipicu oleh ${sender}`);
    void triggerDraw({
      sender,
      giftName: `${likeMilestone} Like`,
      giftCount: milestoneValue,
      spreadId: 'single',
    });
  });

  connection.on(WebcastEvent.CONNECTED, (state) => {
    connected = true;
    lastLikeMilestoneIndex = 0;
    console.log(`CONNECTED: @${username} (roomId: ${state.roomId})`);
  });

  connection.on(WebcastEvent.DISCONNECTED, () => {
    if (shuttingDown) return;

    connected = false;
    console.log('DISCONNECTED: koneksi TikTok terputus.');
    scheduleReconnect(10000, 'Koneksi terputus.');
  });

  connection.on(WebcastEvent.ERROR, (err) => {
    console.error(`CONNECTION ERROR: ${err?.message || err}`);
  });
}

async function connectWithRetry() {
  if (shuttingDown || reconnecting || connected) return;

  reconnecting = true;

  try {
    await connection.connect();
  } catch (err) {
    connected = false;
    console.error(`CONNECT FAILED: @${username} belum terhubung. ${err?.message || err}`);
    scheduleReconnect(15000, 'Percobaan koneksi gagal.');
  } finally {
    reconnecting = false;
  }
}

async function shutdown(signal) {
  if (shuttingDown) return;

  shuttingDown = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  console.log(`SHUTDOWN: menerima ${signal}, menghentikan listener...`);

  try {
    if (connection?.disconnect) {
      await connection.disconnect();
    }
  } catch (err) {
    console.error(`SHUTDOWN ERROR: ${err?.message || err}`);
  } finally {
    process.exit(0);
  }
}

async function main() {
  connection = new TikTokLiveConnection(username, {
    signApiKey: SIGN_API_KEY?.trim() || undefined,
  });

  attachListeners();

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  await connectWithRetry();
}

main().catch((err) => {
  console.error(`FATAL: ${err?.message || err}`);
  process.exit(1);
});
