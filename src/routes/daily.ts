import { pageLayout } from '../lib/layout';
import { getDailyDraw, getRecentDailyDraws } from '../lib/daily';
import { markdownToHtmlFn } from '../lib/markdown';

export function dailyCardData(dateStr?: string): object {
  const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const draw = getDailyDraw(date);
  return { card: draw.card, isReversed: draw.isReversed, dateKey: draw.dateKey };
}

function getTodayInTz(tz: string): Date {
  try {
    const localStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    return new Date(localStr + 'T00:00:00');
  } catch { return new Date(); }
}

export function dailyPage(tz: string = 'Asia/Jakarta'): string {
  const today     = getTodayInTz(tz);
  const draw      = getDailyDraw(today);
  const recent    = getRecentDailyDraws(7, today);
  const dateLabel = today.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // FIX BUG-6: Hapus onclick= inline pada timeline buttons — pakai data-datekey saja
  const recentHTML = recent.map((r, i) => `
    <button type="button" data-datekey="${r.dateKey}"
      class="day-btn${i === 0 ? ' day-btn-active' : ''}"
      aria-label="Kartu tanggal ${new Date(r.dateKey + 'T00:00:00').toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long' })}${i === 0 ? ' (hari ini)' : ''}">
      <div class="day-thumb${i === 0 ? ' day-thumb-active' : ''}">
        <img src="${r.card.image}" alt="${r.card.name}" loading="lazy"
          style="width:100%;height:100%;object-fit:cover;${r.isReversed ? 'transform:rotate(180deg);' : ''}" />
      </div>
      <span class="font-heading day-label">
        ${i === 0 ? 'Hari ini' : new Date(r.dateKey + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short' }).toUpperCase()}
      </span>
    </button>
  `).join('');

  const upliftKws = (draw.isReversed ? draw.card.keywords.reversed : draw.card.keywords.upright).slice(0, 5);

  return pageLayout('Kartu Harian', `
    <div class="daily-wrap">

      <!-- ── Header ── -->
      <div class="daily-header reveal">
        <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.3em;margin-bottom:0.5rem;">RITUAL HARIAN</p>
        <h1 class="font-heading text-bone" style="font-size:1.8rem;letter-spacing:0.15em;margin-bottom:0.4rem;">KARTU HARI INI</h1>
        <p class="font-body text-bone-faint" style="font-size:0.88rem;font-style:italic;">${dateLabel}</p>
      </div>

      <!-- ── Week Timeline ── -->
      <div class="timeline-wrap reveal reveal-delay-1" role="group" aria-label="7 hari terakhir">
        <div class="timeline-row" id="timeline-row">
          ${recentHTML}
        </div>
      </div>

      <!-- ── Main Display ── -->
      <div id="card-display" class="daily-grid anim-curtain">

        <!-- Card column -->
        <div class="daily-card-col">
          <div class="float-card anim-glow daily-card-frame" id="daily-card-frame" role="img" aria-label="Kartu ${draw.card.nameCn}${draw.isReversed ? ' (terbalik)' : ''}">
            <img id="card-img" src="${draw.card.image}" alt="${draw.card.name}"
              class="daily-card-img${draw.isReversed ? ' reversed' : ''}" />
            ${draw.isReversed ? `
              <div class="card-badge-terbalik">
                <span class="font-heading" style="font-size:6.5px;letter-spacing:0.3em;color:var(--gold);">TERBALIK</span>
              </div>` : ''}
          </div>
          <!-- Card name below image on mobile -->
          <div class="daily-card-caption" id="card-caption-mobile">
            <p id="card-name-mobile" class="font-heading text-bone" style="font-size:1.1rem;letter-spacing:0.12em;"></p>
          </div>
        </div>

        <!-- Info column -->
        <div class="daily-info-col">
          <div class="daily-name-row reveal">
            <div>
              <h2 id="card-name" class="font-heading text-bone" style="font-size:1.6rem;letter-spacing:0.12em;">${draw.card.nameCn}</h2>
              <p id="card-subname" class="font-body text-bone-faint" style="font-size:0.9rem;font-style:italic;margin-top:0.25rem;">
                ${draw.card.name} · ${draw.isReversed ? 'Terbalik' : 'Normal'}
              </p>
            </div>
          </div>

          <!-- Keywords -->
          <div id="card-keywords" class="kw-row reveal reveal-delay-1" role="list" aria-label="Kata kunci kartu">
            ${upliftKws.map(k => `
              <span class="font-heading text-gold-dim chip-gold" role="listitem"
                style="font-size:9.5px;letter-spacing:0.15em;">${k}</span>
            `).join('')}
          </div>

          <!-- Oracle Interpretation -->
          <div class="ink-panel interpret-daily reveal reveal-delay-2">
            <div class="interpret-daily-header">
              <h3 class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.25em;">PETUNJUK ORACLE</h3>
              <div class="interpret-daily-controls">
                <!-- FIX BUG-6: Hapus onchange= inline -->
                <select id="daily-tone"
                  aria-label="Gaya interpretasi"
                  class="tone-select font-heading text-bone-faint">
                  <option value="spiritual">Spiritual</option>
                  <option value="praktis">Praktis</option>
                  <option value="puitis">Puitis</option>
                </select>
                <!-- FIX BUG-6: Hapus onclick= inline -->
                <button id="interpret-btn" class="btn-primary"
                  style="padding:0.45rem 1rem;font-size:10px;white-space:nowrap;"
                  aria-label="Dapatkan interpretasi dari Oracle">
                  Baca Interpretasi
                </button>
              </div>
            </div>
            <div id="interpretation-text" class="prose-tarot" style="min-height:64px;" aria-live="polite" aria-atomic="false">
              <p class="text-bone-faint" style="font-style:italic;font-size:0.9rem;">
                Sentuh tombol untuk mendapatkan petunjuk Oracle.
              </p>
            </div>
          </div>

          <!-- Actions row -->
          <div class="daily-actions reveal reveal-delay-3">
            <!-- FIX BUG-6: Hapus onclick= inline -->
            <button id="share-daily-btn" class="btn-ghost" style="padding:0.45rem 1rem;font-size:10px;" aria-label="Salin kartu hari ini">
              Salin Kartu Hari Ini
            </button>
            <span id="share-status" class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.1em;min-height:1em;" aria-live="polite"></span>
          </div>

          <!-- Personal Notes -->
          <div class="ink-panel reveal reveal-delay-4" style="padding:1.5rem;">
            <h3 class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.25em;margin-bottom:1rem;">CATATAN HARIANMU</h3>
            <!-- FIX BUG-6: Hapus oninput= inline -->
            <textarea id="daily-note" class="ink-input" rows="4"
              aria-label="Tulis catatan atau refleksi harianmu"
              placeholder="Tulis refleksi, perasaan, atau hal yang terjadi hari ini…"></textarea>
            <p id="note-status" class="font-heading text-bone-whisper" style="font-size:10px;letter-spacing:0.15em;margin-top:0.5rem;" aria-live="polite"></p>
          </div>
        </div>
      </div>
    </div>

    <style>
      .daily-wrap {
        max-width: 860px;
        margin: 0 auto;
        padding: 3rem 1.5rem 4rem;
      }
      .daily-header { margin-bottom: 2rem; }

      /* ── Timeline ── */
      .timeline-wrap {
        overflow-x: auto;
        margin-bottom: 2.5rem;
        padding-bottom: 0.5rem;
        scrollbar-width: thin;
      }
      .timeline-row {
        display: flex; gap: 0.75rem;
        min-width: max-content;
        padding: 0.25rem;
      }
      .day-btn {
        display: flex; flex-direction: column;
        align-items: center; gap: 0.45rem;
        background: none; border: none; cursor: pointer;
        padding: 0.4rem 0.3rem;
        transition: transform 0.3s var(--ease-emerge);
      }
      .day-btn:hover { transform: translateY(-3px); }
      .day-btn:focus-visible { outline: 2px solid var(--gold-dim); outline-offset: 4px; border-radius: 2px; }
      .day-thumb {
        width: 50px; height: 75px;
        overflow: hidden;
        border: 1px solid var(--ink-line);
        position: relative;
        transition: border-color 0.3s, box-shadow 0.3s;
        flex-shrink: 0;
      }
      .day-thumb:hover, .day-btn:hover .day-thumb { border-color: var(--gold-dim); }
      .day-thumb-active {
        border-color: var(--gold-dim) !important;
        box-shadow: 0 0 12px rgba(200,168,75,0.2);
      }
      .day-label {
        font-size: 9px; letter-spacing: 0.12em;
        color: var(--bone-faint);
        transition: color 0.3s;
      }
      .day-btn-active .day-label { color: var(--gold); }

      /* ── Main grid ── */
      .daily-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 2.5rem;
        align-items: start;
      }
      @media (max-width: 640px) {
        .daily-grid { grid-template-columns: 1fr; gap: 1.75rem; }
        .daily-card-col { display: flex; flex-direction: column; align-items: center; }
      }

      /* ── Card column ── */
      .daily-card-col { position: relative; }
      .daily-card-frame {
        width: min(200px, 52vw);
        aspect-ratio: 3/5;
        overflow: hidden;
        position: relative;
      }
      .daily-card-img {
        width: 100%; height: 100%; object-fit: cover; display: block;
        transition: transform 0.6s var(--ease-veil);
      }
      .card-badge-terbalik {
        position: absolute; top: 0.65rem; right: 0.65rem; z-index: 4;
        border: 1px solid rgba(200,168,75,0.4);
        padding: 2px 8px;
        background: rgba(5,5,7,0.9);
      }
      .daily-card-caption {
        margin-top: 0.75rem; text-align: center;
        display: none;
      }
      @media (max-width: 640px) { .daily-card-caption { display: block; } }

      /* ── Info column ── */
      .daily-name-row { margin-bottom: 1.25rem; }
      .kw-row {
        display: flex; flex-wrap: wrap; gap: 0.45rem;
        margin-bottom: 1.5rem;
      }

      /* ── Interpret panel ── */
      .interpret-daily { padding: 1.5rem; margin-bottom: 1.25rem; }
      .interpret-daily-header {
        display: flex; align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;
      }
      .interpret-daily-controls { display: flex; gap: 0.5rem; align-items: center; }
      .tone-select {
        font-size: 9px; letter-spacing: 0.1em;
        background: var(--ink-mist);
        border: 1px solid var(--ink-line);
        color: var(--bone-faint);
        padding: 3px 6px; cursor: pointer;
        outline: none;
        transition: border-color 0.3s;
      }
      .tone-select:focus { border-color: var(--gold-dim); }

      /* ── Actions ── */
      .daily-actions {
        display: flex; align-items: center; gap: 1rem;
        margin-bottom: 1.25rem; flex-wrap: wrap;
      }
    </style>

    <script>
    ${markdownToHtmlFn}

    let currentDraw = ${JSON.stringify({ card: draw.card, isReversed: draw.isReversed, dateKey: draw.dateKey })};
    let currentInterpretation = '';
    let noteTimer = null;

    /* ── Notes ── */
    function loadNote() {
      const key = 'jalurtarot-daily-note-' + currentDraw.dateKey;
      try {
        const saved = localStorage.getItem(key);
        document.getElementById('daily-note').value = saved ? (JSON.parse(saved).note || '') : '';
      } catch {}
    }

    function saveNote() {
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => {
        const note = document.getElementById('daily-note').value;
        const key  = 'jalurtarot-daily-note-' + currentDraw.dateKey;
        localStorage.setItem(key, JSON.stringify({ note, updatedAt: new Date().toISOString() }));
        document.getElementById('note-status').textContent = '✦ Tersimpan';
        setTimeout(() => { document.getElementById('note-status').textContent = ''; }, 2000);
      }, 800);
    }

    function onToneChange() {
      if (currentInterpretation) {
        document.getElementById('interpretation-text').innerHTML =
          '<p class="text-bone-faint" style="font-style:italic;font-size:0.9rem;">Tone diubah. Klik tombol untuk memuat ulang.</p>';
        currentInterpretation = '';
        document.getElementById('interpret-btn').textContent = 'Baca Interpretasi';
      }
    }

    /* ── Select day from timeline — via event delegation ── */
    function selectDay(dateKey) {
      fetch('/api/daily-card?date=' + dateKey)
        .then(r => r.json())
        .then(d => {
          currentDraw           = d;
          currentInterpretation = '';

          /* Swap image with fade */
          const img = document.getElementById('card-img');
          img.style.opacity = '0';
          img.style.transition = 'opacity 0.35s';
          setTimeout(() => {
            img.src = d.card.image;
            img.style.transform = d.isReversed ? 'rotate(180deg)' : '';
            img.classList.toggle('reversed', d.isReversed);
            img.alt = d.card.name;
            img.style.opacity = '1';
          }, 200);

          /* Update frame aria-label */
          const frame = document.getElementById('daily-card-frame');
          if (frame) frame.setAttribute('aria-label', 'Kartu ' + d.card.nameCn + (d.isReversed ? ' (terbalik)' : ''));

          /* Reversed badge */
          const existingBadge = frame && frame.querySelector('.card-badge-terbalik');
          if (d.isReversed && !existingBadge && frame) {
            const badge = document.createElement('div');
            badge.className = 'card-badge-terbalik';
            badge.innerHTML = '<span class="font-heading" style="font-size:6.5px;letter-spacing:0.3em;color:var(--gold);">TERBALIK</span>';
            frame.appendChild(badge);
          } else if (!d.isReversed && existingBadge) {
            existingBadge.remove();
          }

          document.getElementById('card-name').textContent    = d.card.nameCn;
          document.getElementById('card-subname').textContent = d.card.name + ' · ' + (d.isReversed ? 'Terbalik' : 'Normal');
          const kws = d.isReversed ? d.card.keywords.reversed : d.card.keywords.upright;
          document.getElementById('card-keywords').innerHTML = kws.slice(0, 5).map(k =>
            '<span class="font-heading text-gold-dim chip-gold" role="listitem" style="font-size:9.5px;letter-spacing:0.15em;">' + k + '</span>'
          ).join('');
          document.getElementById('interpretation-text').innerHTML =
            '<p class="text-bone-faint" style="font-style:italic;font-size:0.9rem;">Sentuh tombol untuk mendapatkan petunjuk Oracle.</p>';
          document.getElementById('interpret-btn').textContent = 'Baca Interpretasi';
          document.getElementById('interpret-btn').disabled   = false;

          /* Update active state on timeline */
          document.querySelectorAll('.day-btn').forEach(b => {
            const thumb = b.querySelector('.day-thumb');
            const isActive = b.getAttribute('data-datekey') === dateKey;
            b.classList.toggle('day-btn-active', isActive);
            if (thumb) thumb.classList.toggle('day-thumb-active', isActive);
          });

          loadNote();
        });
    }

    /* ── Oracle interpretation — SSE dengan buffer ── */
    async function getInterpretation() {
      const btn    = document.getElementById('interpret-btn');
      const textEl = document.getElementById('interpretation-text');
      btn.textContent = 'Meminta Oracle…';
      btn.disabled    = true;

      const card       = currentDraw.card;
      const isReversed = currentDraw.isReversed;
      const keywords   = isReversed ? card.keywords.reversed : card.keywords.upright;
      const meaning    = isReversed ? card.meaning.reversed  : card.meaning.upright;
      const dateStr    = new Date(currentDraw.dateKey + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday:'long', day:'numeric', month:'long', year:'numeric',
      });
      const tone = document.getElementById('daily-tone').value;

      textEl.innerHTML = '<div style="display:flex;align-items:center;gap:0.5rem;">' +
        '<div style="width:14px;height:14px;border:1px solid var(--gold-dim);border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;flex-shrink:0;" aria-hidden="true"></div>' +
        '<span class="font-heading text-bone-faint" style="font-size:11px;letter-spacing:0.2em;">Oracle sedang memproses…</span></div>';
      textEl.classList.add('streaming-cursor');

      try {
        const res = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tone, skipCredit: true,
            daily: { cardName: card.name, cardNameCn: card.nameCn, isReversed, keywords, meaning, dateStr },
          }),
        });
        if (!res.ok) {
          const e = await res.json();
          textEl.classList.remove('streaming-cursor');
          textEl.innerHTML = '<p style="color:var(--mist);">Error: ' + (e.error || 'Gagal') + '</p>';
          btn.textContent = 'Baca Interpretasi'; btn.disabled = false; return;
        }

        /* FIX BUG-7: SSE dengan line buffer untuk handle cross-chunk splits */
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
        // Flush sisa buffer
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
        currentInterpretation = text;
        btn.textContent = 'Interpretasi Ulang'; btn.disabled = false;
      } catch(e) {
        textEl.classList.remove('streaming-cursor');
        textEl.innerHTML = '<p style="color:var(--mist);">Koneksi gagal: ' + e.message + '</p>';
        btn.textContent = 'Baca Interpretasi'; btn.disabled = false;
      }
    }

    /* ── Share ── */
    function shareDaily() {
      const card       = currentDraw.card;
      const isReversed = currentDraw.isReversed;
      const dateStr    = new Date(currentDraw.dateKey + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday:'long', day:'numeric', month:'long', year:'numeric',
      });
      const kws  = (isReversed ? card.keywords.reversed : card.keywords.upright).slice(0, 4).join(' · ');
      const note = document.getElementById('daily-note').value.trim();
      const lines = [
        'Jalur Tarot — Kartu Harian', dateStr, '',
        card.nameCn + ' (' + card.name + ')' + (isReversed ? ' · Terbalik' : ''),
        'Kata kunci: ' + kws,
      ];
      if (currentInterpretation) {
        lines.push('', currentInterpretation.replace(/<[^>]+>/g,'').trim());
      }
      if (note) lines.push('', 'Catatanku: ' + note);
      navigator.clipboard.writeText(lines.join('\\n')).then(() => {
        document.getElementById('share-status').textContent = '✦ Tersalin';
        setTimeout(() => { document.getElementById('share-status').textContent = ''; }, 2000);
      }).catch(() => {
        document.getElementById('share-status').textContent = 'Gagal menyalin';
      });
    }

    /* ── Init — semua event listener via addEventListener ── */
    loadNote();

    // Timeline: event delegation pada container
    var timelineRow = document.getElementById('timeline-row');
    if (timelineRow) {
      timelineRow.addEventListener('click', function(e) {
        var btn = e.target.closest('.day-btn');
        if (btn) selectDay(btn.getAttribute('data-datekey'));
      });
      timelineRow.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          var btn = e.target.closest('.day-btn');
          if (btn) { e.preventDefault(); selectDay(btn.getAttribute('data-datekey')); }
        }
      });
    }

    // Tone select
    var toneSelect = document.getElementById('daily-tone');
    if (toneSelect) toneSelect.addEventListener('change', function() { onToneChange(); });

    // Interpret button
    var interpretBtn = document.getElementById('interpret-btn');
    if (interpretBtn) interpretBtn.addEventListener('click', function() { getInterpretation(); });

    // Share button
    var shareDailyBtn = document.getElementById('share-daily-btn');
    if (shareDailyBtn) shareDailyBtn.addEventListener('click', function() { shareDaily(); });

    // Note textarea
    var dailyNote = document.getElementById('daily-note');
    if (dailyNote) dailyNote.addEventListener('input', function() { saveNote(); });

    // Auto-claim kredit harian saat halaman daily dibuka
    function autoClaimDailyBonus() {
      fetch('/api/claim-daily', { method: 'POST' })
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(data) {
          if (!data || !data.success) return;
          var el = document.getElementById('share-status');
          if (el) {
            el.textContent = '✦ +1 kredit harian';
            setTimeout(function() {
              if (el.textContent === '✦ +1 kredit harian') el.textContent = '';
            }, 3000);
          }
        })
        .catch(function() {});
    }

    autoClaimDailyBonus();
    </script>
  `, '', { description: 'Kartu tarot harian — satu kartu setiap hari sebagai panduan dan cermin untuk harimu.' });
}
