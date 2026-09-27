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
import { TikTokLiveConnection, WebcastEvent, IsLiveRouteConfig, RoomIdRouteConfig } from 'tiktok-live-connector';

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
  RECONNECT_MIN_MS = '5000',
  RECONNECT_MAX_MS = '60000',
  WORKER_TIMEOUT_MS = '10000',
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
const reconnectMinMs = Math.max(1000, Number.parseInt(RECONNECT_MIN_MS, 10) || 5000);
const reconnectMaxMs = Math.max(reconnectMinMs, Number.parseInt(RECONNECT_MAX_MS, 10) || 60000);
const workerTimeoutMs = Math.max(3000, Number.parseInt(WORKER_TIMEOUT_MS, 10) || 10000);

// Jangan pernah log isi SIGN_API_KEY secara utuh - cukup status + 4 karakter terakhir
// supaya gampang mastiin env var kebaca tanpa expose key-nya di log.
const signApiKey = SIGN_API_KEY.trim();
const signApiKeyStatus = signApiKey
  ? `terisi (...${signApiKey.slice(-4)})`
  : 'kosong - pakai free tier EulerStream (rawan rate limit/captcha)';

// Kalau SIGN_API_KEY diisi: skip scrape HTML & API TikTok langsung (tahap 1 & 2 di
// fetchIsLiveComposite/fetchRoomIdComposite bawaan library). Tahap itu cuma lanjut ke
// Euler Stream (tahap 3, yang pakai SIGN_API_KEY) kalau tahap sebelumnya melempar error -
// kalau "berhasil" tapi salah baca status (mis. gara-gara IP datacenter kena halaman
// berbeda dari TikTok, atau bug parsing di scrape lokal), Euler Stream tidak pernah
// kesentuh sama sekali walau key-nya valid. Paksa lewat Euler saja supaya key ini
// benar-benar dipakai.
if (signApiKey) {
  IsLiveRouteConfig.skipFetchRoomInfoFromHtmlRoute = true;
  IsLiveRouteConfig.skipFetchRoomInfoFromApiLiveRoute = true;
  RoomIdRouteConfig.skipFetchRoomInfoFromHtmlRoute = true;
  RoomIdRouteConfig.skipFetchRoomInfoFromApiLiveRoute = true;
}

console.log('Jalur Tarot - Bot TikTok Live');
console.log(`  Akun target      : @${username}`);
console.log(`  Worker           : ${workerUrl}`);
console.log(`  Gift pemicu      : ${targetGiftLower ? `"${targetGiftRaw}" saja` : 'SEMUA gift (dibedakan lewat nilai koin)'}`);
console.log(`  Nilai gift min   : ${minGiftValue} koin`);
console.log(`  Ambang 3 kartu   : >= ${threeCardMinValue} koin (di bawah itu -> 1 kartu)`);
console.log(`  Like milestone   : ${likeMilestone ? `setiap ${likeMilestone} like -> 1 kartu` : 'nonaktif'}`);
console.log(`  SIGN_API_KEY     : ${signApiKeyStatus}`);
console.log(`  Deteksi live     : ${signApiKey ? 'Euler Stream saja (skip scrape TikTok langsung)' : 'scrape TikTok -> Euler (fallback bawaan)'}`);
console.log('');

let connection;
let reconnectTimer = null;
let healthTimer = null;
let reconnecting = false;
let shuttingDown = false;
let connected = false;
let reconnectAttempt = 0;

// Index kelipatan like yang sudah pernah memicu draw (reset tiap listener dijalankan ulang).
let lastLikeMilestoneIndex = 0;

function nextReconnectDelay() {
  const base = Math.min(
    reconnectMaxMs,
    reconnectMinMs * (2 ** Math.min(reconnectAttempt, 5)),
  );
  reconnectAttempt += 1;
  const jitter = Math.round(base * (0.8 + Math.random() * 0.4));
  return Math.min(reconnectMaxMs, Math.max(reconnectMinMs, jitter));
}

