import type { LiveSpreadId } from './live';

export type LiveSettingsEnv = {
  RATE_LIMIT_KV: KVNamespace;
  LIVE_TARGET_GIFT_NAME?: string;
  LIVE_MIN_GIFT_VALUE?: string;
  LIVE_THREE_CARD_MIN_VALUE?: string;
  LIVE_DEFAULT_SPREAD?: string;
};

export type LiveSettings = {
  giftEnabled: boolean;
  targetGiftName: string;
  minGiftValue: number;
  threeCardMinValue: number;
  defaultSpread: LiveSpreadId;
  likeEnabled: boolean;
  likeMilestone: number;
  likeSpread: LiveSpreadId;
};

const STORAGE_KEY = 'live:automation:settings:v1';
let cache: { settings: LiveSettings; expires: number } | null = null;

function settingNumber(raw: string | undefined, fallback: number, min: number, max: number): number {
  const number = Number(raw);
  return raw !== undefined && Number.isSafeInteger(number) && number >= min && number <= max ? number : fallback;
}

export function defaultLiveSettings(env: LiveSettingsEnv): LiveSettings {
  return {
    giftEnabled: true,
    targetGiftName: (env.LIVE_TARGET_GIFT_NAME || '*').trim().slice(0, 80) || '*',
    minGiftValue: settingNumber(env.LIVE_MIN_GIFT_VALUE, 1, 0, 1000000),
    threeCardMinValue: settingNumber(env.LIVE_THREE_CARD_MIN_VALUE, 5, 1, 1000000),
    defaultSpread: env.LIVE_DEFAULT_SPREAD === 'three-card' ? 'three-card' : 'single',
    likeEnabled: true,
    likeMilestone: 40,
    likeSpread: 'single',
  };
}

function numberFromForm(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)$/.test(value.trim())) {
    throw new Error(label + ' harus berupa bilangan bulat.');
  }
  const n = Number(value.trim());
  if (!Number.isSafeInteger(n) || n < min || n > max) {
    throw new Error(label + ' harus antara ' + min + ' dan ' + max + '.');
  }
  return n;
}

function formCheckbox(value: unknown, label: string): boolean {
  if (value === undefined) return false;
  if (value !== 'on') throw new Error(label + ' tidak valid.');
  return true;
}

function spreadFromForm(value: unknown, label: string): LiveSpreadId {
  if (value !== 'single' && value !== 'three-card') throw new Error(label + ' tidak valid.');
  return value;
}

export function parseLiveSettingsForm(form: Record<string, unknown>): LiveSettings {
  const targetGiftName = typeof form.targetGiftName === 'string' ? form.targetGiftName.trim() : '';
  if (!targetGiftName || targetGiftName.length > 80 || /[<>\r\n\u0000-\u001f]/.test(targetGiftName)) {
    throw new Error('Nama gift wajib diisi (maksimal 80 karakter, atau * untuk semua gift).');
  }
  return {
    giftEnabled: formCheckbox(form.giftEnabled, 'Aktifkan gift'),
    targetGiftName,
    minGiftValue: numberFromForm(form.minGiftValue, 'Minimal nilai gift', 0, 1000000),
    threeCardMinValue: numberFromForm(form.threeCardMinValue, 'Batas 3 kartu', 1, 1000000),
    defaultSpread: spreadFromForm(form.defaultSpread, 'Susunan kartu gift'),
    likeEnabled: formCheckbox(form.likeEnabled, 'Aktifkan like'),
    likeMilestone: numberFromForm(form.likeMilestone, 'Jumlah like', 1, 1000000),
    likeSpread: spreadFromForm(form.likeSpread, 'Susunan kartu like'),
  };
}

function isLiveSettings(value: unknown): value is LiveSettings {
  if (!value || typeof value !== 'object') return false;
  try {
    const v = value as Partial<LiveSettings>;
    const target = String(v.targetGiftName || '');
    return typeof v.giftEnabled === 'boolean'
      && target.length > 0 && target.length <= 80 && !/[<>\r\n\u0000-\u001f]/.test(target)
      && Number.isSafeInteger(v.minGiftValue) && (v.minGiftValue ?? -1) >= 0 && (v.minGiftValue ?? Infinity) <= 1000000
      && Number.isSafeInteger(v.threeCardMinValue) && (v.threeCardMinValue ?? 0) >= 1 && (v.threeCardMinValue ?? Infinity) <= 1000000
      && (v.defaultSpread === 'single' || v.defaultSpread === 'three-card')
      && typeof v.likeEnabled === 'boolean'
      && Number.isSafeInteger(v.likeMilestone) && (v.likeMilestone ?? 0) >= 1 && (v.likeMilestone ?? Infinity) <= 1000000
      && (v.likeSpread === 'single' || v.likeSpread === 'three-card');
  } catch { return false; }
}

/** Satu draw maksimum per event sekalipun meloncat beberapa milestone. */
export function crossedLikeMilestone(previous: number, current: number, milestone: number): boolean {
  if (![previous, current, milestone].every(Number.isSafeInteger)
    || previous < 0 || current <= previous || milestone < 1) return false;
  return Math.floor(current / milestone) > Math.floor(previous / milestone);
}

export async function getLiveSettings(env: LiveSettingsEnv): Promise<LiveSettings> {
  if (cache && Date.now() < cache.expires) return cache.settings;
  // Gagal membaca KV tidak boleh diam-diam mengaktifkan aturan lama.
  const raw = await env.RATE_LIMIT_KV.get(STORAGE_KEY);
  if (!raw) return defaultLiveSettings(env);
  const parsed: unknown = JSON.parse(raw);
  if (!isLiveSettings(parsed)) throw new Error('Pengaturan LIVE tersimpan tidak valid.');
  cache = { settings: parsed, expires: Date.now() + 3000 };
  return parsed;
}

export async function saveLiveSettings(env: LiveSettingsEnv, settings: LiveSettings): Promise<void> {
  if (!isLiveSettings(settings)) throw new Error('Pengaturan LIVE tidak valid.');
  await env.RATE_LIMIT_KV.put(STORAGE_KEY, JSON.stringify(settings));
  cache = { settings, expires: Date.now() + 3000 };
}
