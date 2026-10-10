/** OBS overlay audio preferences. Audio is synthesized in the browser, not on Workers. */
export type LiveAudioSettings = {
  live1Tts: boolean;
  live2Tts: boolean;
  voice: 'female' | 'default';
  rate: number;
  pitch: number;
  volume: number;
  giftSound: boolean;
  likeSound: boolean;
  sfxVolume: number;
  ambient: boolean;
  ambientVolume: number;
};

export type LiveAudioEnv = { RATE_LIMIT_KV: KVNamespace };
const KEY = 'live:audio:settings:v1';
let cache: { value: LiveAudioSettings; expires: number } | null = null;

export const DEFAULT_LIVE_AUDIO: Readonly<LiveAudioSettings> = Object.freeze({
  live1Tts: false,
  live2Tts: false, // Existing ?voice=1 links still override this default.
  voice: 'female',
  rate: 0.93,
  pitch: 1.13,
  volume: 0.9,
  giftSound: false,
  likeSound: false,
  sfxVolume: 0.35,
  ambient: false,
  ambientVolume: 0.12,
});

function boundedNumber(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== 'string' || !/^(?:\d+)(?:\.\d{1,2})?$/.test(value.trim())) {
    throw new Error(label + ' harus berupa angka (maksimal dua desimal).');
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(label + ' harus antara ' + min + ' dan ' + max + '.');
  }
  return number;
}

function checkbox(value: unknown, label: string): boolean {
  if (value === undefined) return false;
  if (value !== 'on') throw new Error(label + ' tidak valid.');
  return true;
}

export function parseLiveAudioForm(form: Record<string, unknown>): LiveAudioSettings {
  if (form.voice !== 'female' && form.voice !== 'default') throw new Error('Pilihan suara tidak valid.');
  return {
    live1Tts: checkbox(form.live1Tts, 'TTS LIVE 1'),
    live2Tts: checkbox(form.live2Tts, 'TTS LIVE 2'),
    voice: form.voice,
    rate: boundedNumber(form.rate, 'Kecepatan suara', 0.5, 1.5),
    pitch: boundedNumber(form.pitch, 'Nada suara', 0.5, 1.8),
    volume: boundedNumber(form.volume, 'Volume TTS', 0, 1),
    giftSound: checkbox(form.giftSound, 'Efek gift'),
    likeSound: checkbox(form.likeSound, 'Efek like'),
    sfxVolume: boundedNumber(form.sfxVolume, 'Volume efek', 0, 1),
    ambient: checkbox(form.ambient, 'Suara ambient'),
    ambientVolume: boundedNumber(form.ambientVolume, 'Volume ambient', 0, 0.35),
  };
}

function validNumber(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

export function isLiveAudioSettings(value: unknown): value is LiveAudioSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Partial<LiveAudioSettings>;
  return typeof v.live1Tts === 'boolean'
    && typeof v.live2Tts === 'boolean'
    && (v.voice === 'female' || v.voice === 'default')
    && validNumber(v.rate, 0.5, 1.5)
    && validNumber(v.pitch, 0.5, 1.8)
    && validNumber(v.volume, 0, 1)
    && typeof v.giftSound === 'boolean'
    && typeof v.likeSound === 'boolean'
    && validNumber(v.sfxVolume, 0, 1)
    && typeof v.ambient === 'boolean'
    && validNumber(v.ambientVolume, 0, 0.35);
}

export async function getLiveAudioSettings(env: LiveAudioEnv): Promise<LiveAudioSettings> {
  if (cache && Date.now() < cache.expires) return { ...cache.value };
  const raw = await env.RATE_LIMIT_KV.get(KEY);
  if (!raw) return { ...DEFAULT_LIVE_AUDIO };
  const value: unknown = JSON.parse(raw);
  if (!isLiveAudioSettings(value)) throw new Error('Pengaturan audio tersimpan tidak valid.');
  cache = { value, expires: Date.now() + 3000 };
  return { ...value };
}

export async function saveLiveAudioSettings(env: LiveAudioEnv, value: LiveAudioSettings): Promise<void> {
  if (!isLiveAudioSettings(value)) throw new Error('Pengaturan audio tidak valid.');
  await env.RATE_LIMIT_KV.put(KEY, JSON.stringify(value));
  cache = { value: { ...value }, expires: Date.now() + 3000 };
}
