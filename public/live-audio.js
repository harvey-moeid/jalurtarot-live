/* Shared browser/OBS audio: local Web Speech TTS + synthesized copyright-free cues. */
(function (root) {
  'use strict';
  const defaults = {
    live1Tts: false, live2Tts: false, voice: 'female',
    rate: 0.93, pitch: 1.13, volume: 0.9,
    giftSound: false, likeSound: false, sfxVolume: 0.35,
    ambient: false, ambientVolume: 0.12
  };
  const query = new URLSearchParams(location.search);
  const forced = query.get('voice') === '1' ? true : query.get('voice') === '0' ? false : null;
  const AudioContextClass = root.AudioContext || root.webkitAudioContext;

  function create(live) {
    let settings = { ...defaults };
    let localOverride = null;
    let ctx = null;
    let pad = null;
    let speechId = 0;
    let lastConfig = '';
    const listeners = [];

    function isEnabled() {
      return localOverride !== null ? localOverride
        : forced !== null ? forced : !!settings[live + 'Tts'];
    }
    function announce() {
      listeners.forEach(function (listener) { try { listener(); } catch (_) {} });
    }
    function cancel() {
      speechId++;
      try { if ('speechSynthesis' in root) root.speechSynthesis.cancel(); } catch (_) {}
    }
    function setEnabled(value) {
      const before = isEnabled();
      localOverride = Boolean(value);
      if (!isEnabled()) cancel();
      if (before !== isEnabled()) announce();
    }
    function ensureContext() {
      if (!AudioContextClass) return null;
      try {
        if (!ctx) ctx = new AudioContextClass();
        if (ctx.state === 'suspended') ctx.resume().catch(function () {});
        return ctx;
      } catch (_) { return null; }
    }
    function clearPad() {
      if (!pad) return;
      try {
        pad.gain.gain.setTargetAtTime(0, pad.ctx.currentTime, 0.12);
        const previous = pad;
        setTimeout(function () {
          previous.oscillators.forEach(function (o) { try { o.stop(); } catch (_) {} });
          try { previous.gain.disconnect(); } catch (_) {}
        }, 850);
      } catch (_) {}
      pad = null;
    }
    function syncAmbient() {
      if (!settings.ambient || settings.ambientVolume <= 0) { clearPad(); return; }
      const ac = ensureContext();
      if (!ac) return;
      if (pad) {
        pad.gain.gain.setTargetAtTime(settings.ambientVolume * 0.035, ac.currentTime, 0.3);
        return;
      }
      try {
        const master = ac.createGain();
        master.gain.value = 0;
        master.connect(ac.destination);
        // Soft sustained three-note pad, no third-party audio or assets.
        const oscillators = [174.61, 261.63, 349.23].map(function (freq) {
          const osc = ac.createOscillator();
          osc.type = 'sine'; osc.frequency.value = freq;
          osc.connect(master); osc.start();
          return osc;
        });
        pad = { ctx: ac, gain: master, oscillators: oscillators };
        master.gain.setTargetAtTime(settings.ambientVolume * 0.035, ac.currentTime, 1);
      } catch (_) { clearPad(); }
    }
    function unlock() {
      const ac = ensureContext();
      if (ac) syncAmbient();
      // This method must be called by a click/tap where autoplay blocks audio.
    }
    function playEvent(type) {
      if (type === 'gift' ? !settings.giftSound : type === 'like' ? !settings.likeSound : true) return;
      if (settings.sfxVolume <= 0) return;
      const ac = ensureContext();
      if (!ac) return;
      try {
        const notes = type === 'gift' ? [523.25, 659.25, 783.99] : [659.25, 880];
        const now = ac.currentTime + 0.015;
        notes.forEach(function (freq, index) {
          const start = now + index * 0.12;
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = 'sine'; osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, settings.sfxVolume * 0.075), start + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.37);
          osc.connect(gain); gain.connect(ac.destination);
          osc.start(start); osc.stop(start + 0.4);
          osc.onended = function () { try { osc.disconnect(); gain.disconnect(); } catch (_) {} };
        });
      } catch (_) {}
    }
    function selectVoice() {
      if (!('speechSynthesis' in root)) return null;
      const voices = root.speechSynthesis.getVoices ? root.speechSynthesis.getVoices() : [];
      const id = voices.filter(function (voice) { return /^id[-_]/i.test(voice.lang); });
      if (!id.length) return null;
      if (settings.voice === 'female') {
        const female = id.find(function (v) {
          return /female|wanita|perempuan|gadis|damayanti|dewi|siti|google bahasa indonesia/i.test(v.name);
        });
        if (female) return female;
      }
      return id[0];
    }
    function pieces(text) {
      const words = String(text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().split(/\s+/);
      const result = [];
      let line = '';
      for (const word of words) {
        if (line && line.length + word.length + 1 > 185) {
          result.push(line); line = word;
        } else line += (line ? ' ' : '') + word;
      }
      if (line) result.push(line);
      return result;
    }
    function speak(text, onDone) {
      if (!isEnabled() || !('speechSynthesis' in root) || typeof root.SpeechSynthesisUtterance !== 'function') return false;
      const chunks = pieces(text);
      if (!chunks.length) return false;
      cancel();
      const id = speechId;
      let index = 0;
      function next() {
        if (id !== speechId) return;
        if (index >= chunks.length) { if (typeof onDone === 'function') onDone(); return; }
        try {
          const utterance = new root.SpeechSynthesisUtterance(chunks[index++]);
          utterance.lang = 'id-ID';
          utterance.rate = settings.rate;
          utterance.pitch = settings.pitch;
          utterance.volume = settings.volume;
          const voice = selectVoice();
          if (voice) utterance.voice = voice;
          utterance.onend = next;
          utterance.onerror = function () { if (id === speechId && typeof onDone === 'function') onDone(); };
          root.speechSynthesis.speak(utterance);
        } catch (_) { if (id === speechId && typeof onDone === 'function') onDone(); }
      }
      next();
      return true;
    }
    async function refresh() {
      try {
        const response = await fetch('/api/live/audio-settings', { cache: 'no-store' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const value = await response.json();
        // Disallow arbitrary injected settings and ignore malformed responses.
        if (!value || typeof value !== 'object' || typeof value.live1Tts !== 'boolean'
          || typeof value.live2Tts !== 'boolean') return;
        const normalized = {};
        for (const key of Object.keys(defaults)) {
          const wanted = value[key];
          normalized[key] = typeof wanted === typeof defaults[key] ? wanted : defaults[key];
        }
        const serialized = JSON.stringify(normalized);
        if (lastConfig === serialized) return;
        const previouslyEnabled = isEnabled();
        lastConfig = serialized;
        settings = normalized;
        if (previouslyEnabled && !isEnabled()) cancel();
        syncAmbient();
        announce();
      } catch (_) {
        // Keep last known/default settings during outages, never block readings.
      }
    }
    const ready = refresh();
    // Admin settings propagate to already-open OBS Browser Sources.
    const refreshTimer = setInterval(function () { if (!document.hidden) refresh(); }, 30000);
    if (root.addEventListener) root.addEventListener('pagehide', function () {
      clearInterval(refreshTimer); cancel(); clearPad();
      if (ctx) { try { ctx.close(); } catch (_) {} }
    });
    return {
      ready: ready, refresh: refresh, isEnabled: isEnabled, setEnabled: setEnabled,
      speak: speak, cancel: cancel, playEvent: playEvent, unlock: unlock,
      onChange: function (listener) { if (typeof listener === 'function') listeners.push(listener); }
    };
  }
  root.LiveAudio = { create: create };
})(window);
