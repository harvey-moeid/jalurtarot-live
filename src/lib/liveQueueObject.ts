/** Central durable event log for LIVE 1 and LIVE 2.
 * One SQLite Durable Object owns enqueue order, deduplication and like milestones.
 * Viewers maintain their OWN independent channel cursors; no public ACK endpoint
 * may modify anyone else's playback position.
 */
import type { LiveDraw } from './live';
import { crossedLikeMilestone } from './liveSettings';

type QueueKind = 'gift' | 'like';
type QueueEntry = { seq: number; kind: QueueKind; draw: LiveDraw; createdAt: number };
type QueueCursor = { gift: number; like: number; giftsStreak: number };
type LikeOffer = { eventKey: string; draw: LiveDraw; room: string; delta: number; total: number; milestone: number };

export class LiveReadingQueue {
  private state: DurableObjectState;
  private lastSweep = 0;
  constructor(state: DurableObjectState) {
    this.state = state;
    const sql = state.storage.sql;
    sql.exec(`CREATE TABLE IF NOT EXISTS readings (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      event_key TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL CHECK (kind IN ('gift','like')),
      created_at INTEGER NOT NULL,
      draw_json TEXT NOT NULL
    )`);
    sql.exec('CREATE INDEX IF NOT EXISTS readings_kind_seq ON readings(kind,seq)');
    sql.exec(`CREATE TABLE IF NOT EXISTS processed_events (
      event_key TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL
    )`);
    sql.exec(`CREATE TABLE IF NOT EXISTS room_likes (
      room TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0
    )`);
  }

  private prune(now: number) {
    if (now - this.lastSweep < 300_000) return;
    this.lastSweep = now;
    this.state.storage.sql.exec('DELETE FROM readings WHERE created_at < ?', now - 3_600_000);
    this.state.storage.sql.exec('DELETE FROM processed_events WHERE created_at < ?', now - 21_600_000);
    // An upper bound protects the free storage plan even under burst traffic.
    this.state.storage.sql.exec(
      'DELETE FROM readings WHERE seq < (SELECT COALESCE(MAX(seq),0)-499 FROM readings)',
    );
  }

  private add(eventKey: string, kind: QueueKind, draw: LiveDraw, now: number) {
    const sql = this.state.storage.sql;
    sql.exec('INSERT INTO readings(event_key,kind,created_at,draw_json) VALUES (?,?,?,?)',
      eventKey, kind, now, JSON.stringify(draw));
  }

  private gift(body: { eventKey: string; draw: LiveDraw }) {
    const now = Date.now();
    const result = this.state.storage.transactionSync(() => {
      const sql = this.state.storage.sql;
      const exists = sql.exec<{ event_key: string }>(
        'SELECT event_key FROM processed_events WHERE event_key=? LIMIT 1', body.eventKey,
      ).toArray().length > 0;
      if (exists) return { accepted: true, duplicate: true };
      sql.exec('INSERT INTO processed_events(event_key,created_at) VALUES (?,?)',body.eventKey,now);
      // Manual preview can be a like reading without changing any like counters.
      this.add(body.eventKey,body.draw.triggerType==='like' ? 'like' : 'gift',body.draw,now);
      return { accepted: true, duplicate: false, drawId: body.draw.id };
    });
    this.prune(now);
    return result;
  }

  private like(body: LikeOffer) {
    const now = Date.now();
    const result = this.state.storage.transactionSync(() => {
      const sql = this.state.storage.sql;
      if (sql.exec<{ event_key: string }>(
        'SELECT event_key FROM processed_events WHERE event_key=? LIMIT 1',body.eventKey,
      ).toArray().length) return { accepted: true, duplicate: true };
      const row = sql.exec<{ count: number }>(
        'SELECT count FROM room_likes WHERE room=? LIMIT 1',body.room,
      ).toArray()[0];
      const previous = row?.count ?? 0;
      const before = !row && body.total > 0 ? Math.max(0,body.total-body.delta) : previous;
      const count = body.total > 0 ? Math.max(previous,body.total) : previous+body.delta;
      if (!Number.isSafeInteger(count)) throw new Error('Like counter overflow');
      sql.exec('INSERT INTO processed_events(event_key,created_at) VALUES (?,?)',body.eventKey,now);
      sql.exec('INSERT INTO room_likes(room,count) VALUES (?,?) ON CONFLICT(room) DO UPDATE SET count=excluded.count',body.room,count);
      if (crossedLikeMilestone(before,count,body.milestone)) {
        this.add(body.eventKey,'like',body.draw,now);
        return { accepted: true, duplicate: false, drawId: body.draw.id };
      }
      return { accepted: true, duplicate: false, ignored: 'like_milestone_not_reached' };
    });
    this.prune(now);
    return result;
  }

