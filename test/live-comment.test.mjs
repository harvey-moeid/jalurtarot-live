import test from 'node:test';
import assert from 'node:assert/strict';
import { detectLiveTopic, rememberLiveComment, selectLiveComment, markLiveCommentRead } from '../src/lib/liveComment.ts';
import { processConnectorEvent } from '../src/lib/tiktokConnector.ts';
import { getLiveDraw, buildLiveNarration } from '../src/lib/live.ts';

function setup() {
  const values = new Map();
  const env = { RATE_LIMIT_KV: {
    async get(key) { return values.get(key) ?? null; },
    async put(key, value) { values.set(key, value); },
  } };
  return { env, values };
}
let n = 0;
function evt(event, user, data, roomId = 'room-a', timestamp = new Date().toISOString()) {
  return { id: 'event-' + ++n, event, timestamp, roomId, username: 'host',
    data: { username: user, ...data } };
}

test('cinta / karir / nasib recognition and ambiguous/irrelevant messages', () => {
  assert.equal(detectLiveTopic('Apakah aku berjodoh dengan mantan?'), 'cinta');
  assert.equal(detectLiveTopic('Soal promosi karier dan gaji'), 'karir');
  assert.equal(detectLiveTopic('Bagaimana nasib dan keberuntungan tahun depan?'), 'nasib');
  assert.equal(detectLiveTopic('Aku mau cinta tapi juga kerja'), 'cinta');
  assert.equal(detectLiveTopic('Karier dulu, baru jodoh'), 'karir');
  assert.equal(detectLiveTopic('halo min, hadir nih'), null);
  assert.equal(detectLiveTopic(null), null);
});

test('chat only queues intent; gift for SAME viewer unlocks its topic and question', async () => {
  const { env, values } = setup();
  const chat = await processConnectorEvent(env, evt('chat', 'Mawar', { message: 'Cinta, apakah mantanku akan kembali?' }));
  assert.equal(chat.ignored, 'topic_saved_awaiting_trigger');
  assert.equal(values.has('live:current'), false, 'chat must never draw cards');
  const gift = await processConnectorEvent(env, evt('gift', 'Mawar', { giftName: 'Rose', diamondCount: 5, repeatCount: 1 }));
  assert.equal(gift.accepted, true);
  const draw = await getLiveDraw(env);
  assert.equal(draw.topic, 'cinta');
  assert.match(draw.question, /mantanku/);
  assert.match(draw.narration, /percintaan/);
  assert.match(draw.narration, /mantanku/);
  assert.equal(draw.spreadId, 'three-card');
  assert.match(draw.narration, /Kartu pertama/);
  assert.match(draw.narration, /Kartu ketiga/);
  assert.match(draw.summary, /komunikasi yang sehat/);
  const duplicated = await processConnectorEvent(env, { ...evt('gift', 'Mawar', {giftName: 'Rose', diamondCount:5}), id: 'gift-already-handled' });
  assert.ok(duplicated.accepted);
});

test('gift never uses someone else\'s comment or prior consumed comment', async () => {
  const { env } = setup();
  const chat = evt('chat', 'Sari', { message: 'Bagaimana nasib aku tahun ini?' });
  await processConnectorEvent(env, chat);
  await processConnectorEvent(env, evt('gift', 'Budi', { giftName: 'Rose', diamondCount: 1 }));
  assert.equal((await getLiveDraw(env)).topic, undefined);
  await processConnectorEvent(env, evt('gift', 'Sari', { giftName: 'Rose', diamondCount: 1 }));
  assert.equal((await getLiveDraw(env)).topic, 'nasib');
  await processConnectorEvent(env, evt('gift', 'Sari', { giftName: 'Rose', diamondCount: 1 }));
  assert.equal((await getLiveDraw(env)).topic, undefined, 'same request should be used only once');
});

test('room like milestone unlocks latest relevant chat (not arbitrary chat)', async () => {
  const { env } = setup();
  await processConnectorEvent(env, evt('chat', 'Rina', { message: 'Karir, apakah aku akan mendapat promosi?' }));
  const noTrigger = await processConnectorEvent(env, evt('like', 'Other', { likeCount: 1, totalLikeCount: 39 }));
  assert.equal(noTrigger.ignored, 'like_milestone_not_reached');
  assert.equal(await getLiveDraw(env), null);
  const trigger = await processConnectorEvent(env, evt('like', 'Other', { likeCount: 1, totalLikeCount: 40 }));
  assert.equal(trigger.accepted, true);
  const draw = await getLiveDraw(env);
  assert.equal(draw.topic, 'karir');
  assert.equal(draw.username, '@rina');
  assert.match(draw.narration, /karier/);
  assert.match(draw.narration, /promosi/);
  assert.equal(draw.triggerType, 'like');
});

test('stale, anonymous and unknown-topic comments are never used; dedupe works', async () => {
  const { env } = setup();
  const old = new Date(Date.now() - 6 * 60 * 1000).toISOString();
  assert.equal(await rememberLiveComment(env, {id:'old',room:'a',username:'viewer',message:'cinta',timestamp:old}), false);
  const irrelevant = await processConnectorEvent(env, evt('chat', 'Rina', { message: 'selamat malam semuanya' }));
  assert.equal(irrelevant.ignored, 'comment_without_topic');
  const sameEvent = evt('chat', 'Rina', { message: 'karir ke depan?' });
  await processConnectorEvent(env, sameEvent);
  const dup = await processConnectorEvent(env, sameEvent);
  assert.equal(dup.duplicate, true);
  assert.equal(await selectLiveComment(env,'other-room','Rina',true),null);
  const selected = await selectLiveComment(env,'room-a','Rina',false);
  assert.equal(selected.topic, 'karir');
  await markLiveCommentRead(env, selected);
  assert.equal(await selectLiveComment(env,'room-a','Rina',true), null);
});

test('narration for cards follows requested aspect and avoids generic nasib for cinta/karir', () => {
  const card = {
    nameCn:'The Sun', isReversed:false, keywords:['cerah'],
    aspect:{hubungan:'Hubungan penuh perhatian.',karir:'Proyek kerja akan berkembang.',nasib:'Peluang baik sedang terbuka.'},
  };
  const cinta = buildLiveNarration([card], '@tester', {topic:'cinta',question:'Cinta aku gimana?'});
  const karir = buildLiveNarration([card], '@tester', {topic:'karir',question:'Karir aku gimana?'});
  const nasib = buildLiveNarration([card], '@tester', {topic:'nasib',question:'Nasib aku gimana?'});
  assert.match(cinta, /Hubungan penuh perhatian/);
  assert.doesNotMatch(cinta, /Proyek kerja|Peluang baik/);
  assert.match(karir, /Proyek kerja akan berkembang/);
  assert.doesNotMatch(karir, /Hubungan penuh perhatian/);
  assert.match(nasib, /Peluang baik sedang terbuka/);
});
