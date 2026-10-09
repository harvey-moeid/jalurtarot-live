import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { live2OverlayPage } from '../src/routes/live2.ts';

const css = await readFile(new URL('../public/live2.css', import.meta.url), 'utf8');
const js = await readFile(new URL('../public/live2.js', import.meta.url), 'utf8');

function block(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(escaped + '\\s*\\{([^}]+)\\}'));
  assert.ok(match, 'missing CSS selector ' + selector);
  return match[1];
}

test('portrait places host + bubble above result and CTA in dedicated grid rows', () => {
  assert.match(block('.live2'), /display:\s*grid/);
  assert.match(block('.live2'), /grid-template-columns:minmax\(0,1fr\)/);
  assert.match(block('.live2'), /grid-template-rows:minmax\(0,9fr\) minmax\(0,45fr\) minmax\(0,30fr\) minmax\(0,16fr\)/);
  for (const area of ['.host', '.speech']) {
    assert.match(block(area), /grid-column:1;grid-row:2/);
  }
  assert.match(block('.reading'), /grid-column:1;grid-row:3/);
  assert.match(block('.footer'), /grid-column:1;grid-row:4/);
  assert.match(block('.reading'), /overflow:hidden/);
  assert.match(block('.footer'), /min-height:0/);
});

test('landscape allocates a right character stage, left reading and full-width footer', () => {
  const landscape = css.slice(css.indexOf('@media (min-aspect-ratio:1/1)'));
  assert.match(landscape, /grid-template-columns:minmax\(0,52fr\) minmax\(0,48fr\)/);
  assert.match(landscape, /\.host\{grid-row:2;grid-column:2/);
  assert.match(landscape, /\.speech\{grid-row:2;grid-column:1/);
  assert.match(landscape, /\.reading\{grid-row:2;grid-column:1/);
  assert.match(landscape, /\.footer\{grid-row:3;grid-column:1\/-1/);
  assert.match(landscape, /\.footer>p\{display:none\}/);
});

test('small portrait and short landscape preserve text while reducing decoration', () => {
  assert.match(css, /@media \(max-aspect-ratio:3\/5\)/);
  assert.match(css, /@media \(max-height:740px\)/);
  assert.match(css, /@media \(max-height:480px\) and \(min-aspect-ratio:1\/1\)/);
  assert.match(css, /\.reading__eyebrow\{display:none\}/);
  assert.match(css, /\.footer__cta small\{display:none\}/);
  assert.match(css, /\.host__portrait\{height:92%/);
});

test('results keep a real flexing area for up to three cards and an interpretation', () => {
  assert.match(block('.reading'), /display:\s*grid/);
  assert.match(block('.reading'), /minmax\(0,1fr\)\s+auto/);
  assert.match(block('.reading__cards'), /min-height:\s*0/);
  assert.match(block('.reading__interpretation'), /border-top:/);
  assert.ok(css.includes('.reading__cards:has(.tarot-card:nth-child(2))'));
  assert.match(css, /\.reading\[hidden\]\s*\{\s*display:\s*none\s*!important/);
});

test('stage supports transparent OBS, 9:16, short phone, desktop and reduce-motion modes', () => {
  assert.match(block('.live2'), /background:\s*transparent/);
  assert.match(css, /\.live2\.with-background/);
  assert.match(css, /@media\s*\(max-aspect-ratio:\s*3\/5\)/);
  assert.match(css, /@media\s*\(max-height:\s*740px\)/);
  assert.match(css, /@media\s*\(min-aspect-ratio:\s*1\/1\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(block('.footer__viewer span:last-child'), /text-overflow:\s*ellipsis/);
  assert.match(css, /\.no-webgl\s+\.host__fallback/);
});

test('bubble has a capped preview while card reading keeps the complete interpretation', () => {
  assert.match(js, /speechMessage\.textContent\s*=\s*line/);
  assert.match(js, /reading-summary'\)\.textContent\s*=\s*brief\(draw\.summary \|\| message, 145\)/);
  assert.match(js, /brief\(username,\s*23\)/);
  const html = live2OverlayPage();
  assert.match(html, /id="reading-summary"/);
  assert.match(html, /id="speech-message"/);
  assert.match(html, /id="speech-progress"/);
  assert.match(html, /id="host3d"/);
  assert.match(html, /id="reading-cards"/);
});


test('illustrated host remains contained in portrait, landscape and reduced motion', () => {
  const html = live2OverlayPage();
  assert.match(html, /id="host-portrait"/);
  assert.match(html, /jalur-tarot-host\.svg/);
  assert.match(css, /\.host__portrait\{/);
  assert.match(css, /\.host\.is-illustrated canvas\{display:none\}/);
  assert.match(css, /\.host\.is-reading \.host__portrait/);
  assert.match(css, /prefers-reduced-motion:reduce\)\{[\s\S]*?\.host__portrait\{animation:none!important/);
});
