import { pageLayout } from '../lib/layout';
import { iconStar } from '../lib/icons';

export function supportPage(): string {
  return pageLayout('Traktir Kopi', `
    <div class="support-wrap">

      <!-- Eyebrow -->
      <div class="support-eyebrow reveal">
        <span class="eyebrow-line left" aria-hidden="true"></span>
        <span class="font-heading text-gold-dim" style="font-size:9px;letter-spacing:0.38em;">DUKUNG JALURTAROT</span>
        <span class="eyebrow-line right" aria-hidden="true"></span>
      </div>

      <!-- Heading -->
      <h1 class="font-display text-bone support-title reveal reveal-delay-1">
        Traktir <span class="gold-shimmer">Secangkir Kopi</span>
      </h1>

      <!-- Subtext -->
      <p class="font-body text-bone-faint support-subtext reveal reveal-delay-2">
        JalurTarot dibuat dan dijaga oleh satu orang, dengan sepenuh hati.
        Tidak ada iklan, tidak ada paywall. Kalau kamu merasa terbantu —
        secangkir kopi kecil sudah sangat berarti.
      </p>

      <div class="rule-gold" style="width:60px;margin:0 auto 2.5rem;opacity:0.6;" aria-hidden="true"></div>

      <!-- QRIS Card -->
      <div class="ink-panel-glow qris-card reveal reveal-delay-3">
        <div class="qris-card-top">
          <span class="text-gold" aria-hidden="true">${iconStar(12)}</span>
          <span class="font-heading text-gold-dim" style="font-size:9px;letter-spacing:0.3em;">SCAN QRIS · SEMUA DOMPET DIGITAL</span>
          <span class="text-gold" aria-hidden="true">${iconStar(12)}</span>
        </div>
        <div class="qris-img-wrap" role="img" aria-label="Kode QRIS JalurTarot untuk pembayaran">
          <img src="/qris-jalurtarot.webp" alt="QRIS JalurTarot — scan untuk membayar"
            style="width:100%;display:block;image-rendering:crisp-edges;" loading="lazy" />
        </div>
        <p class="font-heading text-bone-faint" style="font-size:9px;letter-spacing:0.2em;margin-top:1rem;text-align:center;">
          JALUR TAROT · NMID: ID1025374020507
        </p>
      </div>

      <!-- Wallets -->
      <p class="font-body text-bone-whisper support-wallets reveal reveal-delay-4">
        GoPay · OVO · Dana · ShopeePay · BCA · BRI · Mandiri · dan semua aplikasi QRIS
      </p>

      <div class="rule-ink" style="width:100%;margin-bottom:2.5rem;" aria-hidden="true"></div>

      <!-- Note from maker -->
      <div class="support-note reveal reveal-delay-5">
        <p class="font-heading text-gold-dim" style="font-size:9px;letter-spacing:0.3em;margin-bottom:1rem;">CATATAN DARI PEMBUAT</p>
        <p class="font-body text-bone-faint" style="font-size:1rem;line-height:1.9;font-style:italic;">
          Setiap kontribusi membantu menjaga server tetap menyala,
          ruh Oracle tetap berbisik, dan JalurTarot tetap gratis
          untuk semua orang. Terima kasih sudah hadir di sini.
        </p>
        <p class="font-body text-gold" style="font-size:0.95rem;margin-top:1.25rem;letter-spacing:0.02em;">— Harvey</p>
      </div>

      <!-- Back -->
      <div style="margin-top:3rem;">
        <a href="/" class="btn-ghost" style="font-size:10px;padding:0.6rem 1.5rem;" aria-label="Kembali ke beranda">← Kembali ke JalurTarot</a>
      </div>

    </div>

    <style>
      .support-wrap {
        max-width: 480px;
        margin: 0 auto;
        padding: 4rem 1.5rem 6rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .support-eyebrow {
        display: flex; align-items: center; gap: 0.9rem;
        margin-bottom: 2.5rem;
      }
      .eyebrow-line {
        width: 28px; height: 1px; display: block; flex-shrink: 0;
      }
      .eyebrow-line.left  { background: linear-gradient(90deg, transparent, var(--gold-dim)); }
      .eyebrow-line.right { background: linear-gradient(270deg, transparent, var(--gold-dim)); }
      .support-title {
        font-size: clamp(1.6rem,5vw,2.4rem);
        line-height: 1.1;
        margin-bottom: 1.25rem;
        letter-spacing: 0.02em;
      }
      .support-subtext {
        font-size: 1.05rem; line-height: 1.88;
        font-style: italic;
        max-width: 360px; margin-bottom: 2.5rem;
      }
      .qris-card {
        padding: 1.75rem;
        width: 100%; max-width: 340px;
        margin-bottom: 1.5rem;
      }
      .qris-card-top {
        display: flex; align-items: center;
        justify-content: center; gap: 0.6rem;
        margin-bottom: 1.25rem;
      }
      .qris-img-wrap {
        background: #fff;
        padding: 12px;
        display: inline-block;
        width: 100%;
      }
      .support-wallets {
        font-size: 0.85rem; font-style: italic;
        margin-bottom: 2.5rem; line-height: 1.65;
        max-width: 320px;
      }
      .support-note { max-width: 340px; }
    </style>
  `, '', { description: 'Dukung JalurTarot dengan traktir secangkir kopi via QRIS.' });
}