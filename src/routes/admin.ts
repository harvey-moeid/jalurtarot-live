// @ts-nocheck
import { Hono } from 'hono';
import { generateLiveDraw, saveLiveDraw, getLiveDraw, type LiveSpreadId } from '../lib/live';
import { connectorConfigured, getConnectorStatus } from '../lib/tiktokConnector';
import { getLiveSettings, parseLiveSettingsForm, saveLiveSettings } from '../lib/liveSettings';
import { getLiveAudioSettings, parseLiveAudioForm, saveLiveAudioSettings } from '../lib/liveAudioSettings';

import type { AdminEnv } from '../middleware/adminAuth';
import { adminAuth, getAdminPassword, isAuthenticated, isLoginRateLimited, recordFailedLogin, clearLoginFailures, createAdminSession, destroyAdminSession, ADMIN_SESSION_TTL_SECONDS } from '../middleware/adminAuth';

const admin = new Hono<{ Bindings: AdminEnv }>();
admin.use('*', adminAuth as any);




// ======================================
// -- AUTH HELPERS --
// ======================================

// -- SHARED TIKTOK CONNECTOR STATUS --
async function getTikTokConnectorState(env: AdminEnv): Promise<{ ok: boolean; data?: any; error?: string }> {
  if (!connectorConfigured(env as any)) {
    return { ok: false, error: 'TIKTOK_CONNECTOR_API_KEY belum di-set.' };
  }
  try { return { ok: true, data: await getConnectorStatus(env as any) }; }
  catch (e: any) { return { ok: false, error: String(e?.message || e) }; }
}

// ======================================
// -- KV HELPERS --
// ======================================

