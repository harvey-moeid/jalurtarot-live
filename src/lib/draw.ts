/**
 * Draw functions · Pure, no side-effects, no React dependency.
 * FIX IMP-4: Replaced biased sort-shuffle with Fisher-Yates algorithm.
 */

import { allCards } from './cards';
import { DrawnCard, Spread, SpreadPosition } from './types';

/** Fisher-Yates unbiased shuffle — O(n), uniform distribution */
function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle all cards and draw for each spread position */
export function drawCardsForSpread(spread: Spread): DrawnCard[] {
  const shuffled = fisherYates(allCards);
  return spread.positions.map((position, index) => ({
    card: shuffled[index],
    isReversed: Math.random() < 0.35,
    position,
  }));
}

// ─── Supplementary cards (follow-up questions) ────────────────────────

const SUPPLEMENTARY_CN_NAMES = ['Tambahan 1', 'Tambahan 2', 'Tambahan 3', 'Tambahan 4', 'Tambahan 5'];

function makeSupplementaryPositions(
  count: number,
  startIndex: number,
): SpreadPosition[] {
  return Array.from({ length: count }, (_, i) => {
    const idx = startIndex + i;
    return {
      id: `supp-${idx + 1}`,
      name: `Supplementary ${idx + 1}`,
      nameCn: SUPPLEMENTARY_CN_NAMES[i] ?? `Tambahan ${idx + 1}`,
      description: 'Kartu tambahan untuk menjawab pertanyaan lanjutan',
    };
  });
}

/** Draw supplementary guidance cards for follow-up questions */
export function drawSupplementaryCards(
  count: number,
  startIndex = 0,
): DrawnCard[] {
  const positions = makeSupplementaryPositions(count, startIndex);
  const shuffled  = fisherYates(allCards);
  return positions.map((position, idx) => ({
    card: shuffled[idx],
    isReversed: Math.random() < 0.35,
    position,
  }));
}
