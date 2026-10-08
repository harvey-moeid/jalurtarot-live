import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  crossedLikeMilestone,
  defaultLiveSettings,
  getLiveSettings,
  parseLiveSettingsForm,
  saveLiveSettings,
} from '../src/lib/liveSettings.ts';

const form = (changes = {}) => ({
  giftEnabled: 'on',
  targetGiftName: '*',
  minGiftValue: '1',
  threeCardMinValue: '5',
  defaultSpread: 'single',
  likeEnabled: 'on',
  likeMilestone: '40',
  likeSpread: 'single',
  ...changes,
});
const makeEnv = () => {
  const data = new Map();
  return {
    data,
    RATE_LIMIT_KV: {
      async get(key) { return data.get(key) ?? null; },
      async put(key, value) { data.set(key, value); },
    },
  };
};

test('default settings preserve gift policy and enable 40-like milestones', () => {
  const defaults = defaultLiveSettings(makeEnv());
  assert.equal(defaults.giftEnabled, true);
  assert.equal(defaults.minGiftValue, 1);
  assert.equal(defaults.threeCardMinValue, 5);
  assert.equal(defaults.likeEnabled, true);
  assert.equal(defaults.likeMilestone, 40);
  assert.equal(defaults.likeSpread, 'single');
});

test('admin form accepts unchecked toggles and validates strict numeric bounds', () => {
  assert.deepEqual(
    [parseLiveSettingsForm(form({ giftEnabled: undefined, likeEnabled: undefined })).giftEnabled,
      parseLiveSettingsForm(form({ giftEnabled: undefined, likeEnabled: undefined })).likeEnabled],
    [false, false],
  );
  assert.equal(parseLiveSettingsForm(form({ likeMilestone: '20', likeSpread: 'three-card' })).likeSpread, 'three-card');
  for (const value of ['-1', '1.5', 'NaN', '0', 'abc', '1000001', '1e3']) {
    assert.throws(() => parseLiveSettingsForm(form({ likeMilestone: value })));
  }
  assert.throws(() => parseLiveSettingsForm(form({ targetGiftName: '<script>' })));
  assert.throws(() => parseLiveSettingsForm(form({ likeEnabled: 'false' })));
});

test('like milestone only fires on a real boundary crossing', () => {
  assert.equal(crossedLikeMilestone(38, 39, 40), false);
  assert.equal(crossedLikeMilestone(39, 40, 40), true);
  assert.equal(crossedLikeMilestone(40, 40, 40), false);
  assert.equal(crossedLikeMilestone(40, 41, 40), false);
  assert.equal(crossedLikeMilestone(79, 120, 40), true);
  assert.equal(crossedLikeMilestone(120, 110, 40), false);
  assert.equal(crossedLikeMilestone(10, 20, 0), false);
});

test('Live settings are persisted without TTL and read back', async () => {
  const env = makeEnv();
  const settings = parseLiveSettingsForm(form({ likeMilestone: '120', likeSpread: 'three-card' }));
  await saveLiveSettings(env, settings);
  const saved = env.data.get('live:automation:settings:v1');
  assert.equal(JSON.parse(saved).likeMilestone, 120);
  assert.equal((await getLiveSettings(env)).likeSpread, 'three-card');
});

test('integration checks: authenticated admin, webhook and like fallback', async () => {
  const [admin, connector, live, overlay] = await Promise.all([
    readFile(new URL('../src/routes/admin.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/tiktokConnector.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/live.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/live.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(admin, /admin\.post\('\/live\/settings'/);
  assert.match(admin, /origin !== new URL\(c\.req\.url\)\.origin/);
  assert.match(admin, /admin\.get\('\/', \(c\) => c\.redirect\('\/admin\/live'\)/);
  assert.doesNotMatch(admin, /admin\.(?:get|post)\('\/blacklist/);
  assert.match(connector, /eventType === 'like'/);
  assert.match(connector, /eventMarkerKey\(event\)/);
  assert.match(live, /getConnectorEvents\(env, 'gift,like'/);
  assert.match(live, /isAuthenticated\(c\)/);
  assert.match(live, /draw\.triggerType==="like"/);
  assert.match(overlay, /triggerType\?: 'gift' \| 'like'/);
});
