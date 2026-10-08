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

function percent(selector, key) {
  const found = block(selector).match(new RegExp('(?:^|;)\\s*' + key + ':\\s*([\\d.]+)%'));
  assert.ok(found, selector + ' needs an explicit ' + key + ' percentage');
  return Number(found[1]);
}

test('mobile portrait overlay allocates disjoint result and footer zones', () => {
  const hostBottom = percent('.host', 'top') + percent('.host', 'height');
  const resultTop = percent('.reading', 'top');
  const resultBottom = resultTop + percent('.reading', 'height');
  const footerTop = percent('.footer', 'top');
  assert.ok(hostBottom <= resultTop, 'character must end before results');
  assert.ok(resultBottom < footerTop, 'ticker must start below the card');
  assert.ok(percent('.speech', 'top') + percent('.speech', 'max-height') < resultTop,
    'speech must stay inside the upper stage');
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
  assert.match(css, /@media\s*\(max-height:\s*680px\)/);
  assert.match(css, /@media\s*\(min-aspect-ratio:\s*1\/1\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(block('.footer__viewer span:last-child'), /text-overflow:\s*ellipsis/);
  assert.match(css, /\.no-webgl\s+\.host__fallback/);
});

test('bubble has a capped preview while card reading keeps the complete interpretation', () => {
  assert.match(js, /speechMessage\.textContent\s*=\s*brief\(message,\s*115\)/);
  assert.match(js, /reading-summary'\)\.textContent\s*=\s*message/);
  assert.match(js, /brief\(username,\s*23\)/);
  const html = live2OverlayPage();
  assert.match(html, /id="reading-summary"/);
  assert.match(html, /id="speech-message"/);
  assert.match(html, /id="host3d"/);
  assert.match(html, /id="reading-cards"/);
});
