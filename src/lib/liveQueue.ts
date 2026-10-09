import type { LiveDraw } from './live';

export type LiveQueueEnv = { LIVE_QUEUE?: DurableObjectNamespace };

type QueueReply = {
  accepted: boolean; duplicate?: boolean; ignored?: string; drawId?: string;
};

async function callQueue<T>(env: LiveQueueEnv, path: string, payload: unknown): Promise<T> {
  if (!env.LIVE_QUEUE) throw new Error('LIVE_QUEUE Durable Object binding belum tersedia.');
  const stub=env.LIVE_QUEUE.get(env.LIVE_QUEUE.idFromName('jalurtarot-single-live-v1'));
  const res=await stub.fetch('https://live-queue.internal'+path, {
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Durable reading queue error: HTTP '+res.status);
  return res.json() as Promise<T>;
}

export async function enqueueGift(
  env: LiveQueueEnv, draw: LiveDraw, eventKey = 'manual:'+draw.id,
): Promise<QueueReply> {
  return callQueue(env,'/offer/gift',{eventKey,draw});
}

export async function processQueuedLikes(env: LiveQueueEnv, options: {
  draw: LiveDraw; eventKey:string; room:string;
  delta:number;total:number;milestone:number;
}): Promise<QueueReply> {
  return callQueue(env,'/offer/like',options);
}

export type LiveQueueCursor = { gift:number;like:number;giftsStreak:number };
export type LiveQueueItem = {
  seq:number;kind:'gift'|'like';createdAt:number;draw:LiveDraw;
};

export async function nextQueuedReading(
  env: LiveQueueEnv, cursor: LiveQueueCursor, bootstrap = false,
): Promise<{initialized:boolean;cursor?:LiveQueueCursor;item?:LiveQueueItem|null;pending:number}> {
  return callQueue(env,'/next',{cursor,bootstrap});
}
