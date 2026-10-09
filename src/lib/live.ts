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
import type { LiveTopic } from './liveComment';
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
  narration?: string;
  topic?: LiveTopic;
  question?: string;
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

/** Natural, contextual reading for both overlays without a paid AI dependency. */
export function buildLiveNarration(
  cards: LiveCardView[], username: string,
  request?: { topic?: LiveTopic; question?: string },
): string {
  if (!cards.length) return '';
  const viewer = String(username || 'Penonton').replace(/[<>\u0000-\u001f]/g, '').slice(0, 46);
  const topic = request?.topic;
  const aspect = topic === 'cinta' ? 'hubungan' : topic === 'karir' ? 'karir' : 'nasib';
  const label = topic === 'cinta' ? 'percintaan' : topic === 'karir' ? 'karier' : topic === 'nasib' ? 'nasib dan peluang' : 'energi hidupmu';
  const question = String(request?.question || '').replace(/[<>\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
  const intro = question
    ? `Halo ${viewer}, aku baca pertanyaanmu: "${question}". Sekarang kita lihat pesannya untuk ${label}, ya.`
    : `Halo ${viewer}, terima kasih sudah hadir. Kita lihat pesan kartu untuk ${label}, ya.`;
  function meaning(card: LiveCardView, max = 125): string {
    const full = String(card.aspect?.[aspect] || card.keywords.join(', ') || '')
      .replace(/::[a-z]+::/g, '').replace(/[\r\n*]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (full.length <= max) return full;
    const part = full.slice(0, max + 1);
    const stop = part.lastIndexOf(' ');
    return part.slice(0, stop > max * .55 ? stop : max).trim() + '…';
  }
  const modes = ['Kartu pertama', 'Kartu kedua', 'Kartu ketiga'];
  const body = cards.slice(0, 3).map((card, index) => {
    const position = cards.length === 1 ? 'Kartu yang muncul' : modes[index];
    const orientation = card.isReversed ? ' dalam posisi terbalik' : '';
    const explanation = meaning(card, cards.length === 1 ? 170 : 104);
    return `${position} adalah ${card.nameCn}${orientation}. ${explanation}`;
  }).join(' ');
  const ending = topic === 'cinta'
    ? 'Pelan-pelan saja, dengarkan perasaanmu dan tetap jaga komunikasi yang sehat.'
    : topic === 'karir'
      ? 'Ambil sisi baiknya untuk langkah kerja berikutnya, tanpa terburu-buru mengambil keputusan.'
      : 'Ingat, kartu ini untuk refleksi; pilihan dan langkah nyatamu tetap yang paling menentukan.';
  return [intro, body, ending].filter(Boolean).join(' ');
}

export function generateLiveDraw(
  spreadId: LiveSpreadId,
  username: string,
  giftName?: string,
  giftCount?: number,
  triggerType: 'gift' | 'like' = 'gift',
  request?: { topic?: LiveTopic; question?: string },
): LiveDraw {
  const spread = getSpreadById(spreadId) ?? getSpreadById('single')!;
  const drawn = drawCardsForSpread(spread);
  const cards = drawn.map(buildCardView);

  const narration = buildLiveNarration(cards, username, request);

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
    summary: narration,
    narration,
    ...(request?.topic ? { topic: request.topic } : {}),
    ...(request?.question ? { question: request.question.slice(0, 160) } : {}),
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