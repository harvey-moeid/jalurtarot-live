import { Hono } from 'hono';
import api, { type Env } from './routes/api';
import admin, { getBannerPublic } from './routes/admin';
import { homePage } from './routes/home';
import { dailyPage, dailyCardData } from './routes/daily';
import { libraryPage } from './routes/library';
import { historyPage } from './routes/history';
import { readingPage } from './routes/reading';
import { supportPage } from './routes/support';
import live, { liveOverlayPage, type LiveEnv } from './routes/live';

const app = new Hono<{ Bindings: LiveEnv }>();

app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('X-Frame-Options', 'SAMEORIGIN');
  if (c.req.path.startsWith('/admin')) c.header('Cache-Control', 'no-store');
});

// -- API routes --
app.route('/api', api);

// Ramalan Live - trigger dari bot TikTok listener + polling state
app.route('/api/live', live);

// -- Admin panel --
app.route('/admin', admin);

// -- Daily card data endpoint --
// Gunakan ?date=YYYY-MM-DD dari client (timezone lokal user)
app.get('/api/daily-card', (c) => {
  const date = c.req.query('date');
  return c.json(dailyCardData(date));
});

// -- GET /api/banner - publik, untuk frontend fetch banner aktif --
app.get('/api/banner', async (c) => {
  const banner = await getBannerPublic(c.env as any);
  if (!banner) return c.json({ active: false });
  return c.json(banner);
});

// -- Page routes --
app.get('/', (c) => c.html(homePage()));
// Kirim CF-Timezone header ke dailyPage agar SSR pakai timezone user
app.get('/daily', (c) => {
  const tz = c.req.header('CF-Timezone') || 'Asia/Jakarta';
  return c.html(dailyPage(tz));
});
app.get('/library', (c) => c.html(libraryPage()));
app.get('/history', (c) => c.html(historyPage()));
app.get('/reading', (c) => c.html(readingPage()));
app.get('/support', (c) => c.html(supportPage()));

// Overlay OBS untuk Ramalan Live (transparan, dipakai sebagai Browser Source)
app.get('/live', (c) => c.html(liveOverlayPage()));

// ââ 404 ââ
app.notFound((c) => {
  return c.html(`<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"/><title>404 - Jalur Tarot</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500&family=Cinzel+Decorative:wght@400&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet"/>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#050507;color:#cac4b5;font-family:'Cormorant Garamond',serif;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;}</style>
</head>
<body>
<div>
  <p style="font-family:'Cinzel',serif;font-size:5rem;color:#c8a84b;margin-bottom:1rem;">404</p>
  <p style="font-family:'Cinzel',serif;font-size:1rem;letter-spacing:0.25em;color:#ede8de;margin-bottom:0.5rem;">HALAMAN TIDAK DITEMUKAN</p>
  <p style="font-style:italic;color:#8a857a;margin-bottom:2rem;">Kartu yang kamu cari telah kembali ke dek.</p>
  <a href="/" style="font-family:'Cinzel',serif;font-size:0.8rem;letter-spacing:0.2em;color:#c8a84b;border:1px solid #3a2e12;padding:0.75rem 2rem;text-decoration:none;"><- Kembali ke Beranda</a>
</div>
</body>
</html>`, 404);
});

export default app;