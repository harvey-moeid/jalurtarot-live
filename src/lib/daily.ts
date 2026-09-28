/**
 * Daily card Â· æ¯æ¥ä¸ççç¡®å®æ§æ½å
 *
 * ç»å®åä¸å¤©ï¼ææç¨æ·å¾å°åä¸å¼ çï¼å«æ­£éä½ï¼ã
 * 用本地时区的日期作 seed —— 让"今天"的边界与用户感知一致。
 */

import { TarotCard } from './types';
import { allCards } from './cards';

const SEED_PREFIX = 'mystic-tarot-daily-v1';

/** YYYY-MM-DDï¼æ¬å°æ¶åºï¼ */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * djb2 å­ç¬¦ä¸²åå¸ Â· 32-bit æ ç¬¦å·
 * è¶³å¤ç¨³å®ä¸åå¸ååï¼ç¨äºææ¥ææ å°å° 0..N
 */
function djb2(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    // ((h << 5) + h) ^ c  ≡  h * 33 ^ c
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return h >>> 0;
}

export interface DailyDraw {
  card: TarotCard;
  isReversed: boolean;
  dateKey: string;
}

/**
 * ç»å®æ¥æè¿åå½æ¥çå¡ç½çï¼å«æ­£éä½ï¼ã
 * 同一天 → 同一张牌。
 */
export function getDailyDraw(date: Date = new Date()): DailyDraw {
  const dateKey = formatDateKey(date);
  const seed = djb2(`${SEED_PREFIX}|${dateKey}`);
  const cardIdx = seed % allCards.length;
  // ç¨ seed çå¦ä¸æ®µä½å³å®æ­£éä½ï¼é¿åä¸å¡çéæ©å¼ºç¸å³
  const isReversed = (((seed >>> 16) ^ (seed >>> 8)) & 1) === 1;
  return {
    card: allCards[cardIdx],
    isReversed,
    dateKey,
  };
}

/**
 * çæ"è¿å» N å¤©"çæ¯æ¥çåè¡¨ï¼å«ä»å¤©ï¼ä»å¤©å¨æåï¼ã
 * ç¨äº"è½¨è¿¹"è§å¾ã
 */
export function getRecentDailyDraws(days: number, end: Date = new Date()): DailyDraw[] {
  const out: DailyDraw[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
    out.push(getDailyDraw(d));
  }
  return out;
}