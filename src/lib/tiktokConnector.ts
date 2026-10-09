import { generateLiveDraw, saveLiveDraw, type LiveSpreadId } from './live';
import { rememberLiveComment, selectLiveComment, markLiveCommentRead } from './liveComment';

export type TikTokConnectorEnv = {
  RATE_LIMIT_KV: KVNamespace;
  TIKTOK_CONNECTOR_URL?: string;
  TIKTOK_CONNECTOR_API_KEY?: string;
  TIKTOK_CONNECTOR_WEBHOOK_SECRET?: string;
  LIVE_TARGET_GIFT_NAME?: string;
  LIVE_MIN_GIFT_VALUE?: string;
  LIVE_THREE_CARD_MIN_VALUE?: string;
  LIVE_DEFAULT_SPREAD?: string;
};

export type ConnectorEvent = {
  id?: string;
  event?: string;
  timestamp?: string;
  roomId?: string | null;
  username?: string | null;
  version?: number;
  data?: Record<string, unknown>;
};

export type ConnectorStatus = {
  ok?: boolean;
  status?: string;
  running?: boolean;
  username?: string;
  roomId?: string | null;
  lastEventAt?: string | null;
  stats?: Record<string, unknown>;
};

const DEFAULT_CONNECTOR_URL = 'https://tiktok-live-konektor.onrender.com';
const REQUEST_TIMEOUT_MS = 8_000;
const PROCESSED_EVENT_TTL_SECONDS = 6 * 60 * 60;

import { crossedLikeMilestone, getLiveSettings } from './liveSettings';

export function connectorBaseUrl(env: TikTokConnectorEnv): string {
  const raw = String(env.TIKTOK_CONNECTOR_URL || DEFAULT_CONNECTOR_URL).trim().replace(/\/+$/, '');
  let url: URL;
  try { url = new URL(raw); }
  catch { throw new Error('TIKTOK_CONNECTOR_URL tidak valid.'); }
  if (url.protocol !== 'https:') throw new Error('TIKTOK_CONNECTOR_URL wajib HTTPS.');
  return url.toString().replace(/\/+$/, '');
}

export function connectorConfigured(env: TikTokConnectorEnv): boolean {
  return Boolean(String(env.TIKTOK_CONNECTOR_API_KEY || '').trim());
}

export async function connectorRequest<T = any>(
  env: TikTokConnectorEnv,
  path: string,
): Promise<T> {
  const key = String(env.TIKTOK_CONNECTOR_API_KEY || '').trim();
  if (!key) throw new Error('TIKTOK_CONNECTOR_API_KEY belum di-set di Cloudflare Worker.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(connectorBaseUrl(env) + path, {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + key,
      },
      signal: controller.signal,
      // Cloudflare Workers mendukung 'manual' atau 'follow', bukan 'error'.
      // Jangan ikuti redirect agar Bearer API key tidak bocor ke host lain.
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      throw new Error('tiktok-live-konektor: HTTP ' + response.status + ' redirect ditolak.');
    }

    const text = await response.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; }
    catch { throw new Error('Respons tiktok-live-konektor bukan JSON valid.'); }

    if (!response.ok) {
      const detail = String(body?.error || body?.message || ('HTTP ' + response.status)).slice(0, 300);
      throw new Error('tiktok-live-konektor: ' + detail);
    }
    return body as T;
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new Error('tiktok-live-konektor timeout.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function getConnectorStatus(env: TikTokConnectorEnv): Promise<ConnectorStatus> {
  return connectorRequest<ConnectorStatus>(env, '/api/v1/status');
}

export function getConnectorStats(env: TikTokConnectorEnv): Promise<any> {
  return connectorRequest(env, '/api/v1/stats');
}

