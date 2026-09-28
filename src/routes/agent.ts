import { pageLayout } from '../lib/layout';
import { iconEye, iconStar } from '../lib/icons';
import { spreads } from '../lib/spreads';
import { allCards } from '../lib/cards';
import { markdownToHtmlFn } from '../lib/markdown';

export function agentPage(): string {
  const sampleQuestions = [
    'Bagaimana perkembangan karier saya ke depan?',
    'Bagaimana masa depan hubungan saya dengan dia?',
    'Saya sedang dihadapkan pilihan sulit, bagaimana memutuskannya?',
    'Berikan aku petunjuk tentang situasiku saat ini.',
  ];

  return pageLayout('Oracle', `
    <div class="oracle-shell">

      <!-- ── Header ── -->
      <div class="oracle-header">
        <div>
          <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.3em;margin-bottom:0.4rem;">ORACLE CHAMBER</p>
          <h1 class="font-heading text-bone oracle-title">
            Oracle <span class="text-gold-dim" aria-hidden="true">·</span> Percakapan
          </h1>
        </div>
        <div class="oracle-tone-row" role="group" aria-label="Pilih gaya Oracle">
          <span class="font-heading text-bone-whisper" style="font-size:9px;letter-spacing:0.15em;">GAYA:</span>
          <button type="button" data-tone="spiritual" id="tone-spiritual" class="tone-btn tone-active" aria-pressed="true">SPIRITUAL</button>
          <button type="button" data-tone="praktis"  id="tone-praktis"  class="tone-btn" aria-pressed="false">PRAKTIS</button>
          <button type="button" data-tone="puitis"   id="tone-puitis"   class="tone-btn" aria-pressed="false">PUITIS</button>
        </div>
      </div>

      <!-- ── Chat list ── -->
      <div id="chat-list" class="chat-list" role="log" aria-live="polite" aria-label="Percakapan Oracle">

        <!-- Welcome screen -->
        <div id="welcome-screen" class="welcome-screen">
          <div class="welcome-symbol anim-drift" aria-hidden="true">${iconEye(52)}</div>
          <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.35em;margin-bottom:1rem;display:flex;align-items:center;gap:0.6rem;">${iconStar(10)} ORACLE ${iconStar(10)}</p>
          <p class="font-body text-bone-faint" style="font-style:italic;line-height:1.9;max-width:400px;margin:0 auto 2rem;">
            Tidak perlu pilih kartu. Tidak perlu kocok sendiri.<br/>
            Cukup ajukan pertanyaanmu — Oracle akan memilih susunan, menarik kartu, dan menginterpretasikan.
          </p>
          <div class="welcome-prompts" id="welcome-prompts" role="list">
            ${sampleQuestions.map((q, idx) => `
              <button type="button"
                class="prompt-btn"
                role="listitem"
                data-sample-idx="${idx}"
                aria-label="Tanyakan: ${q}">
                <span class="prompt-arrow" aria-hidden="true">⟶</span>
                <span>${q}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- ── Input area ── -->
      <div class="chat-input-area">
        <div class="ink-panel chat-input-panel">
          <textarea id="chat-input" class="ink-input chat-textarea" rows="2"
            aria-label="Tulis pertanyaanmu untuk Oracle"
            placeholder="Sampaikan pertanyaanmu — Oracle akan memilihkan kartu untukmu…">
          </textarea>
          <div class="chat-btn-col">
            <button id="send-btn" class="btn-primary"
              style="padding:0.55rem 1.1rem;white-space:nowrap;"
              aria-label="Kirim pertanyaan">Kirim</button>
            <button id="stop-btn" class="btn-ghost"
              style="padding:0.55rem 1.1rem;display:none;"
              aria-label="Hentikan generasi">Berhenti</button>
          </div>
        </div>
        <div class="chat-footer-row">
          <div style="display:flex;gap:0.5rem;">
            <button id="reset-btn" class="btn-ghost" style="padding:0.4rem 1rem;font-size:10px;" aria-label="Mulai percakapan baru">Percakapan Baru</button>
            <button id="share-chat-btn" class="btn-ghost" style="padding:0.4rem 1rem;font-size:10px;" aria-label="Salin percakapan">Salin Percakapan</button>
          </div>
          <span class="font-heading text-bone-whisper" style="font-size:9px;letter-spacing:0.1em;">Enter kirim · Shift+Enter baris baru</span>
        </div>
        <p id="share-status" class="font-heading" style="font-size:10px;color:var(--gold-dim);letter-spacing:0.15em;margin-top:0.3rem;min-height:1em;" aria-live="polite"></p>
      </div>
    </div>

    <style>
      .oracle-shell {
        max-width: 820px;
        margin: 0 auto;
        padding: 2rem 1.25rem 1rem;
        display: flex;
        flex-direction: column;
        height: calc(100dvh - 0px);
      }
      .oracle-header {
        display: flex; align-items: flex-start;
        justify-content: space-between;
        flex-wrap: wrap; gap: 0.75rem;
        margin-bottom: 1rem;
        flex-shrink: 0;
      }
      .oracle-title { font-size: clamp(1.1rem,3vw,1.5rem); letter-spacing: 0.15em; }
      .oracle-tone-row {
        display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;
      }

      /* ── Chat list ── */
      .chat-list {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-right: 0.25rem;
        margin-bottom: 0.75rem;
        scroll-behavior: smooth;
        scrollbar-width: thin;
      }

      /* ── Welcome ── */
      .welcome-screen {
        text-align: center;
        padding: 3.5rem 1rem;
        display: flex; flex-direction: column; align-items: center;
      }
      .welcome-symbol {
        color: var(--gold-dim);
        margin-bottom: 1.5rem;
        filter: drop-shadow(0 0 12px rgba(200,168,75,0.3));
        display: flex; align-items: center; justify-content: center;
      }
      .welcome-prompts {
        display: flex; flex-direction: column;
        gap: 0.6rem; width: 100%; max-width: 460px;
      }
      .prompt-btn {
        background: var(--ink-veil);
        border: 1px solid var(--ink-line);
        padding: 0.8rem 1rem;
        text-align: left; cursor: pointer;
        font-family: var(--font-body);
        font-size: 0.88rem;
        color: var(--bone-faint);
        display: flex; align-items: center; gap: 0.75rem;
        transition: border-color 0.3s, color 0.3s, background 0.3s, transform 0.3s;
        font-style: italic;
        line-height: 1.5;
      }
      .prompt-btn:hover {
        border-color: var(--gold-dim);
        color: var(--bone);
        background: rgba(200,168,75,0.05);
        transform: translateX(4px);
      }
      .prompt-arrow {
        color: var(--gold-dim);
        flex-shrink: 0;
        transition: transform 0.3s;
      }
      .prompt-btn:hover .prompt-arrow { transform: translateX(3px); }

      /* ── Chat bubbles ── */
      .chat-bubble-wrap {
        display: flex;
        animation: fadeUp 0.4s var(--ease-emerge) both;
      }
      .chat-bubble-wrap.user-wrap  { justify-content: flex-end; }
      .chat-bubble-wrap.oracle-wrap { justify-content: flex-start; }
      .chat-bubble {
        max-width: 85%;
        padding: 1rem 1.25rem;
      }
      .user-bubble {
        background: rgba(200,168,75,0.08);
        border: 1px solid var(--gold-faint);
      }
      .oracle-bubble {
        background: var(--ink-veil);
        border: 1px solid var(--ink-line);
        width: 100%;
        max-width: 100%;
      }
      .bubble-label {
        font-family: var(--font-heading);
        font-size: 10px;
        letter-spacing: 0.2em;
        margin-bottom: 0.5rem;
      }

      /* Oracle card strip */
      .oracle-card-strip {
        display: flex; gap: 0.5rem;
        overflow-x: auto;
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
        scrollbar-width: thin;
      }
      .oracle-mini-card {
        flex-shrink: 0; text-align: center;
        display: flex; flex-direction: column; align-items: center; gap: 3px;
      }
      .oracle-mini-frame {
        width: 52px; height: 82px;
        overflow: hidden;
        border: 1px solid var(--ink-line);
        transition: border-color 0.3s;
        position: relative;
      }
      .oracle-mini-frame:hover { border-color: var(--gold-faint); }
      .oracle-mini-label {
        font-family: var(--font-heading);
        font-size: 7.5px; letter-spacing: 0.08em;
        color: var(--bone-whisper);
        max-width: 52px; line-height: 1.3;
      }

      /* ── Input area ── */
      .chat-input-area { flex-shrink: 0; }
      .chat-input-panel {
        display: flex; gap: 0.75rem;
        align-items: flex-end;
        padding: 0.85rem 1rem;
        margin-bottom: 0.6rem;
      }
      .chat-textarea {
        flex: 1; border: none;
        background: none; padding: 0;
        resize: none; font-size: 0.95rem;
      }
      .chat-btn-col { display: flex; flex-direction: column; gap: 0.4rem; }
      .chat-footer-row {
        display: flex; justify-content: space-between;
        flex-wrap: wrap; gap: 0.5rem;
        align-items: center;
        margin-bottom: 0.3rem;
      }
    </style>

    <script>
    ${markdownToHtmlFn}

    const SPREADS   = ${JSON.stringify(spreads)};
    const ALL_CARDS = ${JSON.stringify(allCards)};
    const SAMPLE_QUESTIONS = ${JSON.stringify(sampleQuestions)};

    let conversationHistory = [];
    let displayLog = [];
    let currentReader = null;
    let isRunning = false;
    let currentTone = 'spiritual';

    /* ── XSS-safe text escaping ── */
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    /* ── Tone ── */
    function setTone(t) {
      currentTone = t;
      document.querySelectorAll('.oracle-tone-row .tone-btn').forEach(b => {
        b.classList.remove('tone-active');
        b.setAttribute('aria-pressed', 'false');
      });
      const active = document.getElementById('tone-' + t);
      if (active) { active.classList.add('tone-active'); active.setAttribute('aria-pressed', 'true'); }
    }

    /* ── Submit ── */
    function submitChat() {
      const input = document.getElementById('chat-input');
      const q = input.value.trim();
      if (!q || isRunning) return;
      input.value = '';
      input.style.height = '';
      sendQuestion(q);
    }

    /* ── Main send flow ── */
    async function sendQuestion(question) {
      if (isRunning) return;
      document.getElementById('welcome-screen')?.remove();
      isRunning = true;

      appendUserBubble(question);
      displayLog.push({ type: 'user', text: question });

      /* Pick spread */
      let spread = null;
      try {
        const pickRes = await fetch('/api/pick-spread', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question }),
        });
        if (pickRes.ok) {
          const picked = await pickRes.json();
          spread = picked.spread || null;
        }
      } catch {}
      if (!spread) spread = pickSpreadHeuristic(question);

      /* Draw cards */
      const shuffled = fisherYates(ALL_CARDS);
      const drawnCards = spread.positions.map((pos, i) => ({
        card: shuffled[i], position: pos, isReversed: Math.random() < 0.35,
      }));

      /* Oracle message container */
      const msgId = 'msg-' + Date.now();
      const oracleEl = appendOracleBubble(msgId, spread, drawnCards);
      const textEl   = oracleEl.querySelector('.oracle-text');

      document.getElementById('send-btn').style.display = 'none';
      document.getElementById('stop-btn').style.display = 'block';
      oracleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

      try {
        const res = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, spread, drawnCards, tone: currentTone, history: conversationHistory }),
        });

        if (!res.ok) {
          const e = await res.json();
          textEl.textContent = e.blocked
            ? '🚫 Akses ke layanan ini tidak tersedia untuk koneksimu.'
            : (e.error || 'Gagal mendapatkan interpretasi');
          textEl.classList.remove('streaming-cursor');
          done(); return;
        }

        /* Rate limit display + global badge update */
        const remaining = res.headers.get('X-RateLimit-Remaining');
        const resetAtMs = res.headers.get('X-RateLimit-Reset');
        const limitHdr  = res.headers.get('X-RateLimit-Limit');
        if (remaining !== null && window.updateCreditBadge) {
          window.updateCreditBadge(remaining, limitHdr, resetAtMs);
        }
        const shareStatus = document.getElementById('share-status');
        if (remaining !== null && shareStatus) {
          if (remaining === '0') {
            const resetLabel = resetAtMs
              ? ' — pulih ' + new Date(Number(resetAtMs)).toLocaleDateString('id-ID', { day:'numeric', month:'long' })
              : '';
            shareStatus.textContent = 'Kredit habis' + resetLabel;
          } else {
            shareStatus.textContent = 'Kredit tersisa: ' + remaining;
            setTimeout(() => { shareStatus.textContent = ''; }, 4000);
          }
        }

        /* SSE stream with line buffer to handle cross-chunk splits */
        currentReader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = '';
        let sseBuffer = '';
        textEl.innerHTML = '';

        while (true) {
          const { done: d, value } = await currentReader.read();
          if (d) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\\n');
          // Keep last incomplete line in buffer
          sseBuffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const j = JSON.parse(data);
              const delta = j.choices?.[0]?.delta?.content;
              if (delta) { text += delta; textEl.innerHTML = markdownToHtml(text); }
            } catch {}
          }
        }
        // Flush remaining buffer
        if (sseBuffer.startsWith('data: ')) {
          const data = sseBuffer.slice(6).trim();
          if (data && data !== '[DONE]') {
            try {
              const j = JSON.parse(data);
              const delta = j.choices?.[0]?.delta?.content;
              if (delta) { text += delta; textEl.innerHTML = markdownToHtml(text); }
            } catch {}
          }
        }

        textEl.classList.remove('streaming-cursor');

        conversationHistory.push({ role: 'user', content: question });
        conversationHistory.push({ role: 'assistant', content: text });
        if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);
        displayLog.push({ type: 'oracle', text, spread, drawnCards });
        saveOracleSession();

      } catch (err) {
        if (textEl) { textEl.textContent = 'Koneksi gagal: ' + err.message; textEl.classList.remove('streaming-cursor'); }
      }
      done();
    }

    /* ── DOM helpers ── */
    function appendUserBubble(text) {
      const list = document.getElementById('chat-list');
      const wrap = document.createElement('div');
      wrap.className = 'chat-bubble-wrap user-wrap';
      // FIX BUG-1: Use textContent instead of innerHTML for user input (XSS safe)
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble user-bubble';
      const label = document.createElement('p');
      label.className = 'bubble-label';
      label.style.color = 'var(--gold-dim)';
      label.textContent = 'KAMU';
      const body = document.createElement('p');
      body.className = 'font-body';
      body.style.cssText = 'color:var(--bone-dim);line-height:1.7;';
      body.textContent = text; // textContent — XSS safe
      bubble.appendChild(label);
      bubble.appendChild(body);
      wrap.appendChild(bubble);
      list.appendChild(wrap);
      wrap.scrollIntoView({ behavior: 'smooth', block: 'end' });
      return wrap;
    }

    function appendOracleBubble(id, spread, drawnCards) {
      const list = document.getElementById('chat-list');
      const wrap = document.createElement('div');
      wrap.className = 'chat-bubble-wrap oracle-wrap';
      wrap.id = id;

      const cardStrip = drawnCards.map(dc => \`
        <div class="oracle-mini-card" role="listitem">
          <div class="oracle-mini-frame">
            <img src="\${escapeHtml(dc.card.image)}" alt="\${escapeHtml(dc.card.name)}" loading="lazy"
              style="width:100%;height:100%;object-fit:cover;\${dc.isReversed ? 'transform:rotate(180deg);' : ''}" />
            \${dc.isReversed ? '<div style="position:absolute;top:2px;right:2px;background:rgba(5,5,7,0.88);padding:1px 3px;"><span style="font-size:6px;color:var(--gold);font-family:var(--font-heading);">↻</span></div>' : ''}
          </div>
          <p class="oracle-mini-label">\${escapeHtml(dc.position.nameCn)}</p>
        </div>
      \`).join('');

      wrap.innerHTML = \`
        <div class="chat-bubble oracle-bubble">
          <p class="bubble-label" style="color:var(--celestial-dim);">ORACLE</p>
          <div style="margin-bottom:0.75rem;">
            <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.2em;">
              \${escapeHtml(spread.nameCn)} <span style="color:var(--ink-shine);">·</span> \${escapeHtml(spread.name)}
            </p>
            <p class="font-body text-bone-faint" style="font-size:0.82rem;font-style:italic;margin-top:0.2rem;">\${escapeHtml(spread.description)}</p>
          </div>
          <div class="oracle-card-strip" role="list" aria-label="Kartu yang ditarik">\${cardStrip}</div>
          <div class="rule-ink" style="margin-bottom:0.85rem;"></div>
          <div class="oracle-text streaming-cursor prose-tarot" aria-live="polite"></div>
        </div>
      \`;
      list.appendChild(wrap);
      return wrap;
    }

    /* ── Helpers ── */
    function fisherYates(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function pickSpreadHeuristic(q) {
      const ql = q.toLowerCase();
      if (ql.includes('pilih') || ql.includes('antara') || ql.includes('atau'))
        return SPREADS.find(s => s.id === 'two-options') || SPREADS[1];
      if (ql.includes('hubungan') || ql.includes('cinta') || ql.includes('pasangan') || ql.includes(' dia '))
        return SPREADS.find(s => s.id === 'relationship') || SPREADS[1];
      if (ql.includes('asal') || ql.includes('kenapa') || ql.includes('penyebab'))
        return SPREADS.find(s => s.id === 'timeline') || SPREADS[1];
      if (ql.includes('mendalam') || q.split(' ').length > 20)
        return SPREADS.find(s => s.id === 'celtic-cross') || SPREADS[1];
      if (q.split(' ').length <= 5)
        return SPREADS.find(s => s.id === 'single') || SPREADS[0];
      return SPREADS.find(s => s.id === 'three-card') || SPREADS[1];
    }

    function stopGeneration() {
      if (currentReader) { currentReader.cancel().catch(() => {}).finally(() => done()); }
      else done();
    }

    function done() {
      isRunning = false; currentReader = null;
      document.getElementById('send-btn').style.display = 'block';
      document.getElementById('stop-btn').style.display = 'none';
      document.querySelectorAll('.streaming-cursor').forEach(el => el.classList.remove('streaming-cursor'));
    }

    /* ── Share ── */
    function shareChat() {
      const lines = [
        'Jalur Tarot — Oracle Session',
        new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' }), '',
      ];
      displayLog.forEach(entry => {
        if (entry.type === 'user') { lines.push('[ KAMU ]', entry.text); }
        else {
          lines.push('[ ORACLE ]');
          if (entry.spread) lines.push('Susunan: ' + entry.spread.nameCn);
          if (entry.drawnCards) entry.drawnCards.forEach(dc =>
            lines.push('  ' + dc.position.nameCn + ': ' + dc.card.nameCn + (dc.isReversed ? ' (terbalik)' : ''))
          );
          lines.push(entry.text.replace(/<[^>]+>/g, '').trim());
        }
        lines.push('');
      });
      navigator.clipboard.writeText(lines.join('\\n')).then(() => {
        document.getElementById('share-status').textContent = '✦ Tersalin ke clipboard';
        setTimeout(() => { document.getElementById('share-status').textContent = ''; }, 2500);
      }).catch(() => {
        document.getElementById('share-status').textContent = 'Tidak bisa menyalin otomatis';
      });
    }

    /* ── Save ── */
    const _sessionId = 'o-' + Date.now();
    function saveOracleSession() {
      try {
        const sessions = JSON.parse(localStorage.getItem('jalurtarot-oracle-v1') || '[]');
        const idx = sessions.findIndex(s => s.id === _sessionId);
        const record = { id: _sessionId, createdAt: new Date().toISOString(), tone: currentTone, log: displayLog, updatedAt: new Date().toISOString() };
        if (idx >= 0) sessions[idx] = record;
        else sessions.unshift(record);
        if (sessions.length > 50) sessions.splice(50);
        localStorage.setItem('jalurtarot-oracle-v1', JSON.stringify(sessions));
      } catch {}
    }

    /* ── Reset — FIX IMP-2: rebuild welcome with proper event listeners ── */
    function buildWelcomeScreen() {
      const welcome = document.createElement('div');
      welcome.id = 'welcome-screen';
      welcome.className = 'welcome-screen';
      const iconHtml = \`<div class="welcome-symbol anim-drift" aria-hidden="true">${iconEye(52)}</div>
        <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.35em;margin-bottom:1rem;display:flex;align-items:center;gap:0.6rem;">${iconStar(10)} ORACLE ${iconStar(10)}</p>
        <p class="font-body text-bone-faint" style="font-style:italic;line-height:1.9;max-width:400px;margin:0 auto 2rem;">Percakapan baru dimulai. Ajukan pertanyaanmu.</p>\`;

      const promptsWrap = document.createElement('div');
      promptsWrap.className = 'welcome-prompts';
      promptsWrap.setAttribute('role', 'list');

      const promptsHtml = document.createElement('div');
      promptsHtml.innerHTML = iconHtml;
      // prepend icon html
      welcome.innerHTML = iconHtml;

      SAMPLE_QUESTIONS.forEach(function(q) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'prompt-btn';
        btn.setAttribute('role', 'listitem');
        btn.setAttribute('aria-label', 'Tanyakan: ' + q);
        btn.innerHTML = '<span class="prompt-arrow" aria-hidden="true">⟶</span><span></span>';
        btn.querySelector('span:last-child').textContent = q; // XSS safe
        btn.addEventListener('click', function() { sendQuestion(q); });
        promptsWrap.appendChild(btn);
      });

      welcome.appendChild(promptsWrap);
      return welcome;
    }

    function resetChat() {
      conversationHistory = []; displayLog = [];
      const list = document.getElementById('chat-list');
      list.innerHTML = '';
      list.appendChild(buildWelcomeScreen());
    }

    /* ── Init — semua event listener via addEventListener ── */

    // Tone selector
    document.querySelectorAll('.oracle-tone-row .tone-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        setTone(this.getAttribute('data-tone'));
      });
    });

    // Chat input: Enter to send
    var chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitChat(); }
      });
      // Auto-resize
      chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });
    }

    // Send button
    var sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.addEventListener('click', function() { submitChat(); });

    // Stop button
    var stopBtn = document.getElementById('stop-btn');
    if (stopBtn) stopBtn.addEventListener('click', function() { stopGeneration(); });

    // Reset button
    var resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', function() { resetChat(); });

    // Share button
    var shareChatBtn = document.getElementById('share-chat-btn');
    if (shareChatBtn) shareChatBtn.addEventListener('click', function() { shareChat(); });

    // FIX IMP-2: Welcome screen sample prompt buttons — addEventListener (bukan onclick=)
    document.querySelectorAll('#welcome-prompts .prompt-btn').forEach(function(btn) {
      var idx = parseInt(btn.getAttribute('data-sample-idx'), 10);
      btn.addEventListener('click', function() { sendQuestion(SAMPLE_QUESTIONS[idx]); });
    });
    </script>
  `, '', { description: 'Oracle Jalur Tarot — ajukan pertanyaanmu, Oracle akan memilihkan susunan dan kartu untukmu.' });
}