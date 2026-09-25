import { pageLayout } from '../lib/layout';
import { iconBook, iconSpread, iconEye, iconMoon, iconCoffee } from '../lib/icons';

export function homePage(): string {
  return pageLayout('Beranda', `

    <!-- ═══════════════════════════════════
         BANNER — fetch dari /api/banner
    ═══════════════════════════════════ -->
    <div id="site-banner" role="alert" aria-live="polite" style="display:none;"></div>

    <!-- ═══════════════════════════════════
         HERO — full-width, centered
    ═══════════════════════════════════ -->
    <section class="hero-section" aria-label="Hero">
      <div class="hero-text anim-curtain">
        <!-- Eyebrow -->
        <div class="hero-eyebrow">
          <span class="hero-eyebrow-line"></span>
          <span class="font-heading text-gold-dim" style="font-size:9.5px;letter-spacing:0.38em;text-transform:uppercase;">Divinasi &nbsp;·&nbsp; Tarot Online</span>
          <span class="hero-eyebrow-line hero-eyebrow-line-r"></span>
        </div>

        <!-- Logotype -->
        <h1 class="font-display hero-title">
          <span class="gold-shimmer">Jalur</span><br/>
          <span class="text-bone" style="letter-spacing:0.04em;">Tarot</span>
        </h1>

        <!-- Tagline -->
        <p class="font-heading text-bone-faint hero-tagline">
          Baca Kartu · Temukan Makna
        </p>

        <!-- Body copy -->
        <p class="font-body text-bone-dim hero-body">
          Setiap kartu adalah cermin — bukan ramalan. Bawa pertanyaanmu, biarkan simbol berbicara dalam bahasa yang hanya kamu yang bisa terjemahkan.
        </p>

        <!-- CTAs -->
        <div class="hero-ctas">
          <a href="/reading" class="btn-primary" aria-label="Mulai Ramalan">Mulai Ramalan</a>
          <a href="/daily" class="btn-ghost" aria-label="Kartu Harian">Kartu Harian</a>
        </div>

        <!-- Stats row -->
        <div class="hero-stats reveal reveal-delay-3">
          <div class="hero-stat">
            <span class="font-heading text-gold" style="font-size:1.4rem;">78</span>
            <span class="font-heading text-bone-faint" style="font-size:9px;letter-spacing:0.2em;">KARTU</span>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat">
            <span class="font-heading text-gold" style="font-size:1.4rem;">2</span>
            <span class="font-heading text-bone-faint" style="font-size:9px;letter-spacing:0.2em;">SUSUNAN</span>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat">
            <span class="font-heading text-gold" style="font-size:1.4rem;">✦</span>
            <span class="font-heading text-bone-faint" style="font-size:9px;letter-spacing:0.2em;">ORACLE</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Divider -->
    <div class="section-divider reveal">
      <div class="rule-gold" style="opacity:0.45;"></div>
    </div>

    <!-- ═══════════════════════════════════
         FEATURES GRID
    ═══════════════════════════════════ -->
    <section class="features-section" aria-label="Fitur">
      <div class="features-eyebrow reveal">
        <span class="font-heading text-bone-whisper" style="font-size:9px;letter-spacing:0.35em;">APA YANG BISA KAMU LAKUKAN</span>
      </div>

      <div class="features-grid">

        <!-- 78 Cards -->
        <a href="/library" class="feature-card reveal reveal-delay-1" aria-label="Perpustakaan 78 Kartu">
          <div class="feature-card-top">
            <span class="text-gold-dim feature-icon">${iconBook(20)}</span>
            <span class="font-heading text-bone-whisper feature-num">78</span>
          </div>
          <h3 class="font-heading text-bone feature-title">Tujuh Puluh Delapan</h3>
          <p class="font-heading text-gold-dim feature-sub">RIDER-WAITE SMITH</p>
          <div class="rule-ink" style="margin-bottom:1.5rem;"></div>
          <p class="font-body text-bone-faint feature-desc">Arkana Mayor dan Minor — deck lengkap dengan makna upright dan reversed setiap kartu.</p>
          <span class="feature-arrow font-heading text-gold-dim">Jelajahi →</span>
        </a>

        <!-- Spreads -->
        <a href="/reading" class="feature-card reveal reveal-delay-2" aria-label="Mulai Ramalan">
          <div class="feature-card-top">
            <span class="text-gold-dim feature-icon">${iconSpread(20)}</span>
            <span class="font-heading text-bone-whisper feature-num">02</span>
          </div>
          <h3 class="font-heading text-bone feature-title">Susunan Kartu</h3>
          <p class="font-heading text-gold-dim feature-sub">RAMALAN INSTAN</p>
          <div class="rule-ink" style="margin-bottom:1.5rem;"></div>
          <p class="font-body text-bone-faint feature-desc">Kartu Tunggal untuk jawaban cepat, atau Tiga Kartu untuk masa lalu, kini, dan masa depan.</p>
          <span class="feature-arrow font-heading text-gold-dim">Mulai →</span>
        </a>

        <!-- Ramalan Live -->
        <a href="/live" class="feature-card feature-card-highlight reveal reveal-delay-3" aria-label="Ramalan Live untuk TikTok">
          <div class="feature-card-top">
            <span class="text-gold-dim feature-icon">${iconEye(20)}</span>
            <span class="font-heading text-bone-whisper feature-num">●</span>
          </div>
          <h3 class="font-heading text-bone feature-title">Ramalan Live</h3>
          <p class="font-heading text-gold-dim feature-sub">UNTUK SIARAN TIKTOK</p>
          <div class="rule-ink" style="margin-bottom:1.5rem;"></div>
          <p class="font-body text-bone-faint feature-desc">Overlay OBS yang otomatis menarik kartu saat penonton live TikTok mengirim gift.</p>
          <span class="feature-arrow font-heading text-gold">Lihat Overlay →</span>
        </a>

        <!-- Daily -->
        <a href="/daily" class="feature-card reveal reveal-delay-4" aria-label="Kartu Harian">
          <div class="feature-card-top">
            <span class="text-gold-dim feature-icon">${iconMoon(20)}</span>
            <span class="font-heading text-bone-whisper feature-num">∞</span>
          </div>
          <h3 class="font-heading text-bone feature-title">Kartu Harian</h3>
          <p class="font-heading text-gold-dim feature-sub">RITUAL HARIAN</p>
          <div class="rule-ink" style="margin-bottom:1.5rem;"></div>
          <p class="font-body text-bone-faint feature-desc">Setiap hari, satu kartu. Refleksi singkat untuk memulai atau menutup harimu.</p>
          <span class="feature-arrow font-heading text-gold-dim">Lihat Hari Ini →</span>
        </a>

      </div>
    </section>

    <!-- ═══════════════════════════════════
         BOTTOM CTA
    ═══════════════════════════════════ -->
    <section class="bottom-cta reveal">
      <div class="bottom-cta-inner">
        <p class="font-heading text-gold-dim" style="font-size:9px;letter-spacing:0.35em;margin-bottom:1.25rem;">MULAI PERJALANANMU</p>
        <p class="font-body text-bone-faint" style="font-size:1.1rem;line-height:1.9;max-width:420px;margin:0 auto 2rem;font-style:italic;">
          Bawa pertanyaanmu. Tarik satu atau tiga kartu, dan biarkan simbol berbicara.
        </p>
        <a href="/reading" class="btn-primary" style="padding:1rem 3rem;font-size:12px;" aria-label="Mulai Ramalan">Mulai Ramalan</a>
      </div>
    </section>

    <!-- Support link -->
    <div class="support-link-wrap">
      <a href="/support" class="support-link" aria-label="Traktir Secangkir Kopi">
        ${iconCoffee(15)}
        <span class="font-heading text-bone-faint" style="font-size:9px;letter-spacing:0.25em;">TRAKTIR SECANGKIR KOPI</span>
      </a>
    </div>

    <style>
      /* ── Hero ── */
      .hero-section {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: clamp(5rem,12vh,7rem) clamp(1.5rem,4vw,3rem) 4rem;
        max-width: 760px;
      }
      .hero-text {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .hero-eyebrow {
        display: flex; align-items: center; gap: 0.9rem; margin-bottom: 2rem;
      }
      .hero-eyebrow-line {
        width: 28px; height: 1px;
        background: linear-gradient(90deg,transparent,var(--gold-dim));
        display: block; flex-shrink: 0;
      }
      .hero-eyebrow-line-r {
        background: linear-gradient(90deg,var(--gold-dim),transparent);
      }
      .hero-title {
        font-size: clamp(3.6rem,10vw,7rem);
        line-height: 0.93;
        margin-bottom: 1rem;
        letter-spacing: -0.01em;
      }
      .hero-tagline {
        font-size: 10px; letter-spacing: 0.38em;
        margin-bottom: 1.6rem; text-transform: uppercase;
      }
      .hero-body {
        font-size: 1.1rem; line-height: 1.88;
        max-width: 480px; margin-bottom: 2.5rem;
        font-style: italic; letter-spacing: 0.01em;
      }
      .hero-ctas {
        display: flex; gap: 1.25rem; flex-wrap: wrap;
        align-items: center; justify-content: center;
        margin-bottom: 2.5rem;
      }
      .hero-stats {
        display: flex; align-items: center; gap: 1.5rem; justify-content: center;
      }
      .hero-stat {
        display: flex; flex-direction: column; align-items: center; gap: 3px;
      }
      .hero-stat-divider {
        width: 1px; height: 28px;
        background: var(--ink-shine);
      }

      /* ── Section divider ── */
      .section-divider {
        padding: 0 clamp(1.5rem,4vw,3rem);
        margin-bottom: 5rem;
      }

      /* ── Features ── */
      .features-section {
        padding: 0 clamp(1.5rem,4vw,3rem) 7rem;
        max-width: 1100px;
      }
      .features-eyebrow {
        margin-bottom: 2rem;
      }
      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1px;
        border: 1px solid var(--ink-shine);
        background: var(--ink-shine);
        max-width: 920px;
      }
      .feature-card {
        padding: 2.5rem 2rem;
        text-decoration: none;
        display: flex; flex-direction: column;
        background: linear-gradient(180deg, rgba(200,168,75,0.025) 0%, var(--ink-veil) 100%);
        transition: background 0.4s, box-shadow 0.4s;
        position: relative; overflow: hidden;
      }
      .feature-card::after {
        content: '';
        position: absolute; inset-x: 0; top: 0; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(200,168,75,0), transparent);
        transition: background 0.4s;
      }
      .feature-card:hover {
        background: linear-gradient(180deg, rgba(200,168,75,0.07) 0%, var(--ink-veil) 100%);
      }
      .feature-card:hover::after {
        background: linear-gradient(90deg, transparent, rgba(200,168,75,0.35), transparent);
      }
      .feature-card-highlight {
        background: linear-gradient(180deg, rgba(200,168,75,0.07) 0%, var(--ink-veil) 100%);
      }
      .feature-card-highlight::after {
        background: linear-gradient(90deg, transparent, rgba(200,168,75,0.3), transparent) !important;
      }
      .feature-card-top {
        display: flex; justify-content: space-between; align-items: flex-start;
        margin-bottom: 1.75rem;
      }
      .feature-icon { font-size: 1.2rem; line-height: 1; }
      .feature-num  { font-size: 10px; letter-spacing: 0.2em; }
      .feature-title {
        font-size: 1rem; letter-spacing: 0.15em;
        margin-bottom: 0.4rem; font-weight: 400;
      }
      .feature-sub {
        font-size: 9px; letter-spacing: 0.25em;
        margin-bottom: 1.5rem;
      }
      .feature-desc {
        font-size: 0.95rem; line-height: 1.75;
        flex: 1;
      }
      .feature-arrow {
        font-size: 10px; letter-spacing: 0.15em;
        margin-top: 1.5rem;
        display: block;
        transition: letter-spacing 0.3s, color 0.3s;
      }
      .feature-card:hover .feature-arrow { letter-spacing: 0.22em; }

      /* ── Bottom CTA ── */
      .bottom-cta {
        padding: 0 clamp(1.5rem,4vw,3rem) 5rem;
      }
      .bottom-cta-inner {
        max-width: 560px;
        margin: 0 auto;
        text-align: center;
        border: 1px solid var(--ink-shine);
        padding: 3.5rem 2rem;
        background: linear-gradient(180deg, rgba(200,168,75,0.04) 0%, transparent 100%);
        position: relative;
      }
      .bottom-cta-inner::before {
        content: '';
        position: absolute; inset-x: 20%; top: 0; height: 1px;
        background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
      }

      /* ── Support link ── */
      .support-link-wrap {
        padding: 0 1.75rem 5rem;
        text-align: center;
      }
      .support-link {
        text-decoration: none;
        display: inline-flex; align-items: center; gap: 0.6rem;
        opacity: 0.45;
        transition: opacity 0.35s;
        font-size: 0.9rem;
      }
      .support-link:hover { opacity: 1; }

      /* ── Site Banner ── */
      #site-banner {
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 200;
        padding: 0.65rem 1.25rem 0.65rem 3.5rem;
        font-family: 'Cinzel', serif;
        font-size: 11px;
        letter-spacing: 0.08em;
        line-height: 1.5;
        text-align: center;
        animation: bannerSlide 0.4s ease forwards;
      }
      #site-banner.type-info {
        background: rgba(41,128,185,0.92);
        color: #d0eeff;
        border-bottom: 1px solid rgba(41,128,185,0.6);
      }
      #site-banner.type-warning {
        background: rgba(180,110,0,0.95);
        color: #fff3cd;
        border-bottom: 1px solid rgba(243,156,18,0.5);
      }
      #site-banner.type-error {
        background: rgba(160,30,20,0.95);
        color: #ffddd9;
        border-bottom: 1px solid rgba(192,57,43,0.5);
      }
      #site-banner.type-default {
        background: rgba(60,45,10,0.97);
        color: var(--gold-pale, #f0e0a0);
        border-bottom: 1px solid var(--gold-dim, #7a6128);
        backdrop-filter: blur(6px);
      }
      .banner-close {
        position: absolute;
        right: 0.75rem; top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: inherit;
        opacity: 0.55;
        font-size: 15px;
        cursor: pointer;
        line-height: 1;
        padding: 4px 6px;
        transition: opacity 0.2s;
      }
      .banner-close:hover { opacity: 1; }
      .banner-icon { margin-right: 0.45rem; }
      @keyframes bannerSlide {
        from { transform: translateY(-100%); opacity: 0; }
        to   { transform: translateY(0);     opacity: 1; }
      }
      /* Dorong konten utama ke bawah saat banner aktif */
      body.has-banner .content-wrap {
        padding-top: 2.6rem;
      }
    </style>

    <script>
      (function() {
        var BANNER_DISMISS_KEY = 'jalurtarot-banner-dismissed-v1';
        var bannerEl = document.getElementById('site-banner');
        if (!bannerEl) return;

        fetch('/api/banner')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (!data || !data.active || !data.text) return;

            // Cek apakah user sudah dismiss banner ini
            var dismissed = sessionStorage.getItem(BANNER_DISMISS_KEY);
            if (dismissed === data.text) return;

            // Tentukan icon dan class berdasarkan type
            var typeClass = 'type-default';
            var icon = '✦';
            if (data.type === 'info')    { typeClass = 'type-info';    icon = 'ℹ'; }
            if (data.type === 'warning') { typeClass = 'type-warning'; icon = '⚠'; }
            if (data.type === 'error')   { typeClass = 'type-error';   icon = '⚠'; }

            bannerEl.className = typeClass;
            bannerEl.innerHTML =
              '<span class="banner-icon">' + icon + '</span>' +
              data.text +
              '<button class="banner-close" aria-label="Tutup pengumuman">✕</button>';

            bannerEl.style.display = 'block';
            document.body.classList.add('has-banner');

            bannerEl.querySelector('.banner-close').addEventListener('click', function() {
              sessionStorage.setItem(BANNER_DISMISS_KEY, data.text);
              bannerEl.style.animation = 'bannerSlide 0.3s ease reverse forwards';
              setTimeout(function() {
                bannerEl.style.display = 'none';
                document.body.classList.remove('has-banner');
              }, 280);
            });
          })
          .catch(function() { /* banner gagal fetch — silent fail */ });
      })();
    </script>
  `, '');
}
