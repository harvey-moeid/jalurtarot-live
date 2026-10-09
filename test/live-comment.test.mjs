import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  detectLiveTopic, rememberLiveComment, selectLiveComment, markLiveCommentRead,
} from '../src/lib/liveComment.ts';

function setup() {
  const values = new Map();
  const env = { RATE_LIMIT_KV: {
    async get(key) { return values.get(key) ?? null; },
    async put(key, value) { values.set(key, value); },
  } };
  return { env, values };
}
let n = 0;
function commentInput(username, message, room = 'room-a') {
  return { id: 'chat-' + ++n, room, username, message, timestamp: new Date().toISOString() };
}

test('identify cinta, karir, nasib from Indonesian viewer questions', () => {
  assert.equal(detectLiveTopic('Apakah aku berjodoh dengan mantan?'), 'cinta');
  assert.equal(detectLiveTopic('Soal promosi karier dan gaji'), 'karir');
  assert.equal(detectLiveTopic('Bagaimana nasib dan keberuntungan tahun depan?'), 'nasib');
  assert.equal(detectLiveTopic('Aku mau cinta tapi juga kerja'), 'cinta');
  assert.equal(detectLiveTopic('Karier dulu, baru jodoh'), 'karir');
  assert.equal(detectLiveTopic('halo min, hadir nih'), null);
  assert.equal(detectLiveTopic(null), null);
});

test('record comment as a pending request, scoped to viewer and room, not draw state', async () => {
  const { env, values } = setup();
  assert.equal(await rememberLiveComment(env, commentInput('@Mawar', 'Cinta: mantanku bakal balik?')), true);
  assert.equal(values.has('live:current'), false, 'chat alone must not draw cards');
  const matched = await selectLiveComment(env, 'room-a', 'mawar', false);
  assert.equal(matched.topic, 'cinta');
  assert.match(matched.question, /mantanku/);
  assert.equal(matched.username, '@mawar');
  assert.equal(await selectLiveComment(env, 'another-room', 'mawar', true), null);
  assert.equal(await selectLiveComment(env, 'room-a', 'oranglain', false), null);
});

test('room like milestone can choose latest eligible comment; gift cannot borrow it', async () => {
  const { env } = setup();
  await rememberLiveComment(env, commentInput('Rina', 'Karier: apakah peluang promosi besar?'));
  const guestGift = await selectLiveComment(env, 'room-a', 'Budi', false);
  assert.equal(guestGift, null);
  const roomLike = await selectLiveComment(env, 'room-a', 'Budi', true);
  assert.equal(roomLike.topic, 'karir');
  assert.equal(roomLike.username, '@rina');
  await markLiveCommentRead(env, roomLike);
  assert.equal(await selectLiveComment(env, 'room-a', 'Rina', false), null);
  assert.equal(await selectLiveComment(env, 'room-a', 'Budi', true), null);
});

test('drop stale, anonymous, irrelevant and malformed topic comments', async () => {
  const { env } = setup();
  assert.equal(await rememberLiveComment(env, {
    id: 'stale', room: 'room-a', username: 'Mawar', message: 'cinta',
    timestamp: new Date(Date.now() - 6 * 60_000).toISOString(),
  }), false);
  assert.equal(await rememberLiveComment(env, commentInput('unknown', 'nasib')), false);
  assert.equal(await rememberLiveComment(env, commentInput('Mawar', 'selamat malam semua')), false);
  assert.equal(await rememberLiveComment(env, {...commentInput('Mawar', 'karir'), id: ''}), false);
  const pending = commentInput('Mawar', '<script>karir</script> bagaimana?');
  assert.equal(await rememberLiveComment(env, pending), true);
  const saved = await selectLiveComment(env, 'room-a', 'Mawar', false);
  assert.equal(saved.question.includes('<'), false);
});

test('connector guards draw generation behind gift/like and exposes optional narration metadata', async () => {
  const [connector, live, route, overlay, admin, queue] = await Promise.all([
    readFile(new URL('../src/lib/tiktokConnector.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/live.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/live.ts', import.meta.url), 'utf8'),
    readFile(new URL('../public/live2.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/admin.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/liveQueueObject.ts', import.meta.url), 'utf8'),
  ]);
  const chatAt = connector.indexOf("if (eventType === 'chat')");
  const giftAt = connector.indexOf("if (!settings.giftEnabled)");
  assert.ok(chatAt >= 0 && giftAt > chatAt);
  const chatBlock = connector.slice(chatAt, giftAt);
  assert.match(chatBlock, /rememberLiveComment/);
  assert.doesNotMatch(chatBlock, /generateLiveDraw/);
  assert.match(connector, /selectLiveComment\(env,/);
  assert.match(connector, /markLiveCommentRead\(env,/);
  assert.match(queue, /crossedLikeMilestone\(before,count,body\.milestone\)/);
  assert.match(connector, /processQueuedLikes\(env,/);
  assert.match(route, /getConnectorEvents\(env, 'chat,gift,like', 100\)/);
  assert.match(live, /topic === 'cinta' \? 'hubungan' : topic === 'karir' \? 'karir' : 'nasib'/);
  assert.match(live, /narration:|narration,/);
  assert.match(live, /Kartu pertama/);
  assert.match(live, /Kartu ketiga/);
  assert.match(overlay, /draw\.narration \|\| aspect/);
  assert.match(admin, /name="topic"/);
  assert.match(admin, /name="question"/);
});
