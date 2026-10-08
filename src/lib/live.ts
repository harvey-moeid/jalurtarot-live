/**
 * live.ts - Mesin "Ramalan Live" untuk siaran TikTok Live.
 *
 * 100% lokal, tanpa AI/LLM. Kartu ditarik dengan Fisher-Yates (draw.ts),
 * maknanya diambil dari data statis di repo:
 *   - lib/cards.ts              - nama, gambar, keyword upright/reversed
 *   - lib/liveAspectMeanings.ts - makna 3 aspek (Hubungan/Karir/Nasib)
 *     yang diambil langsung dari arti-tarot-78-rider-waite.md yang di-upload.
 *
 * Alur:
 *  1. Bot pendengar TikTok Live (Node.js, berjalan terpisah: Termux/Render/VPS)
 *     mendeteksi gift target, lalu memanggil POST /api/live/trigger dengan
 *     header rahasia (X-Live-Secret).
 *  2. Worker menarik kartu, menyusun teks ramalan singkat, menyimpannya
 *     di KV sebagai "draw" terbaru.
 *  3. Halaman overlay (/live) dibuka sebagai Browser Source OBS,
 *     polling GET /api/live/state tiap ~1 detik dan menampilkan draw baru.
 *
 * Catatan ikon (rev10): summary tidak memakai emoji unicode langsung
 * (render berbeda-beda antar OS/font, kadang tampil kotak/hitam-putih di OBS).
 * Sebagai gantinya dipakai token teks polos `::nama-ikon::` yang di-parse
 * jadi <svg> inline oleh skrip overlay di routes/live.ts (fungsi md()).
 * Token yang dipakai: ::spark:: ::heart:: ::briefcase:: ::crystal::
 *
 * Catatan encoding: file ini sengaja hanya memakai karakter ASCII. Versi
 * sebelumnya berisi karakter non-ASCII (tanda pisah, titik tengah) yang tampil
 * sebagai mojibake ("a^", "A.") di teks ramalan yang dilihat penonton.
 */

import { drawCardsForSpread } from './draw';
import { getSpreadById } from './spreads';
import { liveAspectMeanings } from './liveAspectMeanings';
import type { DrawnCard } from './types';

export type LiveSpreadId = 'single' | 'three-card';

export interface LiveCardView {
  id: string;
  name: string;
  nameCn: string;
  image: string;
  isReversed: boolean;
  positionNameCn: string;
  keywords: string[];
  aspect: { hubungan: string; karir: string; nasib: string };
}

export interface LiveDraw {
  id: string;
  createdAt: number;
  spreadId: LiveSpreadId;
  spreadNameCn: string;
  username: string;
  giftName?: string;
  giftCount?: number;
  triggerType?: 'gift' | 'like';
  cards: LiveCardView[];
  summary: string;
}

const STATE_KEY = 'live:current';
const STATE_TTL_SECONDS = 6 * 60 * 60; // 6 jam - cukup untuk satu sesi live

function buildCardView(dc: DrawnCard): LiveCardView {
  const aspect = liveAspectMeanings[dc.card.id] || {
    hubungan: dc.card.meaning.upright,
    karir: dc.card.meaning.upright,
    nasib: dc.card.meaning.upright,
  };
  return {
    id: dc.card.id,
    name: dc.card.name,
    nameCn: dc.card.nameCn,
    image: dc.card.image,
    isReversed: dc.isReversed,
    positionNameCn: dc.position.nameCn,
    keywords: (dc.isReversed ? dc.card.keywords.reversed : dc.card.keywords.upright).slice(0, 4),
    aspect,
  };
}

/**
 * Susun ringkasan ramalan singkat - cocok untuk teks overlay live, bukan bacaan panjang.
 * Ikon ditulis sebagai token `::nama::` (bukan emoji unicode), di-render jadi SVG
 * inline oleh overlay (lihat fungsi md() di routes/live.ts, liveOverlayPage()).
 */
function buildSummary(cards: LiveCardView[], spreadId: LiveSpreadId, username: string): string {
  const nama = username?.trim() || 'Kamu';

  if (spreadId === 'single') {
    const c = cards[0];
    // Spasi hanya ditambahkan bila terbalik, supaya tidak ada spasi sisa di dalam ** **.
    const judul = `${c.nameCn}${c.isReversed ? ' (terbalik)' : ''}`;
    return `::spark:: Ramalan untuk ${nama}\n\n**${judul}**\nKata kunci: ${c.keywords.join(', ')}\n\n::heart:: Hubungan: ${c.aspect.hubungan}\n::briefcase:: Karir: ${c.aspect.karir}\n::crystal:: Nasib: ${c.aspect.nasib}`;
  }

  const [past, present, future] = cards;
  const line = (c: LiveCardView, label: string) =>
    `**${label} - ${c.nameCn}${c.isReversed ? ' (terbalik)' : ''}**\n::crystal:: ${c.aspect.nasib}`;

  return `::spark:: Ramalan Masa Lalu - Kini - Masa Depan untuk ${nama}\n\n${line(past, 'Masa Lalu')}\n\n${line(present, 'Saat Ini')}\n\n${line(future, 'Masa Depan')}`;
}

export function generateLiveDraw(
  spreadId: LiveSpreadId,
  username: string,
  giftName?: string,
  giftCount?: number,
  triggerType: 'gift' | 'like' = 'gift',
): LiveDraw {
  const spread = getSpreadById(spreadId) ?? getSpreadById('single')!;
  const drawn = drawCardsForSpread(spread);
  const cards = drawn.map(buildCardView);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    spreadId,
    spreadNameCn: spread.nameCn,
    username: username?.trim() || 'Penonton',
    giftName,
    giftCount,
    triggerType,
    cards,
    summary: buildSummary(cards, spreadId, username),
  };
}

export async function saveLiveDraw(env: { RATE_LIMIT_KV: KVNamespace }, draw: LiveDraw): Promise<boolean> {
  try {
    await env.RATE_LIMIT_KV.put(STATE_KEY, JSON.stringify(draw), {
      expirationTtl: STATE_TTL_SECONDS,
    });
    return true;
  } catch {
    return false;
  }
}

export async function getLiveDraw(env: { RATE_LIMIT_KV: KVNamespace }): Promise<LiveDraw | null> {
  try {
    const raw = await env.RATE_LIMIT_KV.get(STATE_KEY);
    return raw ? (JSON.parse(raw) as LiveDraw) : null;
  } catch {
    return null;
  }
}