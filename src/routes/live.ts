import { Hono } from 'hono';
import type { Env as ApiEnv } from './api';
import { isAuthenticated } from '../middleware/adminAuth';
import { generateLiveDraw, getLiveDraw, saveLiveDraw, type LiveSpreadId } from '../lib/live';
import {
  connectorConfigured,
  getConnectorEvents,
  getConnectorStats,
  getConnectorStatus,
  processConnectorEvent,
  type ConnectorEvent,
  type TikTokConnectorEnv,
} from '../lib/tiktokConnector';

export type LiveEnv = ApiEnv & TikTokConnectorEnv & {
  LIVE_SECRET?: string;
};

const live = new Hono<{ Bindings: LiveEnv }>();

// Draw yang lebih tua dari ini tidak dikirim lagi oleh /state. Tujuannya mencegah
// overlay yang dibuka / di-refresh menampilkan draw lama (KV menyimpannya sampai 6 jam).
// Memakai jam server (bukan jam browser) supaya tidak terpengaruh jam perangkat.
//
// Nilai ini SENGAJA lebih besar dari HIDE_AFTER_MS di overlay (45 detik). KV bersifat
// eventually consistent: draw yang ditulis dari satu lokasi Cloudflare bisa baru terbaca
// di lokasi lain setelah 60 detik atau lebih. Dengan batas 45 detik, draw yang terlambat
// sampai dibuang dan overlay tidak pernah menampilkannya. 120 detik memberi ruang untuk
// keterlambatan itu; overlay tetap menyembunyikan draw 45 detik setelah tampil.
const LIVE_STATE_MAX_AGE_MS = 120_000;

function isValidSpreadId(value: unknown): value is LiveSpreadId {
  return value === 'single' || value === 'three-card';
}

