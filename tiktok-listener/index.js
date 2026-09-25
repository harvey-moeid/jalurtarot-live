/**
 * Jalur Tarot - Bot Pendengar TikTok Live
 *
 * Listener berjalan terpisah dari Cloudflare Worker, misalnya di Termux.
 * Tugas:
 *   1. Terhubung ke live TikTok berdasarkan username.
 *   2. Mendengarkan event gift.
 *   3. Mengirim gift yang cocok ke POST /api/live/trigger.
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
  TARGET_GIFT_NAME,
  MIN_GIFT_COUNT = '1',
  DEFAULT_SPREAD = 'single',
  THREE_CARD_THRESHOLD = '',
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
requireEnv('TARGET_GIFT_NAME', TARGET_GIFT_NAME);

const username = TIKTOK_USERNAME.trim().replace(/^@+/, '');
const workerUrl = WORKER_URL.trim().replace(/\/+$/, '');
const targetGiftLower = TARGET_GIFT_NAME.trim().toLowerCase();

const minGiftCount = Number.parseInt(MIN_GIFT_COUNT, 10);
const threeCardThreshold = THREE_CARD_THRESHOLD.trim()
  ? Number.parseInt(THREE_CARD_THRESHOLD, 10)
  : null;

if (!Number.isInteger(minGiftCount) || minGiftCount < 1) {
  console.error('ERROR: MIN_GIFT_COUNT harus berupa angka >= 1.');
  process.exit(1);
}

if (threeCardThreshold !== null && (!Number.isInteger(threeCardThreshold) || threeCardThreshold < 1)) {
  console.error('ERROR: THREE_CARD_THRESHOLD harus berupa angka >= 1 atau dikosongkan.');
  process.exit(1);
}

const defaultSpread = DEFAULT_SPREAD === 'three-card' ? 'three-card' : 'single';

console.log('Jalur Tarot - Bot TikTok Live');
console.log(`  Akun target    : @${username}`);
console.log(`  Worker         : ${workerUrl}`);
console.log(`  Gift pemicu    : "${TARGET_GIFT_NAME.trim()}" (min ${minGiftCount}x)`);
console.log(`  Spread default : ${defaultSpread}`);
if (threeCardThreshold) {
  console.log(`  Three-card     : otomatis jika >= ${threeCardThreshold}x`);
}
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

function scheduleReconnect(delayMs, reason) {
  if (shuttingDown || reconnectTimer || reconnecting) return;

  console.log(`RECONNECT: ${reason} Mencoba lagi dalam ${Math.ceil(delayMs / 1000)} detik...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectWithRetry();
  }, delayMs);
}

function makeTriggerKey({ username: sender, giftName, giftCount }) {
  return `${sender}|\${giftName}|\${giftCount}`.toLowerCase();
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

function pickSpread(giftCount) {
  if (threeCardThreshold && giftCount >= threeCardThreshold) return 'three-card';
  return defaultSpread;
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
    const giftCount = Number(data.repeatCount) || 1;
    const sender = String(data.user?.uniqueId || data.uniqueId || 'Penonton').trim() || 'Penonton';

    if (giftName.toLowerCase() !== targetGiftLower) return;
    if (giftCount < minGiftCount) return;

    const key = makeTriggerKey({ sender, giftName, giftCount });
    if (isDuplicateTrigger(key)) {
      console.log(`DUPLICATE: ${sender} - ${giftName} x${giftCount} diabaikan.`);
      return;
    }

    console.log(`GIFT: ${sender} mengirim ${giftName} x${giftCount}`);
    void triggerDraw({
      sender,
      giftName,
      giftCount,
      spreadId: pickSpread(giftCount),
    });
  });

  connection.on(WebcastEvent.CONNECTED, (state) => {
    connected = true;
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
