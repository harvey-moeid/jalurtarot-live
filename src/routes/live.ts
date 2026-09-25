import { Hono } from 'hono';
import type { Env as ApiEnv } from './api';
import { generateLiveDraw, getLiveDraw, saveLiveDraw, type LiveSpreadId } from '../lib/live';

export type LiveEnv = ApiEnv & {
  LIVE_SECRET?: string;
};

const live = new Hono<{ Bindings: LiveEnv }>();

function isValidSpreadId(value: unknown): value is LiveSpreadId {
  return value === 'single' || value === 'three-card';
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

  if (!givenSecret || givenSecret !== expectedSecret) {
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
  await saveLiveDraw(c.env, draw);

  return c.json({ ok: true, draw });
});

// GET /api/live/state
// Polled by the OBS/browser overlay.
live.get('/state', async (c) => {
  const draw = await getLiveDraw(c.env);
  return c.json({ draw });
});

export default live;

// GET /live
// Transparent overlay for OBS Browser Source.
export function liveOverlayPage(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<meta name="theme-color" content="#08070b"/>
<title>Jalur Tarot - Live</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#08070b;--panel:rgba(20,17,24,.82);--gold:#d9b45a;--gold2:#f0d58a;--cream:#f5f0e7;--muted:#a9a19a;--line:rgba(217,180,90,.24);--shadow:0 24px 70px rgba(0,0,0,.42)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;min-height:100%;background:transparent}
body{font-family:"Cormorant Garamond",serif;color:var(--cream);display:flex;align-items:center;justify-content:center;padding:clamp(12px,3vw,32px);overflow-x:hidden}
#stage{width:min(960px,100%);display:none;position:relative;padding:clamp(18px,4vw,34px);border:1px solid var(--line);border-radius:28px;background:linear-gradient(145deg,rgba(15,12,20,.92),rgba(7,6,10,.76));box-shadow:var(--shadow),inset 0 1px rgba(255,255,255,.05);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
#stage:before{content:"";position:absolute;inset:8px;border:1px solid rgba(217,180,90,.08);border-radius:21px;pointer-events:none}
#stage.show{display:block;animation:rise .55s cubic-bezier(.2,.8,.2,1)}
@keyframes rise{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:none}}
.kicker{display:flex;align-items:center;justify-content:center;gap:8px;color:var(--gold);font-family:"Cinzel",serif;font-size:clamp(9px,1.7vw,12px);font-weight:600;letter-spacing:.22em;text-transform:uppercase;text-align:center}
.kicker-mark{display:inline-flex;align-items:center;justify-content:center;color:var(--gold);opacity:.9}
.kicker:before,.kicker:after{content:"";height:1px;width:clamp(24px,7vw,70px);background:linear-gradient(90deg,transparent,var(--gold))}
.kicker:after{background:linear-gradient(90deg,var(--gold),transparent)}
.viewer{margin-top:8px;text-align:center;font-size:clamp(17px,3vw,25px);line-height:1.15}
.viewer strong{color:var(--gold2);font-weight:600}
.gift{display:inline-flex;align-items:center;gap:7px;margin:10px auto 0;padding:6px 11px;border:1px solid rgba(217,180,90,.18);border-radius:999px;background:rgba(217,180,90,.07);color:#d8d0c4;font-size:clamp(12px,2.2vw,15px)}
.gift-icon{display:inline-flex;align-items:center;color:var(--gold)}
.cards-row{display:flex;justify-content:center;align-items:flex-start;gap:clamp(10px,2.2vw,22px);margin:clamp(18px,4vw,28px) auto;width:100%}
.live-card{width:clamp(112px,19vw,170px);text-align:center}
.card-frame{position:relative;padding:4px;border-radius:13px;background:linear-gradient(145deg,var(--gold2),#7e5a1d,var(--gold));box-shadow:0 15px 34px rgba(0,0,0,.46)}
.live-card img{display:block;width:100%;aspect-ratio:.652;object-fit:cover;border-radius:9px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.live-card.reversed img{transform:rotate(180deg)}
.pos{margin-top:9px;color:var(--gold);font-family:"Cinzel",serif;font-size:clamp(8px,1.6vw,11px);letter-spacing:.13em;text-transform:uppercase}
.name{margin-top:4px;font-size:clamp(14px,2.5vw,19px);line-height:1.05}
.state{display:inline-block;margin-top:4px;font-size:11px;color:#9f968b;font-style:italic}
.summary{border-top:1px solid var(--line);padding:18px clamp(4px,2vw,16px) 2px;text-align:center;font-size:clamp(16px,2.7vw,21px);line-height:1.45;color:#eee8dd}
.summary strong{color:var(--gold2);font-weight:600}
.footer{margin-top:14px;text-align:center;color:#746e67;font-family:"Cinzel",serif;font-size:8px;letter-spacing:.18em;text-transform:uppercase}
@media(max-width:560px){
body{align-items:flex-start;padding:12px;padding-top:max(12px,env(safe-area-inset-top))}
#stage{border-radius:22px;padding:17px 14px 14px}
#stage:before{inset:5px;border-radius:17px}
.cards-row{gap:8px;margin:17px auto 18px}
.live-card{width:calc((100% - 16px)/3);max-width:126px}
.card-frame{padding:3px;border-radius:11px}
.live-card img{border-radius:8px}
.summary{font-size:16px;line-height:1.42;padding-top:15px}
.footer{font-size:7px}
}
@media(max-width:360px){
#stage{padding:14px 10px 12px}
.viewer{font-size:18px}
.name{font-size:13px}
.pos{font-size:7px}
.summary{font-size:15px}
}
</style>
</head>
<body>
<main id="stage" aria-live="polite">
  <div class="kicker"><img class="kicker-mark" src="/icons/live-spark.svg" alt="" aria-hidden="true"/><span>Jalur Tarot - Live Reading</span></div>
  <div class="viewer" id="viewer"></div>
  <div class="gift" id="gift" hidden></div>
  <div class="cards-row" id="cards-row"></div>
  <div class="summary" id="summary"></div>
  <div class="footer">interpretasi untuk hiburan &amp; refleksi pribadi</div>
</main>
<script>
(function(){
  var lastId=null,hideTimer=null,HIDE_AFTER_MS=45000;
  function esc(s){return String(s ?? "").replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]})}
  function md(s){return esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\\n/g,"<br/>")}
  function render(draw){
    var stage=document.getElementById("stage"),viewer=document.getElementById("viewer"),gift=document.getElementById("gift"),row=document.getElementById("cards-row"),summary=document.getElementById("summary");
    viewer.innerHTML="Ramalan untuk <strong>"+esc(draw.username||"Penonton")+"</strong>";
    if(draw.giftName){
      gift.hidden=false;
      gift.innerHTML='<img class="gift-icon" src="/icons/live-gift.svg" alt="" aria-hidden="true"/><span>'+esc(draw.giftName)+(draw.giftCount>1?" x "+draw.giftCount:"")+'</span>';
    }else{gift.hidden=true}
    row.innerHTML=(draw.cards||[]).map(function(c){
      return '<article class="live-card'+(c.isReversed?" reversed":"")+'">'+
        '<div class="card-frame"><img src="'+esc(c.image)+'" alt="'+esc(c.nameCn)+'"/></div>'+
        '<div class="pos">'+esc(c.positionNameCn)+'</div>'+
        '<div class="name">'+esc(c.nameCn)+'</div>'+
        (c.isReversed?'<div class="state">terbalik</div>':"")+
        '</article>';
    }).join("");
    summary.innerHTML=md(draw.summary||"");
    stage.classList.remove("show"); void stage.offsetWidth; stage.classList.add("show");
    if(hideTimer)clearTimeout(hideTimer);
    hideTimer=setTimeout(function(){stage.classList.remove("show")},HIDE_AFTER_MS);
  }
  async function poll(){
    try{
      var res=await fetch("/api/live/state",{cache:"no-store"});
      if(!res.ok)throw new Error("state "+res.status);
      var data=await res.json();
      if(data.draw&&data.draw.id!==lastId){lastId=data.draw.id;render(data.draw)}
    }catch(e){}
    setTimeout(poll,2000);
  }
  poll();
})();
</script>
</body>
</html>`;
}
