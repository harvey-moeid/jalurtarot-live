import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { readFile } from 'node:fs/promises';

const [serverCode, clientCode, wrangler] = await Promise.all([
  readFile(new URL('../src/lib/liveQueueObject.ts', import.meta.url),'utf8'),
  readFile(new URL('../public/live-queue.js', import.meta.url),'utf8'),
  readFile(new URL('../wrangler.toml', import.meta.url),'utf8'),
]);

class FakeSql {
  constructor() {
    this.readings = [];
    this.processed = new Map();
    this.counts = new Map();
    this.sequence = 0;
  }
  exec(statement,...a) {
    const query = statement.replace(/\\s+/g,' ').toLowerCase();
    let rows = [];
    if (query.startsWith('create ')) {
    } else if (query.startsWith('select event_key from processed_events')) {
      if (this.processed.has(a[0])) rows=[{event_key:a[0]}];
    } else if (query.startsWith('insert into processed_events')) {
      assert.equal(this.processed.has(a[0]),false,'duplicate event key');
      this.processed.set(a[0],a[1]);
    } else if (query.startsWith('select count from room_likes')) {
      if(this.counts.has(a[0])) rows=[{count:this.counts.get(a[0]).count,updated_at:this.counts.get(a[0]).updated_at}];
    } else if (query.startsWith('insert into room_likes')) {
      this.counts.set(a[0],{count:a[1],updated_at:a[2]});
    } else if (query.startsWith('insert into readings')) {
      if(this.readings.some(item=>item.event_key===a[0])) throw new Error('duplicate reading');
      this.readings.push({seq:++this.sequence,event_key:a[0],kind:a[1],
        created_at:a[2],draw_json:a[3]});
    } else if (query.startsWith('delete from readings where created_at')) {
      this.readings=this.readings.filter(item=>item.created_at>=a[0]);
    } else if (query.startsWith('delete from processed_events')) {
      for(const [key,at] of this.processed) if(at<a[0]) this.processed.delete(key);
    } else if (query.startsWith('delete from readings where seq')) {
      this.readings=this.readings.filter(item=>item.seq>=Math.max(0,this.sequence-1999));
    } else if (query.includes('coalesce(max(case when')) {
      const max = kind => Math.max(0,...this.readings.filter(r=>r.kind===kind).map(r=>r.seq));
      rows=[{gift:max('gift'),like:max('like')}];
    } else if (query.startsWith('select seq,draw_json,created_at')) {
      const kind=query.includes("kind='gift'")?'gift':'like';
      rows=this.readings.filter(r=>r.kind===kind&&r.seq>a[0]&&r.created_at>=a[1])
        .sort((a,b)=>a.seq-b.seq).slice(0,1);
    } else if (query.startsWith('select count(*) as n')) {
      rows=[{n:this.readings.filter(r=>r.created_at>=a[0]&&(
        r.kind==='gift'&&r.seq>a[1] || r.kind==='like'&&r.seq>a[2]
      )).length}];
    } else {
      throw new Error('Unexpected SQL: '+statement);
    }
    return {toArray(){return rows;},one(){if(!rows.length)throw Error('No result');return rows[0]}};
  }
}
function harness() {
  const inlinePolicy = `const crossedLikeMilestone = (before, after, milestone) =>
    Number.isSafeInteger(before) && Number.isSafeInteger(after) && milestone > 0 &&
    after > before && Math.floor(after / milestone) > Math.floor(before / milestone);`;
  const js = stripTypeScriptTypes(
    serverCode
      .replace("import { crossedLikeMilestone } from './liveSettings';", inlinePolicy)
      .replace('export class LiveReadingQueue', 'class LiveReadingQueue') +
    String.fromCharCode(10) + 'exports.LiveReadingQueue = LiveReadingQueue;',
    { mode:'strip' },
  );
  const exports = {};
  vm.runInNewContext(js,{exports,Date,URL,Response,console},{timeout:2000});
  const sql = new FakeSql();
  const server = new exports.LiveReadingQueue({
    storage:{sql,transactionSync(cb){return cb();}},
  });
  async function send(path,body) {
    const response=await server.fetch(new Request('https://queue.internal'+path,{
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),
    }));
    if (!response.ok) throw new Error('Queue request failed: '+await response.text());
    return response.json();
  }
  const now=Date.now();
  const draw=(id,kind='gift')=>({
    id,createdAt:now,triggerType:kind,username:'@viewer',cards:[{image:'/cards/test.jpg'}],
  });
  return {sql,send,draw};
}

