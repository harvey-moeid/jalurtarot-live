import { Hono } from 'hono';
import type { Env } from './api';
import { getLLMConfig, setLLMConfig } from '../lib/config';
import { generateLiveDraw, saveLiveDraw, getLiveDraw, type LiveSpreadId } from '../lib/live';

// --- Extend Env untuk ADMIN_PASSWORD ---
// Catatan: field OpenRouter di bawah ini hanya dipertahankan supaya halaman
// legacy /admin/health & /admin/credits (fitur AI, sudah dimatikan) tetap
// lolos type-check. Aplikasi utama (api.ts) sudah tidak memakainya lagi -
// Ramalan Live 100% statis tanpa AI.
type AdminEnv = Env & {
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

const admin = new Hono<{ Bindings: AdminEnv }>();

// Login/logout are public; every other /admin route requires a live KV-backed session.
admin.use('*', async (c, next) => {
  const path = c.req.path;
  if (path === '/login' || path === '/logout') return next();
  if (!(await isAuthenticated(c))) return c.redirect('/admin/login');
  await next();
});

// ======================================
// -- AUTH HELPERS --
// ======================================

const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
const ADMIN_LOGIN_WINDOW_SECONDS = 15 * 60;
const ADMIN_LOGIN_MAX_ATTEMPTS = 8;

function getAdminPassword(c: any): string | null {
  const pwd = c.env.ADMIN_PASSWORD;
  if (!pwd || typeof pwd !== 'string' || pwd.trim() === '') return null;
  return pwd.trim();
}

function getCookie(c: any, name: string): string | null {
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

// -- RENDER LISTENER CONTROL --
const DEFAULT_RENDER_LISTENER_NAME = 'jalurtarot-tiktok-listener';

async function renderApiRequest(env: AdminEnv, path: string, options: RequestInit = {}): Promise<any> {
  const key = (env.RENDER_API_KEY || '').trim();
  if (!key) throw new Error('RENDER_API_KEY belum di-set di Cloudflare Worker.');
  const res = await fetch('https://api.render.com/v1' + path, {
    ...options,
    headers: { Accept: 'application/json', Authorization: 'Bearer ' + key, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
  });
  const body = await res.text();
  let data: any = null;
  try { data = body ? JSON.parse(body) : null; } catch { data = body; }
  if (!res.ok) {
    const message = typeof data === 'string' ? data.slice(0, 300) : JSON.stringify(data || {}).slice(0, 300);
    throw new Error('Render API ' + res.status + ': ' + message);
  }
  return data;
}

async function getRenderListener(env: AdminEnv): Promise<any> {
  const serviceId = (env.RENDER_LISTENER_SERVICE_ID || '').trim();
  if (serviceId) return renderApiRequest(env, '/services/' + encodeURIComponent(serviceId));
  const name = (env.RENDER_LISTENER_SERVICE_NAME || DEFAULT_RENDER_LISTENER_NAME).trim();
  const data = await renderApiRequest(env, '/services?name=' + encodeURIComponent(name));
  const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
  const services = items.map((item: any) => item?.service || item).filter(Boolean);
  const service = services.find((item: any) => item?.name === name);
  if (!service?.id) throw new Error('Service Render tidak ditemukan: ' + name);
  return service;
}

async function getRenderListenerState(env: AdminEnv): Promise<{ ok: boolean; service?: any; error?: string }> {
  try { return { ok: true, service: await getRenderListener(env) }; }
  catch (e: any) { return { ok: false, error: String(e?.message || e) }; }
}

// ======================================
// -- KV HELPERS --
// ======================================

const CREDIT_LIMIT = 10;
const CREDIT_TTL_SECONDS = 7 * 24 * 60 * 60;

interface CreditState {
  used: number;
  credited: number;
  resetAt: number;
}

async function readCreditState(env: AdminEnv, ip: string): Promise<CreditState> {
  const key = `credit:${ip}`;
  const now = Date.now();
  try {
    const raw = await env.RATE_LIMIT_KV.get(key);
    if (!raw) return { used: 0, credited: 0, resetAt: now + CREDIT_TTL_SECONDS * 1000 };
    const parsed = JSON.parse(raw) as any;
    const state: CreditState = {
      used: parsed.used ?? 0,
      credited: parsed.credited ?? parsed.bonus ?? 0,
      resetAt: parsed.resetAt ?? now + CREDIT_TTL_SECONDS * 1000,
    };
    if (now >= state.resetAt) return { used: 0, credited: 0, resetAt: now + CREDIT_TTL_SECONDS * 1000 };
    return state;
  } catch {
    return { used: 0, credited: 0, resetAt: now + CREDIT_TTL_SECONDS * 1000 };
  }
}

async function writeCreditState(env: AdminEnv, ip: string, state: CreditState): Promise<void> {
  const key = `credit:${ip}`;
  const ttlLeft = Math.max(60, Math.ceil((state.resetAt - Date.now()) / 1000));
  await env.RATE_LIMIT_KV.put(key, JSON.stringify(state), { expirationTtl: ttlLeft });
}

async function isBlacklisted(env: AdminEnv, ip: string): Promise<boolean> {
  try {
    const val = await env.RATE_LIMIT_KV.get(`blacklist:${ip}`);
    return val !== null;
  } catch { return false; }
}

async function getBanner(env: AdminEnv): Promise<{ text: string; type: string; active: boolean } | null> {
  try {
    const raw = await env.RATE_LIMIT_KV.get('banner:active');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

// ======================================
// -- HTML ESCAPE HELPER --
// Selalu gunakan ini sebelum render data dari KV/user ke HTML.
// ======================================

/**
 * Escape karakter HTML berbahaya dari string yang berasal dari
 * input user, KV, atau query param - sebelum di-embed ke HTML.
 * Mencegah XSS pada admin panel.
 */
function esc(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// -- Ambil semua credit keys dari KV --
async function listCreditKeys(env: AdminEnv): Promise<Array<{ ip: string; state: CreditState; blacklisted: boolean }>> {
  try {
    const list = await env.RATE_LIMIT_KV.list({ prefix: 'credit:' });
    const results = [];
    for (const key of list.keys) {
      const ip = key.name.replace('credit:', '');
      const state = await readCreditState(env, ip);
      const blacklisted = await isBlacklisted(env, ip);
      results.push({ ip, state, blacklisted });
    }
    return results;
  } catch { return []; }
}

// -- Test satu OpenRouter key --
async function testKey(env: AdminEnv, apiKey: string, keyLabel: string, activeModel?: string): Promise<{
  label: string;
  ok: boolean;
  status: number | null;
  latencyMs: number;
  error: string | null;
  model: string;
}> {
  // FIX BUG #1: selalu gunakan model aktif dari KV (bukan env langsung)
  // activeModel dikirim dari caller yang sudah getLLMConfig() lebih dulu
  const model = activeModel || env.FALLBACK_LLM_MODEL || 'z-ai/glm-5.2:free';
  const baseUrl = (env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
  const start = Date.now();

  // Timeout 15 detik - Workers tidak boleh gantung terlalu lama
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://jalurtarot.com',
        'X-Title': 'Jalur Tarot Admin Health Check',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8,
        temperature: 0.1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;

    // Selalu consume body agar tidak ada resource leak di CF Workers
    const bodyText = await res.text().catch(() => '');

    if (res.ok) {
      return { label: keyLabel, ok: true, status: res.status, latencyMs, error: null, model };
    }
    // Parse pesan error dari OpenRouter jika tersedia
    let errorMsg = bodyText.slice(0, 300);
    try {
      const parsed = JSON.parse(bodyText);
      errorMsg = parsed?.error?.message || parsed?.message || errorMsg;
    } catch { /* biarkan errorMsg mentah */ }
    return { label: keyLabel, ok: false, status: res.status, latencyMs, error: String(errorMsg).slice(0, 250), model };
  } catch (e: any) {
    clearTimeout(timeoutId);
    const isTimeout = e.name === 'AbortError';
    return {
      label: keyLabel,
      ok: false,
      status: null,
      latencyMs: Date.now() - start,
      error: isTimeout ? 'Timeout (>15 detik)' : String(e.message).slice(0, 250),
      model,
    };
  }
}

// ======================================
// -- HTML HELPERS --
// ======================================

function adminShell(title: string, content: string, activePage: string = ''): string {
  const nav = [
    { href: '/admin', label: '[dashboard] Dashboard', id: 'dashboard' },
    { href: '/admin/live', label: '[live] Live', id: 'live' },
    { href: '/admin/credits', label: '[credits] Credits', id: 'credits' },
    { href: '/admin/health', label: '[health] LLM Health', id: 'health' },
    { href: '/admin/banner', label: '[banner] Banner', id: 'banner' },
    { href: '/admin/blacklist', label: '[blocked] Blacklist', id: 'blacklist' },
  ];

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} - JalurTarot Admin</title>
  <meta name="robots" content="noindex,nofollow"/>
  <link rel="manifest" href="/manifest-admin.json"/>
  <link rel="apple-touch-icon" href="/icons/icon-192.png"/>
  <meta name="theme-color" content="#0a0a0f"/>
  <meta name="mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
  <meta name="apple-mobile-web-app-title" content="Tarot Admin"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0a0f;
      --surface: #13131a;
      --surface2: #1a1a24;
      --border: #2a2a3a;
      --gold: #c8a84b;
      --gold-dim: #7a6128;
      --text: #ede8de;
      --text-dim: #9a9489;
      --text-faint: #4a4640;
      --red: #c0392b;
      --red-dim: #7a1f17;
      --green: #27ae60;
      --green-dim: #1a6e3e;
      --blue: #2980b9;
      --yellow: #f39c12;
      --radius: 8px;
    }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
    }
    /* -- Sidebar -- */
    .sidebar {
      width: 220px;
      min-width: 220px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 1.5rem 0;
      position: sticky;
      top: 0;
      height: 100vh;
    }
    .sidebar-logo {
      padding: 0 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1rem;
    }
    .sidebar-logo h1 {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: var(--gold);
      text-transform: uppercase;
    }
    .sidebar-logo p {
      font-size: 10px;
      color: var(--text-faint);
      margin-top: 3px;
      letter-spacing: 0.05em;
    }
    .nav-item {
      display: block;
      padding: 0.6rem 1.25rem;
      color: var(--text-dim);
      text-decoration: none;
      font-size: 13px;
      border-left: 3px solid transparent;
      transition: all 0.15s;
    }
    .nav-item:hover { background: var(--surface2); color: var(--text); }
    .nav-item.active {
      background: var(--surface2);
      color: var(--gold);
      border-left-color: var(--gold);
    }
    .sidebar-bottom {
      margin-top: auto;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border);
    }
    .btn-logout {
      width: 100%;
      padding: 0.5rem;
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-dim);
      font-size: 12px;
      border-radius: var(--radius);
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-logout:hover { background: var(--red-dim); color: var(--text); border-color: var(--red); }
    /* -- Main -- */
    .main {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }
    .page-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    /* -- Cards -- */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .card-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-faint);
      margin-bottom: 1rem;
    }
    /* -- Stats row -- */
    .stats-row { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
    .stat-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem 1.25rem;
      flex: 1;
      min-width: 140px;
    }
    .stat-label { font-size: 10px; color: var(--text-faint); letter-spacing: 0.1em; text-transform: uppercase; }
    .stat-value { font-size: 26px; font-weight: 700; color: var(--gold); margin-top: 4px; }
    .stat-sub { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
    /* -- Table -- */
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th {
      text-align: left;
      padding: 0.5rem 0.75rem;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-faint);
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 0.65rem 0.75rem;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--surface2); }
    /* -- Badges -- */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .badge-green { background: rgba(39,174,96,0.15); color: var(--green); border: 1px solid rgba(39,174,96,0.3); }
    .badge-red { background: rgba(192,57,43,0.15); color: #e74c3c; border: 1px solid rgba(192,57,43,0.3); }
    .badge-yellow { background: rgba(243,156,18,0.15); color: var(--yellow); border: 1px solid rgba(243,156,18,0.3); }
    .badge-blue { background: rgba(41,128,185,0.15); color: #3498db; border: 1px solid rgba(41,128,185,0.3); }
    .badge-gold { background: rgba(200,168,75,0.15); color: var(--gold); border: 1px solid rgba(200,168,75,0.3); }
    /* -- Buttons -- */
    .btn {
      padding: 0.4rem 0.9rem;
      border-radius: var(--radius);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s;
      text-decoration: none;
      display: inline-block;
    }
    .btn-primary { background: var(--gold-dim); color: var(--text); border-color: var(--gold); }
    .btn-primary:hover { background: var(--gold); color: #000; }
    .btn-danger { background: var(--red-dim); color: var(--text); border-color: var(--red); }
    .btn-danger:hover { background: var(--red); color: #fff; }
    .btn-ghost { background: transparent; color: var(--text-dim); border-color: var(--border); }
    .btn-ghost:hover { background: var(--surface2); color: var(--text); }
    .btn-success { background: var(--green-dim); color: var(--text); border-color: var(--green); }
    .btn-success:hover { background: var(--green); color: #fff; }
    /* -- Form -- */
    .form-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.75rem; }
    input[type="text"], input[type="number"], textarea, select {
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius);
      font-size: 13px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s;
    }
    input[type="text"]:focus, input[type="number"]:focus, textarea:focus, select:focus {
      border-color: var(--gold-dim);
    }
    input[type="text"] { min-width: 200px; }
    input[type="number"] { width: 90px; }
    textarea { width: 100%; min-height: 80px; resize: vertical; }
    label { font-size: 12px; color: var(--text-dim); }
    /* -- Alert -- */
    .alert {
      padding: 0.75rem 1rem;
      border-radius: var(--radius);
      font-size: 13px;
      margin-bottom: 1rem;
    }
    .alert-success { background: rgba(39,174,96,0.1); border: 1px solid rgba(39,174,96,0.3); color: #5dba7e; }
    .alert-error { background: rgba(192,57,43,0.1); border: 1px solid rgba(192,57,43,0.3); color: #e74c3c; }
    .alert-info { background: rgba(41,128,185,0.1); border: 1px solid rgba(41,128,185,0.3); color: #5dade2; }
    /* -- Progress bar -- */
    .progress-bar {
      height: 6px;
      background: var(--border);
      border-radius: 99px;
      overflow: hidden;
      width: 100px;
      display: inline-block;
      vertical-align: middle;
    }
    .progress-fill {
      height: 100%;
      border-radius: 99px;
      background: var(--gold);
    }
    .progress-fill.danger { background: var(--red); }
    .progress-fill.warning { background: var(--yellow); }
    /* -- Health indicator -- */
    .health-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 6px;
    }
    .health-dot.ok { background: var(--green); box-shadow: 0 0 6px var(--green); }
    .health-dot.fail { background: var(--red); box-shadow: 0 0 6px var(--red); }
    .health-dot.pending { background: var(--yellow); animation: pulse 1s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    /* -- Banner preview -- */
    .banner-preview {
      padding: 0.6rem 1rem;
      border-radius: var(--radius);
      font-size: 13px;
      margin-top: 0.75rem;
      border-left: 3px solid var(--gold);
      background: rgba(200,168,75,0.07);
      color: var(--text);
    }
    .banner-preview.info { border-left-color: var(--blue); background: rgba(41,128,185,0.07); }
    .banner-preview.warning { border-left-color: var(--yellow); background: rgba(243,156,18,0.07); }
    .banner-preview.error { border-left-color: var(--red); background: rgba(192,57,43,0.07); }
    /* -- Mono IP -- */
    .mono { font-family: 'Courier New', monospace; font-size: 12px; color: var(--text-dim); }
    /* -- Responsive -- */
    @media (max-width: 640px) {
      .sidebar { display: none; }
      .main { padding: 1rem; }
    }
    /* -- Inline edit -- */
    .inline-edit { display: flex; gap: 0.5rem; align-items: center; }
    .inline-edit input { width: 70px; }
    /* -- Empty state -- */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-faint);
      font-size: 13px;
    }
    .empty-state p:first-child { font-size: 32px; margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <h1>[tarot] Admin</h1>
      <p>JalurTarot Panel</p>
    </div>
    <nav>
      ${nav.map(n => `<a href="${n.href}" class="nav-item${activePage === n.id ? ' active' : ''}">${n.label}</a>`).join('')}
    </nav>
    <div class="sidebar-bottom">
      <form method="POST" action="/admin/logout">
        <button type="submit" class="btn-logout">[exit] Logout</button>
      </form>
    </div>
  </aside>
  <main class="main">
    <h1 class="page-title">${title}</h1>
    ${content}
  </main>
  <script>if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw-admin.js').catch(function(){});}</script>
</body>
</html>`;
}

// ======================================
// -- ROUTES: AUTH --
// ======================================

// GET /admin/login
admin.get('/login', (c) => {
  const error = c.req.query('error');
  const hint = c.req.query('hint'); // hint=1 jika ADMIN_PASSWORD belum diset
  // Jika sudah login, redirect langsung ke dashboard
  if (isAuthenticated(c)) {
    return c.redirect('/admin');
  }
  return c.html(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Admin Login - JalurTarot</title>
  <meta name="robots" content="noindex,nofollow"/>
  <link rel="manifest" href="/manifest-admin.json"/>
  <link rel="apple-touch-icon" href="/icons/icon-192.png"/>
  <meta name="theme-color" content="#0a0a0f"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0a0a0f;
      color: #ede8de;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-box {
      background: #13131a;
      border: 1px solid #2a2a3a;
      border-radius: 12px;
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 380px;
    }
    h1 {
      font-size: 16px;
      letter-spacing: 0.15em;
      color: #c8a84b;
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }
    p.sub { font-size: 12px; color: #4a4640; margin-bottom: 1.5rem; }
    label { display: block; font-size: 11px; color: #9a9489; margin-bottom: 0.4rem; letter-spacing: 0.05em; }
    .pw-wrap { position: relative; margin-bottom: 1rem; }
    input[type="password"], input[type="text"] {
      width: 100%;
      padding: 0.65rem 2.5rem 0.65rem 0.9rem;
      background: #1a1a24;
      border: 1px solid #2a2a3a;
      border-radius: 8px;
      color: #ede8de;
      font-size: 14px;
      outline: none;
    }
    input[type="password"]:focus, input[type="text"]:focus { border-color: #7a6128; }
    .pw-toggle {
      position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: #9a9489; cursor: pointer;
      font-size: 14px; padding: 0; line-height: 1;
    }
    button[type="submit"] {
      width: 100%;
      padding: 0.65rem;
      background: #7a6128;
      color: #ede8de;
      border: 1px solid #c8a84b;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      letter-spacing: 0.05em;
      transition: background 0.15s;
    }
    button[type="submit"]:hover { background: #c8a84b; color: #000; }
    .alert {
      padding: 0.6rem 0.9rem;
      border-radius: 8px;
      font-size: 12px;
      margin-bottom: 1rem;
      line-height: 1.5;
    }
    .alert-error {
      background: rgba(192,57,43,0.1);
      border: 1px solid rgba(192,57,43,0.3);
      color: #e74c3c;
    }
    .alert-warn {
      background: rgba(200,168,75,0.08);
      border: 1px solid rgba(200,168,75,0.25);
      color: #c8a84b;
    }
    code {
      font-family: monospace;
      background: rgba(255,255,255,0.07);
      padding: 1px 5px;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>[tarot] Admin Panel</h1>
    <p class="sub">JalurTarot - Area Terbatas</p>
    ${error && hint ? `
    <div class="alert alert-warn">
      [!] <strong>ADMIN_PASSWORD belum diset.</strong><br>
      Jalankan: <code>wrangler secret put ADMIN_PASSWORD</code><br>
      Atau gunakan password default: <code>changeme</code>
    </div>` : error ? `
    <div class="alert alert-error">[!] Password salah. Coba lagi.</div>` : ''}
    <form method="POST" action="/admin/login">
      <label>PASSWORD</label>
      <div class="pw-wrap">
        <input type="password" id="pwField" name="password" placeholder="--------" autofocus required autocomplete="current-password"/>
        <button type="button" class="pw-toggle" onclick="togglePw()" title="Tampilkan/sembunyikan">(eye)</button>
      </div>
      <button type="submit">Masuk -></button>
    </form>
  </div>
  <script>
    function togglePw() {
      const f = document.getElementById('pwField');
      f.type = f.type === 'password' ? 'text' : 'password';
    }
    // Auto-trim whitespace saat submit agar tidak gagal karena trailing space
    document.querySelector('form').addEventListener('submit', function() {
      const f = document.getElementById('pwField');
      f.value = f.value.trim();
    });
  </script>
</body>
</html>`);
});

// POST /admin/login
admin.post('/login', async (c) => {
  const body = await c.req.parseBody();
  // Trim input dari form (browser kadang tambah whitespace, atau copy-paste dari editor)
  const password = (body['password'] as string || '').trim();
  const expected = getAdminPassword(c);

  if (await isLoginRateLimited(c)) return c.redirect('/admin/login?error=1&rate=1');
  if (!expected || !password || password !== expected) {
    await recordFailedLogin(c);
    return c.redirect('/admin/login?error=1');
  }

  await clearLoginFailures(c);
  const token = (crypto as any).randomUUID() as string;
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000;
  await c.env.RATE_LIMIT_KV.put(
    'admin:session:' + token,
    JSON.stringify({ createdAt: Date.now(), expiresAt }),
    { expirationTtl: ADMIN_SESSION_TTL_SECONDS },
  );

  const res = c.redirect('/admin');
  res.headers.set('Set-Cookie',
    `admin_token=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ADMIN_SESSION_TTL_SECONDS}`
  );
  return res;
});

// POST /admin/logout
admin.post('/logout', async (c) => {
  const token = getCookie(c, 'admin_token');
  if (token) {
    try { await c.env.RATE_LIMIT_KV.delete('admin:session:' + token); } catch {}
  }
  const res = c.redirect('/admin/login');
  res.headers.set('Set-Cookie',
    'admin_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
  );
  return res;
});

// ======================================
// -- ROUTES: DASHBOARD --
// ======================================

admin.get('/', async (c) => {
  const entries = await listCreditKeys(c.env);
  const banner = await getBanner(c.env);

  const totalIPs = entries.length;
  const totalUsed = entries.reduce((s, e) => s + e.state.used, 0);
  const blacklistedCount = entries.filter(e => e.blacklisted).length;
  const highUsage = entries.filter(e => {
    const effective = CREDIT_LIMIT + e.state.credited;
    return e.state.used / effective >= 0.8;
  }).length;

  // Cek berapa key tersedia
  const keyCount = [
    c.env.OPENROUTER_API_KEY,
    c.env.OPENROUTER_API_KEY_2,
    c.env.OPENROUTER_API_KEY_3,
    c.env.OPENROUTER_API_KEY_4,
    c.env.OPENROUTER_API_KEY_5,
  ].filter((k): k is string => typeof k === 'string' && k.trim().length > 0).length;

  const content = `
    ${banner?.active ? `<div class="alert alert-info">[banner] Banner aktif: "${esc(banner.text)}"</div>` : ''}
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-label">Total IP Tracked</div>
        <div class="stat-value">${totalIPs}</div>
        <div class="stat-sub">unique IPs di KV</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Total Kredit Dipakai</div>
        <div class="stat-value">${totalUsed}</div>
        <div class="stat-sub">semua IP digabung</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">IP Blacklisted</div>
        <div class="stat-value" style="color:${blacklistedCount > 0 ? 'var(--red)' : 'var(--text)'}">${blacklistedCount}</div>
        <div class="stat-sub">diblokir</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">IP High Usage</div>
        <div class="stat-value" style="color:${highUsage > 0 ? 'var(--yellow)' : 'var(--text)'}">${highUsage}</div>
        <div class="stat-sub">>=80% limit terpakai</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">OpenRouter Keys</div>
        <div class="stat-value">${keyCount}</div>
        <div class="stat-sub">key terdaftar - <a href="/admin/health" style="color:var(--gold);text-decoration:none;font-size:11px;">cek status</a></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Quick Links</div>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
        <a href="/admin/credits" class="btn btn-ghost">[credits] Kelola Credits</a>
        <a href="/admin/health" class="btn btn-ghost">[health] Cek LLM Keys</a>
        <a href="/admin/banner" class="btn btn-ghost">[banner] Set Banner</a>
        <a href="/admin/blacklist" class="btn btn-ghost">[blocked] Kelola Blacklist</a>
        <a href="/" class="btn btn-ghost" target="_blank">[web] Buka Situs</a>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Top IP by Usage (5 Teratas)</div>
      ${entries.length === 0 ? `<div class="empty-state"><p>[empty]</p><p>Belum ada data kredit</p></div>` : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>IP</th>
              <th>Dipakai</th>
              <th>Bonus</th>
              <th>Usage</th>
              <th>Reset</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${entries
              .sort((a, b) => b.state.used - a.state.used)
              .slice(0, 5)
              .map(e => {
                const effective = CREDIT_LIMIT + e.state.credited;
                const pct = Math.min(100, Math.round((e.state.used / effective) * 100));
                const resetDate = new Date(e.state.resetAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                const fillClass = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : '';
                return `<tr>
                  <td class="mono">${e.ip}</td>
                  <td>${e.state.used} / ${effective}</td>
                  <td>${e.state.credited > 0 ? `<span class="badge badge-gold">+${e.state.credited}</span>` : '-'}</td>
                  <td>
                    <div class="progress-bar"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>
                    <span style="font-size:11px;color:var(--text-dim);margin-left:6px;">${pct}%</span>
                  </td>
                  <td style="font-size:12px;color:var(--text-dim);">${resetDate}</td>
                  <td>${e.blacklisted ? '<span class="badge badge-red">BLOCKED</span>' : pct >= 90 ? '<span class="badge badge-yellow">NEAR LIMIT</span>' : '<span class="badge badge-green">OK</span>'}</td>
                </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>
      `}
    </div>
  `;

  return c.html(adminShell('[dashboard] Dashboard', content, 'dashboard'));
});

// ======================================
// -- ROUTES: CREDITS --
// ======================================

admin.get('/credits', async (c) => {
  const entries = await listCreditKeys(c.env);
  const msg = c.req.query('msg');
  const msgType = c.req.query('type') || 'success';
  const filterIp = c.req.query('ip') || '';

  const filtered = filterIp
    ? entries.filter(e => e.ip.includes(filterIp))
    : entries;

  const sorted = [...filtered].sort((a, b) => b.state.used - a.state.used);

  const content = `
    ${msg ? `<div class="alert alert-${esc(msgType)}">${esc(msg)}</div>` : ''}

    <div class="card">
      <div class="card-title">Cari / Lookup IP</div>
      <form method="GET" action="/admin/credits" style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;">
        <input type="text" name="ip" value="${esc(filterIp)}" placeholder="Ketik IP atau sebagian IP..." style="min-width:260px;"/>
        <button type="submit" class="btn btn-primary">Cari</button>
        ${filterIp ? `<a href="/admin/credits" class="btn btn-ghost">Reset</a>` : ''}
      </form>
    </div>

    <div class="card">
      <div class="card-title">Tambah / Edit Kredit per IP</div>
      <form method="POST" action="/admin/credits/adjust">
        <div class="form-row">
          <label>IP Address</label>
          <input type="text" name="ip" placeholder="1.2.3.4" required/>
          <label>Bonus Kredit (+/-)</label>
          <input type="number" name="amount" value="1" min="-100" max="100" required/>
          <button type="submit" class="btn btn-primary">Terapkan</button>
        </div>
        <p style="font-size:11px;color:var(--text-faint);">Nilai positif = tambah kredit. Nilai negatif = kurangi. Perubahan ini akan bertambah ke bonus (credited) yang sudah ada.</p>
      </form>
    </div>

    <div class="card">
      <div class="card-title">Reset Kredit IP</div>
      <form method="POST" action="/admin/credits/reset">
        <div class="form-row">
          <label>IP Address</label>
          <input type="text" name="ip" placeholder="1.2.3.4" required/>
          <button type="submit" class="btn btn-danger" onclick="return confirm('Reset kredit IP ini ke 0?')">Reset ke 0</button>
        </div>
        <p style="font-size:11px;color:var(--text-faint);">Menghapus semua pemakaian dan bonus untuk IP ini. TTL window tetap berjalan.</p>
      </form>
    </div>

    <div class="card">
      <div class="card-title">Semua IP Tracked (${sorted.length})</div>
      ${sorted.length === 0 ? `<div class="empty-state"><p>[empty]</p><p>Tidak ada data${filterIp ? ` untuk IP "${esc(filterIp)}"` : ''}</p></div>` : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>IP</th>
              <th>Dipakai</th>
              <th>Limit Efektif</th>
              <th>Bonus</th>
              <th>Usage %</th>
              <th>Reset</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(e => {
              const effective = CREDIT_LIMIT + e.state.credited;
              const pct = Math.min(100, Math.round((e.state.used / effective) * 100));
              const resetDate = new Date(e.state.resetAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
              const fillClass = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : '';
              const safeIp = esc(e.ip); // FIX BUG #3+#7: escape IP sebelum render
              return `<tr>
                <td class="mono">${safeIp}</td>
                <td>${e.state.used}</td>
                <td>${effective} (base ${CREDIT_LIMIT} + bonus ${e.state.credited})</td>
                <td>${e.state.credited > 0 ? `<span class="badge badge-gold">+${e.state.credited}</span>` : '-'}</td>
                <td>
                  <div class="progress-bar"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>
                  <span style="font-size:11px;color:var(--text-dim);margin-left:6px;">${pct}%</span>
                </td>
                <td style="font-size:11px;color:var(--text-dim);">${resetDate}</td>
                <td>${e.blacklisted
                  ? '<span class="badge badge-red">BLOCKED</span>'
                  : pct >= 100 ? '<span class="badge badge-red">LIMIT</span>'
                  : pct >= 80 ? '<span class="badge badge-yellow">NEAR LIMIT</span>'
                  : '<span class="badge badge-green">OK</span>'}</td>
                <td style="white-space:nowrap;">
                  <form method="POST" action="/admin/credits/adjust" style="display:inline;">
                    <input type="hidden" name="ip" value="${safeIp}"/>
                    <input type="hidden" name="amount" value="5"/>
                    <button type="submit" class="btn btn-success" style="font-size:10px;padding:2px 7px;">+5</button>
                  </form>
                  <form method="POST" action="/admin/credits/reset" style="display:inline;margin-left:4px;" onsubmit="return confirm('Reset kredit ${safeIp}?')">
                    <input type="hidden" name="ip" value="${safeIp}"/>
                    <button type="submit" class="btn btn-danger" style="font-size:10px;padding:2px 7px;">Reset</button>
                  </form>
                  ${!e.blacklisted
                    ? `<form method="POST" action="/admin/blacklist/add" style="display:inline;margin-left:4px;" onsubmit="return confirm('Blacklist ${safeIp}?')">
                        <input type="hidden" name="ip" value="${safeIp}"/>
                        <input type="hidden" name="redirect" value="/admin/credits"/>
                        <button type="submit" class="btn btn-ghost" style="font-size:10px;padding:2px 7px;">[blocked]</button>
                       </form>`
                    : `<form method="POST" action="/admin/blacklist/remove" style="display:inline;margin-left:4px;">
                        <input type="hidden" name="ip" value="${safeIp}"/>
                        <input type="hidden" name="redirect" value="/admin/credits"/>
                        <button type="submit" class="btn btn-ghost" style="font-size:10px;padding:2px 7px;">[ok] Unblock</button>
                       </form>`
                  }
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      `}
    </div>
  `;

  return c.html(adminShell('[credits] Credit Manager', content, 'credits'));
});

// POST /admin/credits/adjust
admin.post('/credits/adjust', async (c) => {
  const body = await c.req.parseBody();
  const ip = (body['ip'] as string || '').trim();
  const amount = parseInt(body['amount'] as string || '0', 10);

  if (!ip) return c.redirect('/admin/credits?msg=IP+tidak+boleh+kosong&type=error');
  if (isNaN(amount)) return c.redirect('/admin/credits?msg=Jumlah+tidak+valid&type=error');

  try {
    const state = await readCreditState(c.env, ip);
    const newCredited = Math.max(0, state.credited + amount);
    await writeCreditState(c.env, ip, { ...state, credited: newCredited });
    const action = amount >= 0 ? `+${amount}` : `${amount}`;
    return c.redirect(`/admin/credits?msg=Kredit+IP+${encodeURIComponent(ip)}+berhasil+diubah+(${encodeURIComponent(action)})&type=success`);
  } catch (e: any) {
    return c.redirect(`/admin/credits?msg=Error:+${encodeURIComponent(e.message)}&type=error`);
  }
});

// POST /admin/credits/reset
admin.post('/credits/reset', async (c) => {
  const body = await c.req.parseBody();
  const ip = (body['ip'] as string || '').trim();
  const redirectTo = (body['redirect'] as string) || '/admin/credits';

  if (!ip) return c.redirect(`${redirectTo}?msg=IP+tidak+boleh+kosong&type=error`);

  try {
    const now = Date.now();
    const freshState: CreditState = {
      used: 0,
      credited: 0,
      resetAt: now + CREDIT_TTL_SECONDS * 1000,
    };
    await writeCreditState(c.env, ip, freshState);
    return c.redirect(`${redirectTo}?msg=Kredit+IP+${encodeURIComponent(ip)}+berhasil+direset&type=success`);
  } catch (e: any) {
    return c.redirect(`${redirectTo}?msg=Error:+${encodeURIComponent(e.message)}&type=error`);
  }
});

// ======================================
// -- ROUTES: LLM HEALTH --
// ======================================

admin.get('/health', async (c) => {
  // Baca config LLM dari KV (bisa diedit dari admin panel ini)
  const llmCfg = await getLLMConfig(c.env);
  const model = llmCfg.model;
  const llmEnabled = llmCfg.enabled;
  // Env fallback info - untuk ditampilkan sebagai referensi
  const envModel = c.env.FALLBACK_LLM_MODEL || 'z-ai/glm-5.2:free';
  const envEnabled = c.env.ENABLE_FALLBACK_LLM === 'true';

  // Ambil semua key
  const keyDefs = [
    { label: 'Key 1 (Primary)', value: c.env.OPENROUTER_API_KEY },
    { label: 'Key 2', value: c.env.OPENROUTER_API_KEY_2 },
    { label: 'Key 3', value: c.env.OPENROUTER_API_KEY_3 },
    { label: 'Key 4', value: c.env.OPENROUTER_API_KEY_4 },
    { label: 'Key 5', value: c.env.OPENROUTER_API_KEY_5 },
  ].filter(k => typeof k.value === 'string' && k.value.trim().length > 0) as Array<{ label: string; value: string }>;

  const doTest = c.req.query('test') === '1';
  let results: Array<Awaited<ReturnType<typeof testKey>>> = [];

  if (doTest && keyDefs.length > 0) {
    // FIX BUG #4: pass model aktif dari KV ke testKey() agar model yg di-test = model yg dipakai user
    results = await Promise.all(keyDefs.map(k => testKey(c.env, k.value, k.label, model)));
  }

  const okCount = results.filter(r => r.ok).length;
  const failCount = results.filter(r => !r.ok).length;

  // Render tabel hasil test key - dipisah agar tidak ada template literal bersarang
  function renderKeyTestRows(rows: typeof results, defs: typeof keyDefs): string {
    return rows.map(r => {
      const keyDef = defs.find(k => k.label === r.label);
      const kv = keyDef?.value || '';
      const masked = kv.length > 14
        ? kv.slice(0, 8) + '...' + kv.slice(-4)
        : kv.length > 6 ? kv.slice(0, 4) + '...' : '-';
      const errSafe = r.error ? r.error.replace(/"/g, '&quot;') : '';
      const errShort = r.error ? (r.error.slice(0, 60) + (r.error.length > 60 ? '...' : '')) : '';
      const errorHtml = r.error
        ? '<span title="' + errSafe + '" style="cursor:help;border-bottom:1px dashed var(--text-faint);">' + errShort + '</span>'
        : '<span style="color:var(--text-faint);">-</span>';
      const statusBadge = r.status !== null
        ? '<span class="badge ' + (r.status === 200 ? 'badge-green' : 'badge-red') + '">' + r.status + '</span>'
        : '<span style="color:var(--text-faint);">-</span>';
      return '<tr>'
        + '<td style="font-weight:600;">' + r.label + '</td>'
        + '<td class="mono" style="font-size:11px;">' + masked + '</td>'
        + '<td>'
        + '<span class="health-dot ' + (r.ok ? 'ok' : 'fail') + '"></span>'
        + '<span class="badge ' + (r.ok ? 'badge-green' : 'badge-red') + '">' + (r.ok ? 'OK' : 'GAGAL') + '</span>'
        + '</td>'
        + '<td>' + statusBadge + '</td>'
        + '<td style="font-size:12px;color:var(--text-dim);">' + r.latencyMs + 'ms</td>'
        + '<td style="font-size:11px;color:' + (r.ok ? 'var(--text-faint)' : '#e74c3c') + ';max-width:220px;">' + errorHtml + '</td>'
        + '</tr>';
    }).join('');
  }

  const keyTestResultsHtml = doTest ? (
    '<div style="margin-bottom:1rem;display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;">'
    + (okCount > 0 ? '<span class="badge badge-green">[ok] ' + okCount + ' key OK</span>' : '')
    + (failCount > 0 ? '<span class="badge badge-red">[x] ' + failCount + ' key GAGAL</span>' : '')
    + '<a href="/admin/health?test=1" class="btn btn-ghost" style="font-size:11px;">(refresh) Test Ulang</a>'
    + '<a href="/admin/health" class="btn btn-ghost" style="font-size:11px;">Tutup</a>'
    + '</div>'
    + '<div class="table-wrap"><table>'
    + '<thead><tr><th>Key</th><th>Masked</th><th>Status</th><th>HTTP</th><th>Latency</th><th>Keterangan</th></tr></thead>'
    + '<tbody>' + renderKeyTestRows(results, keyDefs) + '</tbody>'
    + '</table></div>'
  ) : (
    '<p style="font-size:13px;color:var(--text-dim);margin-bottom:1rem;">Setiap key dicoba dengan request minimal (max_tokens=8).</p>'
    + '<a href="/admin/health?test=1" class="btn btn-primary">[health] Jalankan Health Check</a>'
  );

  // Pesan dari action sebelumnya (model/toggle saved)
  const msg = c.req.query('msg');
  const msgType = c.req.query('type') || 'success';

  // Model preset populer OpenRouter (gratis dan berbayar)
  const MODEL_PRESETS = [
    { label: 'z-ai/glm-5.2:free', value: 'z-ai/glm-5.2:free', note: 'Default' },
    { label: 'google/gemma-3-27b-it:free', value: 'google/gemma-3-27b-it:free', note: 'Gratis' },
    { label: 'meta-llama/llama-4-scout:free', value: 'meta-llama/llama-4-scout:free', note: 'Gratis' },
    { label: 'deepseek/deepseek-chat-v3-0324:free', value: 'deepseek/deepseek-chat-v3-0324:free', note: 'Gratis' },
    { label: 'mistralai/mistral-small-3.2-24b-instruct:free', value: 'mistralai/mistral-small-3.2-24b-instruct:free', note: 'Gratis' },
    { label: 'openai/gpt-4o-mini', value: 'openai/gpt-4o-mini', note: 'Berbayar' },
    { label: 'anthropic/claude-haiku-3.5', value: 'anthropic/claude-haiku-3.5', note: 'Berbayar' },
    { label: 'google/gemini-flash-1.5', value: 'google/gemini-flash-1.5', note: 'Berbayar' },
  ];

  const content = `
    ${msg ? `<div class="alert alert-${esc(msgType) === 'error' ? 'error' : 'success'}" style="margin-bottom:1rem;">${esc(msgType) === 'error' ? '[!]' : '[ok]'} ${esc(msg)}</div>` : ''}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">

      <!-- -- Card: Ganti Model -- -->
      <div class="card" style="margin-bottom:0;">
        <div class="card-title">[model] Model LLM Aktif</div>
        <p style="font-size:12px;color:var(--text-dim);margin-bottom:1rem;line-height:1.6;">
          Model yang dipakai untuk interpretasi tarot.<br/>
          Perubahan berlaku <strong>langsung</strong> - tanpa redeploy.
        </p>
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:0.75rem 1rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
          <span style="font-size:11px;color:var(--text-dim);">Aktif sekarang:</span>
          <span class="mono" style="color:var(--gold);font-size:12px;">${model}</span>
          ${model !== envModel ? `<span class="badge badge-blue" style="font-size:10px;" title="env: ${envModel}">KV override</span>` : '<span class="badge badge-green" style="font-size:10px;">= env</span>'}
        </div>
        <form method="POST" action="/admin/config/model">
          <label style="display:block;font-size:11px;color:var(--text-dim);margin-bottom:0.35rem;letter-spacing:0.04em;">PILIH PRESET MODEL</label>
          <select name="model" style="width:100%;padding:0.55rem 0.75rem;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;margin-bottom:0.75rem;cursor:pointer;font-family:monospace;" onchange="syncCustomField(this)">
            ${MODEL_PRESETS.map(p => `<option value="${p.value}" ${model === p.value ? 'selected' : ''}>${p.label} (${p.note})</option>`).join('')}
            <option value="__custom__" ${!MODEL_PRESETS.find(p => p.value === model) ? 'selected' : ''}>- Custom (isi manual) -</option>
          </select>
          <label style="display:block;font-size:11px;color:var(--text-dim);margin-bottom:0.35rem;letter-spacing:0.04em;">ATAU KETIK MODEL ID MANUAL</label>
          <input type="text" id="customModel" name="custom_model"
            value="${!MODEL_PRESETS.find(p => p.value === model) ? model : ''}"
            placeholder="provider/model-name:variant"
            style="width:100%;padding:0.55rem 0.75rem;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:monospace;margin-bottom:0.75rem;outline:none;"
          />
          <button type="submit" class="btn btn-primary" style="width:100%;">[save] Simpan Model</button>
        </form>
        <p style="font-size:11px;color:var(--text-faint);margin-top:0.6rem;">
          Lihat semua model di <a href="https://openrouter.ai/models" target="_blank" style="color:var(--gold);">openrouter.ai/models</a>
        </p>
      </div>

      <!-- -- Card: Toggle LLM -- -->
      <div class="card" style="margin-bottom:0;">
        <div class="card-title">[*] Status LLM</div>
        <p style="font-size:12px;color:var(--text-dim);margin-bottom:1rem;line-height:1.6;">
          Nonaktifkan LLM untuk beralih ke <strong>static mode</strong> - interpretasi dari template tanpa AI. Berguna saat kuota habis atau debugging.
        </p>
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:1rem;text-align:center;">
          <div style="font-size:2rem;margin-bottom:0.4rem;">${llmEnabled ? '[on]' : '[live]'}</div>
          <span class="badge ${llmEnabled ? 'badge-green' : 'badge-red'}" style="font-size:13px;padding:0.3rem 0.75rem;">
            ${llmEnabled ? 'LLM AKTIF' : 'STATIC MODE'}
          </span>
          ${llmEnabled !== envEnabled ? `<div style="font-size:11px;color:var(--text-faint);margin-top:0.5rem;">env: ${envEnabled ? 'aktif' : 'nonaktif'} - KV: ${llmEnabled ? 'aktif' : 'nonaktif'}</div>` : ''}
        </div>
        <form method="POST" action="/admin/config/llm-toggle">
          <input type="hidden" name="enabled" value="${llmEnabled ? 'false' : 'true'}"/>
          <button type="submit" class="btn ${llmEnabled ? 'btn-ghost' : 'btn-primary'}" style="width:100%;" onclick="return confirm('${llmEnabled ? 'Nonaktifkan LLM? User akan dapat static mode.' : 'Aktifkan LLM?'}')">
            ${llmEnabled ? '[live] Nonaktifkan LLM' : '[on] Aktifkan LLM'}
          </button>
        </form>
        <div style="margin-top:1rem;padding-top:0.75rem;border-top:1px solid var(--border);">
          <div style="font-size:11px;color:var(--text-dim);margin-bottom:0.5rem;">Status sumber config:</div>
          <table style="width:100%;font-size:11px;">
            <tr>
              <td style="color:var(--text-faint);padding-bottom:0.25rem;">env ENABLE_FALLBACK_LLM</td>
              <td><span class="badge ${envEnabled ? 'badge-green' : 'badge-red'}" style="font-size:10px;">${envEnabled ? 'true' : 'false'}</span></td>
            </tr>
            <tr>
              <td style="color:var(--text-faint);padding-bottom:0.25rem;">KV override</td>
              <td><span class="badge badge-blue" style="font-size:10px;">${llmEnabled ? 'true' : 'false'}</span></td>
            </tr>
            <tr>
              <td style="color:var(--text-faint);">Key tersedia</td>
              <td><span class="badge badge-blue" style="font-size:10px;">${keyDefs.length} key</span></td>
            </tr>
          </table>
        </div>
      </div>

    </div>

    ${keyDefs.length === 0 ? `
    <div class="alert alert-error">[!] Tidak ada API key yang terdaftar. Set OPENROUTER_API_KEY via <code>wrangler secret put</code>.</div>
    ` : ''}

    <div class="card">
      <div class="card-title">[search] Test Semua Key</div>
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:0.5rem;">
        Model yang dipakai saat test: <span class="mono" style="color:var(--gold);">${model}</span>
        &nbsp;-&nbsp; Base URL: <span class="mono" style="font-size:11px;">${c.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}</span>
      </p>
      ${keyTestResultsHtml}
    </div>

    <div class="card">
      <div class="card-title">Cara Tambah / Ganti Key</div>
      <p style="font-size:13px;color:var(--text-dim);line-height:1.7;">
        Key disimpan sebagai <strong>Cloudflare Secret</strong>, tidak bisa diedit dari sini.<br/>
        Untuk ubah key, jalankan di terminal:
      </p>
      <pre style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:0.75rem 1rem;font-size:12px;color:var(--gold);margin-top:0.75rem;overflow-x:auto;">wrangler secret put OPENROUTER_API_KEY
wrangler secret put OPENROUTER_API_KEY_2
wrangler secret put OPENROUTER_API_KEY_3</pre>
      <p style="font-size:11px;color:var(--text-faint);margin-top:0.5rem;">Setelah set secret, jalankan <code style="color:var(--gold)">wrangler deploy</code> untuk mengaktifkan.</p>
    </div>

    <script>
      // Sinkronkan field custom dengan dropdown pilihan preset
      function syncCustomField(sel) {
        const customField = document.getElementById('customModel');
        if (sel.value === '__custom__') {
          customField.focus();
        } else {
          customField.value = '';
        }
      }
      // Validasi sebelum submit form model
      document.querySelector('form[action="/admin/config/model"]').addEventListener('submit', function(e) {
        const sel = this.querySelector('select[name="model"]');
        const custom = document.getElementById('customModel').value.trim();
        if (sel.value === '__custom__' && !custom) {
          e.preventDefault();
          alert('Isi model ID di field manual, atau pilih dari preset.');
          return;
        }
        // Jika custom diisi, override value select agar yang dikirim adalah custom
        if (custom && custom !== sel.value) {
          sel.value = custom;
        }
      });
    </script>
  `;

  return c.html(adminShell('[health] LLM Health Check', content, 'health'));
});

// -- POST /admin/config/model - simpan model ke KV --
admin.post('/config/model', async (c) => {
  const body = await c.req.parseBody();
  // Jika custom diisi, custom override dropdown
  const custom = ((body['custom_model'] as string) || '').trim();
  const preset = ((body['model'] as string) || '').trim();
  const newModel = (custom || preset).trim();

  if (!newModel || newModel === '__custom__') {
    return c.redirect('/admin/health?msg=Model+tidak+boleh+kosong&type=error');
  }
  // Validasi format dasar: harus ada minimal 1 slash (provider/model)
  if (!newModel.includes('/')) {
    return c.redirect('/admin/health?msg=Format+model+tidak+valid+(harus:+provider%2Fmodel-name)&type=error');
  }

  try {
    await setLLMConfig(c.env, { model: newModel });
    return c.redirect(`/admin/health?msg=Model+berhasil+diganti+ke+${encodeURIComponent(newModel)}&type=success`);
  } catch (e: any) {
    return c.redirect(`/admin/health?msg=Gagal+simpan:+${encodeURIComponent(e.message)}&type=error`);
  }
});

// -- POST /admin/config/llm-toggle - aktif/nonaktifkan LLM --
admin.post('/config/llm-toggle', async (c) => {
  const body = await c.req.parseBody();
  const enabledStr = (body['enabled'] as string || '').trim();
  const enabled = enabledStr === 'true';

  try {
    await setLLMConfig(c.env, { enabled });
    const statusLabel = enabled ? 'diaktifkan' : 'dinonaktifkan';
    return c.redirect(`/admin/health?msg=LLM+berhasil+${statusLabel}&type=success`);
  } catch (e: any) {
    return c.redirect(`/admin/health?msg=Gagal+simpan:+${encodeURIComponent(e.message)}&type=error`);
  }
});

// ======================================
// -- ROUTES: BANNER --
// ======================================

admin.get('/banner', async (c) => {
  const banner = await getBanner(c.env);
  const msg = c.req.query('msg');
  const msgType = c.req.query('type') || 'success';

  const content = `
    ${msg ? `<div class="alert alert-${esc(msgType)}">${esc(msg)}</div>` : ''}

    <div class="card">
      <div class="card-title">Banner Saat Ini</div>
      ${banner?.active
        ? `<div class="banner-preview ${esc(banner.type || '')}">
            <strong>[${esc((banner.type || 'info').toUpperCase())}]</strong> ${esc(banner.text)}
           </div>
           <div style="margin-top:1rem;display:flex;gap:0.75rem;">
             <form method="POST" action="/admin/banner/deactivate">
               <button type="submit" class="btn btn-danger">[blocked] Nonaktifkan Banner</button>
             </form>
           </div>`
        : `<div class="empty-state" style="padding:1.5rem;">
             <p>[banner]</p>
             <p>Tidak ada banner aktif saat ini</p>
           </div>`
      }
    </div>

    <div class="card">
      <div class="card-title">Set Banner Baru</div>
      <form method="POST" action="/admin/banner/set">
        <div style="margin-bottom:0.75rem;">
          <label style="display:block;margin-bottom:0.4rem;">Teks Banner</label>
          <textarea name="text" placeholder="Contoh: Server sedang dalam pemeliharaan. Beberapa fitur mungkin tidak tersedia." required>${esc(banner?.text || '')}</textarea>
        </div>
        <div class="form-row" style="margin-bottom:1rem;">
          <label>Tipe:</label>
          <select name="type">
            <option value="info" ${banner?.type === 'info' ? 'selected' : ''}>[i] Info (biru)</option>
            <option value="warning" ${banner?.type === 'warning' ? 'selected' : ''}>[!] Warning (kuning)</option>
            <option value="error" ${banner?.type === 'error' ? 'selected' : ''}>[blocked] Error (merah)</option>
            <option value="" ${!banner?.type || banner?.type === '' ? 'selected' : ''}>* Default (gold)</option>
          </select>
        </div>
        <div style="display:flex;gap:0.75rem;">
          <button type="submit" class="btn btn-primary">[save] Simpan & Aktifkan</button>
        </div>
      </form>

      ${banner?.text ? `
      <div style="margin-top:1.5rem;">
        <p class="card-title" style="margin-bottom:0.5rem;">Preview</p>
        <div class="banner-preview ${esc(banner.type || '')}">
          ${esc(banner.text)}
        </div>
      </div>
      ` : ''}
    </div>

    <div class="card">
      <div class="card-title">Cara Kerja Banner</div>
      <p style="font-size:13px;color:var(--text-dim);line-height:1.8;">
        Banner disimpan di KV dengan key <span class="mono">banner:active</span>.<br/>
        Untuk tampil di situs, kamu perlu memanggil <code style="color:var(--gold)">GET /api/banner</code> dari frontend dan render hasilnya.<br/>
        Endpoint ini sudah tersedia dan siap diintegrasikan ke halaman manapun.
      </p>
    </div>
  `;

  return c.html(adminShell('[banner] Banner Manager', content, 'banner'));
});

// POST /admin/banner/set
admin.post('/banner/set', async (c) => {
  const body = await c.req.parseBody();
  const text = (body['text'] as string || '').trim();
  const type = (body['type'] as string || 'info').trim();

  if (!text) return c.redirect('/admin/banner?msg=Teks+banner+tidak+boleh+kosong&type=error');

  try {
    const bannerData = { text, type, active: true, updatedAt: Date.now() };
    await c.env.RATE_LIMIT_KV.put('banner:active', JSON.stringify(bannerData), { expirationTtl: 30 * 24 * 60 * 60 });
    return c.redirect('/admin/banner?msg=Banner+berhasil+diaktifkan&type=success');
  } catch (e: any) {
    return c.redirect(`/admin/banner?msg=Error:+${encodeURIComponent(e.message)}&type=error`);
  }
});

// POST /admin/banner/deactivate
admin.post('/banner/deactivate', async (c) => {
  try {
    await c.env.RATE_LIMIT_KV.delete('banner:active');
    return c.redirect('/admin/banner?msg=Banner+berhasil+dinonaktifkan&type=success');
  } catch (e: any) {
    return c.redirect(`/admin/banner?msg=Error:+${encodeURIComponent(e.message)}&type=error`);
  }
});

// ======================================
// -- ROUTES: BLACKLIST --
// ======================================

admin.get('/blacklist', async (c) => {
  const msg = c.req.query('msg');
  const msgType = c.req.query('type') || 'success';

  // List semua blacklist keys
  let blacklistedIPs: string[] = [];
  try {
    const list = await c.env.RATE_LIMIT_KV.list({ prefix: 'blacklist:' });
    blacklistedIPs = list.keys.map(k => k.name.replace('blacklist:', ''));
  } catch {}

  const content = `
    ${msg ? `<div class="alert alert-${esc(msgType)}">${esc(msg)}</div>` : ''}

    <div class="card">
      <div class="card-title">Blacklist IP</div>
      <form method="POST" action="/admin/blacklist/add">
        <div class="form-row">
          <label>IP Address</label>
          <input type="text" name="ip" placeholder="1.2.3.4" required/>
          <label>Alasan (opsional)</label>
          <input type="text" name="reason" placeholder="Spam, abuse, dll" style="min-width:180px;"/>
          <button type="submit" class="btn btn-danger">[blocked] Blacklist</button>
        </div>
        <p style="font-size:11px;color:var(--text-faint);">IP yang diblacklist akan langsung mendapat 429 pada semua request LLM.</p>
      </form>
    </div>

    <div class="card">
      <div class="card-title">IP yang Diblacklist (${blacklistedIPs.length})</div>
      ${blacklistedIPs.length === 0 ? `
        <div class="empty-state">
          <p>[ok]</p>
          <p>Tidak ada IP yang diblacklist</p>
        </div>
      ` : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>IP Address</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${blacklistedIPs.map(ip => {
                const safeIp = esc(ip); // FIX BUG #3: escape IP dari KV
                return `<tr>
                  <td class="mono">${safeIp}</td>
                  <td><span class="badge badge-red">BLOCKED</span></td>
                  <td>
                    <form method="POST" action="/admin/blacklist/remove" style="display:inline;">
                      <input type="hidden" name="ip" value="${safeIp}"/>
                      <button type="submit" class="btn btn-success" style="font-size:11px;">[ok] Unblock</button>
                    </form>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <div class="card">
      <div class="card-title">Cara Kerja Blacklist</div>
      <p style="font-size:13px;color:var(--text-dim);line-height:1.8;">
        IP diblacklist disimpan di KV dengan key <span class="mono">blacklist:{ip}</span>.<br/>
        Setiap request LLM (<code style="color:var(--gold)">POST /api/interpret</code>) akan mengecek blacklist sebelum memproses.<br/>
        IP yang diblacklist langsung mendapat response 429 tanpa memakan kredit.
      </p>
    </div>
  `;

  return c.html(adminShell('[blocked] IP Blacklist', content, 'blacklist'));
});

// POST /admin/blacklist/add
admin.post('/blacklist/add', async (c) => {
  const body = await c.req.parseBody();
  const ip = (body['ip'] as string || '').trim();
  const reason = (body['reason'] as string || '').trim();
  const redirectTo = (body['redirect'] as string) || '/admin/blacklist';

  if (!ip) return c.redirect(`${redirectTo}?msg=IP+tidak+boleh+kosong&type=error`);

  try {
    const data = JSON.stringify({ reason, blacklistedAt: Date.now() });
    await c.env.RATE_LIMIT_KV.put(`blacklist:${ip}`, data);
    return c.redirect(`${redirectTo}?msg=IP+${encodeURIComponent(ip)}+berhasil+diblacklist&type=success`);
  } catch (e: any) {
    return c.redirect(`${redirectTo}?msg=Error:+${encodeURIComponent(e.message)}&type=error`);
  }
});

// POST /admin/blacklist/remove
admin.post('/blacklist/remove', async (c) => {
  const body = await c.req.parseBody();
  const ip = (body['ip'] as string || '').trim();
  const redirectTo = (body['redirect'] as string) || '/admin/blacklist';

  if (!ip) return c.redirect(`${redirectTo}?msg=IP+tidak+boleh+kosong&type=error`);

  try {
    await c.env.RATE_LIMIT_KV.delete(`blacklist:${ip}`);
    return c.redirect(`${redirectTo}?msg=IP+${encodeURIComponent(ip)}+berhasil+di-unblock&type=success`);
  } catch (e: any) {
    return c.redirect(`${redirectTo}?msg=Error:+${encodeURIComponent(e.message)}&type=error`);
  }
});

// ======================================
// -- PUBLIC API: GET /api/banner --
// (Ini di-export terpisah, di-mount di index.ts di luar /admin)
// ======================================

export async function getBannerPublic(env: AdminEnv): Promise<{ active: boolean; text: string; type: string } | null> {
  try {
    const raw = await env.RATE_LIMIT_KV.get('banner:active');
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.active) return null;
    return { active: true, text: data.text || '', type: data.type || 'info' };
  } catch { return null; }
}

export async function checkBlacklist(env: AdminEnv, ip: string): Promise<boolean> {
  return isBlacklisted(env, ip);
}

// ======================================
// -- RAMALAN LIVE (TikTok) --
// ======================================

// GET /admin/live - panel kontrol & panduan setup
admin.get('/live', async (c) => {
  const authErr = await requireAuth(c);
  if (authErr) return authErr;
  const msg = c.req.query('msg');
  const msgType = c.req.query('type') || 'success';
  const secretSet = Boolean((c.env as any).LIVE_SECRET);
  const renderState = await getRenderListenerState(c.env);
  const current = await getLiveDraw(c.env);
  const host = c.req.header('host') || 'domain-kamu.workers.dev';
  const overlayUrl = 'https://' + host + '/live';
  const service = renderState.service;
  const isStopped = service?.suspended === 'suspended';
  const renderConfigured = Boolean((c.env as any).RENDER_API_KEY);
  const statusHtml = !renderConfigured
    ? '<span class="badge badge-yellow">RENDER_API_KEY belum di-set</span>'
    : !renderState.ok ? '<span class="badge badge-red">[!] ERROR</span>'
    : isStopped ? '<span class="badge badge-red">[stop] STOPPED</span>'
    : '<span class="badge badge-green">> RUNNING</span>';

  const content = `
    ${msg ? `<div class="alert alert-${esc(msgType)}">${esc(msg)}</div>` : ''}
    <div class="card" style="border-color:var(--gold-dim);">
      <div class="card-title">Kontrol TikTok Listener</div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
        <div>
          <div style="font-size:18px;font-weight:700;">@jalurtarot</div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:4px;">Render: <span id="render-status">${statusHtml}</span></div>
          ${renderState.error ? `<div style="font-size:11px;color:var(--red);margin-top:6px;">${esc(renderState.error)}</div>` : ''}
        </div>
        <div style="display:flex;gap:.6rem;flex-wrap:wrap;">
          <form method="POST" action="/admin/live/render/start" onsubmit="return confirm('Nyalakan TikTok Listener di Render?')"><button class="btn btn-success" type="submit">> NYALAKAN</button></form>
          <form method="POST" action="/admin/live/render/stop" onsubmit="return confirm('Stop TikTok Listener di Render?')"><button class="btn btn-danger" type="submit">[stop] STOP</button></form>
          <form method="GET" action="/admin/live"><button class="btn btn-ghost" type="submit">(refresh) REFRESH</button></form>
        </div>
      </div>
      <div style="margin-top:1rem;padding-top:.8rem;border-top:1px solid var(--border);font-size:12px;color:var(--text-dim);line-height:1.6;">
        Listener hanya berjalan ketika kamu menekan <b>NYALAKAN</b>. Saat <b>STOP</b>, service Render di-suspend sehingga bot TikTok tidak berjalan.
      </div>
      ${!renderConfigured ? '<div class="alert alert-error" style="margin-top:1rem;margin-bottom:0;">Set secret Cloudflare <code>RENDER_API_KEY</code> terlebih dahulu.</div>' : ''}
    </div>

    <div class="card">
      <div class="card-title">1. Overlay OBS</div>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:0.75rem;">Tambahkan sebagai <b>Browser Source</b> di OBS/Streamlabs saat live TikTok. Latar transparan, otomatis update saat ada penarikan kartu baru. Bisa juga dibuka & di-<i>install</i> sebagai app terpisah di HP/tablet untuk layar kedua.</p>
      <div class="form-row"><input type="text" readonly value="${esc(overlayUrl)}" style="flex:1;min-width:260px;" onclick="this.select()"/><a href="/live" target="_blank" class="btn">-> Buka Overlay</a></div>
    </div>

    <div class="card">
      <div class="card-title">2. Bot Pendengar TikTok Live</div>
      <p style="font-size:13px;color:var(--text-dim);line-height:1.6;">Token trigger: ${secretSet ? '<span class="badge badge-green">LIVE_SECRET sudah di-set</span>' : '<span class="badge badge-red">LIVE_SECRET BELUM di-set</span>'}</p>
      ${!secretSet ? '<p style="font-size:12px;color:var(--yellow);margin-top:0.5rem;">Set <code>LIVE_SECRET</code> pada Worker dan environment listener Render.</p>' : ''}
      <p style="font-size:12px;color:var(--text-faint);margin-top:0.75rem;">Bot Node.js berada di folder <code>tiktok-listener/</code> dan menerima gift dari @jalurtarot.</p>
    </div>

    <div class="card">
      <div class="card-title">3. Coba Manual (tanpa TikTok)</div>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:0.75rem;">Simulasikan gift masuk untuk uji coba overlay sebelum live beneran.</p>
      <form method="POST" action="/admin/live/test-draw"><div class="form-row"><label>Susunan</label><select name="spreadId"><option value="single">1 Kartu</option><option value="three-card">3 Kartu</option></select><label>Username</label><input type="text" name="username" placeholder="@penonton" value="@tester"/><label>Nama Gift</label><input type="text" name="giftName" placeholder="Mawar" value="Mawar"/><button type="submit" class="btn btn-primary">[tarot] Tarik Kartu Sekarang</button></div></form>
    </div>

    <div class="card">
      <div class="card-title">Draw Terakhir</div>
      ${current ? `<p style="font-size:13px;color:var(--text-dim);"><b>${esc(current.username)}</b> - ${esc(current.spreadNameCn)}${current.giftName ? ` - gift: ${esc(current.giftName)}` : ''}<br/><span style="color:var(--text-faint);font-size:11px;">${new Date(current.createdAt).toLocaleString('id-ID')}</span></p><p style="font-size:13px;margin-top:0.5rem;white-space:pre-wrap;">${esc(current.cards.map((cc: any) => cc.nameCn + (cc.isReversed ? ' (terbalik)' : '')).join(' - '))}</p>` : '<div class="empty-state"><p>Belum ada penarikan kartu.</p></div>'}
    </div>
  `;
  return c.html(adminShell('Ramalan Live', content, 'live'));
});

admin.post('/live/render/start', async (c) => {
  const authErr = await requireAuth(c);
  if (authErr) return authErr;
  try {
    const service = await getRenderListener(c.env);
    if (service.suspended === 'suspended') await renderApiRequest(c.env, '/services/' + service.id + '/resume', { method: 'POST' });
    return c.redirect('/admin/live?msg=Listener+Render+berhasil+dinyalakan&type=success');
  } catch (e: any) {
    return c.redirect('/admin/live?msg=' + encodeURIComponent(String(e?.message || e)) + '&type=error');
  }
});

admin.post('/live/render/stop', async (c) => {
  const authErr = await requireAuth(c);
  if (authErr) return authErr;
  try {
    const service = await getRenderListener(c.env);
    if (service.suspended !== 'suspended') await renderApiRequest(c.env, '/services/' + service.id + '/suspend', { method: 'POST' });
    return c.redirect('/admin/live?msg=Listener+Render+berhasil+di-stop&type=success');
  } catch (e: any) {
    return c.redirect('/admin/live?msg=' + encodeURIComponent(String(e?.message || e)) + '&type=error');
  }
});

admin.post('/live/test-draw', async (c) => {
  const body = await c.req.parseBody();
  const spreadId: LiveSpreadId = body['spreadId'] === 'three-card' ? 'three-card' : 'single';
  const username = (body['username'] as string || '@tester').trim() || '@tester';
  const giftName = (body['giftName'] as string || '').trim() || undefined;

  const draw = generateLiveDraw(spreadId, username, giftName, giftName ? 1 : undefined);
  await saveLiveDraw(c.env, draw);

  return c.redirect('/admin/live?msg=Kartu+berhasil+ditarik&type=success');
});

export default admin;