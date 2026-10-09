import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const [live1, live2, css, script] = await Promise.all([
  readFile(new URL('../src/routes/live.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/routes/live2.ts', import.meta.url), 'utf8'),
  readFile(new URL('../public/overlay-fullscreen.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/overlay-fullscreen.js', import.meta.url), 'utf8'),
]);

function node() {
  const listeners = new Map();
  const values = new Set();
  const obj = {
    attrs: {}, hidden: false, title: '', textContent: '',
    classList: {
      add(key) { values.add(key); },
      remove(key) { values.delete(key); },
      contains(key) { return values.has(key); },
    },
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
    emit(type, event = {}) {
      for (const callback of listeners.get(type) || []) callback(event);
    },
    setAttribute(name, value) { this.attrs[name] = value; },
    matches() { return false; },
  };
  return obj;
}
function start(search = '', support = true) {
  const doc = node();
  const control = node();
  const button = node();
  const status = node();
  status.hidden = true;
  const label = node();
  const icon = node();
  button.querySelector = selector => selector === '.overlay-fullscreen-label' ? label :
    selector === '.overlay-fullscreen-icon' ? icon : null;
  const root = node();
  let requests = 0;
  let exits = 0;
  if (support) {
    root.requestFullscreen = function () {
      requests++;
      doc.fullscreenElement = root;
      doc.emit('fullscreenchange');
      return Promise.resolve();
    };
    doc.exitFullscreen = function () {
      exits++;
      doc.fullscreenElement = null;
      doc.emit('fullscreenchange');
      return Promise.resolve();
    };
  }
  doc.documentElement = root;
  doc.getElementById = id => ({
    'overlay-fullscreen-button': button,
    'overlay-fullscreen-control': control,
    'overlay-fullscreen-status': status,
  })[id];
  const timers = [];
  const context = {
    document: doc,
    location: { search },
    URLSearchParams,
    setTimeout(callback, ms) { timers.push({ callback, ms }); return timers.length; },
    clearTimeout() {},
  };
  assert.doesNotThrow(() => vm.runInNewContext(script, context, { timeout: 2000 }));
  return { doc, root, control, button, status, label, icon, timers,
    get requests() { return requests; }, get exits() { return exits; } };
}

test('both overlays include one identical fullscreen controller and local assets', () => {
  for (const page of [live1, live2]) {
    assert.equal((page.match(/id="overlay-fullscreen-button"/g) || []).length, 1);
    assert.equal((page.match(/id="overlay-fullscreen-control"/g) || []).length, 1);
    assert.match(page, /overlay-fullscreen\.css\?v=20261009-1/);
    assert.match(page, /overlay-fullscreen\.js\?v=20261009-1/);
    assert.match(page, /aria-label="Masuk layar penuh"/);
    assert.match(page, /role="status" aria-live="polite"/);
  }
  assert.match(live1, /href="\/live1\.css\?v=20261010-1"/);
  assert.match(live2, /href="\/live2\.css\?v=20261010-1"/);
});

test('click switches native fullscreen in and out, with accessible state updates', () => {
  const run = start('?demo=1&controls=1');
  assert.ok(run.control.classList.contains('is-pinned'));
  assert.equal(run.button.attrs['aria-pressed'], 'false');
  run.button.emit('click', { stopPropagation() {} });
  assert.equal(run.requests, 1);
  assert.equal(run.doc.fullscreenElement, run.root);
  assert.equal(run.button.attrs['aria-pressed'], 'true');
  assert.equal(run.label.textContent, 'Keluar Layar Penuh');
  run.button.emit('click', { stopPropagation() {} });
  assert.equal(run.exits, 1);
  assert.equal(run.doc.fullscreenElement, null);
  assert.equal(run.button.attrs['aria-pressed'], 'false');
});

test('keyboard F toggles; typing in form inputs never toggles', () => {
  const run = start();
  run.doc.emit('keydown', { key: 'f', target: { tagName: 'INPUT' } });
  assert.equal(run.requests, 0);
  run.doc.emit('keydown', { key: 'F', target: { tagName: 'BODY' } });
  assert.equal(run.requests, 1);
  run.doc.emit('keydown', { key: 'f', target: { tagName: 'BODY' } });
  assert.equal(run.exits, 1);
});

test('OBS control auto-hides until pointer/touch; controls=0 hides it completely', () => {
  const run = start();
  assert.equal(run.control.classList.contains('is-visible'), false);
  run.doc.emit('pointermove');
  assert.ok(run.control.classList.contains('is-visible'));
  assert.ok(run.timers.some(t => t.ms === 4200));
  const timer = run.timers.find(t => t.ms === 4200);
  timer.callback();
  assert.equal(run.control.classList.contains('is-visible'), false);
  run.doc.emit('touchstart');
  assert.ok(run.control.classList.contains('is-visible'));

  const obs = start('?controls=0');
  assert.equal(obs.control.hidden, true);
  obs.doc.emit('pointermove');
  assert.equal(obs.control.classList.contains('is-visible'), false);
});

test('unsupported browser reports limitation rather than pretending fullscreen worked', () => {
  const run = start('', false);
  run.button.emit('click', {});
  assert.equal(run.requests, 0);
  assert.equal(run.status.hidden, false);
  assert.match(run.status.textContent, /tidak mendukung fullscreen/);
});

test('fullscreen fills dynamic viewport, keeps portrait/landscape and no new CDN or API key', () => {
  assert.match(css, /html:fullscreen/);
  assert.match(css, /width:100dvw;height:100vh;height:100dvh/);
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /safe-area-inset-right/);
  assert.match(css, /\.overlay-fullscreen-control\[hidden\]/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotThrow(() => new vm.Script(script));
  assert.doesNotMatch(script, /TIKTOK_CONNECTOR_API_KEY|TIKTOK_CONNECTOR_WEBHOOK_SECRET|fetch\(/);
  assert.doesNotMatch(script, /https?:\/\//);
});
