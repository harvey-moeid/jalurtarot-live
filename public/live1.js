/* Jalur Tarot LIVE 1 — self-contained OBS overlay, no CDN or TikTok secret in browser. */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const demo = params.get('demo') === '1';
  const debug = params.get('debug') === '1';
  const spread = params.get('spread') === 'single' ? 'single' : 'three-card';
  const topicDemo = ['cinta', 'karir', 'nasib'].includes(params.get('topic')) ? params.get('topic') : 'cinta';
  const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = id => document.getElementById(id);
  const stage = $('stage');
  // Fallback legacy polling only if queue asset failed to load.
  const queue = typeof window !== 'undefined' && window.LiveReadingQueue
    ? window.LiveReadingQueue.connect('live1') : null;
  let activeQueueItem = null;
  const idle = $('idle-screen');
  // Default shows a dedicated waiting screen. ?idle=off restores a transparent OBS overlay.
  const idleEnabled = params.get('idle') !== 'off';
  if (idle && !idleEnabled) idle.hidden = true;
  const viewer = $('viewer');
  const gift = $('gift');
  const topic = $('topic');
  const row = $('cards-row');
  const question = $('question');
  const summary = $('summary');
  const summaryScroll = $('summary-scroll');
  const storyTitle = $('story-title');
  const debugEl = $('debug-state');
  if (params.get('background') === '1') stage.classList.add('with-background');
  const HIDE_AFTER_MS = 45_000;
  const POLL_MS = 1000;
  const MAX_AGE_MS = 120_000;
  let lastId = null;
  let hideTimer = null;
  let pollTimer = null;
  let scrollTimer = null;
  let polling = false;
  let pausedUntil = 0;

  const topicLabels = { cinta: 'Cinta & Hubungan', karir: 'Karier & Pekerjaan', nasib: 'Nasib & Peluang' };
  const trimText = (value, limit = 800) => String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, limit);

  function setDebug(value) {
    if (debug && debugEl) {
      debugEl.hidden = false;
      debugEl.textContent = value;
    }
  }
  function safeCardPath(src) {
    const path = String(src || '');
    return /^\/cards\/[a-z0-9_\/-]+\.(jpg|jpeg|png|webp)$/i.test(path) && !path.includes('..') ? path : null;
  }
  function createCard(card, index, total) {
    const c = card && typeof card === 'object' ? card : {};
    const article = document.createElement('article');
    article.className = 'live-card' + (c.isReversed ? ' reversed' : '');
    const frame = document.createElement('div');
    frame.className = 'card-frame';
    const imageSrc = safeCardPath(c.image);
    if (imageSrc) {
      const img = document.createElement('img');
      img.src = imageSrc;
      img.alt = trimText(c.nameCn || c.name || 'Kartu tarot', 100);
      img.loading = 'eager';
      img.decoding = 'async';
      frame.appendChild(img);
    } else {
      const placeholder = document.createElement('span');
      placeholder.textContent = '✧';
      placeholder.setAttribute('aria-label', 'Gambar kartu tidak tersedia');
      frame.appendChild(placeholder);
    }
    const caption = document.createElement('div');
    caption.className = 'card-caption';
    const pos = document.createElement('div');
    pos.className = 'pos';
    pos.textContent = trimText(c.positionNameCn || (total === 1 ? 'Kartu Pilihanmu' : 'Kartu ' + (index + 1)), 56);
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = trimText(c.nameCn || c.name || 'Kartu Tarot', 100);
    caption.appendChild(pos);
    caption.appendChild(name);
    if (c.isReversed) {
      const state = document.createElement('div');
      state.className = 'state';
      state.textContent = 'Posisi terbalik';
      caption.appendChild(state);
    }
    article.appendChild(frame);
    article.appendChild(caption);
    return article;
  }
  function cleanNarration(value) {
    return trimText(value, 2200)
      .replace(/::(?:spark|heart|briefcase|crystal)::/g, '')
      .replace(/\*\*/g, '')
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n');
  }
  function stopScroll() {
    if (scrollTimer !== null) clearTimeout(scrollTimer);
    scrollTimer = null;
  }
  function returnToIdle() {
    stage.classList.remove('show');
    stopScroll();
    if (idle && idleEnabled) idle.hidden = false;
    if (activeQueueItem && queue) {
      queue.finish(activeQueueItem);
      activeQueueItem = null;
      schedule(0);
    }
  }
  function startScroll() {
    stopScroll();
    if (reducedMotion) return; // manual scrolling remains possible
    const started = Date.now();
    function tick() {
      if (!stage.classList.contains('show')) return;
      if (!document.hidden && Date.now() >= pausedUntil) {
        const remaining = Math.max(0, summaryScroll.scrollHeight - summaryScroll.clientHeight);
        if (remaining > 0) {
          const fraction = Math.min(1, Math.max(0, (Date.now() - started - 1800) / 33000));
          summaryScroll.scrollTop = remaining * fraction;
        }
      }
      if (Date.now() - started < HIDE_AFTER_MS && stage.classList.contains('show')) {
        scrollTimer = setTimeout(tick, 160);
      }
    }
    scrollTimer = setTimeout(tick, 160);
  }
  // OBS is noninteractive; in a browser, a viewer can interrupt scrolling.
  if (summaryScroll && typeof summaryScroll.addEventListener === 'function') {
    ['wheel', 'touchstart', 'pointerdown'].forEach(eventName => {
      summaryScroll.addEventListener(eventName, function () { pausedUntil = Date.now() + 8000; }, { passive: true });
    });
  }
  function render(draw) {
    if (!draw || typeof draw !== 'object') return;
    const cards = Array.isArray(draw.cards) ? draw.cards.slice(0, 3) : [];
    if (!cards.length) return;
    const username = trimText(draw.username || 'Penonton', 80) || 'Penonton';
    const requestedTopic = Object.prototype.hasOwnProperty.call(topicLabels, draw.topic) ? draw.topic : null;
    viewer.textContent = 'Untuk ' + username;
    topic.hidden = !requestedTopic;
    topic.textContent = requestedTopic ? '✦ ' + topicLabels[requestedTopic] : '';
    if (draw.giftName) {
      gift.hidden = false;
      const trigger = draw.triggerType === 'like' ? '♥ ' : '🎁 ';
      const count = !Number.isSafeInteger(draw.giftCount) || draw.giftCount <= 1 ? '' : ' ×' + Math.min(draw.giftCount, 1000000);
      gift.textContent = trigger + trimText(draw.giftName, 80) + (draw.triggerType === 'like' ? '' : count);
    } else {
      gift.hidden = true;
      gift.textContent = '';
    }
    row.classList.toggle('is-single', cards.length === 1);
    row.replaceChildren(...cards.map((c, i) => createCard(c, i, cards.length)));
    storyTitle.textContent = requestedTopic ? 'Pesan ' + topicLabels[requestedTopic] : 'Pesan dari Kartu';
    const questionText = trimText(draw.question, 180);
    question.hidden = !questionText;
    question.textContent = questionText ? 'Pertanyaan: “' + questionText + '”' : '';
    summary.textContent = cleanNarration(draw.narration || draw.summary || 'Pesan kartu sedang disiapkan.');
    summaryScroll.scrollTop = 0;
    pausedUntil = 0;
    // Hide the idle scene only after all reading data is ready.
    // Repeated triggers simply refresh the reading without flashing the idle scene.
    if (idle) idle.hidden = true;
    stage.classList.remove('show');
    // Replay reveal animation for a fresh draw.
    void stage.offsetWidth;
    stage.classList.add('show');
    startScroll();
    if (hideTimer !== null) clearTimeout(hideTimer);
    if (!demo) {
      hideTimer = setTimeout(returnToIdle, HIDE_AFTER_MS);
    }
    setDebug('Menampilkan hasil ' + trimText(draw.id || 'baru', 90));
  }
  function schedule(ms) {
    if (pollTimer !== null) clearTimeout(pollTimer);
    pollTimer = setTimeout(poll, ms);
  }
  async function poll() {
    if (polling || demo) return;
    if (document.hidden) { schedule(3000); return; }
    if (queue && stage.classList.contains('show')) { schedule(1000); return; }
    polling = true;
    if (queue) {
      try {
        const payload=await queue.next();
        const count=$('idle-queue-count');
        if (count && !stage.classList.contains('show')) {
          count.textContent = payload.pending > 0
            ? 'Menunggu ' + payload.pending + ' ramalan' : 'Siap menerima ramalan berikutnya';
        }
        if (payload.item) {
          activeQueueItem=payload.item;
          if (Array.isArray(payload.item.draw?.cards) && payload.item.draw.cards.length) {
            render(payload.item.draw);
          } else {
            queue.finish(payload.item); // Malformed old record cannot block the queue.
            activeQueueItem=null;
          }
        }
        setDebug('Antrean terhubung · ' + (payload.pending || 0) + ' menunggu');
      } catch (error) {
        setDebug('Antrean bermasalah · mencoba ulang');
      } finally {
        polling=false;
        schedule(POLL_MS);
      }
      return;
    }
    const ctrl = new AbortController();
    const timeout = setTimeout(function () { ctrl.abort(); }, 8000);
    try {
      const res = await fetch('/api/live/state?t=' + Date.now(), { cache: 'no-store', signal: ctrl.signal });
      if (!res.ok) throw new Error('Status HTTP ' + res.status);
      const data = await res.json();
      const next = data && data.draw;
      if (next && next.id && next.id !== lastId &&
          Number.isFinite(next.createdAt) && Date.now() - next.createdAt <= MAX_AGE_MS &&
          next.createdAt <= Date.now() + 15000) {
        lastId = next.id;
        render(next);
      }
      setDebug('Terhubung · menunggu ramalan');
    } catch (error) {
      setDebug('Tidak bisa membaca state · mencoba ulang');
    } finally {
      clearTimeout(timeout);
      polling = false;
      schedule(POLL_MS);
    }
  }
  function makeDemo() {
    const sample = [
      { image: '/cards/major/18-moon.jpg', nameCn: 'The Moon', positionNameCn: 'Masa Lalu', isReversed: false },
      { image: '/cards/major/17-star.jpg', nameCn: 'The Star', positionNameCn: 'Saat Ini', isReversed: false },
      { image: '/cards/major/19-sun.jpg', nameCn: 'The Sun', positionNameCn: 'Masa Depan', isReversed: false },
    ];
    const label = topicLabels[topicDemo];
    const questionText = topicDemo === 'karir' ? 'Bagaimana peluang karierku tahun ini?'
      : topicDemo === 'nasib' ? 'Apa pesan kartu tentang nasibku ke depan?'
        : 'Apakah hubungan cintaku bisa membaik?';
    return {
      id: 'demo-live1-' + topicDemo, username: '@penonton',
      topic: topicDemo, question: questionText,
      giftName: 'Mawar', giftCount: 1, triggerType: 'gift',
      cards: spread === 'single' ? [sample[1]] : sample,
      narration: 'Halo @penonton, terima kasih sudah hadir. Aku sudah membaca pertanyaanmu tentang ' + label.toLowerCase() +
        '. Yuk kita lihat pesan kartu yang muncul. Ada sesuatu yang perlu kamu pahami dari pengalaman sebelumnya, tetapi bukan berarti masa depanmu sudah ditentukan.' +
        ' Kartu ini mengajakmu memperhatikan perasaan, peluang, dan langkah yang kamu ambil saat ini.' +
        ' Pelan-pelan saja, tidak harus memutuskan semuanya malam ini. Dengarkan suara hatimu, pertimbangkan situasi nyata, dan tetap percaya pada kemampuanmu untuk menentukan pilihan.' +
        ' Ingat ya, tarot adalah sarana refleksi, bukan jaminan masa depan.',
    };
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !demo) schedule(0);
  });
  if (demo) {
    render(makeDemo());
    setDebug('Mode demo · tidak mengirim event TikTok');
  } else {
    poll();
  }
})();