export function getConnectorEvents(
  env: TikTokConnectorEnv,
  types = 'chat,like,gift',
  limit = 50,
): Promise<{ ok?: boolean; count?: number; events?: ConnectorEvent[] }> {
  const safeTypes = types
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(v => ['chat', 'like', 'gift', 'follow', 'share', 'member', 'viewer', 'stream'].includes(v))
    .join(',');
  const safeLimit = Math.min(Math.max(Math.trunc(limit || 50), 1), 200);
  const query = new URLSearchParams({
    type: safeTypes || 'chat,like,gift',
    limit: String(safeLimit),
  });
  return connectorRequest(env, '/api/v1/events?' + query.toString());
}

function normalizedViewerName(event: ConnectorEvent): string {
  const data = event.data || {};
  const username = String(data.username || '').trim();
  const nickname = String(data.nickname || '').trim();
  const chosen = username || nickname || 'Penonton';
  return chosen === 'Penonton' || chosen.startsWith('@') ? chosen : '@' + chosen;
}

function eventMarkerKey(event: ConnectorEvent): string | null {
  const id = String(event.id || '').trim();
  return id ? 'live:connector:event:' + id.slice(0, 160) : null;
}

type ProcessedEventResult = { accepted: boolean; duplicate?: boolean; ignored?: string; drawId?: string };

function safeCount(raw: unknown): number {
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 && n <= 1000000 ? n : 0;
}

async function processLike(
  env: TikTokConnectorEnv,
  event: ConnectorEvent,
  milestone: number,
  spreadId: LiveSpreadId,
  marker: string | null,
): Promise<ProcessedEventResult> {
  if (!marker) return { accepted: false, ignored: 'like_event_without_id' };
  const timestamp = Date.parse(String(event.timestamp || ''));
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
    return { accepted: false, ignored: 'stale_like_event' };
  }
  if (await env.RATE_LIMIT_KV.get(marker)) return { accepted: true, duplicate: true };

  const data = event.data || {};
  const delta = safeCount(data.likeCount);
  if (!delta) return { accepted: false, ignored: 'invalid_like_count' };
  const room = String(event.roomId || event.username || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 70);
  const counterKey = 'live:connector:likes:' + (room || 'unknown');
  const raw = await env.RATE_LIMIT_KV.get(counterKey);
  let previous = 0;
  if (raw) {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Number.isSafeInteger((parsed as any).count) || (parsed as any).count < 0) {
      throw new Error('Counter like di KV tidak valid.');
    }
    previous = (parsed as { count: number }).count;
  }
  // Prefer totalLikeCount when the connector reports an increasing room total.
  // When not available, sum event likeCount (best effort under KV concurrency).
  const total = safeCount(data.totalLikeCount);
  const before = !raw && total ? Math.max(0, total - delta) : previous;
  const count = total ? Math.max(previous, total) : previous + delta;
  if (!Number.isSafeInteger(count)) throw new Error('Akumulasi like melewati batas aman.');

  const crossed = crossedLikeMilestone(before, count, milestone);
  let drawId: string | undefined;
  if (crossed) {
    // Satu draw per event agar lonjakan like tidak menimpa overlay berkali-kali.
    const requester = normalizedViewerName(event);
    // Room milestone can resolve the latest eligible viewer request, even when
    // another viewer happens to send the like that crosses the threshold.
    const comment = await selectLiveComment(env, String(event.roomId || event.username || 'unknown'), requester, true);
    const recipient = comment?.username || requester;
    const draw = generateLiveDraw(spreadId, recipient, milestone + ' Like', milestone, 'like',
      comment ? { topic: comment.topic, question: comment.question } : undefined);
    if (!await saveLiveDraw(env, draw)) throw new Error('Gagal menyimpan draw like ke KV.');
    if (comment) await markLiveCommentRead(env, comment);
    drawId = draw.id;
  }
  await env.RATE_LIMIT_KV.put(counterKey, JSON.stringify({ count }), { expirationTtl: PROCESSED_EVENT_TTL_SECONDS });
  await env.RATE_LIMIT_KV.put(marker, '1', { expirationTtl: PROCESSED_EVENT_TTL_SECONDS });
  return drawId ? { accepted: true, drawId } : { accepted: true, ignored: 'like_milestone_not_reached' };
}

