import { pageLayout } from '../lib/layout';
import { allCards } from '../lib/cards';

export function libraryPage(): string {
  const major  = allCards.filter(c => c.type === 'major');
  const suits  = ['wands','cups','swords','pentacles'] as const;
  const suitNames: Record<string, string> = {
    wands:     'Tongkat · Wands',
    cups:      'Cawan · Cups',
    swords:    'Pedang · Swords',
    pentacles: 'Koin · Pentacles',
  };

  // Card grid HTML — data dari server (bukan user input), aman tanpa escapeHtml
  // onclick= DIHAPUS — pakai data-card-id, event delegation di script
  const cardGridHTML = (cards: typeof allCards) => cards.map(c => `
    <button
      class="card-thumb"
      data-card-id="${c.id}"
      aria-label="Lihat detail ${c.name}${c.nameCn !== c.name ? ' — ' + c.nameCn : ''}">
      <img src="${c.image}" alt="${c.name}" loading="lazy" class="card-thumb-img" />
      <div class="card-thumb-label">
        <p class="font-heading text-bone" style="font-size:9px;letter-spacing:0.1em;">${c.nameCn}</p>
      </div>
    </button>
  `).join('');

  const sections = `
    <div id="section-all">
      <h2 class="font-heading text-bone-faint section-heading">ARKANA MAYOR · ${major.length} KARTU</h2>
      <div class="cards-grid">${cardGridHTML(major)}</div>
      ${suits.map(suit => {
        const cards = allCards.filter(c => c.suit === suit);
        return `
          <h2 class="font-heading text-bone-faint section-heading">${suitNames[suit].toUpperCase()} · ${cards.length} KARTU</h2>
          <div class="cards-grid">${cardGridHTML(cards)}</div>
        `;
      }).join('')}
    </div>
  `;

  return pageLayout('Perpustakaan Kartu', `
    <div class="library-wrap">

      <!-- Header -->
      <div class="library-header reveal">
        <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.3em;margin-bottom:0.5rem;">GALERI KARTU</p>
        <h1 class="font-heading text-bone" style="font-size:1.8rem;letter-spacing:0.15em;">78 KARTU</h1>
        <p class="font-body text-bone-faint" style="font-size:0.85rem;margin-top:0.5rem;font-style:italic;">Rider-Waite-Smith · Deck Lengkap</p>
      </div>

      <!-- Filter tabs — FIX: Hapus onclick= inline, pakai data-filter-id -->
      <div class="filter-row reveal reveal-delay-1" role="group" aria-label="Filter kartu">
        ${[
          { id: 'all',       label: 'Semua',       count: 78 },
          { id: 'major',     label: 'Arkana Mayor', count: 22 },
          { id: 'wands',     label: 'Tongkat',      count: 14 },
          { id: 'cups',      label: 'Cawan',        count: 14 },
          { id: 'swords',    label: 'Pedang',       count: 14 },
          { id: 'pentacles', label: 'Koin',         count: 14 },
        ].map(f => `
          <button
            id="filter-${f.id}"
            data-filter-id="${f.id}"
            class="filter-btn${f.id === 'all' ? ' filter-active' : ''}"
            aria-pressed="${f.id === 'all' ? 'true' : 'false'}"
            aria-label="Filter ${f.label} (${f.count} kartu)">
            ${f.label} <span class="font-heading text-bone-whisper" style="font-size:10px;">${f.count}</span>
          </button>
        `).join('')}
      </div>

      <!-- Cards container -->
      <div id="cards-container">${sections}</div>
    </div>

    <!-- ── Card Detail Modal — FIX: Hapus onclick= inline di overlay & close btn ── -->
    <div id="card-modal" class="modal-overlay hidden"
      role="dialog" aria-modal="true" aria-labelledby="modal-name">
      <div id="modal-box" class="modal-box modal-card-layout">
        <button id="modal-close-btn" class="modal-close-btn"
          aria-label="Tutup detail kartu">✕</button>

        <!-- Card image -->
        <div>
          <div class="float-card" style="aspect-ratio:3/5;overflow:hidden;" role="img" aria-label="Gambar kartu">
            <img id="modal-img" src="" alt="" style="width:100%;height:100%;object-fit:cover;" />
          </div>
        </div>

        <!-- Card info -->
        <div class="modal-info-col">
          <p id="modal-type" class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.25em;margin-bottom:0.5rem;"></p>
          <h2 id="modal-name" class="font-heading text-bone" style="font-size:1.4rem;letter-spacing:0.12em;margin-bottom:0.25rem;"></h2>
          <p id="modal-subname" class="font-body text-bone-faint" style="font-size:0.9rem;font-style:italic;margin-bottom:1.5rem;"></p>

          <div style="margin-bottom:1.25rem;">
            <p class="font-heading text-gold-dim" style="font-size:10px;letter-spacing:0.2em;margin-bottom:0.5rem;">NORMAL</p>
            <div id="modal-kw-up" class="kw-row" style="margin-bottom:0.75rem;" role="list" aria-label="Kata kunci normal"></div>
            <p id="modal-meaning-up" class="font-body text-bone-dim" style="font-size:0.85rem;line-height:1.75;"></p>
          </div>

          <div class="rule-gold" style="margin:1rem 0;"></div>

          <div>
            <p class="font-heading text-mist" style="font-size:10px;letter-spacing:0.2em;margin-bottom:0.5rem;">TERBALIK</p>
            <div id="modal-kw-rev" class="kw-row" style="margin-bottom:0.75rem;" role="list" aria-label="Kata kunci terbalik"></div>
            <p id="modal-meaning-rev" class="font-body text-bone-dim" style="font-size:0.85rem;line-height:1.75;"></p>
          </div>
        </div>
      </div>
    </div>

    <style>
      .library-wrap {
        max-width: 1150px;
        margin: 0 auto;
        padding: 3rem 1.5rem 4rem;
      }
      .library-header { margin-bottom: 2rem; }

      .filter-row {
        display: flex; gap: 0.6rem; flex-wrap: wrap;
        margin-bottom: 2.5rem;
      }

      /* Cards grid */
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
        gap: 0.65rem;
        margin-bottom: 3rem;
      }
      @media (max-width: 480px) {
        .cards-grid { grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); gap: 0.5rem; }
      }

      .section-heading {
        font-size: 11px; letter-spacing: 0.3em;
        margin-bottom: 1.25rem; padding-top: 1.5rem;
      }

      /* Card thumbnail */
      .card-thumb {
        background: none;
        border: 1px solid var(--ink-line);
        cursor: pointer;
        padding: 0; overflow: hidden;
        aspect-ratio: 3/5;
        position: relative;
        transition: border-color 0.3s, transform 0.35s var(--ease-emerge), box-shadow 0.3s;
      }
      .card-thumb:hover, .card-thumb:focus-visible {
        border-color: var(--gold-dim);
        transform: translateY(-5px);
        box-shadow: 0 12px 30px rgba(0,0,0,0.5), 0 0 0 1px var(--gold-faint);
        outline: none;
        z-index: 2;
      }
      .card-thumb:focus-visible { outline: 2px solid var(--gold-dim); outline-offset: 2px; }
      .card-thumb-img {
        width: 100%; height: 100%; object-fit: cover; display: block;
        transition: transform 0.5s var(--ease-veil);
      }
      .card-thumb:hover .card-thumb-img { transform: scale(1.04); }
      .card-thumb-label {
        position: absolute; inset-x: 0; bottom: 0;
        padding: 0.45rem 0.4rem;
        background: linear-gradient(to top, rgba(5,5,7,0.95), transparent);
        text-align: left;
      }

      /* Modal layout */
      .modal-card-layout {
        max-width: 660px !important;
        display: grid;
        grid-template-columns: 1fr 1.6fr;
        gap: 1.75rem;
        padding: 2rem !important;
      }
      @media (max-width: 580px) {
        .modal-card-layout {
          grid-template-columns: 1fr;
          max-height: 90vh;
          overflow-y: auto;
        }
      }
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
      .modal-info-col { padding-top: 0.5rem; overflow-y: auto; }
      .kw-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    </style>

    <script>
      const allCardsData = ${JSON.stringify(allCards)};
      // Map id → card object untuk lookup O(1)
      const cardMap = {};
      allCardsData.forEach(function(c) { cardMap[c.id] = c; });

      let _lastFocus = null;

      /* ── Show card modal ── */
      function showCard(cardId) {
        const c = cardMap[cardId];
        if (!c) return;

        // Semua content kartu dari server (bukan user input) — aman pakai textContent
        document.getElementById('modal-img').src = c.image;
        document.getElementById('modal-img').alt = c.name;
        document.getElementById('modal-type').textContent = c.type === 'major'
          ? 'ARKANA MAYOR'
          : 'ARKANA MINOR · ' + (c.suit || '').toUpperCase();
        document.getElementById('modal-name').textContent    = c.nameCn;
        document.getElementById('modal-subname').textContent = c.name;

        const kwUp  = document.getElementById('modal-kw-up');
        const kwRev = document.getElementById('modal-kw-rev');
        kwUp.innerHTML = c.keywords.upright.map(function(k) {
          return '<span class="font-heading text-gold-dim chip-gold" role="listitem" style="font-size:9px;letter-spacing:0.15em;">' + k + '</span>';
        }).join('');
        kwRev.innerHTML = c.keywords.reversed.map(function(k) {
          return '<span class="font-heading text-mist chip" role="listitem" style="font-size:9px;letter-spacing:0.15em;border-color:var(--ink-shine);color:var(--mist);">' + k + '</span>';
        }).join('');
        document.getElementById('modal-meaning-up').textContent  = c.meaning.upright;
        document.getElementById('modal-meaning-rev').textContent = c.meaning.reversed;

        _lastFocus = document.activeElement;
        document.getElementById('card-modal').classList.remove('hidden');
        setTimeout(function() {
          var btn = document.getElementById('modal-close-btn');
          if (btn) btn.focus();
        }, 50);
      }

      function closeCard() {
        document.getElementById('card-modal').classList.add('hidden');
        if (_lastFocus) _lastFocus.focus();
      }

      /* ── Filter ── */
      function filterCards(type) {
        document.querySelectorAll('.filter-btn').forEach(function(b) {
          b.classList.remove('filter-active');
          b.setAttribute('aria-pressed', 'false');
        });
        var activeBtn = document.getElementById('filter-' + type);
        if (activeBtn) { activeBtn.classList.add('filter-active'); activeBtn.setAttribute('aria-pressed', 'true'); }

        var filtered;
        if (type === 'all')        filtered = allCardsData;
        else if (type === 'major') filtered = allCardsData.filter(function(c) { return c.type === 'major'; });
        else                       filtered = allCardsData.filter(function(c) { return c.suit === type; });

        var container = document.getElementById('cards-container');
        container.innerHTML =
          '<div class="cards-grid">' +
          filtered.map(function(c) {
            return '<button class="card-thumb" data-card-id="' + c.id + '" aria-label="Lihat detail ' + c.name + '">' +
              '<img src="' + c.image + '" alt="' + c.name + '" loading="lazy" class="card-thumb-img" />' +
              '<div class="card-thumb-label"><p class="font-heading text-bone" style="font-size:9px;letter-spacing:0.1em;">' + c.nameCn + '</p></div>' +
              '</button>';
          }).join('') +
          '</div>';
        // Re-attach delegation setelah render
        attachCardDelegation(container);
      }

      /* ── Event delegation untuk card grid ── */
      function attachCardDelegation(container) {
        // Hapus listener lama (clone trick)
        container.removeEventListener('click', _onGridClick);
        container.removeEventListener('keydown', _onGridKeydown);
        container.addEventListener('click', _onGridClick);
        container.addEventListener('keydown', _onGridKeydown);
      }

      function _onGridClick(e) {
        var btn = e.target.closest('.card-thumb');
        if (btn) showCard(btn.getAttribute('data-card-id'));
      }
      function _onGridKeydown(e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var btn = e.target.closest('.card-thumb');
        if (btn) { e.preventDefault(); showCard(btn.getAttribute('data-card-id')); }
      }

      /* ── Init — semua via addEventListener ── */

      // Card grid event delegation (server-rendered HTML)
      var cardsContainer = document.getElementById('cards-container');
      attachCardDelegation(cardsContainer);

      // Filter buttons — event delegation pada .filter-row
      var filterRow = document.querySelector('.filter-row');
      if (filterRow) {
        filterRow.addEventListener('click', function(e) {
          var btn = e.target.closest('.filter-btn');
          if (btn) filterCards(btn.getAttribute('data-filter-id'));
        });
      }

      // Modal close button
      var modalCloseBtn = document.getElementById('modal-close-btn');
      if (modalCloseBtn) modalCloseBtn.addEventListener('click', function() { closeCard(); });

      // Modal overlay click-outside
      var cardModal = document.getElementById('card-modal');
      if (cardModal) {
        cardModal.addEventListener('click', function(e) {
          if (e.target === this) closeCard();
        });
      }

      // Modal box: stop propagation
      var modalBox = document.getElementById('modal-box');
      if (modalBox) modalBox.addEventListener('click', function(e) { e.stopPropagation(); });

      // Focus trap + Escape
      if (cardModal) {
        cardModal.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') { closeCard(); return; }
          if (e.key !== 'Tab') return;
          var focusable = this.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
          var first = focusable[0], last = focusable[focusable.length - 1];
          if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
          else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
        });
      }
    </script>
  `, '', { description: 'Galeri lengkap 78 kartu tarot Rider-Waite-Smith — Arkana Mayor dan Minor dengan makna lengkap.' });
}
