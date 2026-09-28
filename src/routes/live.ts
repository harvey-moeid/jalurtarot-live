import { Hono } from 'hono';
import type { Env as ApiEnv } from './api';
import { generateLiveDraw, getLiveDraw, saveLiveDraw, type LiveSpreadId } from '../lib/live';

export type LiveEnv = ApiEnv & {
  LIVE_SECRET?: string;
};

const live = new Hono<{ Bindings: LiveEnv }>();

// Draw yang lebih tua dari ini tidak dikirim lagi oleh /state. Disamakan dengan
// HIDE_AFTER_MS di overlay (45 detik): draw selebar itu memang sudah disembunyikan,
// jadi tidak ada yang hilang dari alur normal. Yang dicegah: overlay yang dibuka /
// di-refresh menampilkan draw lama (KV menyimpannya sampai 6 jam).
// Memakai jam server (bukan jam browser) supaya tidak terpengaruh jam perangkat.
const LIVE_STATE_MAX_AGE_MS = 45_000;

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
  await saveLiveDraw(c.env, draw);

  return c.json({ ok: true, draw });
});

// GET /api/live/state
// Polled by the OBS/browser overlay. Hanya mengembalikan draw yang masih "segar"
// (lihat LIVE_STATE_MAX_AGE_MS); selain itu { draw: null }.
live.get('/state', async (c) => {
  const draw = await getLiveDraw(c.env);
  const fresh = draw && Date.now() - draw.createdAt <= LIVE_STATE_MAX_AGE_MS ? draw : null;
  c.header('Cache-Control', 'no-store');
  return c.json({ draw: fresh });
});

export default live;

