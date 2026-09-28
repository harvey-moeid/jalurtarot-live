export function userName(msg) {
  return String(msg?.user?.uniqueId || msg?.user?.displayId || msg?.uniqueId || msg?.nickname || 'Penonton').trim() || 'Penonton';
}

export function giftName(msg) {
  return String(msg?.giftName || msg?.gift?.name || msg?.giftDetails?.giftName || msg?.gift?.giftName || 'Gift').trim();
}

export function giftCoins(msg) {
  const direct = [
    msg?.diamondCount, msg?.gift?.diamondCount, msg?.giftDetails?.diamondCount,
    msg?.gift?.diamond_count, msg?.giftDetails?.diamond_count,
  ];
  for (const value of direct) {
    const n = Number(value);
    if (value !== undefined && value !== null && Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

export function giftRepeat(msg) {
  const n = Number(msg?.giftCount ?? msg?.repeatCount ?? msg?.repeat_count ?? 1);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

export function isStreakInProgress(msg) {
  const type = Number(msg?.giftType ?? msg?.gift?.type ?? msg?.gift?.giftType ?? msg?.giftDetails?.giftType);
  const end = msg?.repeatEnd ?? msg?.repeat_end;
  return type === 1 && (end === 0 || end === false);
}
