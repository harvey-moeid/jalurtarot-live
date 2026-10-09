import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const script = await readFile(new URL('../public/live2.js', import.meta.url), 'utf8');

function createHarness(withVoice = false) {
  const nodes = new Map();
  let clock = 10_000;
  let nextId = 0;
  const timers = new Map();
  const spoken = [];
  const ids = ['live2','reading','reading-cards','live-status','speech',
    'speech-title','speech-message','speech-progress','sound-toggle','host3d',
    'viewer-label','reading-name','reading-summary','reading-gift','host-portrait',
    'host-model-debug'];
  function element(name) {
    return {
      name, hidden: name === 'reading' || name === 'speech-progress',
      textContent: '', children: [], className: '', complete: false,
      naturalWidth: 0, attrs: {},
      classList: { values: new Set(), add(k) { this.values.add(k); },
        remove(k) { this.values.delete(k); } },
      append(...items) { this.children.push(...items); },
      appendChild(item) { this.children.push(item); },
      replaceChildren(...items) { this.children = [...items]; },
      setAttribute(key, value) { this.attrs[key] = value; },
      addEventListener() {}, getContext() { return null; },
    };
  }
  for (const id of ids) nodes.set(id, element(id));
  const speechSynthesis = {
    cancel() {},
    getVoices() { return [{ lang: 'id-ID' }]; },
    speak(utterance) { spoken.push(utterance); },
  };
  class Utterance { constructor(text) { this.text = text; } }
  class VirtualDate extends Date { static now() { return clock; } }
  function schedule(callback, delay = 0) {
    const id = ++nextId;
    timers.set(id, { at: clock + Number(delay), callback });
    return id;
  }
  function advance(ms) {
    const until = clock + ms;
    for (let safety = 0; safety < 200; safety++) {
      let next;
      for (const [id, timer] of timers) {
        if (timer.at <= until && (!next || timer.at < next.timer.at)) {
          next = { id, timer };
        }
      }
      if (!next) { clock = until; return; }
      timers.delete(next.id);
      clock = next.timer.at;
      next.timer.callback();
    }
    throw new Error('Unexpected repeated timer');
  }
  const document = {
    hidden: false,
    getElementById(id) { return nodes.get(id) || null; },
    querySelector(selector) { return selector === '.host' ? element('host') : null; },
    createElement(tag) { return element(tag); },
    addEventListener() {},
  };
  const window = { addEventListener() {} };
  if (withVoice) window.speechSynthesis = speechSynthesis;
  vm.runInNewContext(script, {
    document, window,
    location: { search: '?demo=1' + (withVoice ? '&voice=1' : '') },
    matchMedia: () => ({ matches: false }),
    URLSearchParams, SpeechSynthesisUtterance: Utterance,
    speechSynthesis, Date: VirtualDate,
    setTimeout: schedule, clearTimeout(id) { timers.delete(id); },
  }, { timeout: 2500 });
  return { nodes, timers, spoken, advance };
}

test('LIVE 2 advances readable dialogue without truncating the whole ramalan', () => {
  const h = createHarness();
  const bubble = h.nodes.get('speech-message');
  assert.match(bubble.textContent, /aku baca pertanyaanmu tentang cinta/);
  assert.ok(bubble.textContent.length <= 88);
  assert.equal(h.nodes.get('speech-progress').textContent.split(' / ')[0], '1');
  assert.equal(h.nodes.get('reading').hidden, false);
  assert.equal(h.nodes.get('reading-cards').children.length, 3);
  const first = bubble.textContent;
  h.advance(15_000);
  assert.notEqual(bubble.textContent, first, 'bubble advances to a new thought');
  assert.ok(bubble.textContent.length <= 88);
  assert.match(h.nodes.get('reading-summary').textContent, /Halo @penonton/);
  assert.equal(h.nodes.get('reading').hidden, false);
  h.advance(140_000);
  assert.equal(h.nodes.get('reading').hidden, true, 'reading eventually clears');
  assert.match(h.nodes.get('speech-title').textContent, /Selamat datang/);
  assert.equal(h.nodes.get('speech-progress').hidden, true);
});

test('voice-enabled dialogue progresses only when utterance ends', () => {
  const h = createHarness(true);
  assert.equal(h.spoken.length, 1);
  assert.equal(h.spoken[0].text, h.nodes.get('speech-message').textContent);
  const first = h.nodes.get('speech-message').textContent;
  h.spoken[0].onend();
  h.advance(321);
  assert.equal(h.spoken.length, 2);
  assert.notEqual(h.nodes.get('speech-message').textContent, first);
  assert.equal(h.spoken[1].text, h.nodes.get('speech-message').textContent);
});

test('TTS fallback advances if OBS or the browser never fires onend', () => {
  const h = createHarness(true);
  const first = h.nodes.get('speech-message').textContent;
  h.advance(20_000);
  assert.notEqual(h.nodes.get('speech-message').textContent, first);
});