export async function processConnectorEvent(
  env: TikTokConnectorEnv,
  event: ConnectorEvent,
): Promise<ProcessedEventResult> {
  if (!event || typeof event !== 'object') return { accepted: false, ignored: 'invalid_event' };
  const eventType = String(event.event || '').toLowerCase();
  const marker = eventMarkerKey(event);
  if (eventType === 'chat') {
    // Chat only selects a topic. It must never trigger draw generation by itself.
    if (!marker) return { accepted: false, ignored: 'chat_event_without_id' };
    if (await env.RATE_LIMIT_KV.get(marker)) return { accepted: true, duplicate: true };
    const stored = await rememberLiveComment(env, {
      id: String(event.id), room: String(event.roomId || event.username || 'unknown'),
      username: normalizedViewerName(event), message: event.data?.message,
      timestamp: event.timestamp,
    });
    // Store a marker for irrelevant chat too, keeping REST fallback inexpensive.
    await env.RATE_LIMIT_KV.put(marker, '1', { expirationTtl: PROCESSED_EVENT_TTL_SECONDS });
    return { accepted: true, ignored: stored ? 'topic_saved_awaiting_trigger' : 'comment_without_topic' };
  }
  if (eventType !== 'gift' && eventType !== 'like') {
    return { accepted: false, ignored: 'event_not_used_for_draw' };
  }

  const settings = await getLiveSettings(env);
  if (eventType === 'like') {
    if (!settings.likeEnabled) return { accepted: false, ignored: 'like_disabled' };
    return processLike(env, event, settings.likeMilestone, settings.likeSpread, marker);
  }
  if (!settings.giftEnabled) return { accepted: false, ignored: 'gift_disabled' };
  if (marker && await env.RATE_LIMIT_KV.get(marker)) return { accepted: true, duplicate: true };

  const data = event.data || {};
  const giftName = String(data.giftName || 'Gift').slice(0, 80);
  const target = settings.targetGiftName;
  if (target !== '*' && giftName.toLowerCase() !== target.toLowerCase()) {
    return { accepted: false, ignored: 'gift_not_target' };
  }

  const streakable = data.streakable === true || Number(data.giftType || 0) === 1;
  const repeatEnd = data.repeatEnd === true;
  if (streakable && !repeatEnd) {
    return { accepted: false, ignored: 'gift_streak_in_progress' };
  }

  const repeatCount = Math.max(Number(data.repeatCount) || 1, 1);
  const diamondCount = Math.max(Number(data.diamondCount) || 0, 0);
  const totalValue = Math.max(Number(data.totalValue) || diamondCount * repeatCount || 0, 0);
  if (totalValue < settings.minGiftValue) {
    return { accepted: false, ignored: 'gift_below_minimum' };
  }

  const spreadId: LiveSpreadId = totalValue >= settings.threeCardMinValue ? 'three-card' : settings.defaultSpread;
  // A gift uses ONLY its sender's pending comment, never another viewer's.
  const comment = await selectLiveComment(env, String(event.roomId || event.username || 'unknown'),
    normalizedViewerName(event), false);
  const draw = generateLiveDraw(spreadId, normalizedViewerName(event), giftName, repeatCount, 'gift',
    comment ? { topic: comment.topic, question: comment.question } : undefined);
  if (!await saveLiveDraw(env, draw)) throw new Error('Gagal menyimpan draw connector ke KV.');
  if (comment) await markLiveCommentRead(env, comment);

  if (marker) await env.RATE_LIMIT_KV.put(marker, '1', { expirationTtl: PROCESSED_EVENT_TTL_SECONDS });
  return { accepted: true, drawId: draw.id };
}
