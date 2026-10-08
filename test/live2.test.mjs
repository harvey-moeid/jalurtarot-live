import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { live2OverlayPage } from '../src/routes/live2.ts';

const scriptUrl = new URL('../public/live2.js', import.meta.url);
const cssUrl = new URL('../public/live2.css', import.meta.url);

test('LIVE 2 has a dedicated 9:16 overlay, assets and accessible labels', async () => {
  const [entry, html, css] = await Promise.all([
    readFile(new URL('../src/index.ts', import.meta.url), 'utf8'),
    Promise.resolve(live2OverlayPage()),
    readFile(cssUrl, 'utf8'),
  ]);
  assert.match(entry, /app\.get\('\/live2'/);
  assert.match(entry, /app\.get\('\/live'/, 'LIVE 1 route must remain intact');
  assert.match(html, /id="host3d"/);
  assert.match(html, /src="\/live2\.js"/);
  assert.match(html, /href="\/live2\.css"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(css, /background:transparent/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /max-aspect-ratio/);
});

test('browser script compiles and does not require external CDNs or public API secrets', async () => {
  const src = await readFile(scriptUrl, 'utf8');
  assert.doesNotThrow(() => new vm.Script(src));
  assert.match(src, /\/api\/live\/state/);
  assert.match(src, /lastId = id/);
  assert.match(src, /WebGL/);
  assert.match(src, /textContent/);
  assert.match(src, /\/\^\\\/cards\\\//);
  assert.doesNotMatch(src, /TIKTOK_CONNECTOR_API_KEY|TIKTOK_CONNECTOR_WEBHOOK_SECRET/);
  assert.doesNotMatch(src, /https?:\/\/(?:unpkg|jsdelivr|cdnjs|esm\.sh)/);
});

test('offline demo renders three distinct cards, one bubble and graceful WebGL fallback', async () => {
  const src = await readFile(scriptUrl, 'utf8');
  const elements = new Map();
  function element(tag) {
    return {
      tag, children: [], hidden: false, textContent: '', src: '', alt: '',
      className: '', attrs: {},
      classList: { values: new Set(), add(v) { this.values.add(v); }, remove(v) { this.values.delete(v); } },
      setAttribute(k,v) { this.attrs[k] = v; },
      append(...items) { this.children.push(...items); },
      appendChild(child) { this.children.push(child); },
      replaceChildren(...children) { this.children = [...children]; },
      getContext() { return null; },
    };
  }
  const ids = ['live2','reading','reading-cards','live-status','speech','speech-title',
    'speech-message','sound-toggle','host3d','viewer-label','reading-name',
    'reading-summary','reading-gift'];
  for (const id of ids) elements.set(id, element(id));
  const doc = {
    hidden: false,
    getElementById: (id) => elements.get(id),
    createElement: (tag) => element(tag),
    addEventListener() {},
  };
  const fake = {
    document: doc,
    window: { addEventListener() {} },
    location: { search: '?demo=1&background=1' },
    matchMedia: () => ({ matches: false }),
    URLSearchParams,
    setTimeout() { return 1; },
    clearTimeout() {},
  };
  assert.doesNotThrow(() => vm.runInNewContext(src, fake, { timeout: 2000 }));
  assert.equal(elements.get('reading').hidden, false);
  assert.equal(elements.get('reading-cards').children.length, 3);
  assert.match(elements.get('speech-title').textContent, /@penonton/);
  assert.match(elements.get('speech-message').textContent, /Dengarkan suara hatimu/);
  assert.equal(elements.get('reading-cards').children[0].children[0].src, '/cards/major/18-moon.jpg');
  assert.ok(elements.get('live2').classList.values.has('with-background'));
  assert.ok(elements.get('live2').classList.values.has('no-webgl'));
});
