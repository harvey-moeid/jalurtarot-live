import { createMiddleware } from 'hono/factory';
import type { Env } from '../routes/api';

// --- Extend Env untuk ADMIN_PASSWORD ---
// Catatan: field OpenRouter di bawah ini hanya dipertahankan supaya halaman
// legacy /admin/health & /admin/credits (fitur AI, sudah dimatikan) tetap
// lolos type-check. Aplikasi utama (api.ts) sudah tidak memakainya lagi -
// Ramalan Live 100% statis tanpa AI.
export type AdminEnv = Env & {
  ADMIN_PASSWORD: string;
  LIVE_SECRET?: string;
  RENDER_API_KEY?: string;
  RENDER_LISTENER_SERVICE_ID?: string;
  RENDER_LISTENER_SERVICE_NAME?: string;
  ENABLE_FALLBACK_LLM?: string;
  FALLBACK_LLM_MODEL?: string;
  OPENROUTER_BASE_URL?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_API_KEY_2?: string;
  OPENROUTER_API_KEY_3?: string;
  OPENROUTER_API_KEY_4?: string;
  OPENROUTER_API_KEY_5?: string;
};

const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
const ADMIN_LOGIN_WINDOW_SECONDS = 15 * 60;
const ADMIN_LOGIN_MAX_ATTEMPTS = 8;

function getAdminPassword(c: any): string | null {
  const pwd = c.env.ADMIN_PASSWORD;
  if (!pwd || typeof pwd !== 'string' || pwd.trim() === '') return null;
  return pwd.trim();
}

export function getCookie(c: any, name: string): string | null {
  const parts = (c.req.header('Cookie') || '').split(';');
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function getClientIp(c: any): string {
  return (c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown').split(',')[0].trim().slice(0, 100);
}

async function isAuthenticated(c: any): Promise<boolean> {
  const token = getCookie(c, 'admin_token');
  if (!token) return false;
  try {
    const raw = await c.env.RATE_LIMIT_KV.get('admin:session:' + token);
    if (!raw) return false;
    const session = JSON.parse(raw) as { expiresAt?: number };
    if (!session.expiresAt || Date.now() >= session.expiresAt) {
      await c.env.RATE_LIMIT_KV.delete('admin:session:' + token);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function isLoginRateLimited(c: any): Promise<boolean> {
  try {
    const raw = await c.env.RATE_LIMIT_KV.get('admin:login:' + getClientIp(c));
    return Number(raw || 0) >= ADMIN_LOGIN_MAX_ATTEMPTS;
  } catch {
    return false;
  }
}

export async function recordFailedLogin(c: any): Promise<void> {
  try {
    const key = 'admin:login:' + getClientIp(c);
    const count = Number(await c.env.RATE_LIMIT_KV.get(key) || 0) + 1;
    await c.env.RATE_LIMIT_KV.put(key, String(count), { expirationTtl: ADMIN_LOGIN_WINDOW_SECONDS });
  } catch {}
}

export async function clearLoginFailures(c: any): Promise<void> {
  try { await c.env.RATE_LIMIT_KV.delete('admin:login:' + getClientIp(c)); } catch {}
}

export const adminAuth = createMiddleware<{ Bindings: AdminEnv }>(async (c, next) => {
  const path = c.req.path;
  if (path === '/login' || path === '/logout') {
    await next();
    return;
  }
  if (!(await isAuthenticated(c))) {
    return c.redirect('/admin/login');
  }
  await next();
});