test('queue Durable Object uses Free-plan SQLite, one source, and deduplicates concurrent gifts',async()=>{
  assert.match(wrangler,/new_sqlite_classes\s*=\s*\["LiveReadingQueue"\]/);
  assert.match(wrangler,/name\s*=\s*"LIVE_QUEUE"/);
  const {send,draw,sql}=harness();
  const d=draw('gift-one');
  const result=await Promise.all(Array.from({length:4},()=>send('/offer/gift',{
    eventKey:'event:gift-1',draw:d,
  })));
  assert.equal(result.filter(item=>item.duplicate===false).length,1);
  assert.equal(result.filter(item=>item.duplicate===true).length,3);
  assert.equal(sql.readings.length,1);
});

test('like milestone and dedupe happen together, not as racy KV read/modify/write',async()=>{
  const {send,draw,sql}=harness();
  const a=await send('/offer/like',{eventKey:'like1',room:'roomA',delta:3,total:0,milestone:5,draw:draw('a','like')});
  assert.equal(a.ignored,'like_milestone_not_reached');
  const b=await send('/offer/like',{eventKey:'like2',room:'roomA',delta:3,total:0,milestone:5,draw:draw('b','like')});
  assert.equal(b.drawId,'b');
  const again=await send('/offer/like',{eventKey:'like2',room:'roomA',delta:3,total:0,milestone:5,draw:draw('b2','like')});
  assert.equal(again.duplicate,true);
  assert.equal(sql.counts.get('roomA').count,6);
  assert.equal(sql.readings.length,1);
});

test('gift gets priority, but a waiting like is served after three gifts; viewers keep separate cursor',async()=>{
  const {send,draw,sql}=harness();
  for(let i=1;i<=4;i++)await send('/offer/gift',{eventKey:'g'+i,draw:draw('g'+i)});
  await send('/offer/like',{eventKey:'l1',room:'room1',delta:1,total:0,milestone:1,draw:draw('l1','like')});
  const start={gift:0,like:0,giftsStreak:0};
  const next=await send('/next',{cursor:start,bootstrap:false});
  assert.equal(next.item.kind,'gift');
  assert.equal(next.pending,5);
  let cursor={...start};
  for(let i=1;i<=3;i++){
    const picked=await send('/next',{cursor,bootstrap:false});
    assert.equal(picked.item.kind,'gift');
    cursor.gift=picked.item.seq;cursor.giftsStreak=i;
  }
  const fourth=await send('/next',{cursor,bootstrap:false});
  assert.equal(fourth.item.kind,'like');
  // A second overlay does not share the first one's cursor.
  const other=await send('/next',{cursor:start,bootstrap:false});
  assert.equal(other.item.draw.id,'g1');
  assert.equal(sql.readings.length,5);
});

test('initial boot starts at tail, but each later read resumes at its own cursor',async()=>{
  const {send,draw}=harness();
  await send('/offer/gift',{eventKey:'past',draw:draw('past')});
  const boot=await send('/next',{bootstrap:true});
  assert.equal(boot.initialized,true);
  assert.equal(boot.cursor.gift,1);
  await send('/offer/gift',{eventKey:'new',draw:draw('new')});
  const result=await send('/next',{cursor:boot.cursor,bootstrap:false});
  assert.equal(result.item.draw.id,'new');
});

test('per-overlay browser cursors advance only after display completes',async()=>{
  const data=new Map();
  const calls=[];
  const backend=async(url)=>{
    calls.push(url);
    const u=new URL(url,'https://site.invalid');
    if(u.searchParams.get('bootstrap')==='1')return {
      ok:true,json:async()=>({initialized:true,cursor:{gift:3,like:2,giftsStreak:0}}),
    };
    return {ok:true,json:async()=>({pending:1,item:{seq:4,kind:'gift',draw:{id:'g4'}}})};
  };
  const clientWindow={};
  vm.runInNewContext(clientCode,{
    window:clientWindow,
    localStorage:{getItem:key=>data.get(key)||null,setItem:(key,val)=>data.set(key,val)},
    fetch:backend,AbortController,setTimeout,clearTimeout,URLSearchParams,console,
  },{timeout:2000});
  const live1=clientWindow.LiveReadingQueue.connect('live1');
  const live2=clientWindow.LiveReadingQueue.connect('live2');
  assert.equal((await live1.next()).initialized,true);
  assert.equal((await live2.next()).initialized,true);
  const pending=await live1.next();
  assert.equal(pending.item.seq,4);
  assert.equal(JSON.parse(data.get('jalurtarot:queue:v1:live1')).gift,3);
  live1.finish(pending.item);
  assert.equal(JSON.parse(data.get('jalurtarot:queue:v1:live1')).gift,4);
  assert.equal(JSON.parse(data.get('jalurtarot:queue:v1:live2')).gift,3);
  assert.equal(calls.length,3);
});
