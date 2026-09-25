/**
 * Jalur Tarot — Bot Pendengar TikTok Live
 *
 * Jalan terpisah dari Worker (misalnya di Termux HP kamu). Tugasnya:
 *   1. Konek ke live TikTok kamu (tanpa login, cukup username).
 *   2. Dengarkan event "gift".
 *   3. Kalau gift-nya cocok dengan TARGET_GIFT_NAME di .env → panggil
 *      POST /api/live/trigger ke Worker, yang akan menarik kartu &
 *      menampilkannya di overlay OBS (/live).
 *
 * Jalankan:
 *   npm install
 *   cp .env.example .env   (lalu isi sesuai punyamu)
 *   npm start
 *
 * Biar tetap jalan di HP walau layar mati (Termux):
 *   termux-wake-lock
 *   npm start
 * (atau pakai pm2 / tmux supaya bisa ditinggal)
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

function requireEnv(name, val) {
  if (!val) {
    console.error(`❌ ${name} belum diisi di file .env — lihat .env.example`);
    process.exit(1);
  }
}
requireEnv('TIKTOK_USERNAME', TIKTOK_USERNAME);
requireEnv('WORKER_URL', WORKER_URL);
requireEnv('LIVE_SECRET', LIVE_SECRET);
requireEnv('TARGET_GIFT_NAME', TARGET_GIFT_NAME);

const minGiftCount = parseInt(MIN_GIFT_COUNT, 10) || 1;
const threeCardThreshold = THREE_CARD_THRESHOLD ? parseInt(THREE_CARD_THRESHOLD, 10) : null;
const targetGiftLower = TARGET_GIFT_NAME.trim().toLowerCase();

console.log('✦ Jalur Tarot — Bot TikTok Live ✦');
console.log(`  Akun target   : @${TIKTOK_USERNAME}`);
console.log(`  Worker        : ${WORKER_URL}`);
console.log(`  Gift pemicu   : "${TARGET_GIFT_NAME}" (min ${minGiftCount}x)`);
console.log(`  Spread default: ${DEFAULT_SPREAD}${threeCardThreshold ? ` (jadi three-card jika >= ${threeCardThreshold}x)` : ''}`);
console.log('');

async function triggerDraw({ username, giftName, giftCount, spreadId }) {
  try {
    const res = await fetch(`${WORKER_URL}/api/live/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Live-Secret': LIVE_SECRET,
      },
      body: JSON.stringify({ username, giftName, giftCount, spreadId }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`⚠️  Worker menolak trigger (${res.status}): ${text}`);
      return;
    }
    const data = await res.json();
    console.log(`🔮 Kartu ditarik untuk ${username}: ${data.draw?.cards?.map((c) => c.nameCn).join(', ')}`);
  } catch (err) {
    console.error('⚠️  Gagal menghubungi Worker:', err.message);
  }
}

function pickSpread(giftCount) {
  if (threeCardThreshold && giftCount >= threeCardThreshold) return 'three-card';
  return DEFAULT_SPREAD === 'three-card' ? 'three-card' : 'single';
}

async function main() {
  const connection = new TikTokLiveConnection(TIKTOK_USERNAME, {
    signApiKey: SIGN_API_KEY || undefined,
  });

  connection.on(WebcastEvent.GIFT, (data) => {
    // Gift "streakable" (giftType === 1) bisa dikirim berkali-kali dalam satu combo.
    // Tunggu combo selesai (repeatEnd) baru dihitung, biar gak trigger berkali-kali.
    if (data.giftType === 1 && !data.repeatEnd) return;

    const giftName = (data.giftName || '').trim();
    const giftCount = data.repeatCount || 1;
    const username = data.user?.uniqueId || data.uniqueId || 'Penonton';

    if (giftName.toLowerCase() !== targetGiftLower) return;
    if (giftCount < minGiftCount) return;

    console.log(`🎁 ${username} mengirim ${giftName} x${giftCount}`);
    triggerDraw({ username, giftName, giftCount, spreadId: pickSpread(giftCount) });
  });

  connection.on(WebcastEvent.CONNECTED, (state) => {
    console.log(`✅ Terhubung ke live @${TIKTOK_USERNAME} (roomId: ${state.roomId})`);
  });

  connection.on(WebcastEvent.DISCONNECTED, () => {
    console.log('⚠️  Terputus dari live. Mencoba sambung ulang dalam 10 detik...');
    setTimeout(connectWithRetry, 10000);
  });

  connection.on(WebcastEvent.ERROR, (err) => {
    console.error('⚠️  Error koneksi:', err?.message || err);
  });

  async function connectWithRetry() {
    try {
      await connection.connect();
    } catch (err) {
      console.error(`❌ Gagal konek (mungkin @${TIKTOK_USERNAME} sedang tidak live). Coba lagi 15 detik...`, err.message);
      setTimeout(connectWithRetry, 15000);
    }
  }

  await connectWithRetry();
}

main();
