import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { DEFAULT_LIVE_AUDIO, parseLiveAudioForm, saveLiveAudioSettings, getLiveAudioSettings } from '../src/lib/liveAudioSettings.ts';

const valid = (change = {}) => ({
  live1Tts: 'on', live2Tts: 'on', voice: 'female',
  rate: '0.93', pitch: '1.13', volume: '0.9',
  giftSound: 'on', likeSound: 'on', sfxVolume: '0.35',
  ambient: 'on', ambientVolume: '0.12', ...change
});
function env() {
  const values = new Map();
  return { values, RATE_LIMIT_KV: {
    async get(key) { return values.get(key) ?? null; },
    async put(key, value) { values.set(key, value); }
  }};
}

test('audio defaults opt in while keeping legacy query support', () => {
  assert.equal(DEFAULT_LIVE_AUDIO.live1Tts, false);
  assert.equal(DEFAULT_LIVE_AUDIO.live2Tts, false);
  assert.equal(DEFAULT_LIVE_AUDIO.voice, 'female');
});

test('audio form accepts independent toggles and rejects invalid parameters', () => {
  const actual = parseLiveAudioForm(valid({ live1Tts: undefined, ambient: undefined }));
  assert.equal(actual.live1Tts, false);
  assert.equal(actual.live2Tts, true);
  assert.equal(actual.ambient, false);
  assert.equal(actual.pitch, 1.13);
  for (const bad of ['-1', '999', 'Infinity', 'NaN', '1e1', '<script>', '1.111']) {
    assert.throws(() => parseLiveAudioForm(valid({ rate: bad })), bad);
  }
  assert.throws(() => parseLiveAudioForm(valid({ ambientVolume: '0.4' })));
  assert.throws(() => parseLiveAudioForm(valid({ voice: '<img src=x>' })));
  assert.throws(() => parseLiveAudioForm(valid({ giftSound: 'yes' })));
});

test('audio saves only validated typed preferences under independent KV key', async () => {
  const e = env();
  const value = parseLiveAudioForm(valid());
  await saveLiveAudioSettings(e, value);
  const key = 'live:audio:settings:v1';
  assert.equal(JSON.parse(e.values.get(key)).live2Tts, true);
  assert.equal((await getLiveAudioSettings(e)).volume, 0.9);
  assert.equal(e.values.has('live:automation:settings:v1'), false);
  await assert.rejects(() => saveLiveAudioSettings(e, { ...value, rate: 20 }));
});

test('public OBS settings are separate from admin credentials and existing overlay routes', async () => {
  const [admin, live, live2, live1, browser] = await Promise.all([
    'src/routes/admin.ts', 'src/routes/live.ts', 'src/routes/live2.ts',
    'public/live1.js', 'public/live-audio.js'
  ].map(path => readFile(new URL('../' + path, import.meta.url), 'utf8')));
  assert.match(admin, /admin\.get\('\/audio'/);
  assert.match(admin, /admin\.post\('\/audio\/settings'/);
  assert.match(admin, /origin !== new URL\(c\.req\.url\)\.origin/);
  assert.match(live, /live\.get\('\/audio-settings'/);
  assert.match(live, /Cache-Control', 'no-store'/);
  assert.match(live, /\/live-audio\.js\?v=/);
  assert.match(live2, /\/live-audio\.js\?v=/);
  assert.match(live1, /audio\.playEvent\(draw\.triggerType\)/);
  assert.doesNotMatch(browser, /TIKTOK_CONNECTOR_API_KEY|ADMIN_PASSWORD|WEBHOOK_SECRET/);
  assert.doesNotThrow(() => new vm.Script(browser));
});

function audioHarness(search, remote = {}) {
  const code = audioHarness.code;
  const spoken = [];
  const cancels = [];
  class Utterance {
    constructor(text) { this.text = text; }
  }
  const win = {
    SpeechSynthesisUtterance: Utterance,
    speechSynthesis: {
      cancel() { cancels.push(true); },
      getVoices() { return [
        { name: 'Budi', lang: 'id-ID' }, { name: 'Gadis Bahasa Indonesia', lang: 'id-ID' }
      ]; },
      speak(value) { spoken.push(value); }
    },
    addEventListener() {}
  };
  const ctx = {
    window: win, location: { search }, URLSearchParams,
    document: { hidden: false },
    fetch: async () => ({ ok: true, json: async () => ({
      ...DEFAULT_LIVE_AUDIO, ...remote
    }) }),
    setInterval: () => 1, clearInterval() {},
    setTimeout() { return 1; }
  };
  vm.runInNewContext(code, ctx);
  return { instance: win.LiveAudio.create('live2'), spoken, cancels };
}

test('browser follows admin TTS setting, prioritizes Indonesian female, safely cancels', async () => {
  audioHarness.code = await readFile(new URL('../public/live-audio.js', import.meta.url), 'utf8');
  const h = audioHarness('', { live2Tts: true, pitch: 1.3, volume: 0.4, rate: 0.8 });
  await h.instance.ready;
  assert.equal(h.instance.isEnabled(), true);
  assert.equal(h.instance.speak('Selamat datang di LIVE Tarot.'), true);
  assert.equal(h.spoken.length, 1);
  assert.equal(h.spoken[0].pitch, 1.3);
  assert.equal(h.spoken[0].volume, 0.4);
  assert.equal(h.spoken[0].rate, 0.8);
  assert.equal(h.spoken[0].voice.name, 'Gadis Bahasa Indonesia');
  h.instance.setEnabled(false);
  assert.equal(h.instance.isEnabled(), false);
  assert.ok(h.cancels.length >= 1);
});

test('query voice=0/1 overrides admin defaults; disabled TTS leaves text untouched', async () => {
  const forced = audioHarness('?voice=1', { live2Tts: false });
  const disabled = audioHarness('?voice=0', { live2Tts: true });
  await Promise.all([forced.instance.ready, disabled.instance.ready]);
  assert.equal(forced.instance.isEnabled(), true);
  assert.equal(disabled.instance.isEnabled(), false);
  assert.equal(disabled.instance.speak('Belum boleh berbicara.'), false);
  assert.equal(disabled.spoken.length, 0);
});
