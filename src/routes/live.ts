import { Hono } from 'hono';
import type { Env as ApiEnv } from './api';
import { generateLiveDraw, getLiveDraw, saveLiveDraw, type LiveSpreadId } from '../lib/live';

export type LiveEnv = ApiEnv & {
  // Token rahasia yang harus dikirim bot TikTok listener di header X-Live-Secret.
  // Set via: wrangler secret put LIVE_SECRET
  LIVE_SECRET?: string;
};

const live = new Hono<{ Bindings: LiveEnv }>();

function isValidSpreadId(v: unknown): v is LiveSpreadId {
  return v === 'single' || v === 'three-card';
}

// ══════════════════════════════════════════════════════════
// POST /api/live/trigger — dipanggil oleh bot Node.js TikTok listener
// ══════════════════════════════════════════════════════════
live.post('/trigger', async (c) => {
  const expectedSecret = (c.env.LIVE_SECRET || '').trim();
  const givenSecret = (c.req.header('X-Live-Secret') || '').trim();

  if (!expectedSecret) {
    return c.json({ error: 'LIVE_SECRET belum di-set di server. Jalankan: wrangler secret put LIVE_SECRET' }, 500 as any);
  }
  if (!givenSecret || givenSecret !== expectedSecret) {
    return c.json({ error: 'Unauthorized — X-Live-Secret salah/kosong' }, 401 as any);
  }

  let body: any;
  try { body = await c.req.json(); }
  catch { return c.json({ error: 'Format JSON tidak valid' }, 400 as any); }

  const spreadId: LiveSpreadId = isValidSpreadId(body.spreadId) ? body.spreadId : 'single';
  const username: string = typeof body.username === 'string' ? body.username.slice(0, 60) : 'Penonton';
  const giftName: string | undefined = typeof body.giftName === 'string' ? body.giftName.slice(0, 60) : undefined;
  const giftCount: number | undefined = typeof body.giftCount === 'number' ? body.giftCount : undefined;

  const draw = generateLiveDraw(spreadId, username, giftName, giftCount);
  await saveLiveDraw(c.env, draw);

  return c.json({ ok: true, draw });
});

// ══════════════════════════════════════════════════════════
// GET /api/live/state — di-poll halaman overlay tiap beberapa detik
// ══════════════════════════════════════════════════════════
live.get('/state', async (c) => {
  const draw = await getLiveDraw(c.env);
  return c.json({ draw });
});

export default live;

// ══════════════════════════════════════════════════════════
// GET /live — halaman overlay untuk OBS Browser Source
// Latar transparan, tanpa navigasi, auto-update via polling.
// ══════════════════════════════════════════════════════════
export function liveOverlayPage(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Jalur Tarot — Live Overlay</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { background: transparent; overflow: hidden; width:100%; height:100%; }
  body {
    font-family:'Cormorant Garamond', serif;
    color:#ede8de;
    display:flex; align-items:center; justify-content:center;
    min-height:100vh;
  }
  #stage { display:none; text-align:center; max-width:900px; padding:2rem; }
  #stage.show { display:block; animation: fadeIn 0.6s ease; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(16px);} to {opacity:1; transform:translateY(0);} }
  .headline {
    font-family:'Cinzel', serif; letter-spacing:0.15em; font-size:1.1rem;
    color:#c8a84b; text-shadow: 0 2px 12px rgba(0,0,0,0.8); margin-bottom:1.2rem;
  }
  .cards-row { display:flex; gap:1.4rem; justify-content:center; margin-bottom:1.4rem; flex-wrap:wrap; }
  .live-card { width:150px; }
  .live-card img {
    width:150px; height:230px; object-fit:cover; border-radius:8px;
    border:2px solid #c8a84b; box-shadow:0 8px 30px rgba(0,0,0,0.7);
    transition: transform 0.4s ease;
  }
  .live-card.reversed img { transform: rotate(180deg); }
  .live-card .pos { font-family:'Cinzel',serif; font-size:0.65rem; letter-spacing:0.15em; color:#c8a84b; margin-top:0.5rem; text-shadow:0 2px 8px rgba(0,0,0,0.8); }
  .live-card .name { font-size:1rem; margin-top:0.15rem; text-shadow:0 2px 8px rgba(0,0,0,0.9); }
  .summary {
    font-size:1.15rem; line-height:1.6; white-space:pre-wrap;
    background:rgba(5,5,7,0.55); border:1px solid rgba(200,168,75,0.35);
    border-radius:12px; padding:1.2rem 1.6rem; text-shadow:0 2px 8px rgba(0,0,0,0.9);
    backdrop-filter: blur(3px);
  }
  .summary strong { color:#c8a84b; }
</style>
</head>
<body>
  <div id="stage">
    <div class="headline" id="headline"></div>
    <div class="cards-row" id="cards-row"></div>
    <div class="summary" id="summary"></div>
  </div>

<script>
(function () {
  var lastId = null;
  var HIDE_AFTER_MS = 45000; // sembunyikan overlay 45 detik setelah draw ditampilkan
  var hideTimer = null;

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m];
    });
  }

  function mdToHtml(s) {
    return escHtml(s)
      .replace(/\\*\\*(.+?)\\*\\*/g, function (_m, inner) { return '<strong>' + inner + '</strong>'; })
      .replace(/\\n/g, '<br/>');
  }

  function render(draw) {
    var stage = document.getElementById('stage');
    var headline = document.getElementById('headline');
    var cardsRow = document.getElementById('cards-row');
    var summary = document.getElementById('summary');

    var giftLine = draw.giftName
      ? '✦ ' + escHtml(draw.username) + ' mengirim ' + escHtml(draw.giftName) + (draw.giftCount > 1 ? ' x' + draw.giftCount : '') + ' ✦'
      : '✦ Ramalan untuk ' + escHtml(draw.username) + ' ✦';
    headline.textContent = giftLine;

    cardsRow.innerHTML = draw.cards.map(function (c) {
      return '<div class="live-card' + (c.isReversed ? ' reversed' : '') + '">' +
        '<img src="' + c.image + '" alt="' + escHtml(c.nameCn) + '"/>' +
        '<div class="pos">' + escHtml(c.positionNameCn) + '</div>' +
        '<div class="name">' + escHtml(c.nameCn) + (c.isReversed ? ' (terbalik)' : '') + '</div>' +
        '</div>';
    }).join('');

    summary.innerHTML = mdToHtml(draw.summary);

    stage.classList.add('show');
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { stage.classList.remove('show'); }, HIDE_AFTER_MS);
  }

  async function poll() {
    try {
      const res = await fetch('/api/live/state', { cache: 'no-store' });
      const data = await res.json();
      if (data.draw && data.draw.id !== lastId) {
        lastId = data.draw.id;
        render(data.draw);
      }
    } catch (e) { /* diamkan — coba lagi di poll berikutnya */ }
    setTimeout(poll, 2000);
  }
  poll();
})();
</script>
</body>
</html>`;
}
