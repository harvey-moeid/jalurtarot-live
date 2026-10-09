/* Local cursor per browser source. No public queue ACK mutation.
   Independent LIVE 1 and LIVE 2 progress safely over a single durable event log. */
(function () {
  'use strict';
  function valid(state) {
    return state && ['gift','like','giftsStreak'].every(key =>
      Number.isSafeInteger(state[key]) && state[key] >= 0
    ) && state.giftsStreak <= 3;
  }
  function connect(channel) {
    if (channel !== 'live1' && channel !== 'live2') throw new Error('Unknown LIVE channel');
    const key = 'jalurtarot:queue:v1:' + channel;
    let cursor = null;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (valid(saved)) cursor = saved;
    } catch (_) {}
    function save() {
      try { localStorage.setItem(key,JSON.stringify(cursor)); } catch (_) {}
    }
    async function next() {
      const bootstrap = cursor === null;
      const query = new URLSearchParams(bootstrap ? { bootstrap:'1' } : {
        gift:String(cursor.gift), like:String(cursor.like), streak:String(cursor.giftsStreak),
      });
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(),8000);
      try {
        const res = await fetch('/api/live/queue?' + query.toString(), {
          cache:'no-store',signal:ctrl.signal,
        });
        if (!res.ok) throw new Error('LIVE queue HTTP '+res.status);
        const payload = await res.json();
        if (bootstrap) {
          if (!payload.initialized || !valid(payload.cursor)) throw new Error('Invalid bootstrap cursor');
          cursor=payload.cursor;
          save();
          return {item:null,pending:0,initialized:true};
        }
        if (payload.item && (!Number.isSafeInteger(payload.item.seq) ||
          !['gift','like'].includes(payload.item.kind))) throw new Error('Invalid LIVE item');
        // A response started before an ACK may arrive afterwards.
        if (payload.item && cursor && payload.item.seq <= cursor[payload.item.kind]) {
          return { ...payload, item:null };
        }
        return payload;
      } finally { clearTimeout(timer); }
    }
    function finish(item) {
      if (!cursor || !item || !['gift','like'].includes(item.kind) ||
        !Number.isSafeInteger(item.seq) || item.seq<0) return;
      const prev=cursor[item.kind];
      if (item.seq<=prev) return;
      cursor[item.kind]=item.seq;
      cursor.giftsStreak=item.kind==='gift' ? Math.min(3,cursor.giftsStreak+1) : 0;
      save(); // Persist only AFTER completing the reading; refresh replays unfinished work.
    }
    return {next,finish};
  }
  window.LiveReadingQueue = {connect};
})();
