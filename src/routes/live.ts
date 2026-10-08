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
    const payload = await getConnectorEvents(env, 'gift,like', 100);
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

// POST /api/live/trigger
// Called by the TikTok listener.
live.post('/trigger', async (c) => {
  const expectedSecret = (c.env.LIVE_SECRET || '').trim();
  const givenSecret = (c.req.header('X-Live-Secret') || '').trim();

  if (!expectedSecret) {
    return c.json(
      { error: 'LIVE_SECRET belum di-set di server. Jalankan: wrangler secret put LIVE_SECRET' },
      500,
    );
  }

  if (!givenSecret || !safeEqual(givenSecret, expectedSecret)) {
    return c.json({ error: 'Unauthorized - X-Live-Secret salah atau kosong' }, 401);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Format JSON tidak valid' }, 400);
  }

  const spreadId: LiveSpreadId = isValidSpreadId(body?.spreadId) ? body.spreadId : 'single';
  const username = typeof body?.username === 'string' ? body.username.slice(0, 60) : 'Penonton';
  const giftName = typeof body?.giftName === 'string' ? body.giftName.slice(0, 60) : undefined;
  const giftCount = typeof body?.giftCount === 'number' ? body.giftCount : undefined;

  const draw = generateLiveDraw(spreadId, username, giftName, giftCount);
  const saved = await saveLiveDraw(c.env, draw);
  if (!saved) return c.json({ error: 'Gagal menyimpan draw ke storage' }, 503);

  return c.json({ ok: true, draw });
});

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
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<meta name="theme-color" content="#08070b"/>
<link rel="manifest" href="/manifest-live.json"/>
<link rel="apple-touch-icon" href="/icons/icon-192.png"/>
<meta name="mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<meta name="apple-mobile-web-app-title" content="Tarot Overlay"/>
<title>Jalur Tarot - Live</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#08070b;--panel:rgba(20,17,24,.82);--gold:#d9b45a;--gold2:#f0d58a;--cream:#f5f0e7;--muted:#a9a19a;--line:rgba(217,180,90,.24);--shadow:0 24px 70px rgba(0,0,0,.42)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;min-height:100%;margin:0;background:var(--bg)}
body{font-family:"Cormorant Garamond",serif;color:var(--cream);display:flex;align-items:center;justify-content:center;overflow:hidden;overscroll-behavior:none}
#stage{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;min-width:100vw;min-height:100dvh;max-width:none;max-height:none;aspect-ratio:auto;display:none;padding:max(28px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) max(28px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left));border:0;border-radius:0;background:linear-gradient(145deg,rgba(15,12,20,.98),rgba(7,6,10,.98));box-shadow:none;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);overflow:auto;overscroll-behavior:none}
#stage:before{content:"";position:absolute;inset:14px;border:1px solid rgba(217,180,90,.10);border-radius:24px;pointer-events:none}
#stage.show{display:block;animation:rise .55s cubic-bezier(.2,.8,.2,1)}
@keyframes rise{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:none}}
.kicker{display:flex;align-items:center;justify-content:center;gap:8px;color:var(--gold);font-family:"Cinzel",serif;font-size:clamp(10px,1.7vw,15px);font-weight:600;letter-spacing:.22em;text-transform:uppercase;text-align:center}
.kicker-mark{display:inline-block;width:14px;height:14px;flex:none;vertical-align:-2px;color:var(--gold)}
.kicker:before,.kicker:after{content:"";height:1px;width:clamp(24px,7vw,70px);background:linear-gradient(90deg,transparent,var(--gold))}
.kicker:after{background:linear-gradient(90deg,var(--gold),transparent)}
.viewer{margin-top:14px;text-align:center;font-size:clamp(20px,3.2vw,32px);line-height:1.15}
.viewer strong{color:var(--gold2);font-weight:600}
.gift{display:flex;align-items:center;justify-content:center;gap:7px;margin:12px auto 0;padding:6px 11px;border:1px solid rgba(217,180,90,.18);border-radius:999px;background:rgba(217,180,90,.07);color:#d8d0c4;font-size:clamp(12px,2.2vw,15px)}
.gift-icon{display:inline-block;width:14px;height:14px;flex:none;vertical-align:-2px;color:var(--gold)}
.cards-row{display:flex;justify-content:center;align-items:flex-start;gap:clamp(8px,1.8vw,22px);margin:clamp(28px,5vw,56px) auto;width:100%;max-width:100%}
.live-card{width:clamp(150px,27vw,280px);max-width:31%;text-align:center}
.card-frame{position:relative;padding:5px;border-radius:15px;background:linear-gradient(145deg,var(--gold2),#7e5a1d,var(--gold));box-shadow:0 15px 34px rgba(0,0,0,.46)}
.live-card img{display:block;width:100%;aspect-ratio:.652;object-fit:cover;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.live-card.reversed img{transform:rotate(180deg)}
.pos{margin-top:9px;color:var(--gold);font-family:"Cinzel",serif;font-size:clamp(9px,1.7vw,12px);letter-spacing:.13em;text-transform:uppercase}
.name{margin-top:4px;font-size:clamp(15px,2.7vw,21px);line-height:1.05}
.state{display:inline-block;margin-top:4px;font-size:11px;color:#9f968b;font-style:italic}
.summary{border-top:1px solid var(--line);padding:22px clamp(4px,2vw,18px) 2px;text-align:center;font-size:clamp(18px,2.8vw,26px);line-height:1.45;color:#eee8dd}
.summary strong{color:var(--gold2);font-weight:600}
.icon-sum{width:.9em;height:.9em;vertical-align:-0.12em;margin-right:.22em;fill:var(--gold)}
.footer{margin-top:14px;text-align:center;color:#746e67;font-family:"Cinzel",serif;font-size:8px;letter-spacing:.18em;text-transform:uppercase}
@media(max-aspect-ratio:3/4){
body{align-items:center}
#stage{width:100vw;height:100vh;height:100dvh;max-height:none;max-width:none;padding:max(24px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))}
#stage:before{inset:10px;border-radius:18px}
.cards-row{gap:7px;margin:24px auto 22px}
.live-card{width:calc((100% - 14px)/3);max-width:none}
.card-frame{padding:4px;border-radius:13px}
.live-card img{border-radius:9px}
.summary{font-size:16px;line-height:1.42;padding-top:15px}
.footer{font-size:7px}
}
@media(max-width:360px), (max-height:600px) and (orientation:landscape){
#stage{padding:14px 10px 12px}
.viewer{font-size:18px}
.name{font-size:14px}
.pos{font-size:8px}
.summary{font-size:15px}
}
</style>
</head>
<body>
<main id="stage" aria-live="polite">
  <div class="kicker"><svg class="kicker-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/></svg><span>Jalur Tarot - Live Reading</span></div>
  <div class="viewer" id="viewer">Menunggu pembacaan live...</div>
  <div class="gift" id="gift" hidden></div>
  <div class="cards-row" id="cards-row"></div>
  <div class="summary" id="summary"></div>
  <div class="footer">interpretasi untuk hiburan &amp; refleksi pribadi</div>
</main>
<script>
(function(){
  var lastId=null,hideTimer=null,pollTimer=null,polling=false,HIDE_AFTER_MS=45000;
  function esc(s){return String(s ?? "").replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]})}
  var ICONS={
    spark:'<svg class="icon-sum" viewBox="0 0 24 24"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>',
    heart:'<svg class="icon-sum" viewBox="0 0 24 24"><path d="M12 20.6s-7.1-4.35-9.5-8.8C.9 8.4 2.6 5 6 5c2 0 3.3 1 4 2.2C10.7 6 12 5 14 5c3.4 0 5.1 3.4 3.5 6.8-2.4 4.45-9.5 8.8-9.5 8.8z"/></svg>',
    briefcase:'<svg class="icon-sum" viewBox="0 0 24 24"><path d="M9 4h6a2 2 0 0 1 2 2v1h2.25A1.75 1.75 0 0 1 21 8.75v9.5A1.75 1.75 0 0 1 19.25 20H4.75A1.75 1.75 0 0 1 3 18.25v-9.5A1.75 1.75 0 0 1 4.75 7H7V6a2 2 0 0 1 2-2zm0 3h6V6H9v1zM3 12h18v1.6c0 .77-.63 1.4-1.4 1.4H4.4c-.77 0-1.4-.63-1.4-1.4V12z"/></svg>',
    crystal:'<svg class="icon-sum" viewBox="0 0 24 24"><circle cx="12" cy="10" r="6.4"/><path d="M4.2 20.2 6 16.6h12l1.8 3.6z" opacity=".55"/></svg>'
  };
  function md(s){
    var t=esc(s).replace(/\\*\\*(.+?)\\*\\*/g,"<strong>$1</strong>").replace(/\\n/g,"<br/>");
    return t.replace(/::(spark|heart|briefcase|crystal)::/g,function(_,n){return ICONS[n]||""});
  }
  function render(draw){
    var stage=document.getElementById("stage"),viewer=document.getElementById("viewer"),gift=document.getElementById("gift"),row=document.getElementById("cards-row"),summary=document.getElementById("summary");
    viewer.innerHTML="Ramalan untuk <strong>"+esc(draw.username||"Penonton")+"</strong>";
    if(draw.giftName){
      gift.hidden=false;
      var isLike=draw.triggerType==="like";
      var symbol=isLike?'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>':'<path d="M12 20V6M7 9h10M8 6c0-1.7 1.3-3 3-3 1 0 1.8.7 2 1.7C13.2 3.7 14 3 15 3c1.7 0 3 1.3 3 3v3M5 9h14v3H5zM7 12v8h10v-8"/>';
      gift.innerHTML='<svg class="gift-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">'+symbol+'</svg><span>'+esc(draw.giftName)+(isLike?"":(draw.giftCount>1?" x "+draw.giftCount:""))+'</span>';
    }else{gift.hidden=true}
    row.innerHTML=(draw.cards||[]).map(function(c){
      return '<article class="live-card'+(c.isReversed?" reversed":"")+'">'+
        '<div class="card-frame"><img src="'+esc(c.image)+'" alt="'+esc(c.nameCn)+'"/></div>'+
        '<div class="pos">'+esc(c.positionNameCn)+'</div>'+
        '<div class="name">'+esc(c.nameCn)+'</div>'+
        (c.isReversed?'<div class="state">terbalik</div>':"")+
        '</article>';
    }).join("");
    summary.innerHTML=md(draw.summary||"Pembacaan sedang diproses...");
    stage.classList.remove("show"); void stage.offsetWidth; stage.classList.add("show");
    if(hideTimer)clearTimeout(hideTimer);
    hideTimer=setTimeout(function(){stage.classList.remove("show")},HIDE_AFTER_MS);
  }
  // Hanya boleh ada SATU loop polling. schedule() selalu membatalkan timer yang
  // masih menunggu, jadi visibilitychange tidak lagi menambah loop paralel.
  function schedule(ms){
    if(pollTimer)clearTimeout(pollTimer);
    pollTimer=setTimeout(poll,ms);
  }
  async function poll(){
    if(polling)return;
    if(document.hidden){schedule(3000);return}
    polling=true;
    var ctrl=new AbortController();
    var to=setTimeout(function(){ctrl.abort()},8000);
    try{
      var res=await fetch("/api/live/state?t="+Date.now(),{cache:"no-store",signal:ctrl.signal});
      if(!res.ok)throw new Error("state "+res.status);
      var data=await res.json();
      if(data.draw){if(data.draw.id!==lastId){lastId=data.draw.id;render(data.draw)}}
    }catch(e){}
    clearTimeout(to);
    polling=false;
    schedule(1000);
  }
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw-live.js').catch(function(){});
  }
  document.addEventListener("visibilitychange",function(){if(!document.hidden)schedule(0)});
  poll();
})();
</script>
</body>
</html>`;
}