  private next(cursor: QueueCursor, bootstrap: boolean) {
    this.prune(Date.now());
    const sql=this.state.storage.sql;
    if (bootstrap) {
      const max=sql.exec<{ gift: number; like: number }>(`SELECT
        COALESCE(MAX(CASE WHEN kind='gift' THEN seq END),0) AS gift,
        COALESCE(MAX(CASE WHEN kind='like' THEN seq END),0) AS like FROM readings`).one();
      return { initialized: true, cursor: { gift: max.gift, like: max.like, giftsStreak: 0 }, pending: 0 };
    }
    const minAge=Date.now()-3_600_000;
    const gifts=sql.exec<{ seq:number;draw_json:string;created_at:number }>(
      `SELECT seq,draw_json,created_at FROM readings WHERE kind='gift' AND seq>? AND created_at>=? ORDER BY seq LIMIT 1`,
      cursor.gift,minAge,
    ).toArray()[0];
    const likes=sql.exec<{ seq:number;draw_json:string;created_at:number }>(
      `SELECT seq,draw_json,created_at FROM readings WHERE kind='like' AND seq>? AND created_at>=? ORDER BY seq LIMIT 1`,
      cursor.like,minAge,
    ).toArray()[0];
    // Gift has priority, but a pending like runs after at most three gifts.
    const chosen=(likes && (!gifts || cursor.giftsStreak >= 3)) ? { ...likes, kind: 'like' as const } :
      gifts ? { ...gifts, kind: 'gift' as const } : likes ? { ...likes, kind: 'like' as const } : null;
    const counts=sql.exec<{ n:number }>(`SELECT COUNT(*) AS n FROM readings WHERE created_at>=?
      AND ((kind='gift' AND seq>?) OR (kind='like' AND seq>?))`,minAge,cursor.gift,cursor.like).one();
    return {
      initialized: false,
      item: chosen ? { seq:chosen.seq,kind:chosen.kind,
        createdAt:chosen.created_at,draw:JSON.parse(chosen.draw_json) as LiveDraw } : null,
      pending: counts.n,
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url=new URL(request.url);
    try {
      if (url.pathname === '/offer/gift' && request.method === 'POST') {
        const input=await request.json() as { eventKey:string;draw:LiveDraw };
        if (!validEvent(input.eventKey,input.draw) || !['gift','like'].includes(input.draw.triggerType || 'gift')) {
          return Response.json({error:'invalid gift'}, {status:400});
        }
        return Response.json(this.gift(input));
      }
      if (url.pathname === '/offer/like' && request.method === 'POST') {
        const input=await request.json() as LikeOffer;
        if (!validEvent(input.eventKey,input.draw,'like') ||
          !input.room || input.room.length>90 || !Number.isSafeInteger(input.delta) ||
          input.delta<1 || !Number.isSafeInteger(input.total) || input.total<0 ||
          !Number.isSafeInteger(input.milestone) || input.milestone<1) {
          return Response.json({error:'invalid like'}, {status:400});
        }
        return Response.json(this.like(input));
      }
      if (url.pathname === '/next' && request.method === 'POST') {
        const input=await request.json() as { bootstrap?:boolean;cursor?:QueueCursor };
        const cursor=input.cursor;
        if (!input.bootstrap && (!cursor || ![cursor.gift,cursor.like,cursor.giftsStreak].every(
          n=>Number.isSafeInteger(n)&&n>=0 && n<Number.MAX_SAFE_INTEGER
        ) || cursor.giftsStreak>3)) return Response.json({error:'invalid cursor'},{status:400});
        return Response.json(this.next(cursor||{gift:0,like:0,giftsStreak:0},input.bootstrap===true));
      }
      return Response.json({error:'not_found'}, {status:404});
    } catch (error) {
      console.error('LiveReadingQueue failure',error);
      return Response.json({error:'queue_error'},{status:500});
    }
  }
}
function validEvent(key: unknown, draw: LiveDraw, kind?: QueueKind): boolean {
  return typeof key === 'string' && key.length>0 && key.length<=220 &&
    draw && typeof draw.id==='string' && draw.id.length<=120 &&
    (!kind || draw.triggerType===kind) && Array.isArray(draw.cards) && draw.cards.length>0 &&
    typeof draw.createdAt==='number' && Number.isFinite(draw.createdAt);
}
