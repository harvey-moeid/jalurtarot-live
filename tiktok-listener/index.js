import 'dotenv/config';
import WebSocket from 'ws';
import { createWebSocketUrl, ClientCloseCode } from '@eulerstream/euler-websocket-sdk';

const env = process.env;
const required = ['TIKTOK_USERNAME', 'WORKER_URL', 'LIVE_SECRET'];
for (const key of required) {
  if (!String(env[key] || '').trim()) {
    console.error('ERROR: ' + key + ' belum diisi di environment.');
    process.exit(1);
  }
}

const username = env.TIKTOK_USERNAME.trim().replace(/^@+/, '');
const workerUrl = env.WORKER_URL.trim().replace(/\/+$/, '');
const liveSecret = env.LIVE_SECRET.trim();
const apiKey = String(env.EULER_API_KEY || env.SIGN_API_KEY || '').trim();
const targetGift = String(env.TARGET_GIFT_NAME || '').trim();
const targetGiftLower = targetGift && targetGift !== '*' ? targetGift.toLowerCase() : '';
const minGiftValue = Number.parseInt(env.MIN_GIFT_VALUE || '1', 10);
const threeCardMinValue = Number.parseInt(env.THREE_CARD_MIN_VALUE || '5', 10);
const defaultSpread = env.DEFAULT_SPREAD === 'three-card' ? 'three-card' : 'single';
const likeMilestone = String(env.LIKE_MILESTONE ?? '1000').trim()
  ? Number.parseInt(env.LIKE_MILESTONE, 10) : 0;
const reconnectMinMs = Math.max(1000, Number.parseInt(env.RECONNECT_MIN_MS || '5000', 10) || 5000);
const reconnectMaxMs = Math.max(reconnectMinMs, Number.parseInt(env.RECONNECT_MAX_MS || '60000', 10) || 60000);
const workerTimeoutMs = Math.max(3000, Number.parseInt(env.WORKER_TIMEOUT_MS || '10000', 10) || 10000);
const debugEvents = ['1', 'true', 'yes'].includes(String(env.DEBUG_EVENTS || '').trim().toLowerCase());

if (!Number.isInteger(minGiftValue) || minGiftValue < 0) throw new Error('MIN_GIFT_VALUE harus angka >= 0.');
if (!Number.isInteger(threeCardMinValue) || threeCardMinValue < 1) throw new Error('THREE_CARD_MIN_VALUE harus angka >= 1.');
if (likeMilestone && (!Number.isInteger(likeMilestone) || likeMilestone < 1)) throw new Error('LIKE_MILESTONE harus angka >= 1 atau kosong.');

console.log('Jalur Tarot - Euler WebSocket Listener');
console.log('  Akun target      : @' + username);
console.log('  Worker           : ' + workerUrl);
console.log('  Provider         : Euler Stream Managed WebSocket');
console.log('  Euler API key    : ' + (apiKey ? 'terisi (tersamarkan)' : 'kosong'));
console.log('  Gift pemicu      : ' + (targetGiftLower ? '"' + targetGift + '" saja' : 'SEMUA gift'));
console.log('  Nilai gift min   : ' + minGiftValue + ' koin');
console.log('  Ambang 3 kartu   : >= ' + threeCardMinValue + ' koin');
console.log('  Like milestone   : ' + (likeMilestone ? 'setiap ' + likeMilestone + ' like' : 'nonaktif'));
console.log('  Debug event      : ' + (debugEvents ? 'AKTIF (semua tipe packet di-log)' : 'nonaktif (set DEBUG_EVENTS=1 untuk aktifkan)'));
console.log('');

let ws = null;
let reconnectTimer = null;
let reconnecting = false;
let shuttingDown = false;
let connected = false;
let reconnectAttempt = 0;
let lastLikeMilestoneIndex = 0;
const seenEventIds = new Map();

// Debug/diagnostic counters - helps confirm whether ANY traffic is arriving
// from the room, independent of whether we recognize the packet type.
let totalMessagesReceived = 0;
let lastMessageAt = null;
const seenPacketTypes = new Map();
let heartbeatTimer = null;

function startHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    if (!connected) return;
    const sinceLast = lastMessageAt ? Math.round((Date.now() - lastMessageAt) / 1000) + 's lalu' : 'belum ada';
    const typesSummary = [...seenPacketTypes.entries()].map(([t, n]) => t + '=' + n).join(', ') || '(tidak ada)';
    console.log('HEARTBEAT: total packet diterima=' + totalMessagesReceived + ', packet terakhir=' + sinceLast + ', tipe=' + typesSummary);
  }, 15000);
  heartbeatTimer.unref?.();
}

function nextReconnectDelay() {
  const base = Math.min(reconnectMaxMs, reconnectMinMs * (2 ** Math.min(reconnectAttempt, 5)));
  reconnectAttempt += 1;
  return Math.min(reconnectMaxMs, Math.max(reconnectMinMs, Math.round(base * (0.8 + Math.random() * 0.4))));
}

function scheduleReconnect(reason, delay) {
  if (shuttingDown || reconnectTimer || reconnecting || connected) return;
  const wait = delay ?? nextReconnectDelay();
  console.log('RECONNECT: ' + reason + ' Mencoba lagi dalam ' + Math.ceil(wait / 1000) + ' detik...');
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, wait);
}

function rememberEvent(id) {
  if (!id) return false;
  const key = String(id);
  if (seenEventIds.has(key)) return true;
  seenEventIds.set(key, Date.now());
  if (seenEventIds.size > 1000) {
    const oldest = seenEventIds.keys().next().value;
    seenEventIds.delete(oldest);
  }
  return false;
}

function userName(msg) {
  return String(msg?.user?.uniqueId || msg?.user?.displayId || msg?.uniqueId || msg?.nickname || 'Penonton').trim() || 'Penonton';
}

function giftName(msg) {
  return String(msg?.giftName || msg?.gift?.name || msg?.giftDetails?.giftName || msg?.gift?.giftName || 'Gift').trim();
}