// Perbandingan string tanpa short-circuit (waktu tidak bergantung pada posisi
// karakter pertama yang berbeda), supaya secret tidak bisa ditebak lewat timing.
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ea = enc.encode(a);
  const eb = enc.encode(b);
  let diff = ea.length ^ eb.length;
  const n = Math.max(ea.length, eb.length);
  for (let i = 0; i < n; i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

let lastConnectorSyncAt = 0;
let connectorSyncPromise: Promise<void> | null = null;
const CONNECTOR_SYNC_MIN_INTERVAL_MS = 5_000;
const CONNECTOR_EVENT_MAX_AGE_MS = 30_000;

async function syncRecentConnectorEvents(env: LiveEnv): Promise<void> {
  if (!connectorConfigured(env)) return;

  const now = Date.now();
  if (connectorSyncPromise) return connectorSyncPromise;
  if (now - lastConnectorSyncAt < CONNECTOR_SYNC_MIN_INTERVAL_MS) return;
  lastConnectorSyncAt = now;

  const sync = (async () => {
    const payload = await getConnectorEvents(env, 'chat,gift,like', 100);
    const events = Array.isArray(payload?.events) ? [...payload.events].reverse() : [];
    for (const event of events) {
      const timestamp = Date.parse(String(event?.timestamp || ''));
      if (Number.isFinite(timestamp) && now - timestamp > CONNECTOR_EVENT_MAX_AGE_MS) continue;
      await processConnectorEvent(env, event);
    }
  })().finally(() => {
    connectorSyncPromise = null;
  });
  connectorSyncPromise = sync;
  return sync;
}

// Legacy direct listener has been retired. Events are accepted only through
// /api/live/connector-webhook from the shared tiktok-live-konektor service.
live.post('/trigger', (c) => c.json({ error: 'Legacy TikTok listener dinonaktifkan. Gunakan connector-webhook.' }, 410));

// POST /api/live/connector-webhook
// Preferred realtime path from tiktok-live-konektor. Configure its webhook URL as:
// https://YOUR_DOMAIN/api/live/connector-webhook?secret=YOUR_WEBHOOK_SECRET
live.post('/connector-webhook', async (c) => {
  const expected = String(c.env.TIKTOK_CONNECTOR_WEBHOOK_SECRET || '').trim();
  const supplied = String(c.req.query('secret') || c.req.header('X-TikTok-Webhook-Secret') || '').trim();

  if (!expected) {
    return c.json({ error: 'TIKTOK_CONNECTOR_WEBHOOK_SECRET belum di-set.' }, 503);
  }
  if (!supplied || !safeEqual(supplied, expected)) {
    return c.json({ error: 'Webhook secret tidak valid.' }, 401);
  }

  let event: ConnectorEvent;
  try { event = await c.req.json<ConnectorEvent>(); }
  catch { return c.json({ error: 'Format JSON webhook tidak valid.' }, 400); }

  try {
    const result = await processConnectorEvent(c.env, event);
    return c.json({ ok: true, ...result });
  } catch (error: any) {
    return c.json({ error: String(error?.message || error) }, 503);
  }
});

// Server-side proxy; only logged-in admins may access viewer activity.
live.use('/connector/*', async (c, next) => {
  if (!await isAuthenticated(c)) return c.json({ error: 'Unauthorized' }, 401);
  await next();
});
live.get('/connector/status', async (c) => {
  c.header('Cache-Control', 'no-store');
  try { return c.json(await getConnectorStatus(c.env)); }
  catch (error: any) { return c.json({ ok: false, error: String(error?.message || error) }, 502); }
});

live.get('/connector/stats', async (c) => {
  c.header('Cache-Control', 'no-store');
  try { return c.json(await getConnectorStats(c.env)); }
  catch (error: any) { return c.json({ ok: false, error: String(error?.message || error) }, 502); }
});

live.get('/connector/events', async (c) => {
  const types = String(c.req.query('type') || 'chat,like,gift');
  const limit = Number(c.req.query('limit') || 50);
  c.header('Cache-Control', 'no-store');
  try { return c.json(await getConnectorEvents(c.env, types, limit)); }
  catch (error: any) { return c.json({ ok: false, error: String(error?.message || error) }, 502); }
});

// GET /api/live/state
// Polled by the OBS/browser overlay. A lightweight connector sync is used as a
// fallback when webhook delivery has not been configured yet.
live.get('/state', async (c) => {
  try { await syncRecentConnectorEvents(c.env); } catch {}
  const draw = await getLiveDraw(c.env);
  const fresh = draw && Date.now() - draw.createdAt <= LIVE_STATE_MAX_AGE_MS ? draw : null;
  c.header('Cache-Control', 'no-store');
  return c.json({ draw: fresh });
});

export default live;

// GET /live
// Overlay layar penuh (portrait & landscape) untuk OBS Browser Source / perangkat.
export function liveOverlayPage(): string {
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#160d28">
<meta name="color-scheme" content="dark">
<meta name="mobile-web-app-capable" content="yes">
<title>Jalur Tarot — LIVE 1 Reading</title>
<link rel="stylesheet" href="/live1.css?v=20261009-1">
<link rel="stylesheet" href="/overlay-fullscreen.css?v=20261009-1">
<script src="/live1.js?v=20261009-1" defer></script>
<script src="/overlay-fullscreen.js?v=20261009-1" defer></script>
</head>
<body>
<main id="stage" aria-label="Pembacaan tarot Jalur Tarot LIVE 1" role="region">
  <header class="stage-head">
    <div class="head-meta">
      <div class="eyebrow">Jalur Tarot • Live</div>
      <h1 class="brand">Pesan dari Semesta</h1>
    </div>
    <span class="head-tag">✦ LIVE READING</span>
  </header>
  <div class="reading-layout">
    <section class="card-panel" aria-label="Kartu tarot hasil pembacaan">
      <div class="viewer" id="viewer">Menanti pesan kartu...</div>
      <div class="badge-row">
        <span class="chip topic" id="topic" hidden></span>
        <span class="chip" id="gift" hidden></span>
      </div>
      <div class="cards-row" id="cards-row"></div>
      <div class="card-panel__bottom">Satu hingga tiga kartu • pesan untukmu</div>
    </section>
    <section class="story-panel" aria-label="Penjelasan ramalan">
      <header class="story-head">
        <h2 class="story-title" id="story-title">Pesan dari Kartu</h2>
        <span class="story-mark" aria-hidden="true">✧ ☾ ✧</span>
      </header>
      <p class="question" id="question" hidden></p>
      <div class="summary-scroll" id="summary-scroll" tabindex="0" aria-label="Bacaan tarot lengkap, dapat digulir">
        <p class="summary" id="summary" aria-live="polite"></p>
      </div>
      <p class="story-hint">Pesan untuk refleksi diri, bukan kepastian tentang masa depan.</p>
    </section>
  </div>
  <footer class="stage-foot">
    <strong>✦ Tulis CINTA • NASIB • KARIER di komentar</strong>
    <small>Gift atau target like membuka bacaan berikutnya</small>
  </footer>
</main>
<div class="debug-state" id="debug-state" role="status" hidden></div>
<div class="overlay-fullscreen-control" id="overlay-fullscreen-control">
  <button class="overlay-fullscreen-button" id="overlay-fullscreen-button" type="button" aria-label="Masuk layar penuh" aria-pressed="false" title="Masuk layar penuh"><span class="overlay-fullscreen-icon" aria-hidden="true">⛶</span><span class="overlay-fullscreen-label">Layar Penuh</span></button>
</div>
<div class="overlay-fullscreen-status" id="overlay-fullscreen-status" role="status" aria-live="polite" hidden></div>
</body>
</html>`;
}
