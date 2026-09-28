import { iconStar, iconMoon, iconSpread, iconBook, iconCoffee, iconDiamond } from './icons';

interface PageMeta {
  description?: string;
  ogImage?: string;
  ogType?: string;
}

export function pageLayout(title: string, bodyContent: string, extraHead = '', meta: PageMeta = {}): string {
  const description = meta.description || 'Baca kartu takdirmu. Deck Rider-Waite-Smith 78 kartu lengkap dengan 6 susunan dan interpretasi mendalam.';
  const ogImage = meta.ogImage || '/og-image.jpg';
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Jalur Tarot</title>
  <!-- Favicon & PWA -->
  <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
  <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#c9a84c" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

  <!-- SEO -->
  <meta name="description" content="${description}" />
  <meta name="keywords" content="tarot, tarot indonesia, baca tarot, kartu tarot, rider waite smith, tarot online" />
  <meta name="robots" content="index, follow" />
  <meta name="author" content="Jalur Tarot" />

  <!-- Open Graph -->
  <meta property="og:title" content="${title} — Jalur Tarot" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="id_ID" />
  <meta property="og:site_name" content="Jalur Tarot" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title} — Jalur Tarot" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${ogImage}" />

  <!-- Fonts — preload kritis -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Marcellus&display=swap" rel="stylesheet" />

  <style>
    /* ══════════════════════════════════════
       DESIGN TOKENS
    ══════════════════════════════════════ */
    :root {
      --ink-void:    #050507;
      --ink-deep:    #09090c;
      --ink-veil:    #101014;
      --ink-mist:    #18181e;
      --ink-line:    #242430;
      --ink-shine:   #2e2e3c;

      --gold:        #c8a84b;
      --gold-bright: #e2c96a;
      --gold-warm:   #d4ac52;
      --gold-dim:    #7a6128;
      --gold-faint:  #3a2e12;
      --gold-pale:   #f0e0a0;
      --gold-glow:   rgba(200,168,75,0.18);

      --bone:        #ede8de;
      --bone-dim:    #cac4b5;
      --bone-faint:  #9a9489;
      --bone-whisper:#3e3a34;

      --mist:        #5c6e90;
      --celestial:   #6a7fa8;
      --celestial-dim:#3e4e68;
      --rose:        #8c5a5a;

      --font-display: 'Cinzel Decorative', serif;
      --font-heading: 'Cinzel', serif;
      --font-body:    'Cormorant Garamond', serif;
      --font-ui:      'Marcellus', serif;

      --ease-ritual:  cubic-bezier(0.4, 0, 0.2, 1);
      --ease-veil:    cubic-bezier(0.25, 0.46, 0.45, 0.94);
      --ease-emerge:  cubic-bezier(0.16, 1, 0.3, 1);

      --nav-w: 56px;
      --nav-mob-h: 72px;
    }

    /* ══════════════════════════════════════
       RESET & BASE
    ══════════════════════════════════════ */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html {
      background: var(--ink-void);
      color: var(--bone-dim);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      scroll-behavior: smooth;
    }
    body {
      font-family: var(--font-body);
      min-height: 100vh;
      font-size: 17px;
      overflow-x: hidden;
    }

    /* ══════════════════════════════════════
       TYPOGRAPHY UTILS
    ══════════════════════════════════════ */
    .font-display { font-family: var(--font-display); }
    .font-heading  { font-family: var(--font-heading); }
    .font-body     { font-family: var(--font-body); }
    .font-ui       { font-family: var(--font-ui); }

    /* ══════════════════════════════════════
       COLOR UTILS
    ══════════════════════════════════════ */
    .text-gold         { color: var(--gold); }
    .text-gold-bright  { color: var(--gold-bright); }
    .text-gold-dim     { color: var(--gold-dim); }
    .text-gold-pale    { color: var(--gold-pale); }
    .text-bone         { color: var(--bone); }
    .text-bone-dim     { color: var(--bone-dim); }
    .text-bone-faint   { color: var(--bone-faint); }
    .text-bone-whisper { color: var(--bone-whisper); }
    .text-mist         { color: var(--mist); }
    .text-celestial    { color: var(--celestial); }
    .bg-void  { background: var(--ink-void); }
    .bg-deep  { background: var(--ink-deep); }
    .bg-veil  { background: var(--ink-veil); }
    .border-line { border-color: var(--ink-line); }
    .border-gold { border-color: var(--gold-dim); }

    /* ══════════════════════════════════════
       ATMOSPHERIC LAYERS
    ══════════════════════════════════════ */
    /* Film grain */
    body::before {
      content: '';
      position: fixed; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.045'/%3E%3C/svg%3E");
      pointer-events: none; z-index: 50; opacity: 0.55; mix-blend-mode: overlay;
    }
    /* Deep vignette */
    body::after {
      content: '';
      position: fixed; inset: 0;
      background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.65) 100%);
      pointer-events: none; z-index: 0;
    }
    #stars-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
    .ambient-orb {
      position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
      filter: blur(80px); opacity: 0.07; mix-blend-mode: screen;
    }

    /* ══════════════════════════════════════
       SIDE NAV (desktop)
    ══════════════════════════════════════ */
    .side-nav {
      position: fixed; left: 0; top: 0; bottom: 0; width: var(--nav-w);
      display: flex; flex-direction: column; align-items: center;
      padding: 2rem 0; gap: 2.5rem; z-index: 100;
      border-right: 1px solid var(--ink-shine);
      background: linear-gradient(180deg, rgba(5,5,7,0.95) 0%, rgba(9,9,12,0.92) 100%);
      backdrop-filter: blur(20px) saturate(1.4);
    }
    .side-nav a, .side-nav button {
      text-decoration: none; color: var(--bone-whisper);
      font-family: var(--font-heading); font-size: 9px; letter-spacing: 0.25em;
      writing-mode: vertical-rl; text-orientation: mixed;
      transition: color 0.4s, letter-spacing 0.4s, opacity 0.3s;
      background: none; border: none; cursor: pointer;
      position: relative;
    }
    .side-nav a::before {
      content: '';
      position: absolute; left: -1px; top: 50%; transform: translateY(-50%);
      width: 2px; height: 0;
      background: linear-gradient(180deg, transparent, var(--gold), transparent);
      transition: height 0.35s var(--ease-emerge);
    }
    .side-nav a:hover::before,
    .side-nav a.nav-active::before { height: 24px; }
    .side-nav a:hover, .side-nav button:hover { color: var(--gold); letter-spacing: 0.35em; }
    .side-nav a.nav-active { color: var(--gold); }
    .side-nav .logo {
      writing-mode: horizontal-tb; color: var(--gold);
      display: flex; align-items: center; justify-content: center;
      filter: drop-shadow(0 0 8px rgba(200,168,75,0.5));
      transition: filter 0.4s; letter-spacing: 0;
    }
    .side-nav .logo:hover { filter: drop-shadow(0 0 14px rgba(200,168,75,0.85)); }
    .side-nav .logo::before { display: none; }
    .side-nav .nav-kopi {
      margin-top: auto;
      writing-mode: horizontal-tb;
      display: flex; align-items: center; justify-content: center;
      opacity: 0.55;
      letter-spacing: 0;
      transition: opacity 0.3s, filter 0.3s;
    }
    .side-nav .nav-kopi:hover { opacity: 1; filter: drop-shadow(0 0 6px rgba(200,168,75,0.5)); }
    .side-nav .nav-kopi::before { display: none; }

    /* ══════════════════════════════════════
       MOBILE NAV — 5 item, glassmorphism
    ══════════════════════════════════════ */
    .mobile-nav {
      display: none;
      position: fixed; bottom: 0; left: 0; right: 0;
      background: linear-gradient(180deg, rgba(5,5,7,0.82) 0%, rgba(5,5,7,0.98) 100%);
      border-top: 1px solid var(--ink-shine);
      padding: 0.6rem 0.5rem env(safe-area-inset-bottom, 0.6rem);
      z-index: 100;
      justify-content: space-around; align-items: center;
      backdrop-filter: blur(28px) saturate(1.8);
      -webkit-backdrop-filter: blur(28px) saturate(1.8);
    }
    .mobile-nav a {
      text-decoration: none; color: var(--bone-whisper);
      font-family: var(--font-heading); font-size: 9.5px; letter-spacing: 0.07em;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      transition: color 0.3s; padding: 0.35rem 0.5rem; min-width: 52px;
      position: relative;
    }
    .mobile-nav a::after {
      content: '';
      position: absolute; bottom: -0.5rem; left: 50%; transform: translateX(-50%);
      width: 0; height: 1px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
      transition: width 0.35s var(--ease-emerge);
    }
    .mobile-nav a.active::after { width: 28px; }
    .mobile-nav a:hover, .mobile-nav a.active { color: var(--gold); }
    .mobile-nav .nav-icon {
      display: flex; align-items: center; justify-content: center;
      height: 18px; width: 18px;
      transition: transform 0.3s var(--ease-emerge), filter 0.3s;
    }
    .mobile-nav a.active .nav-icon {
      filter: drop-shadow(0 0 6px rgba(200,168,75,0.75));
      transform: translateY(-2px);
    }
    .mobile-nav .nav-label { font-size: 9px; letter-spacing: 0.06em; }

    /* ══════════════════════════════════════
       RESPONSIVE
    ══════════════════════════════════════ */
    @media (max-width: 768px) {
      .side-nav { display: none; }
      .mobile-nav { display: flex !important; }
      .main-content { padding-left: 0 !important; padding-bottom: var(--nav-mob-h) !important; }
    }

    /* ══════════════════════════════════════
       PANELS
    ══════════════════════════════════════ */
    .ink-panel {
      background: var(--ink-veil);
      border: 1px solid var(--ink-shine);
      border-radius: 1px;
    }
    .ink-panel-quiet {
      background: rgba(16,16,20,0.7);
      border: 1px solid var(--ink-shine);
      border-radius: 1px;
      backdrop-filter: blur(8px);
      transition: border-color 0.4s, box-shadow 0.4s;
    }
    .ink-panel-quiet:hover {
      border-color: var(--gold-dim);
      box-shadow: 0 0 0 1px var(--gold-faint) inset, 0 8px 32px rgba(0,0,0,0.4);
    }
    .ink-panel-glow {
      background: linear-gradient(180deg, rgba(200,168,75,0.04) 0%, transparent 40%), var(--ink-veil);
      border: 1px solid var(--ink-shine);
      border-radius: 1px;
      transition: border-color 0.4s, box-shadow 0.4s, background 0.4s;
    }
    .ink-panel-glow:hover {
      border-color: rgba(200,168,75,0.3);
      box-shadow: 0 0 24px rgba(200,168,75,0.06), 0 8px 32px rgba(0,0,0,0.3);
    }

    /* ══════════════════════════════════════
       BUTTONS
    ══════════════════════════════════════ */
    .btn-primary {
      background: linear-gradient(135deg, rgba(200,168,75,0.14) 0%, rgba(200,168,75,0.06) 100%);
      border: 1px solid var(--gold-dim);
      color: var(--gold);
      font-family: var(--font-heading);
      letter-spacing: 0.2em; font-size: 11px; font-weight: 500;
      padding: 0.85rem 2.25rem;
      cursor: pointer; transition: all 0.35s var(--ease-veil);
      text-decoration: none; display: inline-block;
      position: relative; overflow: hidden;
    }
    .btn-primary::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(200,168,75,0.18), transparent);
      opacity: 0; transition: opacity 0.35s;
    }
    .btn-primary:hover {
      border-color: var(--gold-bright);
      color: var(--gold-pale);
      box-shadow: 0 0 24px rgba(200,168,75,0.18), 0 4px 16px rgba(0,0,0,0.4);
      transform: translateY(-1px);
    }
    .btn-primary:hover::before { opacity: 1; }
    .btn-primary:active { transform: translateY(0); }

    .btn-ghost {
      background: transparent;
      border: 1px solid var(--ink-shine);
      color: var(--bone-faint);
      font-family: var(--font-heading);
      letter-spacing: 0.2em; font-size: 11px;
      padding: 0.85rem 2.25rem;
      cursor: pointer; transition: all 0.35s;
      text-decoration: none; display: inline-block;
    }
    .btn-ghost:hover {
      border-color: var(--gold-dim);
      color: var(--bone-dim);
      transform: translateY(-1px);
    }
    .btn-ghost:active { transform: translateY(0); }

    /* ══════════════════════════════════════
       TAROT CARD
    ══════════════════════════════════════ */
    .tarot-card-img {
      width: 100%; height: 100%; object-fit: cover;
      transition: transform 1.2s var(--ease-veil);
    }
    .float-card {
      box-shadow:
        0 0 0 1px var(--gold-faint),
        0 0 40px -8px rgba(200,168,75,0.4),
        0 0 90px -20px rgba(200,168,75,0.18),
        0 28px 70px rgba(0,0,0,0.95),
        0 4px 12px rgba(0,0,0,0.7);
      border: none;
      position: relative;
    }
    .float-card::before {
      content: '';
      position: absolute; inset: 0; z-index: 2;
      border: 1px solid rgba(200,168,75,0.28);
      pointer-events: none;
    }
    .float-card::after {
      content: '';
      position: absolute; top: 0; left: 8%; right: 8%; height: 1px; z-index: 3;
      background: linear-gradient(90deg, transparent, rgba(240,224,160,0.6), transparent);
      pointer-events: none;
    }

    /* ══════════════════════════════════════
       CARD FLIP (3D)
    ══════════════════════════════════════ */
    .card-flip-wrap {
      perspective: 900px;
      cursor: pointer;
    }
    .card-flip-inner {
      position: relative;
      width: 100%; height: 100%;
      transform-style: preserve-3d;
      transition: transform 0.75s var(--ease-emerge);
    }
    .card-flip-wrap.flipped .card-flip-inner {
      transform: rotateY(180deg);
    }
    .card-flip-front,
    .card-flip-back {
      position: absolute; inset: 0;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      overflow: hidden;
    }
    .card-flip-back {
      transform: rotateY(180deg);
    }
    /* Card back pattern */
    .card-flip-front {
      background: var(--ink-mist);
      border: 1px solid var(--gold-faint);
      display: flex; align-items: center; justify-content: center;
      flex-direction: column; gap: 0.5rem;
    }
    .card-back-pattern {
      position: absolute; inset: 8px;
      border: 1px solid rgba(200,168,75,0.15);
      background:
        repeating-linear-gradient(45deg, rgba(200,168,75,0.03) 0px, rgba(200,168,75,0.03) 1px, transparent 1px, transparent 8px),
        repeating-linear-gradient(-45deg, rgba(200,168,75,0.03) 0px, rgba(200,168,75,0.03) 1px, transparent 1px, transparent 8px);
    }

    /* ══════════════════════════════════════
       SKELETON LOADER
    ══════════════════════════════════════ */
    @keyframes skeletonPulse {
      0%, 100% { opacity: 0.4; }
      50%       { opacity: 0.85; }
    }
    .skeleton {
      background: linear-gradient(135deg, var(--ink-mist) 0%, var(--ink-line) 50%, var(--ink-mist) 100%);
      animation: skeletonPulse 1.8s ease-in-out infinite;
    }
    .skeleton-card {
      border: 1px solid var(--gold-faint);
      box-shadow: 0 0 30px -8px rgba(200,168,75,0.15), 0 20px 50px rgba(0,0,0,0.8);
    }

    /* ══════════════════════════════════════
       SCROLL REVEAL
    ══════════════════════════════════════ */
    .reveal {
      opacity: 0;
      transform: translateY(28px);
      transition: opacity 0.7s var(--ease-emerge), transform 0.7s var(--ease-emerge);
    }
    .reveal.reveal-left {
      transform: translateX(-28px);
    }
    .reveal.reveal-right {
      transform: translateX(28px);
    }
    .reveal.visible {
      opacity: 1;
      transform: translate(0);
    }
    .reveal-delay-1 { transition-delay: 0.1s; }
    .reveal-delay-2 { transition-delay: 0.2s; }
    .reveal-delay-3 { transition-delay: 0.3s; }
    .reveal-delay-4 { transition-delay: 0.4s; }
    .reveal-delay-5 { transition-delay: 0.5s; }

    /* ══════════════════════════════════════
       PHASE TRANSITIONS (reading/agent)
    ══════════════════════════════════════ */
    .phase-panel {
      transition: opacity 0.45s var(--ease-veil), transform 0.45s var(--ease-emerge);
    }
    .phase-panel.phase-exit {
      opacity: 0;
      transform: translateY(-12px) scale(0.99);
      pointer-events: none;
    }
    .phase-panel.phase-enter {
      opacity: 0;
      transform: translateY(16px) scale(0.99);
    }
    .phase-panel.phase-enter-active {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .hidden { display: none !important; }

    /* ══════════════════════════════════════
       ANIMATIONS
    ══════════════════════════════════════ */
    @keyframes drift {
      0%,100% { transform: translateY(0) rotate(0deg); }
      50%      { transform: translateY(-14px) rotate(2deg); }
    }
    @keyframes twinkle  { 0%,100%{opacity:0.25} 50%{opacity:1} }
    @keyframes whisper  { 0%,100%{opacity:0.06} 50%{opacity:0.3} }
    @keyframes curtain {
      from { opacity:0; transform: translateY(28px) scale(0.97); }
      to   { opacity:1; transform: translateY(0) scale(1); }
    }
    @keyframes shimmer {
      from { background-position: -200% center; }
      to   { background-position: 200% center; }
    }
    @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes pulse  { 0%,100%{opacity:0.4} 50%{opacity:1} }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes glowPulse {
      0%,100% { box-shadow: 0 0 40px -8px rgba(200,168,75,0.35), 0 28px 70px rgba(0,0,0,0.95); }
      50%      { box-shadow: 0 0 60px -4px rgba(200,168,75,0.55), 0 28px 70px rgba(0,0,0,0.95); }
    }
    @keyframes cardReveal {
      from { opacity:0; transform: translateY(20px) rotateX(8deg); }
      to   { opacity:1; transform: translateY(0) rotateX(0deg); }
    }

    .anim-drift    { animation: drift 9s ease-in-out infinite; }
    .anim-twinkle  { animation: twinkle 3.5s ease-in-out infinite; }
    .anim-whisper  { animation: whisper 5s ease-in-out infinite; }
    .anim-curtain  { animation: curtain 0.9s var(--ease-emerge) both; }
    .anim-fadeup   { animation: fadeUp 0.6s var(--ease-emerge) both; }
    .anim-glow     { animation: glowPulse 4s ease-in-out infinite; }
    .anim-card-reveal { animation: cardReveal 0.65s var(--ease-emerge) both; }

    /* Gold shimmer text */
    .gold-shimmer {
      background: linear-gradient(90deg, var(--gold) 0%, var(--gold-pale) 40%, var(--gold) 60%, var(--gold-bright) 100%);
      background-size: 200% auto;
      -webkit-background-clip: text; background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 4s linear infinite;
    }

    /* ══════════════════════════════════════
       SCATTER SYMBOLS
    ══════════════════════════════════════ */
    .scatter-symbol {
      position: fixed; color: var(--gold-faint);
      pointer-events: none; z-index: 1; user-select: none;
    }

    /* ══════════════════════════════════════
       STREAMING CURSOR
    ══════════════════════════════════════ */
    .streaming-cursor::after {
      content: '▋'; color: var(--gold);
      animation: pulse 1.2s ease-in-out infinite;
    }

    /* ══════════════════════════════════════
       SCROLLBAR
    ══════════════════════════════════════ */
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: var(--ink-void); }
    ::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, var(--gold-faint), var(--ink-line));
      border-radius: 2px;
    }

    /* ══════════════════════════════════════
       INPUT
    ══════════════════════════════════════ */
    .ink-input {
      background: var(--ink-mist);
      border: 1px solid var(--ink-shine);
      color: var(--bone); font-family: var(--font-body); font-size: 1.05rem;
      padding: 0.9rem 1rem; width: 100%; resize: none; outline: none;
      transition: border-color 0.3s, box-shadow 0.3s; border-radius: 1px;
      letter-spacing: 0.01em;
    }
    .ink-input:focus {
      border-color: var(--gold-dim);
      box-shadow: 0 0 0 1px var(--gold-faint) inset, 0 0 16px rgba(200,168,75,0.06);
    }
    .ink-input::placeholder { color: var(--bone-whisper); font-style: italic; }

    /* ══════════════════════════════════════
       MODAL
    ══════════════════════════════════════ */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.88);
      backdrop-filter: blur(6px);
      z-index: 200; display: flex;
      align-items: center; justify-content: center; padding: 1rem;
      animation: fadeUp 0.3s var(--ease-emerge) both;
    }
    .modal-box {
      background: var(--ink-veil);
      border: 1px solid var(--ink-shine);
      max-width: 480px; width: 100%; padding: 2rem;
      position: relative;
      box-shadow: 0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px var(--gold-faint);
      animation: curtain 0.4s var(--ease-emerge) both;
    }

    /* ══════════════════════════════════════
       DIVIDERS
    ══════════════════════════════════════ */
    .rule-gold {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--gold-dim) 30%, var(--gold) 50%, var(--gold-dim) 70%, transparent);
    }
    .rule-ink {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--ink-shine), transparent);
    }

    /* ══════════════════════════════════════
       PROSE MARKDOWN
    ══════════════════════════════════════ */
    .prose-tarot { line-height: 1.85; font-size: 1.05rem; }
    .prose-tarot p { margin-bottom: 1.1rem; color: var(--bone-dim); }
    .prose-tarot h1, .prose-tarot h2, .prose-tarot h3 {
      color: var(--bone); font-family: var(--font-heading);
      margin-bottom: 0.6rem; margin-top: 1.75rem;
      letter-spacing: 0.12em; font-size: 0.95rem;
    }
    .prose-tarot strong { color: var(--bone); font-weight: 600; }
    .prose-tarot em { color: var(--bone-faint); }
    .prose-tarot hr {
      border: none; height: 1px; margin: 1.5rem 0;
      background: linear-gradient(90deg, transparent, var(--ink-shine), transparent);
    }
    .prose-tarot ul { padding-left: 1.5rem; margin-bottom: 1rem; }
    .prose-tarot li { color: var(--bone-dim); margin-bottom: 0.3rem; }

    /* ══════════════════════════════════════
       REVERSED CARD
    ══════════════════════════════════════ */
    .reversed { transform: rotate(180deg); }

    /* ══════════════════════════════════════
       CHIPS / BADGES
    ══════════════════════════════════════ */
    .chip {
      display: inline-block; padding: 2px 10px;
      font-family: var(--font-heading); font-size: 9px; letter-spacing: 0.2em;
      border: 1px solid var(--ink-shine); color: var(--bone-faint);
      background: rgba(16,16,20,0.6);
    }
    .chip-gold {
      border-color: var(--gold-faint); color: var(--gold-dim);
      background: rgba(200,168,75,0.06);
    }
    .num-badge {
      font-family: var(--font-heading); font-size: 10px;
      letter-spacing: 0.15em; color: var(--bone-whisper);
    }

    /* ══════════════════════════════════════
       TONE BUTTON
    ══════════════════════════════════════ */
    .tone-btn {
      padding: 8px 16px;
      min-height: 36px;
      font-family: var(--font-heading); font-size: 9px; letter-spacing: 0.15em;
      border: 1px solid var(--ink-shine);
      background: none; color: var(--bone-whisper); cursor: pointer;
      transition: border-color 0.2s, color 0.2s, background 0.2s;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
    }
    .tone-btn:hover { border-color: var(--gold-dim); color: var(--bone-faint); }
    .tone-btn:active { transform: scale(0.97); }
    .tone-active {
      border-color: var(--gold) !important;
      background: rgba(200,168,75,0.12) !important;
      color: var(--gold) !important;
      box-shadow: 0 0 8px rgba(200,168,75,0.15);
    }

    /* ══════════════════════════════════════
       FILTER BUTTONS (library)
    ══════════════════════════════════════ */
    .filter-btn {
      font-family: var(--font-heading); font-size: 11px; letter-spacing: 0.15em;
      padding: 0.4rem 1rem;
      border: 1px solid var(--ink-line);
      color: var(--bone-faint);
      background: none; cursor: pointer;
      transition: border-color 0.3s, color 0.3s;
    }
    .filter-btn:hover { border-color: var(--gold-dim); color: var(--bone-dim); }
    .filter-active {
      border-color: var(--gold-dim) !important;
      color: var(--gold) !important;
      background: rgba(200,168,75,0.06) !important;
    }

    /* ══════════════════════════════════════
       CREDIT BADGE & PANEL
    ══════════════════════════════════════ */
    .nav-credit-btn {
      background: none; border: 1px solid var(--ink-shine);
      cursor: pointer; padding: 4px 6px;
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.3s, background 0.3s;
      position: relative;
    }
    .nav-credit-btn:hover { border-color: var(--gold-dim); background: rgba(200,168,75,0.06); }
    .nav-credit-btn:focus-visible { outline: 2px solid var(--gold-dim); outline-offset: 2px; }

    .credit-num {
      font-family: var(--font-heading);
      font-size: 10px; letter-spacing: 0.12em;
      color: var(--gold-dim);
      line-height: 1;
      transition: color 0.3s;
    }
    .credit-num.credit-low  { color: var(--mist); }
    .credit-num.credit-zero { color: var(--rose); }

    /* Mobile credit button */
    .mobile-credit-btn {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      background: none; border: none; cursor: pointer;
      padding: 0.35rem 0.5rem; min-width: 52px;
      color: var(--bone-whisper);
      font-family: var(--font-heading); font-size: 9px; letter-spacing: 0.07em;
      transition: color 0.3s;
    }
    .mobile-credit-btn:hover { color: var(--gold); }
    .mobile-credit-btn:focus-visible { outline: 2px solid var(--gold-dim); outline-offset: 2px; }

    /* Credit panel popup */
    .credit-panel {
      position: fixed;
      bottom: calc(var(--nav-mob-h) + 0.75rem);
      left: 0.75rem; right: 0.75rem;
      z-index: 150;
      animation: fadeUp 0.3s var(--ease-emerge) both;
    }
    @media (min-width: 769px) {
      .credit-panel {
        bottom: auto;
        top: auto;
        left: calc(var(--nav-w) + 0.75rem);
        right: auto;
        bottom: 1.5rem;
        width: 280px;
      }
    }
    .credit-panel.hidden { display: none !important; }
    .credit-panel-inner {
      background: var(--ink-veil);
      border: 1px solid var(--ink-shine);
      box-shadow: 0 20px 60px rgba(0,0,0,0.85), 0 0 0 1px var(--gold-faint);
      padding: 1.5rem;
      position: relative;
      backdrop-filter: blur(20px);
    }
    .credit-panel-inner::before {
      content: '';
      position: absolute; inset-x: 20%; top: 0; height: 1px;
      background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
    }
    .credit-panel-close {
      position: absolute; top: 0.75rem; right: 0.75rem;
      background: none; border: none; cursor: pointer;
      color: var(--bone-faint); font-size: 1rem;
      transition: color 0.3s, transform 0.3s;
      width: 24px; height: 24px;
      display: flex; align-items: center; justify-content: center;
    }
    .credit-panel-close:hover { color: var(--bone); transform: rotate(90deg); }

    /* Big number */
    .credit-display {
      display: flex; align-items: baseline; gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .credit-big-num {
      font-family: var(--font-heading);
      font-size: 2.4rem; letter-spacing: 0.05em;
      color: var(--gold);
      line-height: 1;
      transition: color 0.4s;
    }
    .credit-big-num.credit-low  { color: var(--mist); }
    .credit-big-num.credit-zero { color: var(--rose); }

    /* Progress bar */
    .credit-bar-wrap {
      height: 2px;
      background: var(--ink-shine);
      margin-bottom: 0.5rem;
      overflow: hidden;
    }
    .credit-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--gold-dim), var(--gold-bright));
      transition: width 0.6s var(--ease-emerge);
      width: 0%;
    }
    .credit-bar.bar-low  { background: linear-gradient(90deg, var(--mist), var(--celestial)); }
    .credit-bar.bar-zero { background: var(--rose); width: 100% !important; opacity: 0.4; }

    /* ══════════════════════════════════════
       SPREAD CARD
    ══════════════════════════════════════ */
    .spread-card {
      border: 1px solid var(--ink-shine);
      background: var(--ink-veil);
      cursor: pointer;
      transition: border-color 0.35s, box-shadow 0.35s, transform 0.35s;
      padding: 1.5rem 1.25rem;
      position: relative;
      overflow: hidden;
    }
    .spread-card::before {
      content: '';
      position: absolute; inset-x: 0; top: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(200,168,75,0), transparent);
      transition: background 0.4s;
    }
    .spread-card:hover {
      border-color: var(--gold-dim);
      box-shadow: 0 0 20px rgba(200,168,75,0.08), 0 8px 30px rgba(0,0,0,0.4);
      transform: translateY(-3px);
    }
    .spread-card:hover::before {
      background: linear-gradient(90deg, transparent, rgba(200,168,75,0.35), transparent);
    }
    .spread-card.selected {
      border-color: var(--gold) !important;
      box-shadow: 0 0 28px rgba(200,168,75,0.14), 0 8px 30px rgba(0,0,0,0.5) !important;
      background: linear-gradient(180deg, rgba(200,168,75,0.06) 0%, var(--ink-veil) 100%);
    }
    .spread-card.selected::before {
      background: linear-gradient(90deg, transparent, rgba(200,168,75,0.5), transparent);
    }

    /* Spread position dots */
    .spread-positions {
      display: flex; gap: 4px; flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .spread-dot {
      width: 8px; height: 12px;
      border: 1px solid var(--gold-faint);
      background: rgba(200,168,75,0.04);
      border-radius: 1px;
    }
    .spread-card.selected .spread-dot {
      border-color: var(--gold-dim);
      background: rgba(200,168,75,0.12);
    }
  </style>
  ${extraHead}
</head>
<body class="bg-void relative">
  <canvas id="stars-canvas" aria-hidden="true"></canvas>

  <!-- Ambient glow orbs -->
  <div class="ambient-orb" style="width:600px;height:600px;top:-120px;left:-120px;background:radial-gradient(circle,rgba(200,168,75,1),transparent 70%);"></div>
  <div class="ambient-orb" style="width:700px;height:700px;bottom:-180px;right:-180px;background:radial-gradient(circle,rgba(70,80,110,1),transparent 70%);opacity:0.05;"></div>

  <!-- Side Nav -->
  <nav class="side-nav" role="navigation" aria-label="Navigasi Utama">
    <a href="/" class="logo" title="JalurTarot — Beranda" aria-label="Beranda JalurTarot">${iconStar(16)}</a>
    <a href="/daily"   title="Kartu Harian"         aria-label="Kartu Harian">Harian</a>
    <a href="/reading" title="Mulai Ramalan"         aria-label="Ramalan">Ramalan</a>
    <a href="/library" title="Perpustakaan 78 Kartu" aria-label="Kartu">Kartu</a>
    <a href="/history" title="Riwayat Ramalan"       aria-label="Riwayat">Riwayat</a>

    <a href="/support" class="nav-kopi" title="Traktir Kopi" aria-label="Traktir Kopi">${iconCoffee(16)}</a>
  </nav>

  <!-- Mobile Nav — 4 item -->
  <nav class="mobile-nav" role="navigation" aria-label="Navigasi Mobile">
    <a href="/"        aria-label="Beranda"><span class="nav-icon">${iconStar(18)}</span><span class="nav-label">Home</span></a>
    <a href="/daily"   aria-label="Kartu Harian"><span class="nav-icon">${iconMoon(18)}</span><span class="nav-label">Harian</span></a>
    <a href="/reading" aria-label="Ramalan"><span class="nav-icon">${iconSpread(18)}</span><span class="nav-label">Ramalan</span></a>
    <a href="/library" aria-label="Kartu"><span class="nav-icon">${iconBook(18)}</span><span class="nav-label">Kartu</span></a>
  </nav>

  <!-- Main Content -->
  <main class="main-content" style="padding-left:var(--nav-w); position:relative; z-index:10;">
    ${bodyContent}
  </main>

  <!-- Scatter symbols -->
  <span class="scatter-symbol anim-drift"   style="top:10%;right:16%;animation-delay:0s;opacity:0.45;" aria-hidden="true">${iconDiamond(24)}</span>
  <span class="scatter-symbol anim-whisper" style="top:62%;left:12%;animation-delay:2s;" aria-hidden="true">${iconMoon(16)}</span>
  <span class="scatter-symbol anim-drift"   style="bottom:25%;right:10%;animation-delay:5s;opacity:0.35;" aria-hidden="true">${iconStar(28)}</span>

  <script>
    /* ── Stars & Ambient ── */
    (function() {
      const canvas = document.getElementById('stars-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let stars = [], nebula = [], mouse = { x: -1000, y: -1000 };
      let W, H;

      function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        initStars();
      }
      function initStars() {
        stars = Array.from({ length: 170 }, () => ({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 0.9 + 0.15,
          o: Math.random() * 0.5 + 0.1,
          speed: Math.random() * 0.25 + 0.05,
          phase: Math.random() * Math.PI * 2,
          warm: Math.random() > 0.68,
        }));
        nebula = Array.from({ length: 9 }, () => ({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.5 + 0.8,
          o: Math.random() * 0.3 + 0.05,
          speed: Math.random() * 0.15 + 0.04,
          phase: Math.random() * Math.PI * 2,
        }));
      }
      function draw(t) {
        ctx.clearRect(0, 0, W, H);
        stars.forEach(s => {
          const glow = Math.sin(t * 0.001 * s.speed + s.phase) * 0.5 + 0.5;
          const dx = mouse.x - s.x, dy = mouse.y - s.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const attract = Math.max(0, 1 - dist / 260);
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r + attract * 0.9, 0, Math.PI * 2);
          const a = s.o * (0.3 + glow * 0.5) * (1 + attract * 0.85);
          ctx.fillStyle = s.warm ? \`rgba(220,190,100,\${a})\` : \`rgba(200,210,240,\${a * 0.6})\`;
          ctx.fill();
        });
        nebula.forEach(s => {
          const glow = Math.sin(t * 0.001 * s.speed + s.phase) * 0.5 + 0.5;
          const a = s.o * (0.5 + glow * 0.5);
          ctx.save(); ctx.translate(s.x, s.y);
          const sz = s.r * (1.5 + glow);
          ctx.fillStyle = \`rgba(200,168,75,\${a})\`;
          ctx.fillRect(-sz * 0.2, -sz, sz * 0.4, sz * 2);
          ctx.fillRect(-sz, -sz * 0.2, sz * 2, sz * 0.4);
          ctx.restore();
        });
        if (mouse.x > 0 && mouse.x < W) {
          const grd = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
          grd.addColorStop(0, 'rgba(200,168,75,0.055)');
          grd.addColorStop(1, 'rgba(200,168,75,0)');
          ctx.fillStyle = grd;
          ctx.fillRect(0, 0, W, H);
        }
        requestAnimationFrame(draw);
      }
      window.addEventListener('resize', resize);
      window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
      window.addEventListener('touchmove', e => {
        mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY;
      }, { passive: true });
      resize();
      requestAnimationFrame(draw);
    })();

    /* ── Active Nav ── */
    (function() {
      const p = location.pathname;
      document.querySelectorAll('.side-nav a').forEach(a => {
        const href = a.getAttribute('href');
        if (href === p || (p.startsWith(href) && href !== '/')) a.classList.add('nav-active');
      });
      document.querySelectorAll('.mobile-nav a').forEach(a => {
        const href = a.getAttribute('href');
        if (href === p || (p.startsWith(href) && href !== '/')) a.classList.add('active');
      });
    })();

    /* ── Scroll Reveal (IntersectionObserver) ── */
    (function() {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(el => {
          if (el.isIntersecting) {
            el.target.classList.add('visible');
            obs.unobserve(el.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    })();


    /* ── Phase Transition helper (global) ── */
    window.showPhaseAnimated = function(currentId, nextId) {
      const current = document.getElementById(currentId);
      const next    = document.getElementById(nextId);
      if (!next) return;
      if (current && !current.classList.contains('hidden')) {
        current.classList.add('phase-exit');
        setTimeout(() => {
          current.classList.add('hidden');
          current.classList.remove('phase-exit');
          next.classList.remove('hidden');
          next.classList.add('phase-enter');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              next.classList.add('phase-enter-active');
              next.classList.remove('phase-enter');
            });
          });
        }, 400);
      } else {
        if (current) current.classList.add('hidden');
        next.classList.remove('hidden');
        next.classList.add('phase-enter');
        requestAnimationFrame(() => requestAnimationFrame(() => {
          next.classList.add('phase-enter-active');
          next.classList.remove('phase-enter');
        }));
      }
    };
  </script>
</body>
</html>`;
}