function giftCoins(msg) {
  const direct = [msg?.diamondCount, msg?.gift?.diamondCount, msg?.giftDetails?.diamondCount,
    msg?.gift?.diamond_count, msg?.giftDetails?.diamond_count];
  for (const value of direct) {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return 0;
}

function giftRepeat(msg) {
  const n = Number(msg?.giftCount ?? msg?.repeatCount ?? msg?.repeat_count ?? 1);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

async function triggerDraw({ sender, name, count, spread }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), workerTimeoutMs);
  try {
    const response = await fetch(workerUrl + '/api/live/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Live-Secret': liveSecret },
      body: JSON.stringify({ username: sender, giftName: name || 'Gift', giftCount: count, spreadId: spread }),
      signal: controller.signal,
    });
    const bodyText = await response.text().catch(() => '');
    if (!response.ok) {
      console.error('WORKER ERROR: HTTP ' + response.status + (bodyText ? ' - ' + bodyText.slice(0, 250) : ''));
      return false;
    }
    let result;
    try { result = bodyText ? JSON.parse(bodyText) : null; }
    catch { console.error('WORKER ERROR: respons bukan JSON valid.'); return false; }
    const cards = result?.draw?.cards?.map(card => card.nameCn).filter(Boolean).join(', ') || '-';
    console.log('DRAW OK: ' + sender + ' -> ' + cards);
    return true;
  } catch (error) {
    console.error('WORKER ERROR: ' + (error?.name === 'AbortError' ? 'timeout setelah ' + workerTimeoutMs + ' ms' : (error?.message || error)));
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function handleGift(msg) {
  if (rememberEvent(msg?.msgId || msg?.messageId || msg?.common?.msgId)) return;
  const name = giftName(msg);
  const count = giftRepeat(msg);
  const coins = giftCoins(msg) * count;
  if (targetGiftLower && name.toLowerCase() !== targetGiftLower) return;
  if (coins < minGiftValue) return;
  console.log('GIFT: ' + userName(msg) + ' mengirim ' + name + ' x' + count + ' (' + coins + ' koin)');
  void triggerDraw({ sender: userName(msg), name, count, spread: coins >= threeCardMinValue ? 'three-card' : defaultSpread });
}

function handleLike(msg) {
  if (!likeMilestone) return;
  const total = Number(msg?.totalLikeCount ?? msg?.total_like_count ?? msg?.totalLike ?? 0);
  if (!Number.isFinite(total) || total <= 0) return;
  const index = Math.floor(total / likeMilestone);
  if (index <= lastLikeMilestoneIndex) return;
  lastLikeMilestoneIndex = index;
  const at = index * likeMilestone;
  const sender = userName(msg);
  console.log('LIKE MILESTONE: total ' + total + ' like (>= ' + at + '), dari ' + sender);
  void triggerDraw({ sender, name: likeMilestone + ' Like', count: at, spread: 'single' });
}

function connect() {
  if (shuttingDown || reconnecting || (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN))) return;
  reconnecting = true;
  console.log('CONNECT: meminta stream @' + username + ' melalui Euler...');
  let url;
  try {
    url = createWebSocketUrl({
      uniqueId: username,
      apiKey: apiKey || undefined,
      features: { bundleEvents: true, syntheticPresence: false, schemaVersion: 'v2' },
    });
  } catch (error) {
    reconnecting = false;
    console.error('CONFIG ERROR: gagal membuat URL Euler: ' + (error?.message || error));
    scheduleReconnect('konfigurasi URL gagal.');
    return;
  }

  try {
    ws = new WebSocket(url);
  } catch (error) {
    reconnecting = false;
    console.error('CONNECT ERROR: gagal membuat WebSocket: ' + (error?.message || error));
    scheduleReconnect('inisialisasi WebSocket gagal.');
    return;
  }

  ws.on('open', () => {
    connected = true;
    reconnecting = false;
    reconnectAttempt = 0;
    lastLikeMilestoneIndex = 0;
    totalMessagesReceived = 0;
    lastMessageAt = null;
    seenPacketTypes.clear();
    console.log('CONNECTED: WebSocket Euler terbuka untuk @' + username + ' (menunggu event live).');
    startHeartbeat();
  });

  ws.on('message', raw => {
    let packet;
    try { packet = JSON.parse(raw.toString()); }
    catch (error) {
      console.error('MESSAGE ERROR: frame Euler bukan JSON: ' + (error?.message || error));
      return;
    }
    if (!packet || typeof packet !== 'object') return;

    const type = String(packet.type || '');
    const data = packet.data || {};

    totalMessagesReceived += 1;
    lastMessageAt = Date.now();
    seenPacketTypes.set(type || '(tanpa type)', (seenPacketTypes.get(type || '(tanpa type)') || 0) + 1);
    if (debugEvents) console.log('EVENT RAW: type=' + (type || '(kosong)'));

    if (type === 'WebcastGiftMessage') handleGift(data);
    else if (type === 'WebcastLikeMessage') handleLike(data);
    else if (type === 'room.status') {
      if (data.state === 'connected') console.log('ROOM CONNECTED: roomId ' + (data.roomId || 'tidak disediakan'));
      else if (data.state === 'error') console.error('ROOM ERROR: ' + (data.message || 'status error dari Euler'));
      else console.log('ROOM STATUS: ' + (data.state || 'unknown'));
    } else if (type === 'tiktok.error') {
      console.error('EULER ERROR: ' + (data.message || JSON.stringify(data).slice(0, 300)));
    }
  });

  ws.on('error', error => {
    console.error('WEBSOCKET ERROR: ' + (error?.message || error));
  });

  ws.on('close', (code, reasonBuffer) => {
    const reason = reasonBuffer?.toString() || '';
    connected = false;
    reconnecting = false;
    ws = null;
    const known = {
      4401: 'autentikasi Euler tidak valid',
      4403: 'akun/key tidak memiliki izin',
      4404: 'akun TikTok sedang offline atau tidak ditemukan',
      4429: 'batas koneksi tercapai',
      4556: 'gagal mengambil webcast',
      4557: 'gagal mengambil info room',
    };
    console.error('DISCONNECTED: code ' + code + ' - ' + (known[code] || 'koneksi ditutup') + (reason ? ' (' + reason + ')' : ''));
    console.log('  Ringkasan sesi: total packet diterima=' + totalMessagesReceived + ', tipe=' + ([...seenPacketTypes.entries()].map(([t, n]) => t + '=' + n).join(', ') || '(tidak ada)'));
    if (!shuttingDown) scheduleReconnect('koneksi Euler ditutup.');
  });
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  console.log('SHUTDOWN: ' + signal + ', menghentikan listener...');
  if (ws && ws.readyState < WebSocket.CLOSING) ws.close(1000, 'Listener shutdown');
  setTimeout(() => process.exit(0), 500).unref();
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
connect();
