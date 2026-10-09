import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const [markup, css, script] = await Promise.all([
  readFile(new URL('../src/routes/live.ts', import.meta.url), 'utf8'),
  readFile(new URL('../public/live1.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/live1.js', import.meta.url), 'utf8'),
]);

class Node {
  constructor(name = 'div') {
    this.name = name; this.children = []; this.className = '';
    this.textContent = ''; this.hidden = false;
    this.scrollHeight = 1200; this.clientHeight = 250; this.scrollTop = 0;
    this.offsetWidth = 300; this.src = ''; this.alt = ''; this.attrs = {};
    const values = new Set();
    this.classList = {
      add: key => values.add(key), remove: key => values.delete(key),
      contains: key => values.has(key),
      toggle: (key, enabled) => {
        if (enabled === undefined) enabled = !values.has(key);
        if (enabled) values.add(key); else values.delete(key);
        return enabled;
      },
    };
  }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, val) { this.attrs[key] = String(val); }
  addEventListener() {}
}
function mount(search, data = null, motion = false) {
  const ids = ['stage', 'idle-screen', 'viewer', 'gift', 'topic', 'cards-row', 'question',
    'summary', 'summary-scroll', 'story-title', 'debug-state'];
  const elements = new Map(ids.map(id => [id, new Node()]));
  const timeouts = [];
  let networkCount = 0;
  const document = {
    hidden: false,
    getElementById: id => elements.get(id),
    createElement: name => new Node(name),
    addEventListener() {},
  };
  const state = { elements, timeouts, get networkCount() { return networkCount; } };
  const fake = {
    document, location: { search }, URLSearchParams,
    Date, AbortController,
    setTimeout: (fn, ms) => { timeouts.push({ fn, ms }); return timeouts.length; },
    clearTimeout() {},
    matchMedia: () => ({ matches: motion }),
    fetch: async () => {
      networkCount++;
      return { ok: true, json: async () => ({ draw: data }) };
    },
  };
  assert.doesNotThrow(() => vm.runInNewContext(script, fake, { timeout: 2000 }));
  return state;
}

