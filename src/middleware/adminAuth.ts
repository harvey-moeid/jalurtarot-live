import { createMiddleware } from 'hono/factory';
import type { Env } from '../routes/api';

// --- Admin environment ---
// Aplikasi Live menggunakan data kartu dan interpretasi lokal; tidak ada ketergantungan LLM.
export type AdminEnv = Env & {
  ADMIN_PASSWORD: string;
  LIVE_SECRET?: string;
  RENDER_API_KEY?: string;
  RENDER_LISTENER_SERVICE_ID?: string;
  RENDER_LISTENER_SERVICE_NAME?: string;
};

export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
const ADMIN_LOGIN_WINDOW_SECONDS = 15 * 60;
const ADMIN_LOGIN_MAX_ATTEMPTS = 8;

// Path yang boleh diakses tanpa sesi admin.
// PENTING: `c.req.path` di Hono selalu berisi path PENUH request (mis. '/admin/login'),
// meskipun middleware dipasang lewat sub-app yang di-mount di '/admin'.
// Jadi daftar ini harus memakai path penuh. Versi sebelumnya membandingkan dengan
// '/login' sehingga tidak pernah cocok -> /admin/login me-redirect ke dirinya sendiri
// (ERR_TOO_MANY_REDIRECTS).
const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/admin/logout']);

function normalizePath(path: string): string {
  // Buang trailing slash supaya '/admin/login/' juga dianggap publik.
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function getAdminPassword(c: any): string | null {
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

export async function isAuthenticated(c: any): Promise<boolean> {
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

export async function createAdminSession(c: any): Promise<string> {
  const token = (crypto as any).randomUUID() as string;
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000;
  await c.env.RATE_LIMIT_KV.put(
    'admin:session:' + token,
    JSON.stringify({ createdAt: Date.now(), expiresAt }),
    { expirationTtl: ADMIN_SESSION_TTL_SECONDS },
  );
  return token;
}

export async function destroyAdminSession(c: any): Promise<void> {
  const token = getCookie(c, 'admin_token');
  if (token) {
    try { await c.env.RATE_LIMIT_KV.delete('admin:session:' + token); } catch {}
  }
}

export const adminAuth = createMiddleware<{ Bindings: AdminEnv }>(async (c, next) => {
  // Halaman login/logout dilewatkan tanpa cek sesi; selain itu wajib login.
  if (PUBLIC_ADMIN_PATHS.has(normalizePath(c.req.path))) {
    await next();
    return;
  }
  if (!(await isAuthenticated(c))) {
    return c.redirect('/admin/login');
  }
  await next();
});
