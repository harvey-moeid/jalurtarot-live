/* Shared fullscreen controls for LIVE 1 and LIVE 2.
 * OBS fills its Browser Source automatically; control is hidden until viewer interaction.
 * Native fullscreen requires a real click/tap, not a URL parameter or auto-run. */
(function () {
  'use strict';
  var button = document.getElementById('overlay-fullscreen-button');
  var control = document.getElementById('overlay-fullscreen-control');
  var status = document.getElementById('overlay-fullscreen-status');
  if (!button || !control) return;

  var query = new URLSearchParams(location.search);
  var mode = query.get('controls');
  var permanentlyVisible = mode === '1' || query.get('debug') === '1';
  var disabled = mode === '0';
  var hideTimer = null;

  if (disabled) {
    control.hidden = true;
    return;
  }
  if (permanentlyVisible) control.classList.add('is-pinned');

  function inFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }
  function update() {
    var on = inFullscreen();
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    button.setAttribute('aria-label', on ? 'Keluar layar penuh' : 'Masuk layar penuh');
    button.title = on ? 'Keluar layar penuh' : 'Masuk layar penuh';
    var label = button.querySelector('.overlay-fullscreen-label');
    if (label) label.textContent = on ? 'Keluar Layar Penuh' : 'Layar Penuh';
    var icon = button.querySelector('.overlay-fullscreen-icon');
    if (icon) icon.textContent = on ? '⊟' : '⛶';
  }
  function notify(message) {
    if (!status) return;
    status.textContent = message;
    status.hidden = false;
  }
  function reveal() {
    if (permanentlyVisible) return;
    control.classList.add('is-visible');
    if (hideTimer !== null) clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      if (!control.matches(':focus-within')) control.classList.remove('is-visible');
    }, 4200);
  }
  function toggle() {
    // Request fullscreen synchronously inside this trusted user-gesture handler.
    try {
      if (inFullscreen()) {
        var exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (!exit) {
          notify('Browser ini tidak mendukung keluar fullscreen melalui tombol.');
          return;
        }
        var result = exit.call(document);
        if (result && typeof result.catch === 'function') {
          result.catch(function () { notify('Gagal keluar fullscreen. Coba tombol Escape.'); });
        }
      } else {
        var target = document.documentElement;
        var request = target && (target.requestFullscreen || target.webkitRequestFullscreen);
        if (!request) {
          notify('Browser ini tidak mendukung fullscreen halaman. Coba F11 di komputer.');
          return;
        }
        var result = request.call(target);
        if (result && typeof result.catch === 'function') {
          result.catch(function () { notify('Fullscreen ditolak oleh browser. Coba lagi melalui tombol atau gunakan F11.'); });
        }
      }
    } catch (_) {
      notify('Fullscreen tidak tersedia pada browser atau perangkat ini.');
    }
  }

  button.addEventListener('click', function (event) {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    reveal();
    toggle();
  });
  // Discoverable for mouse, keyboard and touch; never leave button visible in OBS.
  document.addEventListener('pointermove', reveal, { passive: true });
  document.addEventListener('touchstart', reveal, { passive: true });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'f' || event.key === 'F') {
      if (event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName || '')) return;
      toggle();
    }
    if (event.key === 'Tab' || event.key === 'Escape') reveal();
  });
  document.addEventListener('fullscreenchange', update);
  document.addEventListener('webkitfullscreenchange', update);
  document.addEventListener('fullscreenerror', function () {
    notify('Permintaan fullscreen tidak diizinkan pada browser ini.');
  });
  button.addEventListener('focus', reveal);
  update();
  if (permanentlyVisible) reveal();
})();