async function getBanner(env: AdminEnv): Promise<{ active: boolean; text: string; type: string } | null> {
  try {
    const raw = await env.RATE_LIMIT_KV.get('banner:active');
    return raw ? JSON.parse(raw) : null;
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

// ======================================
// -- HTML HELPERS --
// ======================================

function adminShell(title: string, content: string, activePage: string = ''): string {
  const nav = [
    { href: '/admin/live', label: '[live] Live', id: 'live' },
    { href: '/admin/audio', label: '[audio] Audio & TTS', id: 'audio' },
    { href: '/admin/banner', label: '[banner] Banner', id: 'banner' },
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
admin.get('/login', async (c) => {
  const error = c.req.query('error');
  // Jika sudah login, redirect langsung ke dashboard
  if (await isAuthenticated(c)) {
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
    ${error ? `
    <div class="alert alert-error">[!] Password salah atau konfigurasi admin belum lengkap.</div>` : ''}
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

// Admin utama hanya mengelola fitur website yang benar-benar aktif.
admin.get('/', (c) => c.redirect('/admin/live'));

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

// ======================================
// -- RAMALAN LIVE (TikTok) --
// ======================================

// GET /admin/live - panel kontrol & panduan setup
admin.get('/live', async (c) => {
  const msg = c.req.query('msg');
  const msgType = c.req.query('type') || 'success';
  const connectorState = await getTikTokConnectorState(c.env);
  let settings;
  try { settings = await getLiveSettings(c.env); }
  catch (error: any) { return c.html(adminShell('Ramalan Live', '<div class="alert alert-error">Pengaturan LIVE gagal dibaca: ' + esc(String(error?.message || error)) + '</div>', 'live'), 503); }
  const current = await getLiveDraw(c.env);
  const host = c.req.header('host') || 'domain-kamu.workers.dev';
  const overlayUrl = 'https://' + host + '/live';
  const webhookUrl = 'https://' + host + '/api/live/connector-webhook?secret=YOUR_WEBHOOK_SECRET';
  const connector = connectorState.data || {};
  const running = connector.running === true;
  const configured = connectorConfigured(c.env as any);
  const webhookConfigured = Boolean((c.env as any).TIKTOK_CONNECTOR_WEBHOOK_SECRET);

  const statusHtml = !configured
    ? '<span class="badge badge-yellow">API KEY BELUM DI-SET</span>'
    : !connectorState.ok
      ? '<span class="badge badge-red">[!] ERROR</span>'
      : running
        ? '<span class="badge badge-green">LIVE CONNECTED</span>'
        : '<span class="badge badge-yellow">' + esc(String(connector.status || 'DISCONNECTED')) + '</span>';

  const stats = connector.stats || {};
  const content = `
    ${msg ? `<div class="alert alert-${esc(msgType)}">${esc(msg)}</div>` : ''}

    <div class="card" style="border-color:var(--gold-dim);">
      <div class="card-title">tiktok-live-konektor</div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
        <div>
          <div style="font-size:18px;font-weight:700;">@${esc(String(connector.username || 'jalurtarot'))}</div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:4px;">Status: ${statusHtml}</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:6px;">Room ID: ${esc(String(connector.roomId || '-'))} · Event terakhir: ${esc(String(connector.lastEventAt || '-'))}</div>
          ${connectorState.error ? `<div style="font-size:11px;color:var(--red);margin-top:6px;">${esc(connectorState.error)}</div>` : ''}
        </div>
        <form method="GET" action="/admin/live"><button class="btn btn-ghost" type="submit">(refresh) REFRESH</button></form>
      </div>
      <div class="stats-row" style="margin-top:1rem;margin-bottom:0;">
        <div class="stat-box"><div class="stat-label">Chat</div><div class="stat-value">${Number(stats.chat || 0)}</div></div>
        <div class="stat-box"><div class="stat-label">Likes</div><div class="stat-value">${Number(stats.likes || 0)}</div></div>
        <div class="stat-box"><div class="stat-label">Gifts</div><div class="stat-value">${Number(stats.gifts || 0)}</div></div>
        <div class="stat-box"><div class="stat-label">Viewers</div><div class="stat-value">${Number(stats.viewerCount || 0)}</div></div>
      </div>
      <div style="margin-top:1rem;padding-top:.8rem;border-top:1px solid var(--border);font-size:12px;color:var(--text-dim);line-height:1.6;">
        START/STOP TikTok tetap dilakukan dari dashboard <code>tiktok-live-konektor</code>. Repo ini hanya menjadi consumer, jadi tidak membuat koneksi TikTok kedua.
      </div>
    </div>


    <div class="card">
      <div class="card-title">Pengaturan Otomatis Gift &amp; Like</div>
      <p style="font-size:13px;color:var(--text-dim);line-height:1.6;margin-bottom:1rem;">
        Disimpan permanen di Cloudflare KV. Perubahan berlaku tanpa deploy; propagasi antar lokasi dapat tertunda.
      </p>
      <form method="POST" action="/admin/live/settings">
        <div class="form-row">
          <label style="display:flex;align-items:center;gap:.5rem;"><input type="checkbox" name="giftEnabled" ${settings.giftEnabled ? 'checked' : ''}/> Aktifkan ramalan gift</label>
        </div>
        <div class="form-row">
          <label for="targetGiftName">Gift yang diterima</label>
          <input id="targetGiftName" name="targetGiftName" type="text" maxlength="80" value="${esc(settings.targetGiftName)}" required/>
          <small style="color:var(--text-faint);">Gunakan * untuk semua gift</small>
        </div>
        <div class="form-row">
          <label for="minGiftValue">Minimal nilai gift (koin)</label>
          <input id="minGiftValue" name="minGiftValue" type="number" min="0" max="1000000" step="1" value="${settings.minGiftValue}" required/>
          <label for="threeCardMinValue">Minimal gift untuk 3 kartu (koin)</label>
          <input id="threeCardMinValue" name="threeCardMinValue" type="number" min="1" max="1000000" step="1" value="${settings.threeCardMinValue}" required/>
        </div>
        <div class="form-row">
          <label for="defaultSpread">Susunan default gift</label>
          <select id="defaultSpread" name="defaultSpread">
            <option value="single" ${settings.defaultSpread === 'single' ? 'selected' : ''}>1 Kartu</option>
            <option value="three-card" ${settings.defaultSpread === 'three-card' ? 'selected' : ''}>3 Kartu</option>
          </select>
        </div>
        <hr style="border:0;border-top:1px solid var(--border);margin:1.25rem 0;"/>
        <div class="form-row">
          <label style="display:flex;align-items:center;gap:.5rem;"><input type="checkbox" name="likeEnabled" ${settings.likeEnabled ? 'checked' : ''}/> Aktifkan ramalan berdasarkan like</label>
        </div>
        <div class="form-row">
          <label for="likeMilestone">Setiap jumlah like</label>
          <input id="likeMilestone" name="likeMilestone" type="number" min="1" max="1000000" step="1" value="${settings.likeMilestone}" required/>
          <label for="likeSpread">Jumlah kartu</label>
          <select id="likeSpread" name="likeSpread">
            <option value="single" ${settings.likeSpread === 'single' ? 'selected' : ''}>1 Kartu</option>
            <option value="three-card" ${settings.likeSpread === 'three-card' ? 'selected' : ''}>3 Kartu</option>
          </select>
        </div>
        <p style="font-size:12px;color:var(--text-dim);line-height:1.5;margin:1rem 0;">
          Like dihitung dari total room TikTok (jika tersedia), atau penjumlahan event dari konektor.
          Satu event yang melewati beberapa batas hanya memicu satu ramalan. Webhook sebaiknya menerima chat, gift, dan like.
          Untuk traffic tinggi, counter KV bersifat best-effort.
        </p>
        <button type="submit" class="btn btn-primary">Simpan Pengaturan LIVE</button>
      </form>
    </div>

    <div class="card">
      <div class="card-title">Integrasi Realtime</div>
      <p style="font-size:13px;color:var(--text-dim);line-height:1.7;">
        REST status/feed memakai <code>TIKTOK_CONNECTOR_API_KEY</code> secara server-side.
        Gift dan like realtime sebaiknya dikirim dari webhook tiktok-live-konektor ke URL di bawah.
        Bila webhook belum dipasang, overlay mencoba fallback sync gift dan like dari REST API (best-effort).
      </p>
      <div class="form-row" style="margin-top:.75rem;"><input type="text" readonly value="${esc(webhookUrl)}" style="flex:1;min-width:260px;" onclick="this.select()"/></div>
      <p style="font-size:12px;color:var(--text-dim);">Webhook secret: ${webhookConfigured ? '<span class="badge badge-green">configured</span>' : '<span class="badge badge-red">belum di-set</span>'}</p>
    </div>

    <div class="card">
      <div class="card-title">Overlay OBS</div><p style="margin:10px 0"><a href="/admin/audio" class="btn btn-primary">🔊 Pengaturan Audio &amp; TTS</a></p>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:0.75rem;">Browser Source tetap memakai overlay yang sama dan otomatis membaca draw terbaru.</p>
      <div class="form-row"><input type="text" readonly value="${esc(overlayUrl)}" style="flex:1;min-width:260px;" onclick="this.select()"/><a href="/live" target="_blank" class="btn">-> Buka Overlay</a></div>
    </div>

    <div class="card">
      <div class="card-title">Coba Manual (tanpa TikTok)</div>
      <form method="POST" action="/admin/live/test-draw"><div class="form-row">
         <label>Susunan</label><select name="spreadId"><option value="single">1 Kartu</option><option value="three-card">3 Kartu</option></select>
         <label>Username</label><input type="text" name="username" value="@tester" maxlength="64"/>
         <label>Nama Gift</label><input type="text" name="giftName" value="Mawar" maxlength="80"/>
         <label>Topik Demo</label><select name="topic"><option value="cinta">Cinta</option><option value="nasib">Nasib</option><option value="karir">Karir</option></select>
         <label>Komentar Demo</label><input type="text" name="question" value="Bagaimana cinta aku ke depan?" maxlength="160"/>
         <button type="submit" class="btn btn-primary">[tarot] Tarik Kartu Sekarang</button>
         </div></form>
    </div>

    <div class="card">
      <div class="card-title">Draw Terakhir</div>
      ${current ? `<p style="font-size:13px;color:var(--text-dim);"><b>${esc(current.username)}</b> - ${esc(current.spreadNameCn)}${current.giftName ? ` - gift: ${esc(current.giftName)}` : ''}<br/><span style="color:var(--text-faint);font-size:11px;">${new Date(current.createdAt).toLocaleString('id-ID')}</span></p><p style="font-size:13px;margin-top:0.5rem;white-space:pre-wrap;">${esc(current.cards.map((cc: any) => cc.nameCn + (cc.isReversed ? ' (terbalik)' : '')).join(' - '))}</p>` : '<div class="empty-state"><p>Belum ada penarikan kartu.</p></div>'}
    </div>
  `;
  return c.html(adminShell('Ramalan Live', content, 'live'));
});

// Audio panel: same authenticated admin middleware as all other routes.
admin.get('/audio', async (c) => {
  let a;
  try { a = await getLiveAudioSettings(c.env); }
  catch (e: any) {
    return c.html(adminShell('Audio & TTS', '<div class="alert alert-error">' + esc(String(e?.message || e)) + '</div>', 'audio'), 503);
  }
  const msg = c.req.query('msg');
  const status = c.req.query('type') === 'error' ? 'error' : 'success';
  const mark = (b: boolean) => b ? 'checked' : '';
  const controls = [
    { id: 'rate', label: 'Kecepatan suara (0.5–1.5)', min: '0.5', max: '1.5' },
    { id: 'pitch', label: 'Pitch suara (0.5–1.8)', min: '0.5', max: '1.8' },
    { id: 'volume', label: 'Volume TTS (0–1)', min: '0', max: '1' },
    { id: 'sfxVolume', label: 'Volume efek (0–1)', min: '0', max: '1' },
    { id: 'ambientVolume', label: 'Volume latar (0–0.35)', min: '0', max: '0.35' },
  ];
  const field = (id: string) => {
    const x = controls.find(x => x.id === id)!;
    return '<label for="' + id + '">' + x.label + '</label><input id="' + id + '" name="' + id
      + '" type="number" required step="0.01" min="' + x.min + '" max="' + x.max + '" value="' + a[id] + '"/>';
  };
  const toggle = (name: string, label: string) => '<label style="display:flex;gap:.65rem;align-items:center;"><input type="checkbox" name="' + name
    + '" ' + mark(a[name]) + '/> ' + label + '</label>';
  const content = \`
    \${msg ? '<div class="alert alert-' + status + '">' + esc(msg) + '</div>' : ''}
    <div class="card" style="border-color:var(--gold-dim)">
      <div class="card-title">🔊 Pengaturan Audio &amp; TTS</div>
      <p style="font-size:13px;line-height:1.7;color:var(--text-dim);margin-bottom:1rem">
        Berlaku untuk LIVE 1 dan LIVE 2. Disimpan di Cloudflare KV; OBS menyegarkan pengaturan otomatis
        sekitar 30 detik sekali (propagasi antar lokasi bisa lebih lama). Tidak membutuhkan API key TTS.
      </p>
      <form method="POST" action="/admin/audio/settings">
        <div class="form-row">
          \${toggle('live1Tts', 'Aktifkan pembaca ramalan LIVE 1')}
          \${toggle('live2Tts', 'Aktifkan pembaca ramalan LIVE 2')}
          <small style="color:var(--text-dim)">Bacaan otomatis setelah gift/target like. ?voice=1 memaksa ON; ?voice=0 memaksa OFF untuk URL OBS tersebut. Gunakan URL biasa agar mengikuti admin.</small>
        </div>
        <div class="form-row">
          <label for="voice">Jenis suara</label>
          <select name="voice" id="voice">
            <option value="female" \${a.voice === 'female' ? 'selected' : ''}>Prioritaskan suara perempuan Indonesia</option>
            <option value="default" \${a.voice === 'default' ? 'selected' : ''}>Suara Indonesia default browser</option>
          </select>
          <small style="color:var(--text-dim)">Pilihan suara tergantung TTS yang terpasang di perangkat/OBS; tidak selalu tersedia suara perempuan.</small>
          \${field('rate')}\${field('pitch')}\${field('volume')}
          <button class="btn btn-ghost" id="test-voice" type="button">▶ Tes suara di browser admin</button>
        </div>
        <hr style="border:0;border-top:1px solid var(--border);margin:1.25rem 0;"/>
        <div class="form-row">
          \${toggle('giftSound', 'Efek suara saat gift diterima')}
          \${toggle('likeSound', 'Efek suara saat target like tercapai')}
          \${field('sfxVolume')}
          \${toggle('ambient', 'Latar magis ambient sintetis (tanpa file musik)')}
          \${field('ambientVolume')}
          <small style="color:var(--text-dim)">OBS dapat memblokir autoplay. Gunakan tombol suara di overlay dan aktifkan Control audio via OBS. Suara ambient dan efek dibuat secara lokal menggunakan Web Audio.</small>
        </div>
        <button type="submit" class="btn btn-primary">Simpan Pengaturan Audio</button>
      </form>
    </div>
    <div class="card">
      <div class="card-title">Preview &amp; URL OBS</div>
      <div class="form-row"><label>LIVE 1</label><input readonly value="/live" onclick="this.select()"/><a href="/live?demo=1" target="_blank" rel="noopener" class="btn">Preview</a></div>
      <div class="form-row"><label>LIVE 2</label><input readonly value="/live2" onclick="this.select()"/><a href="/live2?demo=1" target="_blank" rel="noopener" class="btn">Preview</a></div>
    </div>
    <script>
      document.getElementById('test-voice').onclick = function () {
        if (!('speechSynthesis' in window)) { alert('TTS tidak didukung browser.'); return; }
        speechSynthesis.cancel();
        var sample = new SpeechSynthesisUtterance('Halo, selamat datang di Jalur Tarot. Mari kita lihat pesan kartu hari ini.');
        sample.lang = 'id-ID';
        sample.rate = Number(document.getElementById('rate').value);
        sample.pitch = Number(document.getElementById('pitch').value);
        sample.volume = Number(document.getElementById('volume').value);
        var voices = speechSynthesis.getVoices().filter(function (v) { return /^id[-_]/i.test(v.lang); });
        var preferred = document.getElementById('voice').value === 'female' ? voices.find(function (v) {
          return /female|wanita|perempuan|gadis|damayanti|dewi|siti|google bahasa indonesia/i.test(v.name);
        }) : null;
        if (preferred || voices[0]) sample.voice = preferred || voices[0];
        speechSynthesis.speak(sample);
      };
    </script>\`;
  return c.html(adminShell('Audio & TTS', content, 'audio'));
});

admin.post('/audio/settings', async (c) => {
  const origin = c.req.header('Origin');
  if (!origin || origin !== new URL(c.req.url).origin) return c.text('Origin tidak diizinkan.', 403);
  try {
    const form = await c.req.parseBody();
    await saveLiveAudioSettings(c.env, parseLiveAudioForm(form as Record<string, unknown>));
    return c.redirect('/admin/audio?msg=Pengaturan+audio+berhasil+disimpan&type=success', 303);
  } catch (e: any) {
    return c.redirect('/admin/audio?type=error&msg=' + encodeURIComponent(String(e?.message || e).slice(0, 160)), 303);
  }
});

admin.post('/live/settings', async (c) => {
  // Browser form same-origin only. Sesi admin tetap diperiksa oleh adminAuth.
  const origin = c.req.header('Origin');
  if (!origin || origin !== new URL(c.req.url).origin) {
    return c.text('Origin tidak diizinkan.', 403);
  }
  try {
    const form = await c.req.parseBody();
    const settings = parseLiveSettingsForm(form as Record<string, unknown>);
    await saveLiveSettings(c.env, settings);
    return c.redirect('/admin/live?msg=Pengaturan+LIVE+berhasil+disimpan&type=success', 303);
  } catch (error: any) {
    const msg = String(error?.message || error);
    return c.redirect('/admin/live?msg=' + encodeURIComponent(msg.slice(0, 180)) + '&type=error', 303);
  }
});

admin.post('/live/test-draw', async (c) => {
  const body = await c.req.parseBody();
  const spreadId: LiveSpreadId = body['spreadId'] === 'three-card' ? 'three-card' : 'single';
  const username = (body['username'] as string || '@tester').trim() || '@tester';
  const giftName = (body['giftName'] as string || '').trim() || undefined;

  const rawTopic = String(body['topic'] || '');
  const topic = rawTopic === 'cinta' || rawTopic === 'nasib' || rawTopic === 'karir' ? rawTopic : undefined;
  const question = String(body['question'] || '').trim().replace(/[<>\\u0000-\\u001f]/g, ' ').slice(0, 160);
  const draw = generateLiveDraw(spreadId, username, giftName, giftName ? 1 : undefined,
    'gift', topic ? { topic, question } : undefined);
  const saved = await saveLiveDraw(c.env, draw);
  if (!saved) return c.redirect('/admin/live?msg=Gagal+menyimpan+draw+ke+KV&type=error');

  return c.redirect('/admin/live?msg=Kartu+berhasil+ditarik&type=success');
});

export default admin;
