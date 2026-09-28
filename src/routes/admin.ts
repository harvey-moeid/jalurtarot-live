import { Hono } from 'hono';
import type { Env } from './api';
import { generateLiveDraw, saveLiveDraw, getLiveDraw, type LiveSpreadId } from '../lib/live';

import type { AdminEnv } from '../middleware/adminAuth';
import { adminAuth, getAdminPassword, isLoginRateLimited, recordFailedLogin, clearLoginFailures, createAdminSession, destroyAdminSession } from '../middleware/adminAuth';

const admin = new Hono<{ Bindings: AdminEnv }>();
admin.use('*', adminAuth);




// ======================================
// -- AUTH HELPERS --
// ======================================

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

async function isBlacklisted(env: AdminEnv, ip: string): Promise<boolean> {
  try { return (await env.RATE_LIMIT_KV.get(`blacklist:${ip}`)) !== null; } catch { return false; }
}

async function listBlacklistEntries(env: AdminEnv): Promise<string[]> {
  try { return (await env.RATE_LIMIT_KV.list({ prefix: 'blacklist:' })).keys.map(k => k.name.replace('blacklist:', '')); } catch { return []; }
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

// ======================================
// -- HTML HELPERS --
// ======================================

function adminShell(title: string, content: string, activePage: string = ''): string {
  const nav = [
    { href: '/admin', label: '[dashboard] Dashboard', id: 'dashboard' },
    { href: '/admin/live', label: '[live] Live', id: 'live' },
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
  const token = await createAdminSession(c);

  const res = c.redirect('/admin');
  res.headers.set('Set-Cookie',
    `admin_token=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ADMIN_SESSION_TTL_SECONDS}`
  );
  return res;
});

// POST /admin/logout
admin.post('/logout', async (c) => {
  await destroyAdminSession(c);
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
  const blacklistedEntries = await listBlacklistEntries(c.env);
  const blacklistedCount = blacklistedEntries.length;

  const content = `
    ${banner?.active ? `<div class="alert alert-info">[banner] Banner aktif: "${esc(banner.text)}"</div>` : ''}
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-label">IP Blacklisted</div>
        <div class="stat-value">${blacklistedCount}</div>
        <div class="stat-sub">diblokir</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Quick Links</div>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
        <a href="/admin/live" class="btn btn-ghost">[live] Kontrol Live</a>
        <a href="/admin/banner" class="btn btn-ghost">[banner] Kelola Banner</a>
        <a href="/admin/blacklist" class="btn btn-ghost">[blocked] Kelola Blacklist</a>
      </div>
    </div>>
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