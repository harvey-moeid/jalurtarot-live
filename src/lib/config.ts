/**
 * config.ts — Runtime LLM configuration via KV
 *
 * Model dan toggle LLM bisa diubah dari admin panel tanpa redeploy.
 * Nilai disimpan di KV key "config:llm", fallback ke env vars jika belum pernah diset.
 *
 * Prioritas:
 *   KV "config:llm" → env var → hardcoded default
 */

export interface LLMConfig {
  /** Model yang dipakai, e.g. "z-ai/glm-5.2:free" */
  model: string;
  /** Apakah LLM aktif (false = static mode) */
  enabled: boolean;
}

const KV_KEY = 'config:llm';
const DEFAULT_MODEL = 'z-ai/glm-5.2:free';

/**
 * Baca LLM config dari KV. Jika belum ada, fallback ke env.
 * Selalu gunakan fungsi ini daripada baca env langsung.
 */
export async function getLLMConfig(env: {
  RATE_LIMIT_KV: KVNamespace;
  ENABLE_FALLBACK_LLM?: string;
  FALLBACK_LLM_MODEL?: string;
}): Promise<LLMConfig> {
  try {
    const raw = await env.RATE_LIMIT_KV.get(KV_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LLMConfig>;
      return {
        model: parsed.model?.trim() || env.FALLBACK_LLM_MODEL?.trim() || DEFAULT_MODEL,
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : env.ENABLE_FALLBACK_LLM === 'true',
      };
    }
  } catch {
    // KV error → fallback ke env
  }
  return {
    model: env.FALLBACK_LLM_MODEL?.trim() || DEFAULT_MODEL,
    enabled: env.ENABLE_FALLBACK_LLM === 'true',
  };
}

/**
 * Tulis LLM config ke KV. Dipakai dari admin panel.
 * TTL tidak di-set → config permanen sampai dihapus/diubah lagi.
 */
export async function setLLMConfig(
  env: { RATE_LIMIT_KV: KVNamespace },
  config: Partial<LLMConfig>,
): Promise<void> {
  // Baca existing dulu agar tidak timpa field yang tidak diubah
  let current: LLMConfig = { model: DEFAULT_MODEL, enabled: true };
  try {
    const raw = await env.RATE_LIMIT_KV.get(KV_KEY);
    if (raw) current = { ...current, ...JSON.parse(raw) };
  } catch { /* pakai default */ }

  const next: LLMConfig = {
    model: config.model !== undefined ? config.model.trim() : current.model,
    enabled: config.enabled !== undefined ? config.enabled : current.enabled,
  };
  await env.RATE_LIMIT_KV.put(KV_KEY, JSON.stringify(next));
}