// GET /live
// Overlay layar penuh untuk OBS Browser Source / perangkat.
// Layout: portrait (bawaan), desktop/landscape besar (bawaan), dan HP dimiringkan
// (landscape pendek, max-height 520px): kartu di kiri, teks ramalan di kanan dan
// bergulir otomatis bila lebih panjang dari ruang yang tersedia.
//
// Animasi (rev10):
//  - Layar idle (#idle): bintang berkelip + tiga kartu tertutup melayang + teks ajakan.
//    Tampil otomatis kapan pun #stage tidak aktif (CSS: "#stage.show ~ #idle").
//  - Kocok kartu ~1,4 detik (murni tampilan; hasil draw sudah ditentukan Worker).
//  - Kartu dibalik satu per satu (flip 3D); nama kartu dan teks ramalan baru
//    muncul setelah kartunya terbuka supaya tidak membocorkan hasil sebelum flip.
//  - prefers-reduced-motion: kocok dan flip dilewati, kartu langsung terbuka.
// Semua animasi memakai transform/opacity saja agar ringan di HP.
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
#stage{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;min-width:100vw;min-height:100dvh;max-width:none;max-height:none;aspect-ratio:auto;display:none;padding:max(28px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) max(28px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left));border:0;border-radius:0;background:linear-gradient(145deg,rgba(15,12,20,.98),rgba(7,6,10,.98));box-shadow:none;overflow:auto;overscroll-behavior:none}
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
.gift[hidden]{display:none}
.gift-icon{display:inline-block;width:14px;height:14px;flex:none;vertical-align:-2px;color:var(--gold)}
.cards-row{display:flex;justify-content:center;align-items:flex-start;gap:clamp(8px,1.8vw,22px);margin:clamp(28px,5vw,56px) auto;width:100%;max-width:100%}
.live-card{width:clamp(150px,27vw,280px);max-width:31%;text-align:center}
.card-frame{position:relative;padding:5px;border-radius:15px;background:linear-gradient(145deg,var(--gold2),#7e5a1d,var(--gold));box-shadow:0 15px 34px rgba(0,0,0,.46);perspective:900px}
.live-card img{display:block;width:100%;aspect-ratio:.652;object-fit:cover;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.live-card.reversed img{transform:rotate(180deg)}
.pos{margin-top:9px;color:var(--gold);font-family:"Cinzel",serif;font-size:clamp(9px,1.7vw,12px);letter-spacing:.13em;text-transform:uppercase}
.name{margin-top:4px;font-size:clamp(15px,2.7vw,21px);line-height:1.05}
.state{display:inline-block;margin-top:4px;font-size:11px;color:#9f968b;font-style:italic}
.summary{border-top:1px solid var(--line);padding:22px clamp(4px,2vw,18px) 2px;text-align:center;font-size:clamp(18px,2.8vw,26px);line-height:1.45;color:#eee8dd}
.summary strong{color:var(--gold2);font-weight:600}
.icon-sum{width:.9em;height:.9em;vertical-align:-0.12em;margin-right:.22em;fill:var(--gold)}
.footer{margin-top:14px;text-align:center;color:#746e67;font-family:"Cinzel",serif;font-size:8px;letter-spacing:.18em;text-transform:uppercase}
/* Flip kartu: awalnya menampilkan punggung kartu (.flip diputar 180 derajat),
   kelas .open pada .live-card memutarnya ke sisi depan (gambar kartu). */
.flip{position:relative;transform-style:preserve-3d;transform:rotateY(180deg);transition:transform .9s cubic-bezier(.3,.7,.2,1)}
.live-card.open .flip{transform:rotateY(0)}
.front,.back{border-radius:10px;-webkit-backface-visibility:hidden;backface-visibility:hidden}
.back{position:absolute;inset:0;transform:rotateY(180deg);display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid rgba(217,180,90,.55);background:radial-gradient(circle at 50% 50%,rgba(217,180,90,.30),transparent 58%),linear-gradient(160deg,#26193c,#0d0918)}
.back:before{content:"";position:absolute;inset:7%;border:1px solid rgba(217,180,90,.32);border-radius:6px}
.back svg{position:relative;width:44%;height:auto;color:var(--gold)}
/* Nama kartu & teks ramalan disembunyikan sampai kartunya terbuka. */
.meta{opacity:0;transition:opacity .5s ease .45s}
.live-card.open .meta{opacity:1}
.summary{opacity:0;transition:opacity .7s ease}
.summary.in{opacity:1}
/* Kocok: kartu bergeser ke tengah, bertukar sisi, lalu kembali. --dx = arah geser
   (persen lebar kartu, menuju kartu tengah), --rot = arah miring. */
@keyframes shuffle{
0%{transform:none}
25%{transform:translate(calc(var(--dx,0)*1%),-4%) rotate(calc(var(--rot,0)*1deg)) scale(.96)}
50%{transform:translate(calc(var(--dx,0)*-.6%),3%) rotate(calc(var(--rot,0)*-1deg)) scale(.96)}
75%{transform:translate(calc(var(--dx,0)*.5%),-2%) rotate(calc(var(--rot,0)*.6deg)) scale(.97)}
100%{transform:none}
}
.cards-row.shuffling .live-card{animation:shuffle 1.4s ease-in-out .35s both}
/* Layar idle: tampil kapan pun #stage tidak aktif. */
#idle{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,3vh,26px);text-align:center;pointer-events:none;overflow:hidden;--ch:min(30vh,200px);background:radial-gradient(ellipse at 50% 40%,rgba(38,25,60,.55),transparent 70%),var(--bg)}
#stage.show ~ #idle{display:none}
#idle:before,#idle:after{content:"";position:absolute;inset:0;background-repeat:repeat;animation:twinkle 5s ease-in-out infinite alternate}
#idle:before{background-image:radial-gradient(1px 1px at 20px 30px,#fff,transparent),radial-gradient(1px 1px at 90px 80px,#f0d58a,transparent),radial-gradient(1.5px 1.5px at 160px 40px,#fff,transparent),radial-gradient(1px 1px at 60px 130px,#fff,transparent);background-size:200px 160px}
#idle:after{background-image:radial-gradient(1px 1px at 40px 70px,#f0d58a,transparent),radial-gradient(1.5px 1.5px at 130px 20px,#fff,transparent),radial-gradient(1px 1px at 110px 120px,#fff,transparent);background-size:260px 190px;animation-duration:7s;animation-delay:-2s}
@keyframes twinkle{from{opacity:.25}to{opacity:.9}}
.idle-fan{position:relative;width:calc(var(--ch)*1.4);height:var(--ch);flex:none}
.ic{position:absolute;left:50%;top:0;width:calc(var(--ch)*.652);height:var(--ch);margin-left:calc(var(--ch)*-.326);border-radius:10px;border:1px solid rgba(217,180,90,.55);background:radial-gradient(circle at 50% 50%,rgba(217,180,90,.30),transparent 58%),linear-gradient(160deg,#26193c,#0d0918);box-shadow:0 12px 28px rgba(0,0,0,.5);transform-origin:50% 100%;animation:floaty 5s ease-in-out infinite}
.ic:before{content:"";position:absolute;inset:7%;border:1px solid rgba(217,180,90,.32);border-radius:6px}
.i1{--x:-46%;--r:-14deg}
.i2{--x:0%;--r:0deg;animation-delay:-1.6s}
.i3{--x:46%;--r:14deg;animation-delay:-3.2s}
@keyframes floaty{0%,100%{transform:translate(var(--x),0) rotate(var(--r))}50%{transform:translate(var(--x),-8px) rotate(var(--r))}}
.idle-copy{position:relative;display:flex;flex-direction:column;gap:clamp(6px,1.4vh,12px)}
.idle-title{color:var(--gold);font-family:"Cinzel",serif;font-size:clamp(10px,1.7vw,15px);font-weight:600;letter-spacing:.22em;text-transform:uppercase}
.idle-text{font-size:clamp(18px,3.4vw,30px);line-height:1.2;color:var(--cream);animation:pulse 3.2s ease-in-out infinite}
.idle-sub{font-size:clamp(13px,2.2vw,18px);color:var(--muted)}
@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
@media(prefers-reduced-motion:reduce){
#idle:before,#idle:after,.ic,.idle-text{animation:none}
.flip{transition:none}
.cards-row.shuffling .live-card{animation:none}
}
@media(max-aspect-ratio:3/4){
body{align-items:center}
#stage{width:100vw;height:100vh;height:100dvh;max-height:none;max-width:none;padding:max(24px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))}
#stage:before{inset:10px;border-radius:18px}
.cards-row{gap:7px;margin:24px auto 22px}
.live-card{width:calc((100% - 14px)/3);max-width:none}
.card-frame{padding:4px;border-radius:13px}
.live-card img{border-radius:9px}
.front,.back{border-radius:9px}
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
/* HP dimiringkan (landscape pendek): kartu kiri, teks kanan, tanpa scroll manual.
   Tinggi kartu = min(56% tinggi layar, 24% lebar layar) supaya 3 kartu tidak
   menghabiskan kolom teks pada layar sempit. Ditaruh paling akhir agar menimpa
   aturan landscape di atas. */
@media(orientation:landscape) and (max-height:520px){
#stage{padding:max(8px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));overflow:hidden}
#stage.show{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto auto auto minmax(0,1fr) auto;grid-template-areas:"cards kicker" "cards viewer" "cards gift" "cards summary" "cards footer";column-gap:clamp(12px,3vw,28px);align-items:start}
#stage:before{inset:5px;border-radius:14px}
.kicker{grid-area:kicker;font-size:9px;letter-spacing:.16em}
.kicker:before,.kicker:after{width:14px}
.viewer{grid-area:viewer;margin-top:4px;font-size:clamp(14px,5dvh,20px)}
.gift{grid-area:gift;margin:5px auto 0;padding:3px 9px;font-size:11px}
.cards-row{grid-area:cards;align-self:center;margin:0;width:auto;max-width:none;gap:clamp(6px,1.6vw,12px);flex-wrap:nowrap}
.live-card{width:auto;max-width:none}
.card-frame{padding:3px;border-radius:10px}
.live-card img{width:auto;height:min(56vh,24vw);height:min(56dvh,24vw);border-radius:7px}
.front,.back{border-radius:7px}
.pos{margin-top:4px;font-size:8px}
.name{margin-top:2px;font-size:12px}
.state{margin-top:2px;font-size:9px}
.summary{grid-area:summary;min-height:0;overflow:hidden;margin-top:6px;padding:7px 2px 0;text-align:left;font-size:clamp(11px,3.7vh,15px);font-size:clamp(11px,3.7dvh,15px);line-height:1.35}
.footer{grid-area:footer;margin-top:4px;font-size:6px}
#idle{--ch:min(40vh,26vw);flex-direction:row;gap:4vw}
.idle-copy{text-align:left;max-width:45vw}
.idle-text{font-size:clamp(14px,5vh,22px)}
.idle-sub{font-size:clamp(11px,3.6vh,15px)}
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
<div id="idle" aria-hidden="true">
  <div class="idle-fan"><span class="ic i1"></span><span class="ic i2"></span><span class="ic i3"></span></div>
  <div class="idle-copy">
    <div class="idle-title">Jalur Tarot - Live</div>
    <div class="idle-text">Kirim gift untuk mendapat ramalan</div>
    <div class="idle-sub">Kartu tarot untukmu, langsung di layar</div>
  </div>
</div>
<script>
(function(){
  var lastId=null,hideTimer=null,HIDE_AFTER_MS=45000,scrollRaf=0,scrollTimer=0,timers=[];
  var SHUFFLE_MS=1800,FLIP_START_MS=1900,FLIP_GAP_MS=750,FLIP_DUR_MS=900;
  var reduce=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var BACK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>';
  function later(fn,ms){timers.push(setTimeout(fn,ms))}
  function clearTimers(){for(var i=0;i<timers.length;i++)clearTimeout(timers[i]);timers=[]}
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
  // Teks ramalan yang lebih panjang dari kotaknya (layout HP dimiringkan) digulir
  // pelan ke bawah setelah jeda baca (delay, ms); selesai sebelum overlay disembunyikan.
  // Pada layout lain kotak ini tidak overflow, jadi fungsi ini tidak melakukan apa-apa.
  function autoScroll(el,delay){
    cancelAnimationFrame(scrollRaf);clearTimeout(scrollTimer);
    el.scrollTop=0;
    scrollTimer=setTimeout(function(){
      var max=el.scrollHeight-el.clientHeight;
      if(max<=2)return;
      var dur=Math.min(HIDE_AFTER_MS-delay-6000,Math.max(6000,max*45)),start=null;
      if(dur<3000)dur=3000;
      function step(t){
        if(start===null)start=t;
        var p=Math.min(1,(t-start)/dur);
        el.scrollTop=max*p;
        if(p<1)scrollRaf=requestAnimationFrame(step);
      }
      scrollRaf=requestAnimationFrame(step);
    },delay);
  }
  function render(draw){
    var stage=document.getElementById("stage"),viewer=document.getElementById("viewer"),gift=document.getElementById("gift"),row=document.getElementById("cards-row"),summary=document.getElementById("summary");
    clearTimers();
    viewer.innerHTML="Ramalan untuk <strong>"+esc(draw.username||"Penonton")+"</strong>";
    if(draw.giftName){
      gift.hidden=false;
      gift.innerHTML='<svg class="gift-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 20V6M7 9h10M8 6c0-1.7 1.3-3 3-3 1 0 1.8.7 2 1.7C13.2 3.7 14 3 15 3c1.7 0 3 1.3 3 3v3M5 9h14v3H5zM7 12v8h10v-8"/></svg><span>'+esc(draw.giftName)+(draw.giftCount>1?" x "+draw.giftCount:"")+'</span>';
    }else{gift.hidden=true}
    var cards=draw.cards||[],n=cards.length,mid=(n-1)/2;
    row.className="cards-row";
    row.innerHTML=cards.map(function(c,i){
      var dx=Math.round((mid-i)*100),rot=(i%2?-1:1)*6;
      return '<article class="live-card'+(c.isReversed?" reversed":"")+'" style="--i:'+i+';--dx:'+dx+';--rot:'+rot+'">'+
        '<div class="card-frame"><div class="flip">'+
        '<div class="back">'+BACK+'</div>'+
        '<div class="front"><img src="'+esc(c.image)+'" alt="'+esc(c.nameCn)+'"/></div>'+
        '</div></div>'+
        '<div class="meta">'+
        '<div class="pos">'+esc(c.positionNameCn)+'</div>'+
        '<div class="name">'+esc(c.nameCn)+'</div>'+
        (c.isReversed?'<div class="state">terbalik</div>':"")+
        '</div>'+
        '</article>';
    }).join("");
    summary.innerHTML=md(draw.summary||"Pembacaan sedang diproses...");
    summary.classList.remove("in");
    stage.classList.remove("show"); void stage.offsetWidth; stage.classList.add("show");

    // Urutan: kocok -> kartu dibuka satu per satu -> teks ramalan muncul -> gulir teks.
    // Dengan prefers-reduced-motion semuanya langsung tampil tanpa jeda.
    var startAt=reduce?0:FLIP_START_MS,gap=reduce?0:FLIP_GAP_MS;
    if(!reduce){
      row.classList.add("shuffling");
      later(function(){row.classList.remove("shuffling")},SHUFFLE_MS);
    }
    var arts=row.querySelectorAll(".live-card");
    for(var i=0;i<arts.length;i++){
      (function(a,k){later(function(){a.classList.add("open")},startAt+k*gap)})(arts[i],i);
    }
    var doneAt=startAt+Math.max(0,n-1)*gap+(reduce?0:FLIP_DUR_MS);
    later(function(){summary.classList.add("in")},doneAt);
    autoScroll(summary,doneAt+3000);

    if(hideTimer)clearTimeout(hideTimer);
    hideTimer=setTimeout(function(){stage.classList.remove("show")},HIDE_AFTER_MS);
  }
  async function poll(){
    try{
      var res=await fetch("/api/live/state?t="+Date.now(),{cache:"no-store"});
      if(!res.ok)throw new Error("state "+res.status);
      var data=await res.json();
      if(data.draw){if(data.draw.id!==lastId){lastId=data.draw.id;render(data.draw)}}
    }catch(e){}
    setTimeout(poll,1000);
  }
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw-live.js').catch(function(){});
  }
  document.addEventListener("visibilitychange",function(){if(!document.hidden)poll()});
  poll();
})();
</script>
</body>
</html>`;
}