function scheduleReconnect(reason, delayMs = null) {
  if (shuttingDown || reconnectTimer || reconnecting || connected) return;

  const delay = delayMs ?? nextReconnectDelay();
  console.log(`RECONNECT: ${reason} Mencoba lagi dalam ${Math.ceil(delay / 1000)} detik...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectWithRetry();
  }, delay);
}

function pickSpreadByValue(coinValue) {
  return coinValue >= threeCardMinValue ? 'three-card' : defaultSpread;
}

async function triggerDraw({ sender, giftName, giftCount, spreadId }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), workerTimeoutMs);

  try {
    const res = await fetch(`${workerUrl}/api/live/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Live-Secret': LIVE_SECRET.trim(),
      },
      body: JSON.stringify({
        username: sender,
        giftName: giftName || 'Gift',
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
      console.error(`WORKER ERROR: request timeout setelah ${workerTimeoutMs} ms.`);
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
    const giftDetails = data.giftDetails || {};
    const giftType = Number(giftDetails.giftType ?? data.giftType) || 0;
    if (giftType === 1 && !data.repeatEnd) return;

    const giftName = String(giftDetails.giftName ?? data.giftName ?? '').trim();
    const repeatCount = Math.max(1, Number(data.repeatCount) || 1);
    const diamondCount = Math.max(0, Number(giftDetails.diamondCount ?? data.diamondCount) || 0);
    const coinValue = diamondCount * repeatCount;
    const sender = String(data.user?.uniqueId || data.uniqueId || 'Penonton').trim() || 'Penonton';

    if (targetGiftLower && giftName.toLowerCase() !== targetGiftLower) return;
    if (coinValue < minGiftValue) return;

    console.log(`GIFT: ${sender} mengirim ${giftName || 'gift'} x${repeatCount} (${coinValue} koin)`);
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
    reconnectAttempt = 0;
    lastLikeMilestoneIndex = 0;
    console.log(`CONNECTED: @${username} (roomId: ${state.roomId})`);
  });

  connection.on(WebcastEvent.DISCONNECTED, ({ code, reason } = {}) => {
    if (shuttingDown) return;

    connected = false;
    console.log(
      `DISCONNECTED: koneksi TikTok terputus${code !== undefined ? ` (code ${code})` : ''}${reason ? ` - ${reason}` : ''}.`,
    );
    scheduleReconnect('Koneksi terputus.');
  });

  connection.on(WebcastEvent.ERROR, (err) => {
    console.error(`CONNECTION ERROR: ${err?.message || err?.info || err || 'unknown error'}`);
    // Jika error terjadi di luar siklus connect/disconnect, health monitor akan memastikan
    // koneksi tidak dibiarkan mati tanpa recovery.
    if (!connected && !reconnecting) scheduleReconnect('Connector melaporkan error.');
  });
}

function startHealthMonitor() {
  healthTimer = setInterval(() => {
    if (shuttingDown || !connection) return;

    const isConnected = Boolean(connection.isConnected);
    const isConnecting = Boolean(connection.isConnecting);
    connected = isConnected;

    if (!isConnected && !isConnecting && !reconnecting) {
      scheduleReconnect('Health check mendeteksi koneksi tidak aktif.');
    }
  }, 30000);
}

async function connectWithRetry() {
  if (shuttingDown || reconnecting || connection?.isConnected) return;

  reconnecting = true;
  console.log(`CONNECT: mencoba @${username}...`);

  try {
    const state = await connection.connect();
    connected = Boolean(state?.isConnected ?? connection.isConnected);
    if (connected) reconnectAttempt = 0;
  } catch (err) {
    connected = false;
    const errType = err?.constructor?.name || err?.name || 'Error';
    console.error(`CONNECT FAILED: @${username} belum terhubung. [${errType}] ${err?.message || err}`);
  } finally {
    reconnecting = false;
    if (!connected && !shuttingDown) scheduleReconnect('Percobaan koneksi gagal.');
  }
}

async function shutdown(signal) {
  if (shuttingDown) return;

  shuttingDown = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
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
    signApiKey: signApiKey || undefined,
    // Jangan replay batch awal ketika listener baru connect; hanya proses event live setelah connect.
    processInitialData: false,
  });

  attachListeners();

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  startHealthMonitor();
  await connectWithRetry();
}

main().catch((err) => {
  console.error(`FATAL: ${err?.message || err}`);
  process.exit(1);
});
