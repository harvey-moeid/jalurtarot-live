import { pageLayout } from '../lib/layout';
import { spreads } from '../lib/spreads';
import { allCards } from '../lib/cards';
import { markdownToHtmlFn } from '../lib/markdown';
import { iconStar } from '../lib/icons';

export function readingPage(): string {
  // ★ Ramalan Live — hanya kartu tunggal & tiga kartu, tanpa AI (data lokal repo)
  const liveSpreads = spreads.filter(s => s.id === 'single' || s.id === 'three-card');
  const spreadsJson = JSON.stringify(liveSpreads);
  const cardsJson   = JSON.stringify(allCards);

  // Deck back cards HTML
  const deckCards = [0,1,2,3,4].map(i =>
    `<div id="deck-card-${i}" class="deck-card-item"
      style="position:absolute;width:130px;height:200px;
             background:var(--ink-mist);border:1px solid var(--gold-faint);
             transform:rotate(${(i-2)*3}deg) translateY(${i*2}px);
             transition:transform 0.55s var(--ease-emerge);">
       <div style="position:absolute;inset:8px;border:1px solid rgba(200,168,75,0.1);
         background:repeating-linear-gradient(45deg,rgba(200,168,75,0.025) 0px,rgba(200,168,75,0.025) 1px,transparent 1px,transparent 8px),
                    repeating-linear-gradient(-45deg,rgba(200,168,75,0.025) 0px,rgba(200,168,75,0.025) 1px,transparent 1px,transparent 8px);">
       </div>
       <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(200,168,75,0.2);">
         ${iconStar(28)}
       </div>
     </div>`
  ).join('');

  return pageLayout('Ramalan', `
    <div id="reading-app" class="reading-app-wrap" role="main">

      <!-- ════════════════════
           PHASE 1: QUESTION
      ════════════════════ -->
      <div id="phase-question" class="phase-panel reading-phase" aria-label="Fase Pertanyaan">
        <div class="phase-header">
          <p class="phase-label">BABAK I · PERTANYAAN</p>
          <h1 class="font-display text-bone phase-title">Apa yang kamu cari?</h1>
          <p class="font-body text-bone-faint phase-subtitle">Pusatkan pikiranmu, biarkan pertanyaan muncul dari dalam</p>
        </div>
        <textarea id="question-input" class="ink-input" rows="4"
          aria-label="Tulis pertanyaanmu"
          placeholder="Tuliskan pertanyaanmu di sini…"
          style="margin-bottom:0.5rem;font-size:1.1rem;">
        </textarea>

        <!-- Validation error message -->
        <p id="question-error" class="font-heading" role="alert" aria-live="polite"
          style="font-size:10px;letter-spacing:0.2em;color:var(--rose);margin-bottom:1rem;
                 min-height:1.2em;transition:opacity 0.3s;opacity:0;">
          ✦ TULIS PERTANYAANMU TERLEBIH DAHULU
        </p>

        <!-- Tone selector -->
        <div class="tone-row" id="tone-selector" role="group" aria-label="Pilih gaya interpretasi">
          <span class="font-heading text-bone-whisper" style="font-size:10px;letter-spacing:0.2em;align-self:center;">GAYA:</span>
          <button type="button" data-tone="spiritual" id="tone-spiritual" class="tone-btn tone-active" aria-pressed="true">SPIRITUAL</button>
          <button type="button" data-tone="praktis"  id="tone-praktis"  class="tone-btn" aria-pressed="false">PRAKTIS</button>
          <button type="button" data-tone="puitis"   id="tone-puitis"   class="tone-btn" aria-pressed="false">PUITIS</button>
        </div>

        <button id="btn-go-spread" class="btn-primary" style="width:100%;padding:1rem;" aria-label="Lanjut ke pilih susunan">
          Bawa Pertanyaan Ini →
        </button>
      </div>

      <!-- ════════════════════
           PHASE 2: SPREAD
      ════════════════════ -->
      <div id="phase-spread" class="phase-panel reading-phase hidden" aria-label="Fase Pilih Susunan">
        <div class="phase-header">
          <p class="phase-label">BABAK II · PILIH SUSUNAN</p>
          <h2 class="font-heading text-bone phase-title" style="font-size:clamp(1.3rem,3vw,2rem);">Bentuk Takdir</h2>
          <p id="spread-suggestion" class="font-body text-gold-dim" style="font-size:0.85rem;font-style:italic;margin-top:0.5rem;min-height:1.3em;" aria-live="polite"></p>
        </div>
        <div id="spread-grid" class="spread-grid-layout" role="list" aria-label="Pilih susunan kartu"></div>
        <div style="text-align:center;margin-top:0.5rem;">
          <button id="btn-go-question" class="btn-ghost" style="margin-right:1rem;" aria-label="Kembali ke pertanyaan">← Kembali</button>
          <button id="confirm-spread-btn" class="btn-primary" style="display:none;" aria-label="Konfirmasi pilihan susunan">Pilih Susunan Ini →</button>
        </div>
      </div>

      <!-- ════════════════════
           PHASE 3: SHUFFLE
      ════════════════════ -->
      <div id="phase-shuffle" class="phase-panel reading-phase hidden" style="text-align:center;" aria-label="Fase Kocok Kartu">
        <p class="phase-label">BABAK III · KOCOK KARTU</p>
        <!-- FIX: Hapus duplikat id="deck-visual-btn" — hanya pakai satu id yang benar -->
        <button id="deck-visual-btn" class="deck-visual-btn"
          aria-label="Klik untuk mengocok kartu">
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
            ${deckCards}
            <div style="position:relative;z-index:5;color:var(--gold-faint);pointer-events:none;
              filter:drop-shadow(0 0 20px rgba(200,168,75,0.3));">${iconStar(40)}</div>
          </div>
        </button>
        <p class="font-body text-bone-faint" style="font-style:italic;margin-bottom:1.5rem;line-height:1.7;" id="shuffle-hint" aria-live="polite">
          Kocok kartu sambil merenungkan pertanyaanmu dalam hati
        </p>
        <button id="shuffle-btn" class="btn-primary" style="width:100%;max-width:400px;padding:1rem;" aria-label="Kocok dan tarik kartu">
          Kocok & Tarik Kartu
        </button>
        <!-- FIX: Tombol terpisah untuk "Mulai Tarik" agar tidak ada onclick-override -->
        <button id="draw-btn" class="btn-primary" style="width:100%;max-width:400px;padding:1rem;display:none;" aria-label="Mulai tarik kartu">
          Mulai Tarik Kartu →
        </button>
      </div>

      <!-- ════════════════════
           PHASE 4: DRAW
      ════════════════════ -->
      <div id="phase-draw" class="phase-panel reading-phase hidden" style="max-width:960px;width:100%;" aria-label="Fase Tarik Kartu">
        <div class="phase-header">
          <p class="phase-label">BABAK IV · TARIK KARTU</p>
          <h2 class="font-heading text-bone phase-title" id="draw-title" style="font-size:1.4rem;">Sentuh kartu satu per satu</h2>
          <p class="font-body text-bone-faint phase-subtitle">Setiap sentuhan membuka sebuah cermin</p>
        </div>
        <div id="draw-grid" class="draw-grid-layout" role="list" aria-label="Kartu yang ditarik"></div>
        <div style="text-align:center;margin-top:1rem;">
          <button id="reveal-all-btn" class="btn-ghost" style="display:none;" aria-label="Buka semua kartu sekaligus">Buka Semua Kartu</button>
        </div>
      </div>

      <!-- ════════════════════
           PHASE 5: INTERPRET
      ════════════════════ -->
      <div id="phase-interpret" class="phase-panel reading-phase hidden" style="max-width:860px;width:100%;" aria-label="Fase Interpretasi Oracle">
        <div class="phase-header">
          <p class="phase-label">BABAK V · ORACLE</p>
          <h2 class="font-heading text-bone phase-title" style="font-size:1.4rem;">Oracle Berbicara</h2>
        </div>

        <!-- Mini card summary -->
        <div id="cards-summary" class="cards-summary-strip" role="list" aria-label="Ringkasan kartu yang ditarik"></div>

        <!-- Mode badge (tone aktif + static notice) -->
        <div id="mode-badge-row" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.85rem;flex-wrap:wrap;gap:0.5rem;">
          <span id="tone-badge" class="font-heading" style="font-size:9px;letter-spacing:0.2em;color:var(--gold-dim);border:1px solid var(--gold-faint);padding:3px 10px;"></span>
          <span id="static-notice" style="display:none;font-family:var(--font-heading);font-size:9px;letter-spacing:0.15em;color:var(--mist);border:1px solid rgba(92,110,144,0.3);padding:3px 10px;">MODE HENING · Bisikan sunyi</span>
        </div>

        <!-- Interpretation panel -->
        <div class="ink-panel interpret-panel">
          <div id="interp-text" class="prose-tarot" aria-live="polite" aria-atomic="false">
            <div class="spinner-row">
              <div class="spinner" aria-hidden="true"></div>
              <span class="font-heading text-bone-faint" style="font-size:11px;letter-spacing:0.2em;">Oracle sedang memproses…</span>
            </div>
          </div>
        </div>

        <!-- Follow-up -->
        <div id="followup-section" style="display:none;">
          <div class="ink-panel" style="padding:1.5rem;margin-bottom:1rem;">
            <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.25em;margin-bottom:1rem;">PERTANYAAN LANJUTAN</p>
            <textarea id="followup-input" class="ink-input" rows="3"
              aria-label="Pertanyaan lanjutan ke Oracle"
              placeholder="Tanyakan lebih dalam tentang kartu, tindakan spesifik, atau sudut pandang lain…"
              style="margin-bottom:1rem;"></textarea>
            <button id="btn-followup" class="btn-primary" style="width:100%;padding:0.75rem;" aria-label="Kirim pertanyaan lanjutan">Tanya Lanjut</button>
          </div>
          <div id="followup-list" aria-live="polite"></div>
        </div>

        <!-- Actions -->
        <div class="interpret-actions">
          <button id="btn-new-reading" class="btn-primary" aria-label="Mulai ramalan baru">Ramalan Baru</button>
          <button id="btn-retry" class="btn-ghost" aria-label="Minta interpretasi ulang">Interpretasi Ulang</button>
          <button id="share-btn" class="btn-ghost" aria-label="Salin hasil ramalan">Salin Hasil</button>
        </div>
        <p id="share-status" class="font-heading" style="text-align:center;font-size:11px;color:var(--gold-dim);letter-spacing:0.15em;margin-top:0.75rem;min-height:1.2em;" aria-live="polite"></p>
      </div>

    </div>

    <style>
      .reading-app-wrap {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 1.5rem 3rem;
      }
      .reading-phase {
        max-width: 680px;
        width: 100%;
        text-align: center;
      }
      .phase-header { margin-bottom: 2rem; }
      .phase-label {
        font-family: var(--font-heading);
        color: var(--gold-dim);
        font-size: 10px;
        letter-spacing: 0.4em;
        margin-bottom: 0.85rem;
      }
      .phase-title {
        font-size: clamp(1.5rem,4vw,2.5rem);
        letter-spacing: 0.1em;
        margin-bottom: 0.75rem;
        line-height: 1.1;
      }
      .phase-subtitle {
        font-style: italic;
        font-size: 1rem;
        line-height: 1.7;
      }
      .tone-row {
        display: flex; gap: 0.5rem;
        justify-content: center;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }

      /* Spread grid */
      .spread-grid-layout {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.85rem;
        margin-bottom: 2rem;
        text-align: left;
      }
      @media (max-width: 500px) {
        .spread-grid-layout {
          grid-template-columns: 1fr;
        }
      }

      /* Deck visual */
      .deck-visual-btn {
        position: relative;
        width: 160px; height: 250px;
        margin: 0 auto 2rem;
        cursor: pointer;
        background: none; border: none;
        transition: filter 0.4s;
      }
      .deck-visual-btn:hover {
        filter: drop-shadow(0 0 16px rgba(200,168,75,0.25));
      }
      /* Deck glow setelah dikocok */
      .deck-visual-btn.shuffled {
        filter: drop-shadow(0 0 20px rgba(200,168,75,0.4));
      }

      /* Draw grid */
      .draw-grid-layout {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 1.5rem;
      }

      /* Cards summary strip */
      .cards-summary-strip {
        display: flex;
        gap: 0.6rem;
        overflow-x: auto;
        padding-bottom: 0.75rem;
        margin-bottom: 2rem;
        scrollbar-width: thin;
      }

      /* Interpret panel */
      .interpret-panel {
        padding: 2rem;
        margin-bottom: 1.5rem;
        position: relative;
      }
      .interpret-panel::before {
        content: '';
        position: absolute; inset-x: 15%; top: 0; height: 1px;
        background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
      }

      /* Spinner */
      .spinner-row { display: flex; align-items: center; gap: 0.75rem; }
      .spinner {
        width: 16px; height: 16px;
        border: 1px solid var(--gold-dim);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        flex-shrink: 0;
      }

      /* Actions */
      .interpret-actions {
        display: flex; gap: 1rem;
        flex-wrap: wrap; justify-content: center;
        margin-top: 1.5rem;
      }

      /* Input validation */
      @keyframes inputShake {
        0%, 100% { transform: translateX(0); }
        15%       { transform: translateX(-7px); }
        40%       { transform: translateX(7px); }
        65%       { transform: translateX(-5px); }
        85%       { transform: translateX(3px); }
      }
      .input-error {
        animation: inputShake 0.45s var(--ease-emerge) !important;
        border-color: var(--rose) !important;
        box-shadow: 0 0 0 1px rgba(140,90,90,0.25) inset, 0 0 14px rgba(140,90,90,0.08) !important;
      }

      /* Shuffle counter indicator */
      .shuffle-count-ring {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px; height: 20px;
        border: 1px solid var(--gold-dim);
        border-radius: 50%;
        font-family: var(--font-heading);
        font-size: 9px;
        color: var(--gold-dim);
        margin-left: 0.4rem;
        vertical-align: middle;
        transition: all 0.3s;
      }
      .shuffle-count-ring.ring-ready {
        border-color: var(--gold);
        color: var(--gold);
        box-shadow: 0 0 6px rgba(200,168,75,0.3);
      }
    </style>

    <script>
    ${markdownToHtmlFn}

    const SPREADS  = ${spreadsJson};
    const ALL_CARDS = ${cardsJson};

    let state = {
      phase: 'question',
      question: '',
      spread: null,
      drawnCards: [],
      revealedCount: 0,
      interpretation: '',
      followUps: [],
      readingId: null,
      tone: 'spiritual',
    };

    /* ── Tone ── */
    function setTone(t) {
      state.tone = t;
      document.querySelectorAll('#tone-selector .tone-btn').forEach(b => {
        b.classList.remove('tone-active');
        b.setAttribute('aria-pressed', 'false');
      });
      const active = document.getElementById('tone-' + t);
      if (active) { active.classList.add('tone-active'); active.setAttribute('aria-pressed', 'true'); }
    }

    /* ── Phase navigation with animation ── */
    let _currentPhase = 'question';
    function showPhase(next) {
      const currentId = 'phase-' + _currentPhase;
      const nextId    = 'phase-' + next;
      _currentPhase = next;
      state.phase   = next;
      if (typeof window.showPhaseAnimated === 'function') {
        window.showPhaseAnimated(currentId, nextId);
      } else {
        document.querySelectorAll('.phase-panel').forEach(el => el.classList.add('hidden'));
        const nextEl = document.getElementById(nextId);
        if (nextEl) nextEl.classList.remove('hidden');
      }
    }

    function goToQuestion() { showPhase('question'); }

    async function goToSpread() {
      const q = document.getElementById('question-input').value.trim();
      if (!q) {
        const input  = document.getElementById('question-input');
        const errMsg = document.getElementById('question-error');
        input.focus();
        input.classList.remove('input-error');
        void input.offsetWidth;
        input.classList.add('input-error');
        if (errMsg) { errMsg.style.opacity = '1'; }
        setTimeout(() => {
          input.classList.remove('input-error');
          if (errMsg) errMsg.style.opacity = '0';
        }, 2500);
        return;
      }
      state.question = q;
      renderSpreads();
      showPhase('spread');

      const hint = document.getElementById('spread-suggestion');
      if (hint) hint.textContent = '✦ Pilih Kartu Tunggal atau Tiga Kartu di bawah';
    }

    function goToShuffle() {
      if (!state.spread) return;
      // Reset shuffle state setiap kali masuk phase shuffle
      _shuffleCount = 0;
      _shuffleReady = false;
      const shuffleBtn = document.getElementById('shuffle-btn');
      const drawBtn    = document.getElementById('draw-btn');
      const hint       = document.getElementById('shuffle-hint');
      const deckBtn    = document.getElementById('deck-visual-btn');
      if (shuffleBtn) { shuffleBtn.style.display = 'inline-block'; shuffleBtn.textContent = 'Kocok & Tarik Kartu'; }
      if (drawBtn)    { drawBtn.style.display = 'none'; }
      if (hint)       { hint.textContent = 'Kocok kartu sambil merenungkan pertanyaanmu dalam hati'; }
      if (deckBtn)    { deckBtn.classList.remove('shuffled'); }
      showPhase('shuffle');
    }

    function goToDraw() {
      state.drawnCards    = drawCards(state.spread);
      state.revealedCount = 0;
      renderDrawGrid();
      showPhase('draw');
    }

    /* ── Spreads — with visual position dots ── */
    function renderSpreads() {
      const grid = document.getElementById('spread-grid');
      grid.innerHTML = SPREADS.map(s => {
        const dots = Array.from({ length: Math.min(s.positions.length, 12) }, () =>
          '<div class="spread-dot" aria-hidden="true"></div>'
        ).join('');
        return \`
          <div class="spread-card" id="spread-\${s.id}"
            role="option" tabindex="0" aria-selected="false"
            aria-label="\${s.nameCn}: \${s.positions.length} kartu"
            data-spread-id="\${s.id}">
            <div class="spread-positions">\${dots}</div>
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
              <span class="font-heading text-bone" style="font-size:0.95rem;letter-spacing:0.1em;">\${s.nameCn}</span>
              <span class="font-heading text-bone-whisper" style="font-size:10px;">\${s.positions.length}K</span>
            </div>
            <p class="font-heading text-gold-dim" style="font-size:9px;letter-spacing:0.15em;margin-bottom:0.5rem;">\${s.name.toUpperCase()}</p>
            <p class="font-body text-bone-faint" style="font-size:0.85rem;line-height:1.65;">\${s.description}</p>
          </div>
        \`;
      }).join('');

      // FIX: Attach event listener setelah render, bukan pakai inline onclick
      document.querySelectorAll('.spread-card').forEach(function(card) {
        card.addEventListener('click', function() {
          selectSpread(this.getAttribute('data-spread-id'));
        });
        card.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectSpread(this.getAttribute('data-spread-id'));
          }
        });
      });
    }

    function selectSpread(id) {
      state.spread = SPREADS.find(s => s.id === id);
      document.querySelectorAll('.spread-card').forEach(el => {
        el.classList.remove('selected');
        el.setAttribute('aria-selected', 'false');
      });
      const el = document.getElementById('spread-' + id);
      if (el) { el.classList.add('selected'); el.setAttribute('aria-selected', 'true'); }
      const btn = document.getElementById('confirm-spread-btn');
      if (btn) btn.style.display = 'inline-block';
    }

    /* ── Shuffle ──
       FIX: Pisahkan state shuffle dan draw ke tombol berbeda.
       Kocok minimal 1x → tampilkan tombol "Mulai Tarik Kartu" terpisah.
       Tidak ada btn.onclick override → tidak ada double-fire risk.
    ── */
    let _shuffleCount = 0;
    let _shuffleReady = false;

    function shuffleDeck() {
      _shuffleCount++;
      const cards = document.querySelectorAll('[id^="deck-card-"]');
      cards.forEach((c, i) => {
        const r  = (Math.random() - 0.5) * 22;
        const tx = (Math.random() - 0.5) * 14;
        const ty = (Math.random() - 0.5) * 14;
        c.style.transform = \`rotate(\${r}deg) translate(\${tx}px,\${ty}px)\`;
        setTimeout(() => {
          c.style.transform = \`rotate(\${(i-2)*3}deg) translateY(\${i*2}px)\`;
        }, 420);
      });

      // Setelah kocok pertama: tampilkan tombol "Mulai Tarik Kartu" terpisah
      if (!_shuffleReady) {
        _shuffleReady = true;
        const shuffleBtn = document.getElementById('shuffle-btn');
        const drawBtn    = document.getElementById('draw-btn');
        const hint       = document.getElementById('shuffle-hint');
        const deckBtn    = document.getElementById('deck-visual-btn');
        if (shuffleBtn) shuffleBtn.textContent = 'Kocok Lagi';
        if (drawBtn)    drawBtn.style.display = 'inline-block';
        if (hint)       hint.textContent = 'Siap. Kocok sekali lagi atau langsung tarik kartu.';
        if (deckBtn)    deckBtn.classList.add('shuffled');
      } else {
        // Kocok tambahan — update hint dengan counter
        const hint = document.getElementById('shuffle-hint');
        if (hint) hint.textContent = \`Dikocok \${_shuffleCount}×. Siap saat kamu siap.\`;
      }
    }

    /* ── Draw — Card flip 3D ── */
    function fisherYates(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function drawCards(spread) {
      const shuffled = fisherYates(ALL_CARDS);
      return spread.positions.map((pos, i) => ({
        card: shuffled[i], position: pos,
        isReversed: Math.random() < 0.35,
        revealed: false,
      }));
    }

    function renderDrawGrid() {
      const grid  = document.getElementById('draw-grid');
      const total = state.drawnCards.length;
      const w = total > 7 ? 80  : total > 4 ? 100 : 120;
      const h = total > 7 ? 126 : total > 4 ? 157 : 190;

      grid.innerHTML = state.drawnCards.map((dc, i) => \`
        <div style="text-align:center;flex-shrink:0;" role="listitem">
          <div class="card-flip-wrap" id="flip-\${i}"
            style="width:\${w}px;height:\${h}px;cursor:pointer;"
            tabindex="0"
            role="button"
            aria-label="Buka kartu posisi \${dc.position.nameCn}"
            data-card-index="\${i}">
            <div class="card-flip-inner float-card">
              <!-- Back face -->
              <div class="card-flip-front">
                <div class="card-back-pattern"></div>
                <span style="position:relative;z-index:1;color:rgba(200,168,75,0.25);" aria-hidden="true">${iconStar(28)}</span>
              </div>
              <!-- Front face -->
              <div class="card-flip-back">
                <img src="\${dc.card.image}" alt="\${dc.card.name}"
                  loading="lazy"
                  style="width:100%;height:100%;object-fit:cover;\${dc.isReversed ? 'transform:rotate(180deg);' : ''}" />
                \${dc.isReversed ? \`<div style="position:absolute;top:5px;right:5px;z-index:4;">
                  <span class="font-heading" style="font-size:6px;letter-spacing:0.25em;color:var(--gold);
                    border:1px solid rgba(200,168,75,0.4);padding:1px 5px;background:rgba(5,5,7,0.88);">
                    TERBALIK</span></div>\` : ''}
              </div>
            </div>
          </div>
          <p class="font-heading text-bone-faint" style="font-size:9px;letter-spacing:0.1em;margin-top:0.5rem;max-width:\${w}px;">\${dc.position.nameCn}</p>
        </div>
      \`).join('');

      // FIX: Attach event listener ke setiap card-flip-wrap setelah render
      document.querySelectorAll('.card-flip-wrap').forEach(function(wrap) {
        wrap.addEventListener('click', function() {
          revealCard(parseInt(this.getAttribute('data-card-index'), 10));
        });
        wrap.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            revealCard(parseInt(this.getAttribute('data-card-index'), 10));
          }
        });
      });
    }

    function revealCard(i) {
      if (state.drawnCards[i].revealed) return;
      state.drawnCards[i].revealed = true;
      state.revealedCount++;
      const wrap = document.getElementById('flip-' + i);
      if (wrap) {
        wrap.classList.add('flipped');
        wrap.setAttribute('aria-label', 'Kartu: ' + state.drawnCards[i].card.nameCn);
        wrap.style.cursor = 'default';
        wrap.setAttribute('aria-pressed', 'true');
      }
      if (state.revealedCount === state.drawnCards.length) {
        setTimeout(startInterpretation, 800);
      } else if (state.revealedCount >= 2) {
        const revealAllBtn = document.getElementById('reveal-all-btn');
        if (revealAllBtn) revealAllBtn.style.display = 'inline-block';
      }
    }

    function revealAll() {
      let delay = 0;
      state.drawnCards.forEach((_, i) => {
        if (!state.drawnCards[i].revealed) {
          setTimeout(() => revealCard(i), delay);
          delay += 130;
        }
      });
    }

    /* ── Interpretation ── */
    function startInterpretation() {
      showPhase('interpret');

      const toneLabels = { spiritual: '✦ SPIRITUAL', praktis: '✦ PRAKTIS', puitis: '✦ PUITIS' };
      const toneBadge = document.getElementById('tone-badge');
      if (toneBadge) toneBadge.textContent = toneLabels[state.tone] || '✦ SPIRITUAL';

      const staticNotice = document.getElementById('static-notice');
      if (staticNotice) staticNotice.style.display = 'none';

      const summary = document.getElementById('cards-summary');
      summary.innerHTML = state.drawnCards.map(dc => \`
        <div style="flex-shrink:0;text-align:center;" role="listitem">
          <div style="width:52px;height:82px;overflow:hidden;border:1px solid var(--gold-faint);
            box-shadow:0 4px 16px rgba(0,0,0,0.6);">
            <img src="\${dc.card.image}" alt="\${dc.card.name}" loading="lazy"
              style="width:100%;height:100%;object-fit:cover;\${dc.isReversed ? 'transform:rotate(180deg);' : ''}" />
          </div>
          <p class="font-heading text-bone-whisper" style="font-size:7.5px;margin-top:4px;letter-spacing:0.08em;">\${dc.position.nameCn}</p>
        </div>
      \`).join('');
      callInterpretApi();
    }

    async function callInterpretApi() {
      const textEl = document.getElementById('interp-text');
      textEl.innerHTML = '<div class="spinner-row"><div class="spinner" aria-hidden="true"></div><span class="font-heading text-bone-faint" style="font-size:11px;letter-spacing:0.2em;">Oracle sedang memproses…</span></div>';
      textEl.classList.add('streaming-cursor');

      const toneLabels = { spiritual: '✦ SPIRITUAL', praktis: '✦ PRAKTIS', puitis: '✦ PUITIS' };
      const toneBadge = document.getElementById('tone-badge');
      if (toneBadge) toneBadge.textContent = toneLabels[state.tone] || '✦ SPIRITUAL';

      try {
        const res = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: state.question,
            spread: state.spread,
            drawnCards: state.drawnCards,
            tone: state.tone,
          }),
        });
        if (!res.ok) {
          textEl.classList.remove('streaming-cursor');
          const e = await res.json();
          let errMsg = '';
          if (e.blocked) {
            errMsg = '🚫 Akses ke layanan ini tidak tersedia untuk koneksimu.';
          } else {
            const resetLabel = e.resetAt
              ? ' (kredit pulih ' + new Date(e.resetAt).toLocaleDateString('id-ID', { day:'numeric', month:'long' }) + ')'
              : '';
            errMsg = (e.error || 'Gagal mendapatkan interpretasi') + resetLabel;
          }
          textEl.innerHTML = \`<p style="color:var(--mist);">\${errMsg}</p>\`;
          return;
        }

        const isStaticMode = res.headers.get('X-Static-Mode') === 'true';
        const staticNotice = document.getElementById('static-notice');
        if (staticNotice) staticNotice.style.display = isStaticMode ? 'inline-block' : 'none';

        const remaining = res.headers.get('X-RateLimit-Remaining');
        const resetAtMs  = res.headers.get('X-RateLimit-Reset');
        const limitHdr   = res.headers.get('X-RateLimit-Limit');
        if (remaining !== null && window.updateCreditBadge) {
          window.updateCreditBadge(remaining, limitHdr, resetAtMs);
        }
        const statusEl = document.getElementById('share-status');
        if (remaining !== null && statusEl) {
          statusEl.textContent = remaining === '0' ? 'Kredit habis' : 'Kredit tersisa: ' + remaining;
          if (remaining !== '0') setTimeout(() => { statusEl.textContent = ''; }, 4000);
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let text = '';
        let sseBuffer = '';
        textEl.innerHTML = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\\n');
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
        if (sseBuffer.startsWith('data: ')) {
          const data = sseBuffer.slice(6).trim();
          if (data && data !== '[DONE]') {
            try { const j = JSON.parse(data); const delta = j.choices?.[0]?.delta?.content; if (delta) { text += delta; textEl.innerHTML = markdownToHtml(text); } } catch {}
          }
        }
        textEl.classList.remove('streaming-cursor');
        state.interpretation = text;
        saveReading();
        document.getElementById('followup-section').style.display = 'block';
      } catch (err) {
        textEl.classList.remove('streaming-cursor');
        textEl.innerHTML = \`<p style="color:var(--mist);">Koneksi gagal: \${err.message}</p>\`;
      }
    }

    async function retryInterpretation() { await callInterpretApi(); }

    /* ── Follow-up ── */
    async function askFollowUp() {
      const q = document.getElementById('followup-input').value.trim();
      if (!q) return;
      document.getElementById('followup-input').value = '';
      const fuId   = 'fu-' + Date.now();
      const list   = document.getElementById('followup-list');
      list.insertAdjacentHTML('beforeend', \`
        <div class="ink-panel" style="padding:1.25rem;margin-bottom:1rem;" id="\${fuId}">
          <p class="font-heading text-celestial" style="font-size:10px;letter-spacing:0.2em;margin-bottom:0.5rem;">PERTANYAAN LANJUTAN</p>
          <p class="font-body text-bone" style="margin-bottom:0.75rem;">\${q}</p>
          <div class="fu-answer streaming-cursor font-body text-bone-faint" style="font-size:0.9rem;line-height:1.75;"></div>
        </div>
      \`);
      list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const answerEl = list.querySelector('#' + fuId + ' .fu-answer');
      const history  = state.followUps.map(fu => ([
        { role: 'user',      content: fu.question       },
        { role: 'assistant', content: fu.interpretation },
      ])).flat();
      try {
        const res = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: state.question,
            spread: state.spread,
            drawnCards: state.drawnCards,
            tone: state.tone,
            history,
            followUp: { followUpQuestion: q, previousInterpretation: state.interpretation },
          }),
        });
        if (!res.ok) {
          const e = await res.json();
          answerEl.textContent = e.blocked
            ? '🚫 Akses ke layanan ini tidak tersedia untuk koneksimu.'
            : 'Error: ' + (e.error || 'Gagal');
          answerEl.classList.remove('streaming-cursor');
          return;
        }
        const remaining = res.headers.get('X-RateLimit-Remaining');
        const resetAtMs = res.headers.get('X-RateLimit-Reset');
        const limitHdr  = res.headers.get('X-RateLimit-Limit');
        if (remaining !== null && window.updateCreditBadge) {
          window.updateCreditBadge(remaining, limitHdr, resetAtMs);
        }
        const statusEl = document.getElementById('share-status');
        if (remaining !== null && statusEl) {
          statusEl.textContent = remaining === '0' ? 'Kredit habis' : 'Kredit tersisa: ' + remaining;
          if (remaining !== '0') setTimeout(() => { statusEl.textContent = ''; }, 4000);
        }
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let text = '';
        let sseBuffer = '';
        answerEl.innerHTML = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\\n');
          sseBuffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try { const j = JSON.parse(data); const d = j.choices?.[0]?.delta?.content; if (d) { text += d; answerEl.innerHTML = markdownToHtml(text); } } catch {}
          }
        }
        if (sseBuffer.startsWith('data: ')) {
          const data = sseBuffer.slice(6).trim();
          if (data && data !== '[DONE]') {
            try { const j = JSON.parse(data); const d = j.choices?.[0]?.delta?.content; if (d) { text += d; answerEl.innerHTML = markdownToHtml(text); } } catch {}
          }
        }
        answerEl.classList.remove('streaming-cursor');
        state.followUps.push({ question: q, interpretation: text });
        saveReading();
      } catch (err) {
        answerEl.textContent = 'Koneksi gagal: ' + err.message;
        answerEl.classList.remove('streaming-cursor');
      }
    }

    /* ── Share ── */
    function shareReading() {
      const lines = [
        'Jalur Tarot — ' + new Date().toLocaleDateString('id-ID'),
        'Pertanyaan: ' + state.question,
        'Susunan: ' + (state.spread?.nameCn || ''),
        '',
        'Kartu:',
        ...state.drawnCards.map(dc => '  ' + dc.position.nameCn + ': ' + dc.card.nameCn + (dc.isReversed ? ' (terbalik)' : '')),
        '',
        'Interpretasi:',
        state.interpretation.replace(/<[^>]+>/g,'').replace(/\\n{3,}/g,'\\n\\n'),
      ];
      navigator.clipboard.writeText(lines.join('\\n')).then(() => {
        document.getElementById('share-status').textContent = '✦ Tersalin ke clipboard';
        setTimeout(() => { document.getElementById('share-status').textContent = ''; }, 2500);
      }).catch(() => {
        document.getElementById('share-status').textContent = 'Tidak bisa menyalin otomatis';
      });
    }

    /* ── Storage ── */
    function saveReading() {
      if (!state.readingId) state.readingId = 'r-' + Date.now();
      const readings = JSON.parse(localStorage.getItem('jalurtarot-readings-v1') || '[]');
      const existing = readings.findIndex(r => r.id === state.readingId);
      const record   = {
        id: state.readingId,
        createdAt: new Date().toISOString(),
        question: state.question,
        spread: state.spread,
        drawnCards: state.drawnCards,
        interpretation: state.interpretation,
        followUps: state.followUps,
        tone: state.tone,
      };
      if (existing >= 0) readings[existing] = record;
      else readings.unshift(record);
      if (readings.length > 50) readings.splice(50);
      localStorage.setItem('jalurtarot-readings-v1', JSON.stringify(readings));
    }

    function newReading() {
      state = { phase:'question', question:'', spread:null, drawnCards:[], revealedCount:0, interpretation:'', followUps:[], readingId:null, tone:state.tone };
      document.getElementById('question-input').value = '';
      document.getElementById('followup-list').innerHTML = '';
      document.getElementById('followup-section').style.display = 'none';
      _currentPhase = 'question';
      document.querySelectorAll('.phase-panel').forEach(el => el.classList.add('hidden'));
      const q = document.getElementById('phase-question');
      q.classList.remove('hidden','phase-exit','phase-enter','phase-enter-active');
    }

    /* ── Expose ke window ── */
    window.goToSpread          = goToSpread;
    window.goToQuestion        = goToQuestion;
    window.goToShuffle         = goToShuffle;
    window.goToDraw            = goToDraw;
    window.selectSpread        = selectSpread;
    window.shuffleDeck         = shuffleDeck;
    window.revealCard          = revealCard;
    window.revealAll           = revealAll;
    window.retryInterpretation = retryInterpretation;
    window.askFollowUp         = askFollowUp;
    window.shareReading        = shareReading;
    window.newReading          = newReading;

    /* ── Init DOM ── */
    document.querySelectorAll('.phase-panel').forEach(el => el.classList.add('hidden'));
    document.getElementById('phase-question').classList.remove('hidden');

    // Tone selector
    document.querySelectorAll('#tone-selector .tone-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { setTone(this.getAttribute('data-tone')); });
    });

    // Question input: Enter to advance
    var questionInput = document.getElementById('question-input');
    if (questionInput) {
      questionInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); goToSpread(); }
      });
    }

    // Phase 1 → 2
    var btnGoSpread = document.getElementById('btn-go-spread');
    if (btnGoSpread) btnGoSpread.addEventListener('click', function() { goToSpread(); });

    // Phase 2 → 1
    var btnGoQuestion = document.getElementById('btn-go-question');
    if (btnGoQuestion) btnGoQuestion.addEventListener('click', function() { goToQuestion(); });

    // Phase 2 → 3 (konfirmasi spread)
    var btnConfirmSpread = document.getElementById('confirm-spread-btn');
    if (btnConfirmSpread) btnConfirmSpread.addEventListener('click', function() { goToShuffle(); });

    // Phase 3: deck visual button → kocok
    var deckVisualBtn = document.getElementById('deck-visual-btn');
    if (deckVisualBtn) deckVisualBtn.addEventListener('click', function() { shuffleDeck(); });

    // Phase 3: shuffle-btn → kocok (sama dengan deck visual)
    var shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn) shuffleBtn.addEventListener('click', function() { shuffleDeck(); });

    // Phase 3: draw-btn → mulai tarik (terpisah, tidak ada override)
    var drawBtn = document.getElementById('draw-btn');
    if (drawBtn) drawBtn.addEventListener('click', function() { goToDraw(); });

    // Phase 4: reveal all
    var revealAllBtn = document.getElementById('reveal-all-btn');
    if (revealAllBtn) revealAllBtn.addEventListener('click', function() { revealAll(); });

    // Phase 5: follow-up
    var btnFollowup = document.getElementById('btn-followup');
    if (btnFollowup) btnFollowup.addEventListener('click', function() { askFollowUp(); });

    // Followup input: Enter to send
    var followupInput = document.getElementById('followup-input');
    if (followupInput) {
      followupInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askFollowUp(); }
      });
    }

    // Phase 5: new reading
    var btnNewReading = document.getElementById('btn-new-reading');
    if (btnNewReading) btnNewReading.addEventListener('click', function() { newReading(); });

    // Phase 5: retry
    var btnRetry = document.getElementById('btn-retry');
    if (btnRetry) btnRetry.addEventListener('click', function() { retryInterpretation(); });

    // Phase 5: share
    var shareBtn = document.getElementById('share-btn');
    if (shareBtn) shareBtn.addEventListener('click', function() { shareReading(); });
    </script>
  `, '', { description: 'Mulai sesi ramalan tarot — pilih susunan, tarik kartu, dan baca interpretasinya.' });
}
