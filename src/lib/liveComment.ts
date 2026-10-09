/** LIVE comment intent is collected without drawing cards.
 * Only a qualifying gift or a crossed like milestone may consume it. */
export type LiveTopic = 'cinta' | 'karir' | 'nasib';
export type PendingLiveComment = {
  id: string;
  username: string;
  question: string;
  topic: LiveTopic;
  createdAt: number;
};
type CommentEnv = { RATE_LIMIT_KV: KVNamespace };
const COMMENT_TTL_SECONDS = 15 * 60;
const COMMENT_MAX_AGE_MS = COMMENT_TTL_SECONDS * 1000;

const patterns: Array<[LiveTopic, RegExp]> = [
  ['cinta', /\b(cinta|asmara|jodoh|pacar|pacaran|pasangan|hubungan|gebetan|mantan|nikah|menikah|suami|istri|sayang|balikan|selingkuh|doi)\b/gi],
  ['karir', /\b(karir|karier|pekerjaan|kerja|bekerja|kantor|atasan|bos|bisnis|usaha|dagang|promosi|gaji|interview|wawancara|resign|lowongan|cari kerja)\b/gi],
  ['nasib', /\b(nasib|keberuntungan|beruntung|hoki|takdir|masa depan|hidup|rezeki|rejeki|keuangan|uang|peruntungan|peluang|tahun ini)\b/gi],
];

export function detectLiveTopic(message: unknown): LiveTopic | null {
  if (typeof message !== 'string') return null;
  const normalized = message.normalize('NFKC').toLowerCase().slice(0, 600);
  let found: { topic: LiveTopic; index: number } | null = null;
  for (const [topic, pattern] of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(normalized);
    if (match && (!found || match.index < found.index)) found = { topic, index: match.index };
  }
  return found?.topic ?? null;
}
export function cleanLiveQuestion(message: unknown): string {
  return String(message ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, 160);
}
export function normalizedCommentUser(raw: unknown): string {
  return String(raw ?? '').trim().replace(/^@/, '').toLowerCase()
    .replace(/[^a-z0-9._-]/g, '').slice(0, 64);
}
export function liveCommentRoom(raw: unknown): string {
  return String(raw ?? 'unknown').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 64) || 'unknown';
}
function commentKey(room: string, user: string): string {
  return 'live:comment:person:' + room + ':' + user;
}
function latestKey(room: string): string {
  return 'live:comment:latest:' + room;
}
function usedKey(id: string): string {
  return 'live:comment:used:' + id.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 150);
}
export async function rememberLiveComment(
  env: CommentEnv,
  input: { id?: string; room: string; username: string; message: unknown; timestamp?: string },
): Promise<boolean> {
  const user = normalizedCommentUser(input.username);
  const topic = detectLiveTopic(input.message);
  const question = cleanLiveQuestion(input.message);
  const createdAt = Date.parse(String(input.timestamp || ''));
  if (!user || user === 'unknown' || user === 'penonton' || !topic || !question || !input.id ||
      !Number.isFinite(createdAt) || Math.abs(Date.now() - createdAt) > 5 * 60 * 1000) {
    return false;
  }
  const comment: PendingLiveComment = {
    id: String(input.id).replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 150),
    username: '@' + user,
    question, topic, createdAt,
  };
  if (!comment.id) return false;
  const room = liveCommentRoom(input.room);
  const value = JSON.stringify(comment);
  await Promise.all([
    env.RATE_LIMIT_KV.put(commentKey(room, user), value, { expirationTtl: COMMENT_TTL_SECONDS }),
    env.RATE_LIMIT_KV.put(latestKey(room), value, { expirationTtl: COMMENT_TTL_SECONDS }),
  ]);
  return true;
}
async function validPending(env: CommentEnv, raw: string | null): Promise<PendingLiveComment | null> {
  if (!raw) return null;
  let item: PendingLiveComment;
  try { item = JSON.parse(raw); } catch { return null; }
  if (typeof item?.id !== 'string' || typeof item.username !== 'string' ||
      typeof item.question !== 'string' || !detectLiveTopic(item.question) ||
      !['cinta', 'karir', 'nasib'].includes(item.topic) ||
      !Number.isFinite(item.createdAt) || Date.now() - item.createdAt > COMMENT_MAX_AGE_MS ||
      item.createdAt > Date.now() + 15_000) return null;
  if (await env.RATE_LIMIT_KV.get(usedKey(item.id))) return null;
  return item;
}
/** Gift can only read sender's comment. The room like milestone may read latest comment. */
export async function selectLiveComment(
  env: CommentEnv, roomRaw: string, usernameRaw: string, allowRoomLatest: boolean,
): Promise<PendingLiveComment | null> {
  const room = liveCommentRoom(roomRaw);
  const user = normalizedCommentUser(usernameRaw);
  if (user && user !== 'unknown') {
    const own = await validPending(env, await env.RATE_LIMIT_KV.get(commentKey(room, user)));
    if (own) return own;
  }
  return allowRoomLatest ? validPending(env, await env.RATE_LIMIT_KV.get(latestKey(room))) : null;
}
export async function markLiveCommentRead(env: CommentEnv, comment: PendingLiveComment): Promise<void> {
  await env.RATE_LIMIT_KV.put(usedKey(comment.id), '1', { expirationTtl: COMMENT_TTL_SECONDS });
}