test('LIVE 1 uses independent local assets with accessible story and card panels', () => {
  assert.match(markup, /href="\/live1\.css\?v=20261010-1"/);
  assert.match(markup, /src="\/live1\.js\?v=20261010-1"/);
  for (const id of ['stage', 'idle-screen', 'cards-row', 'summary-scroll', 'summary', 'question', 'topic']) {
    assert.ok(markup.includes('id="' + id + '"'), 'missing ' + id);
  }
  assert.match(markup, /aria-label="Bacaan tarot lengkap, dapat digulir"/);
  assert.doesNotMatch(markup.slice(markup.indexOf('export function liveOverlayPage')), /<script>[\s\S]*?fetch\(/);
});

test('portrait and landscape keep separate card/story areas with scrollable uncut narration', () => {
  assert.match(css, /#stage\{[^}]*display:none;grid-template-rows:auto minmax\(0,1fr\) auto/);
  assert.match(css, /\.reading-layout\{[^}]*grid-template-rows:minmax\(0,47fr\) minmax\(0,53fr\)/);
  assert.match(css, /@media \(min-aspect-ratio:1\/1\)/);
  assert.match(css, /grid-template-columns:minmax\(0,46fr\) minmax\(0,54fr\)/);
  assert.match(css, /\.idle-screen\{[\s\S]*?display:grid/);
  assert.match(css, /\.idle__content\{[^}]*grid-template-rows/);
  assert.match(css, /\.idle__card--center\{/);
  assert.match(css, /\.idle__card-face\{/);
  assert.match(css, /\.idle__header\{/);
  assert.match(css, /\.idle__footer\{/);
  assert.match(css, /\.summary-scroll\{[^}]*overflow:auto/);
  assert.match(css, /@media \(max-height:490px\) and \(min-aspect-ratio:1\/1\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(css.match(/\.summary\{[^}]*\}/)?.[0] || '', /-webkit-line-clamp/, 'narration must not be clamped');
});

test('demo portrait renders three cards + personalized topic with NO network calls', () => {
  const run = mount('?demo=1&background=1&topic=cinta&spread=three-card');
  assert.equal(run.networkCount, 0);
  const el = run.elements;
  assert.ok(el.get('stage').classList.contains('show'));
  assert.ok(el.get('stage').classList.contains('with-background'));
  assert.equal(el.get('idle-screen').hidden, true, 'demo reading hides idle');
  assert.equal(el.get('cards-row').children.length, 3);
  assert.match(el.get('topic').textContent, /Cinta/);
  assert.match(el.get('question').textContent, /hubungan cintaku/);
  assert.match(el.get('summary').textContent, /tarot adalah sarana refleksi/);
  assert.equal(run.timeouts.some(timer => timer.ms === 45000), false, 'demo remains visible for review');
});

test('single card, karir and reduced-motion mode are supported', () => {
  const run = mount('?demo=1&topic=karir&spread=single', null, true);
  assert.equal(run.elements.get('cards-row').children.length, 1);
  assert.ok(run.elements.get('cards-row').classList.contains('is-single'));
  assert.match(run.elements.get('story-title').textContent, /Karier/);
  assert.equal(run.timeouts.some(timer => timer.ms === 160), false, 'reduced motion skips auto-scroll');
});

test('live state uses DOM text, validates card path, starts 45s timeout and does not inject markup', async () => {
  const draw = {
    id: 'sample-real', createdAt: Date.now(), username: '<img onerror=alert(1)>',
    topic: 'nasib', question: '<script>nasib</script>',
    narration: 'Halo <script>alert("x")</script>, semoga kamu baik.',
    giftName: '<b>Fake</b>', triggerType: 'like',
    cards: [{ image: 'https://malicious.example/card.jpg', nameCn: '<svg/onload=evil>',
      positionNameCn: 'Sekarang', isReversed: false }],
  };
  const run = mount('', draw);
  await new Promise(resolve => setImmediate(resolve));
  const el = run.elements;
  assert.equal(run.networkCount, 1);
  assert.ok(el.get('stage').classList.contains('show'));
  assert.equal(el.get('idle-screen').hidden, true, 'live draw hides waiting screen');
  assert.equal(el.get('viewer').textContent, 'Untuk <img onerror=alert(1)>');
  assert.equal(el.get('summary').textContent, 'Halo <script>alert("x")</script>, semoga kamu baik.');
  assert.equal(el.get('gift').textContent, '♥ <b>Fake</b>');
  assert.equal(el.get('cards-row').children[0].children[0].children[0].name, 'span',
    'invalid card URL must not become img src');
  assert.ok(run.timeouts.some(timer => timer.ms === 45000), 'live reading automatically hides');
  assert.ok(run.timeouts.some(timer => timer.ms === 1000), 'poll loop repeats');
});


test('live without a draw shows premium idle rather than a black/transparent canvas', async () => {
  const run = mount('', null);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(run.elements.get('idle-screen').hidden, false, 'idle visible by default');
  assert.equal(run.elements.get('stage').classList.contains('show'), false);
  assert.match(markup, /Menunggu <em>Pesan Semesta<\/em>/);
  assert.match(markup, /TULIS CINTA · NASIB · KARIER/);
  assert.match(markup, /Gift atau target like/);
  assert.match(css, /\.idle-screen\{[\s\S]*?linear-gradient\(160deg,#130c27/);
  assert.equal((markup.match(/class="idle__card idle__card--/g) || []).length, 3);
});

test('45 seconds after a real reading the idle scene returns', async () => {
  const run = mount('', {
    id: 'reading-1', createdAt: Date.now(), username: '@tester', topic: 'nasib',
    cards: [{ image: '/cards/major/18-moon.jpg', nameCn: 'The Moon' }],
    narration: 'Pesan kartu untuk hari ini',
  });
  await new Promise(resolve => setImmediate(resolve));
  const idle = run.elements.get('idle-screen');
  const stage = run.elements.get('stage');
  assert.equal(idle.hidden, true);
  assert.equal(stage.classList.contains('show'), true);
  const ending = run.timeouts.find(timer => timer.ms === 45_000);
  assert.ok(ending, 'reading has 45s timeout');
  ending.fn();
  assert.equal(stage.classList.contains('show'), false);
  assert.equal(idle.hidden, false, 'waiting scene returns after reading');
});

test('idle=off preserves transparent OBS mode before and after a reading', async () => {
  const empty = mount('?idle=off', null);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(empty.elements.get('idle-screen').hidden, true);
  assert.equal(empty.elements.get('stage').classList.contains('show'), false);

  const current = mount('?idle=off', {
    id: 'transparent-draw', createdAt: Date.now(), username: '@tester',
    cards: [{ nameCn: 'The Star' }], narration: 'Pesan kartu',
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(current.elements.get('idle-screen').hidden, true);
  assert.equal(current.elements.get('stage').classList.contains('show'), true);
  current.timeouts.find(timer => timer.ms === 45_000).fn();
  assert.equal(current.elements.get('idle-screen').hidden, true, 'off mode stays transparent');
  assert.equal(current.elements.get('stage').classList.contains('show'), false);
});

test('browser has no exposed TikTok credentials and compiles without CDN imports', () => {
  assert.doesNotThrow(() => new vm.Script(script));
  assert.match(script, /fetch\('\/api\/live\/state\?t='/);
  assert.doesNotMatch(script, /TIKTOK_CONNECTOR_API_KEY|TIKTOK_CONNECTOR_WEBHOOK_SECRET/);
  assert.doesNotMatch(script, /https?:\/\/(?:unpkg|jsdelivr|cdnjs)/);
});
