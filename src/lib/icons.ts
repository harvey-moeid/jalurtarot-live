/**
 * icons.ts — Inline SVG icon library
 * Stroke-based, currentColor, thin-line (stroke-width 1.25).
 * Gunakan sebagai string di dalam template literal HTML.
 */

type IconFn = (size?: number) => string;

const svg = (size: number, content: string): string =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
  `stroke="currentColor" stroke-width="1.25" stroke-linecap="round" ` +
  `stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;

/** 4-pointed compass star — pengganti ✦ */
export const iconStar: IconFn = (size = 18) =>
  svg(size, '<path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5Z"/>');

/** Crescent moon — pengganti ✧ (Harian) */
export const iconMoon: IconFn = (size = 18) =>
  svg(size, '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>');

/** 4-card Celtic cross spread — pengganti ◈ (Ramalan) */
export const iconSpread: IconFn = (size = 18) =>
  svg(
    size,
    '<rect x="9" y="1" width="6" height="8" rx="1.2"/>' +
    '<rect x="15.5" y="9" width="7.5" height="6" rx="1.2"/>' +
    '<rect x="9" y="15" width="6" height="8" rx="1.2"/>' +
    '<rect x="1" y="9" width="7.5" height="6" rx="1.2"/>',
  );

/** Open book — pengganti ◇ (Library) */
export const iconBook: IconFn = (size = 18) =>
  svg(
    size,
    '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>' +
    '<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  );

/** All-seeing eye — pengganti ◉ (Oracle) */
export const iconEye: IconFn = (size = 18) =>
  svg(
    size,
    '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>' +
    '<circle cx="12" cy="12" r="3"/>',
  );

/** Coffee cup with steam — pengganti ☕ */
export const iconCoffee: IconFn = (size = 16) =>
  svg(
    size,
    '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/>' +
    '<path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>' +
    '<line x1="6" y1="1" x2="6" y2="4"/>' +
    '<line x1="10" y1="1" x2="10" y2="4"/>' +
    '<line x1="14" y1="1" x2="14" y2="4"/>',
  );

/** Diamond outline — dekoratif scatter */
export const iconDiamond: IconFn = (size = 18) =>
  svg(size, '<path d="M12 2L22 12L12 22L2 12Z"/>');
