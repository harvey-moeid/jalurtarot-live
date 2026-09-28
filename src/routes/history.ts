import { pageLayout } from '../lib/layout';
import { markdownToHtmlFn } from '../lib/markdown';
import { iconEye, iconSpread } from '../lib/icons';

export function historyPage(): string {
  return pageLayout('Riwayat Ramalan', `
    <div class="history-wrap">

      <!-- ── Header ── -->
      <div class="history-header reveal">
        <div>
          <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.3em;margin-bottom:0.5rem;">JEJAK RAMALAN</p>
          <h1 class="font-heading text-bone" style="font-size:1.8rem;letter-spacing:0.15em;">RIWAYAT</h1>
        </div>
        <div class="history-actions" id="history-actions">
          <span id="session-count" class="font-heading text-bone-faint" style="font-size:11px;letter-spacing:0.15em;"></span>
          <button id="select-btn"          class="btn-ghost" style="padding:0.4rem 1rem;font-size:10px;display:none;">Pilih</button>
          <button id="delete-selected-btn" class="btn-ghost" style="padding:0.4rem 1rem;font-size:10px;display:none;color:var(--mist);">Hapus</button>
          <button id="clear-all-btn"       class="btn-ghost" style="padding:0.4rem 1rem;font-size:10px;color:var(--mist);">Hapus Semua</button>
        </div>
      </div>

      <!-- ── Tab switcher ── -->
      <div class="tab-row reveal reveal-delay-1" role="tablist" aria-label="Pilih tipe riwayat">
        <button id="tab-reading" class="tab-btn tab-active" role="tab"
          data-tab="reading" aria-selected="true" aria-controls="sessions-list">
          RAMALAN
        </button>
        <button id="tab-oracle"  class="tab-btn" role="tab"
          data-tab="oracle" aria-selected="false" aria-controls="sessions-list">
          ORACLE
        </button>
      </div>

      <div id="sessions-list" role="tabpanel" aria-label="Daftar riwayat"></div>
    </div>

    <!-- ── Detail Modal ── -->
    <div id="detail-modal" class="modal-overlay hidden"
      role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div class="modal-box" style="max-width:700px;max-height:90vh;overflow-y:auto;" id="modal-box">
        <button id="modal-close-btn" class="modal-close-btn" aria-label="Tutup detail">✕</button>
        <div id="detail-content"></div>
      </div>
    </div>

    <style>
      .history-wrap {
        max-width: 900px;
        margin: 0 auto;
        padding: 3rem 1.5rem 4rem;
      }
      .history-header {
        display: flex; align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 1.75rem; flex-wrap: wrap; gap: 1rem;
      }
      .history-actions {
        display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;
      }

      /* ── Tabs ── */
      .tab-row {
        display: flex; gap: 0;
        margin-bottom: 2rem;
        border-bottom: 1px solid var(--ink-shine);
      }
      .tab-btn {
        font-family: var(--font-heading); font-size: 11px;
        letter-spacing: 0.2em; padding: 0.65rem 1.5rem;
        border: none; border-bottom: 2px solid transparent;
        background: none; color: var(--bone-faint);
        cursor: pointer; transition: color 0.3s, border-color 0.3s;
      }
      .tab-btn:hover { color: var(--bone-dim); }
      .tab-btn.tab-active {
        border-bottom-color: var(--gold-dim);
        color: var(--gold);
      }
      .tab-btn:focus-visible { outline: 2px solid var(--gold-dim); outline-offset: 2px; }

      /* ── Session cards ── */
      .session-card {
        padding: 1.25rem 1.5rem;
        margin-bottom: 0.85rem;
        cursor: pointer;
        background: var(--ink-veil);
        border: 1px solid var(--ink-line);
        transition: border-color 0.3s, background 0.3s, transform 0.3s var(--ease-emerge);
        animation: fadeUp 0.4s var(--ease-emerge) both;
      }
      .session-card:hover {
        border-color: var(--gold-faint);
        transform: translateY(-2px);
      }
      .session-card:focus-visible { outline: 2px solid var(--gold-dim); outline-offset: 2px; }
      .session-card.selected-card { border-color: var(--gold-dim); background: rgba(200,168,75,0.04); }

      /* ── Empty state ── */
      .empty-state {
        text-align: center;
        padding: 6rem 2rem;
        animation: fadeUp 0.5s var(--ease-emerge) both;
      }

      /* ── Detail modal close btn ── */
      .modal-close-btn {
        position: absolute; top: 1rem; right: 1rem;
        color: var(--bone-faint); background: none; border: none;
        cursor: pointer; font-size: 1.2rem;
        transition: color 0.3s, transform 0.3s;
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
      }
      .modal-close-btn:hover { color: var(--bone); transform: rotate(90deg); }
      .modal-close-btn:focus-visible { outline: 2px solid var(--gold-dim); outline-offset: 2px; }

      /* ── Mini card thumb ── */
      .mini-thumb {
        width: 28px; height: 44px;
        overflow: hidden;
        border: 1px solid var(--ink-line);
        flex-shrink: 0;
      }
    </style>

    <script>
    ${markdownToHtmlFn}

    let readings   = [];
    let oracles    = [];
    let activeTab  = 'reading';
    let selectMode = false;
    let selected   = new Set();
    let _lastDetailFocus = null;

    /* ── FIX BUG-2: XSS-safe HTML escaping untuk semua user data ── */
    function escapeHtml(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    /* ── Load ── */
    function loadAll() {
      try { readings = JSON.parse(localStorage.getItem('jalurtarot-readings-v1') || '[]'); } catch { readings = []; }
      try { oracles  = JSON.parse(localStorage.getItem('jalurtarot-oracle-v1')   || '[]'); } catch { oracles  = []; }
      renderList();
    }

    /* ── Tab switch ── */
    function switchTab(tab) {
      activeTab  = tab;
      selectMode = false;
      selected.clear();
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('tab-active');
        b.setAttribute('aria-selected', 'false');
      });
      const active = document.getElementById('tab-' + tab);
      if (active) { active.classList.add('tab-active'); active.setAttribute('aria-selected', 'true'); }
      document.getElementById('select-btn').textContent = 'Pilih';
      document.getElementById('delete-selected-btn').style.display = 'none';
      renderList();
    }

    /* ── Render list ── */
    function renderList() {
      const list     = document.getElementById('sessions-list');
      const countEl  = document.getElementById('session-count');
      const selectBtn = document.getElementById('select-btn');
      const clearBtn  = document.getElementById('clear-all-btn');
      const items = activeTab === 'reading' ? readings : oracles;

      countEl.textContent = items.length + (activeTab === 'reading' ? ' sesi ramalan' : ' sesi oracle');
      selectBtn.style.display = items.length > 0 ? 'inline-block' : 'none';
      clearBtn.style.display  = items.length > 0 ? 'inline-block' : 'none';

      if (items.length === 0) {
        list.innerHTML = \`
          <div class="empty-state">
            <p class="font-heading text-bone-faint" style="font-size:1.4rem;letter-spacing:0.2em;margin-bottom:1rem;">BELUM ADA RIWAYAT</p>
            <p class="font-body text-bone-whisper" style="font-style:italic;margin-bottom:2rem;line-height:1.8;">Sesi pertamamu akan menjadi awal dari perjalanan ini.</p>
            <a href="\${activeTab === 'reading' ? '/reading' : '/reading'}" class="btn-primary">\${activeTab === 'reading' ? 'Mulai Ramalan' : 'Mulai Ramalan'}</a>
          </div>
        \`;
        return;
      }

      list.innerHTML = items.map((item, i) =>
        activeTab === 'reading' ? renderReadingCard(item, i) : renderOracleCard(item, i)
      ).join('');

      // Re-attach event delegation setelah render
      attachCardListeners();
    }

    /* ── Event delegation untuk session cards ── */
    function attachCardListeners() {
      const list = document.getElementById('sessions-list');
      // Hapus listener lama agar tidak double
      list.removeEventListener('click', _onCardClick);
      list.removeEventListener('keydown', _onCardKeydown);
      list.addEventListener('click', _onCardClick);
      list.addEventListener('keydown', _onCardKeydown);
    }

    function _onCardClick(e) {
      const card = e.target.closest('.session-card');
      if (!card) return;
      const id = card.getAttribute('data-id');
      if (!id) return;
      if (selectMode) toggleSelect(id, card);
      else if (activeTab === 'reading') openReadingDetail(id);
      else openOracleDetail(id);
    }

    function _onCardKeydown(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.session-card');
      if (!card) return;
      e.preventDefault();
      const id = card.getAttribute('data-id');
      if (!id) return;
      if (selectMode) toggleSelect(id, card);
      else if (activeTab === 'reading') openReadingDetail(id);
      else openOracleDetail(id);
    }

    /* ── Reading card ── */
    function renderReadingCard(r, i) {
      const date     = new Date(r.createdAt);
      const dateStr  = date.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
      const timeStr  = date.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
      const cardCount = r.drawnCards?.length || 0;
      const isSelected = selected.has(r.id);

      const thumbs = cardCount > 0 ? \`
        <div style="display:flex;gap:4px;margin-top:0.75rem;overflow:hidden;">
          \${r.drawnCards.slice(0,8).map(dc => \`
            <div class="mini-thumb">
              <img src="\${escapeHtml(dc.card.image)}" alt="\${escapeHtml(dc.card.name)}" loading="lazy"
                style="width:100%;height:100%;object-fit:cover;\${dc.isReversed ? 'transform:rotate(180deg);' : ''}" />
            </div>
          \`).join('')}
          \${cardCount > 8 ? '<span class="font-heading text-bone-whisper" style="font-size:10px;align-self:center;padding-left:4px;">+' + (cardCount - 8) + '</span>' : ''}
        </div>
      \` : '';

      return \`
        <div class="session-card\${isSelected ? ' selected-card' : ''}"
          tabindex="0" role="button" data-id="\${escapeHtml(r.id)}"
          aria-label="\${escapeHtml(r.question || 'Ramalan')}, \${escapeHtml(dateStr)}"
          style="animation-delay:\${i * 0.05}s;">
          <div style="display:flex;align-items:start;justify-content:space-between;gap:1rem;">
            <div style="flex:1;min-width:0;">
              <p class="font-body text-bone"
                style="font-size:1rem;line-height:1.5;margin-bottom:0.5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                \${escapeHtml(r.question || 'Pertanyaan tidak tercatat')}
              </p>
              <div style="display:flex;gap:1rem;flex-wrap:wrap;">
                <span class="font-heading text-bone-faint" style="font-size:10px;letter-spacing:0.12em;">\${escapeHtml(r.spread?.nameCn || r.spread?.name || '—')}</span>
                <span class="font-heading text-bone-whisper" style="font-size:10px;">\${cardCount} kartu</span>
                \${r.followUps?.length > 0 ? '<span class="font-heading text-celestial" style="font-size:10px;">◆ ' + r.followUps.length + 'x Tanya Lanjut</span>' : ''}
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <p class="font-heading text-bone-faint" style="font-size:11px;">\${escapeHtml(dateStr)}</p>
              <p class="font-heading text-bone-whisper" style="font-size:10px;">\${escapeHtml(timeStr)}</p>
            </div>
          </div>
          \${thumbs}
        </div>
      \`;
    }

    /* ── Oracle card ── */
    function renderOracleCard(o, i) {
      const date     = new Date(o.createdAt);
      const dateStr  = date.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
      const timeStr  = date.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
      const msgCount = o.log?.length || 0;
      const firstQ   = o.log?.find(e => e.type === 'user')?.text || 'Percakapan Oracle';
      const allCards = [];
      (o.log || []).forEach(e => { if (e.drawnCards) allCards.push(...e.drawnCards); });
      const isSelected = selected.has(o.id);

      const thumbs = allCards.length > 0 ? \`
        <div style="display:flex;gap:4px;margin-top:0.75rem;overflow:hidden;">
          \${allCards.slice(0,8).map(dc => \`
            <div class="mini-thumb">
              <img src="\${escapeHtml(dc.card.image)}" alt="\${escapeHtml(dc.card.name)}" loading="lazy"
                style="width:100%;height:100%;object-fit:cover;\${dc.isReversed ? 'transform:rotate(180deg);' : ''}" />
            </div>
          \`).join('')}
          \${allCards.length > 8 ? '<span class="font-heading text-bone-whisper" style="font-size:10px;align-self:center;padding-left:4px;">+' + (allCards.length - 8) + '</span>' : ''}
        </div>
      \` : '';

      return \`
        <div class="session-card\${isSelected ? ' selected-card' : ''}"
          tabindex="0" role="button" data-id="\${escapeHtml(o.id)}"
          aria-label="Oracle: \${escapeHtml(firstQ)}, \${escapeHtml(dateStr)}"
          style="animation-delay:\${i * 0.05}s;">
          <div style="display:flex;align-items:start;justify-content:space-between;gap:1rem;">
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;">
                <span class="font-heading text-celestial-dim" style="font-size:9px;letter-spacing:0.2em;">${iconEye(10)} ORACLE</span>
                \${o.tone ? '<span class="font-heading text-bone-whisper" style="font-size:9px;">· ' + escapeHtml(o.tone.toUpperCase()) + '</span>' : ''}
              </div>
              <p class="font-body text-bone"
                style="font-size:1rem;line-height:1.5;margin-bottom:0.5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                \${escapeHtml(firstQ)}
              </p>
              <div style="display:flex;gap:1rem;flex-wrap:wrap;">
                <span class="font-heading text-bone-whisper" style="font-size:10px;">\${Math.floor(msgCount/2)} pertanyaan</span>
                \${allCards.length > 0 ? '<span class="font-heading text-bone-whisper" style="font-size:10px;">' + allCards.length + ' kartu total</span>' : ''}
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <p class="font-heading text-bone-faint" style="font-size:11px;">\${escapeHtml(dateStr)}</p>
              <p class="font-heading text-bone-whisper" style="font-size:10px;">\${escapeHtml(timeStr)}</p>
            </div>
          </div>
          \${thumbs}
        </div>
      \`;
    }

    /* ── Select mode ── */
    function toggleSelectMode() {
      selectMode = !selectMode;
      selected.clear();
      document.getElementById('select-btn').textContent = selectMode ? 'Batal' : 'Pilih';
      document.getElementById('delete-selected-btn').style.display = selectMode ? 'inline-block' : 'none';
      renderList();
    }

    function toggleSelect(id, el) {
      if (selected.has(id)) { selected.delete(id); el.classList.remove('selected-card'); }
      else { selected.add(id); el.classList.add('selected-card'); }
      document.getElementById('delete-selected-btn').textContent = 'Hapus (' + selected.size + ')';
    }

    function deleteSelected() {
      if (selected.size === 0) return;
      if (!confirm('Hapus ' + selected.size + ' riwayat yang dipilih? Tindakan ini tidak dapat dibatalkan.')) return;
      if (activeTab === 'reading') {
        readings = readings.filter(r => !selected.has(r.id));
        localStorage.setItem('jalurtarot-readings-v1', JSON.stringify(readings));
      } else {
        oracles = oracles.filter(o => !selected.has(o.id));
        localStorage.setItem('jalurtarot-oracle-v1', JSON.stringify(oracles));
      }
      selected.clear(); selectMode = false;
      document.getElementById('select-btn').textContent = 'Pilih';
      document.getElementById('delete-selected-btn').style.display = 'none';
      renderList();
    }

    function clearAll() {
      const label = activeTab === 'reading' ? 'riwayat ramalan' : 'riwayat oracle';
      if (!confirm('Hapus semua ' + label + '? Tindakan ini tidak dapat dibatalkan.')) return;
      if (activeTab === 'reading') { readings = []; localStorage.removeItem('jalurtarot-readings-v1'); }
      else { oracles = []; localStorage.removeItem('jalurtarot-oracle-v1'); }
      renderList();
    }

    /* ── Detail: Reading — FIX BUG-2: semua user content pakai escapeHtml ── */
    function openReadingDetail(id) {
      const r = readings.find(x => x.id === id);
      if (!r) return;
      _lastDetailFocus = document.activeElement;
      const date = new Date(r.createdAt).toLocaleDateString('id-ID', {
        weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit',
      });

      const cardStrip = (r.drawnCards?.length > 0) ? \`
        <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.25em;margin-bottom:1rem;">KARTU YANG DITARIK</p>
        <div style="display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:0.5rem;margin-bottom:1.5rem;scrollbar-width:thin;">
          \${r.drawnCards.map(dc => \`
            <div style="flex-shrink:0;text-align:center;">
              <div style="width:56px;height:88px;overflow:hidden;border:1px solid var(--ink-line);">
                <img src="\${escapeHtml(dc.card.image)}" alt="\${escapeHtml(dc.card.name)}" loading="lazy"
                  style="width:100%;height:100%;object-fit:cover;\${dc.isReversed ? 'transform:rotate(180deg);' : ''}" />
              </div>
              <p class="font-heading text-bone-faint" style="font-size:8px;margin-top:4px;letter-spacing:0.05em;">\${escapeHtml(dc.position?.nameCn || dc.card.nameCn)}</p>
              \${dc.isReversed ? '<p class="font-heading text-gold-dim" style="font-size:8px;">↻</p>' : ''}
            </div>
          \`).join('')}
        </div>
      \` : '';

      // interpretation: ini adalah output LLM (HTML dari markdownToHtml), bukan user input — aman untuk innerHTML
      const interpSection = r.interpretation ? \`
        <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.25em;margin-bottom:1rem;">INTERPRETASI ORACLE</p>
        <div class="prose-tarot" style="margin-bottom:1.5rem;">\${markdownToHtml(r.interpretation)}</div>
      \` : '';

      const followUpSection = (r.followUps?.length > 0) ? \`
        <div class="rule-gold" style="margin:1.5rem 0;"></div>
        <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.25em;margin-bottom:1rem;">PERTANYAAN LANJUTAN (\${r.followUps.length})</p>
        \${r.followUps.map((fu, i) => \`
          <div class="ink-panel" style="padding:1rem;margin-bottom:0.85rem;">
            <p class="font-heading text-celestial" style="font-size:10px;letter-spacing:0.2em;margin-bottom:0.5rem;">PERTANYAAN · \${i+1}</p>
            <p class="font-body text-bone" style="margin-bottom:0.75rem;">\${escapeHtml(fu.question)}</p>
            \${fu.interpretation ? \`<div class="prose-tarot font-body text-bone-dim" style="font-size:0.9rem;">\${markdownToHtml(fu.interpretation)}</div>\` : ''}
          </div>
        \`).join('')}
      \` : '';

      const detailEl = document.getElementById('detail-content');
      detailEl.innerHTML = \`
        <div style="padding-top:0.5rem;">
          <p class="font-heading text-gold-dim" id="detail-title" style="font-size:10px;letter-spacing:0.3em;margin-bottom:0.5rem;">\${escapeHtml(date)}</p>
          <p class="font-body text-bone" style="font-size:1.1rem;line-height:1.6;margin-bottom:1.5rem;">\${escapeHtml(r.question || 'Pertanyaan tidak tercatat')}</p>
          <div style="display:flex;gap:2rem;margin-bottom:1.5rem;flex-wrap:wrap;">
            <div>
              <p class="font-heading text-bone-faint" style="font-size:10px;letter-spacing:0.2em;margin-bottom:0.25rem;">SUSUNAN</p>
              <p class="font-heading text-bone" style="font-size:0.9rem;">\${escapeHtml(r.spread?.nameCn || '—')}</p>
            </div>
            <div>
              <p class="font-heading text-bone-faint" style="font-size:10px;letter-spacing:0.2em;margin-bottom:0.25rem;">KARTU</p>
              <p class="font-heading text-bone" style="font-size:0.9rem;">\${r.drawnCards?.length || 0} kartu</p>
            </div>
            \${r.tone ? \`<div>
              <p class="font-heading text-bone-faint" style="font-size:10px;letter-spacing:0.2em;margin-bottom:0.25rem;">GAYA</p>
              <p class="font-heading text-bone" style="font-size:0.9rem;">\${escapeHtml(r.tone)}</p>
            </div>\` : ''}
          </div>
          <div class="rule-gold" style="margin:1.5rem 0;"></div>
          \${cardStrip}
          \${interpSection}
          \${followUpSection}
          <div style="display:flex;justify-content:space-between;margin-top:1.5rem;flex-wrap:wrap;gap:0.75rem;">
            <button class="btn-ghost detail-delete-btn" data-delete-id="\${escapeHtml(r.id)}" style="padding:0.5rem 1rem;font-size:10px;color:var(--mist);" aria-label="Hapus riwayat ini">Hapus Riwayat</button>
            <button class="btn-ghost detail-close-btn" style="padding:0.5rem 1rem;font-size:10px;" aria-label="Tutup detail">Tutup</button>
          </div>
        </div>
      \`;

      attachDetailBtns();
      openModal();
    }

    /* ── Detail: Oracle — FIX BUG-2: escapeHtml untuk semua user content ── */
    function openOracleDetail(id) {
      const o = oracles.find(x => x.id === id);
      if (!o) return;
      _lastDetailFocus = document.activeElement;
      const date = new Date(o.createdAt).toLocaleDateString('id-ID', {
        weekday:'long', day:'numeric', month:'long', year:'numeric',
      });

      const logHTML = (o.log || []).map(entry => {
        if (entry.type === 'user') return \`
          <div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">
            <div style="max-width:80%;padding:1rem 1.25rem;background:rgba(200,168,75,0.08);border:1px solid var(--gold-faint);">
              <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.2em;margin-bottom:0.5rem;">KAMU</p>
              <p class="font-body text-bone-dim" style="line-height:1.7;">\${escapeHtml(entry.text)}</p>
            </div>
          </div>
        \`;
        const cards = entry.drawnCards || [];
        return \`
          <div style="background:var(--ink-mist);border:1px solid var(--ink-line);padding:1.25rem;margin-bottom:1rem;">
            <p class="font-heading text-celestial-dim" style="font-size:10px;letter-spacing:0.2em;margin-bottom:0.75rem;">ORACLE</p>
            \${entry.spread ? '<p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.15em;margin-bottom:0.75rem;">${iconSpread(10)} ' + escapeHtml(entry.spread.nameCn) + '</p>' : ''}
            \${cards.length > 0 ? \`
              <div style="display:flex;gap:4px;margin-bottom:1rem;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin;">
                \${cards.map(dc => \`
                  <div style="flex-shrink:0;text-align:center;">
                    <div style="width:40px;height:62px;overflow:hidden;border:1px solid var(--ink-line);">
                      <img src="\${escapeHtml(dc.card.image)}" alt="\${escapeHtml(dc.card.name)}" loading="lazy"
                        style="width:100%;height:100%;object-fit:cover;\${dc.isReversed ? 'transform:rotate(180deg);' : ''}" />
                    </div>
                    <p class="font-heading text-bone-faint" style="font-size:7px;margin-top:2px;">\${escapeHtml(dc.position?.nameCn || '')}</p>
                  </div>
                \`).join('')}
              </div>
            \` : ''}
            \${entry.text ? '<div class="prose-tarot font-body text-bone-dim" style="font-size:0.9rem;">' + markdownToHtml(entry.text) + '</div>' : ''}
          </div>
        \`;
      }).join('');

      document.getElementById('detail-content').innerHTML = \`
        <div style="padding-top:0.5rem;">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;">
            <span class="font-heading text-celestial-dim" id="detail-title" style="font-size:9px;letter-spacing:0.2em;">${iconEye(10)} ORACLE SESSION</span>
            \${o.tone ? '<span class="font-heading text-bone-whisper" style="font-size:9px;">· ' + escapeHtml(o.tone.toUpperCase()) + '</span>' : ''}
          </div>
          <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.3em;margin-bottom:1.5rem;">\${escapeHtml(date)}</p>
          <div class="rule-gold" style="margin-bottom:1.5rem;"></div>
          \${logHTML}
          <div style="display:flex;justify-content:space-between;margin-top:1.5rem;flex-wrap:wrap;gap:0.75rem;">
            <button class="btn-ghost detail-delete-btn" data-delete-id="\${escapeHtml(o.id)}" style="padding:0.5rem 1rem;font-size:10px;color:var(--mist);" aria-label="Hapus riwayat ini">Hapus Riwayat</button>
            <button class="btn-ghost detail-close-btn" style="padding:0.5rem 1rem;font-size:10px;" aria-label="Tutup detail">Tutup</button>
          </div>
        </div>
      \`;

      attachDetailBtns();
      openModal();
    }

    /* ── Modal helpers ── */
    function openModal() {
      const modal = document.getElementById('detail-modal');
      modal.classList.remove('hidden');
      setTimeout(() => { document.getElementById('modal-close-btn')?.focus(); }, 50);
    }

    function attachDetailBtns() {
      // Delete buttons inside modal
      document.querySelectorAll('.detail-delete-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          deleteItem(this.getAttribute('data-delete-id'));
        });
      });
      // Close buttons inside modal
      document.querySelectorAll('.detail-close-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { closeDetail(); });
      });
    }

    /* ── Delete / close ── */
    function deleteItem(id) {
      if (!confirm('Hapus riwayat ini?')) return;
      if (activeTab === 'reading') {
        readings = readings.filter(r => r.id !== id);
        localStorage.setItem('jalurtarot-readings-v1', JSON.stringify(readings));
      } else {
        oracles = oracles.filter(o => o.id !== id);
        localStorage.setItem('jalurtarot-oracle-v1', JSON.stringify(oracles));
      }
      closeDetail(); renderList();
    }

    function closeDetail() {
      document.getElementById('detail-modal').classList.add('hidden');
      if (_lastDetailFocus) _lastDetailFocus.focus();
    }

    /* ── Init — semua event listener via addEventListener ── */

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        switchTab(this.getAttribute('data-tab'));
      });
    });

    // Select mode btn
    var selectBtn = document.getElementById('select-btn');
    if (selectBtn) selectBtn.addEventListener('click', function() { toggleSelectMode(); });

    // Delete selected btn
    var deleteSelectedBtn = document.getElementById('delete-selected-btn');
    if (deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', function() { deleteSelected(); });

    // Clear all btn
    var clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) clearAllBtn.addEventListener('click', function() { clearAll(); });

    // Modal close btn
    var modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', function() { closeDetail(); });

    // Modal overlay click-outside to close
    var detailModal = document.getElementById('detail-modal');
    if (detailModal) {
      detailModal.addEventListener('click', function(e) {
        if (e.target === this) closeDetail();
      });
    }

    // Modal box: stop propagation saat klik di dalam
    var modalBox = document.getElementById('modal-box');
    if (modalBox) modalBox.addEventListener('click', function(e) { e.stopPropagation(); });

    /* ── Focus trap for modal ── */
    if (detailModal) {
      detailModal.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { closeDetail(); return; }
        if (e.key !== 'Tab') return;
        const focusable = this.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
        else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
      });
    }

    loadAll();
    </script>
  `, '', { description: 'Riwayat sesi ramalan dan oracle tarotmu — tersimpan di browser.' });
}