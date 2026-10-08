/* LIVE 2: realtime tarot, no API keys in browser. WebGL 3D host drawn locally. */
(function () {
  'use strict';

  const query = new URLSearchParams(location.search);
  const demo = query.get('demo') === '1';
  const soundWanted = query.get('voice') === '1';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = document.getElementById('live2');
  const reading = document.getElementById('reading');
  const cardsPanel = document.getElementById('reading-cards');
  const status = document.getElementById('live-status');
  const speech = document.getElementById('speech');
  const speechTitle = document.getElementById('speech-title');
  const speechMessage = document.getElementById('speech-message');
  const soundToggle = document.getElementById('sound-toggle');
  const canvas = document.getElementById('host3d');
  const modelDebug = document.getElementById('host-model-debug');
  const modelDebugEnabled = query.get('debug') === '1';

  function reportModel(state, message, error) {
    overlay.setAttribute('data-model-state', state);
    if (modelDebugEnabled && modelDebug) {
      modelDebug.hidden = false;
      const cause = error ? ' — ' + safeText(error.message || error, 150) : '';
      modelDebug.textContent = '3D ' + state.toUpperCase() + ': ' + message + cause;
    }
    if (error && typeof console !== 'undefined' && console.warn) {
      console.warn('[Jalur Tarot LIVE 2] ' + message, error);
    }
  }

  if (query.get('background') === '1') overlay.classList.add('with-background');

  let lastId = null;
  let activeId = null;
  let heldCardImage = '/cards/major/18-moon.jpg';
  let activeUntil = 0;
  let speakingUntil = 0;
  let voiceEnabled = soundWanted;
  let polling = false;
  let pollTimer = 0;
  let closeTimer = 0;
  let voiceTimer = 0;
  const HIDE_AFTER_MS = 45_000;
  const POLL_INTERVAL_MS = 1200;
  const MAX_CLIENT_AGE_MS = 120_000;

  function safeText(text, limit) {
    return String(text == null ? '' : text).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, limit);
  }
  function brief(text, limit) {
    const normalized = safeText(text, 1200).replace(/::(?:spark|heart|briefcase|crystal)::/g, '').replace(/\*{1,2}/g, '').replace(/\s+/g, ' ').trim();
    if (normalized.length <= limit) return normalized;
    const chunk = normalized.slice(0, limit + 1);
    const space = chunk.lastIndexOf(' ');
    return chunk.slice(0, space > limit * .6 ? space : limit).trimEnd() + '…';
  }
  function cardTitle(card) {
    return safeText(card && (card.nameCn || card.name), 65) || 'Kartu Tarot';
  }
  function utteranceFor(draw) {
    const card = draw.cards[0];
    const aspect = card && card.aspect && card.aspect.nasib;
    return brief(aspect || draw.summary || 'Ikuti suara hati dan temukan pesanmu hari ini.', 200);
  }
  function markTalking() {
    return Date.now() < speakingUntil;
  }

  function say(text) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.93;
      utterance.pitch = 1.13;
      const voices = speechSynthesis.getVoices();
      const bahasa = voices.find(v => /^id[-_]/i.test(v.lang));
      if (bahasa) utterance.voice = bahasa;
      utterance.onend = () => { speakingUntil = 0; speech.classList.remove('talking'); };
      utterance.onerror = () => { speakingUntil = 0; speech.classList.remove('talking'); };
      speechSynthesis.speak(utterance);
    } catch (_) {
      // OBS and mobile browser voice availability varies; text remains usable.
    }
  }

  function stopReading() {
    clearTimeout(closeTimer);
    reading.hidden = true;
    activeId = null;
    activeUntil = 0;
    speakingUntil = 0;
    speech.classList.remove('talking');
    speechTitle.textContent = 'Selamat datang di LIVE ✨';
    speechMessage.textContent = 'Kirim gift atau kumpulkan like untuk membuka pesan dari kartu tarot.';
    document.getElementById('viewer-label').textContent = 'Menanti energi baik...';
    status.textContent = 'Menunggu pembacaan tarot.';
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (_) {}
  }

  function present(draw) {
    if (!draw || !Array.isArray(draw.cards) || draw.cards.length < 1) return;
    if (typeof draw.id !== 'string' && typeof draw.id !== 'number') return;
    const eventAge = Date.now() - Number(draw.createdAt);
    if (!demo && (!Number.isFinite(eventAge) || eventAge < -15_000 || eventAge > MAX_CLIENT_AGE_MS)) return;
    const id = String(draw.id);
    if (id === lastId) return;
    lastId = id;
    activeId = id;
    activeUntil = Date.now() + HIDE_AFTER_MS;

    const username = safeText(draw.username, 36) || 'Penonton';
    const message = utteranceFor(draw);
    const isLike = draw.triggerType === 'like';
    const giftName = safeText(draw.giftName, 80);
    // A shorter bubble protects the character; the reading panel keeps the full message.
    speechTitle.textContent = 'Ramalan untuk ' + brief(username, 23);
    speechMessage.textContent = brief(message, 115);
    speakingUntil = Date.now() + Math.min(16_000, Math.max(3800, message.length * 80));
    speech.classList.add('talking');
    document.getElementById('reading-name').textContent = 'Untuk ' + username;
    document.getElementById('reading-summary').textContent = message;
    document.getElementById('viewer-label').textContent = username + ' · ' + (isLike ? 'Terima kasih untuk like!' : 'Terima kasih sudah hadir!');
    document.getElementById('reading-gift').textContent = giftName ? ((isLike ? '♥ ' : '🎁 ') + giftName + (Number(draw.giftCount) > 1 && !isLike ? ' ×' + Math.min(Number(draw.giftCount), 1000000) : '')) : '✦ Ramalan Baru';
    const firstPath = String(draw.cards[0] && draw.cards[0].image || '');
    heldCardImage = /^\/cards\/[a-z0-9/_-]+\.jpe?g$/i.test(firstPath) ? firstPath : '/cards/major/00-fool.jpg';
    cardsPanel.replaceChildren();

    draw.cards.slice(0, 3).forEach(function (card, index) {
      if (!card || typeof card !== 'object') return;
      const fig = document.createElement('figure');
      fig.className = 'tarot-card' + (card.isReversed ? ' is-reversed' : '');
      const img = document.createElement('img');
      const path = String(card.image || '');
      // Prevent arbitrary external image URLs or data: payloads in overlay.
      img.src = /^\/cards\/[a-z0-9/_-]+\.jpe?g$/i.test(path) ? path : '/cards/major/00-fool.jpg';
      img.alt = cardTitle(card);
      img.loading = 'eager';
      img.decoding = 'async';
      const caption = document.createElement('figcaption');
      caption.textContent = cardTitle(card);
      const info = document.createElement('small');
      info.textContent = (safeText(card.positionNameCn, 40) || 'Kartu ' + (index + 1)) + (card.isReversed ? ' · Terbalik' : '');
      caption.appendChild(info);
      fig.append(img, caption);
      cardsPanel.appendChild(fig);
    });

    reading.hidden = false;
    status.textContent = 'Ramalan baru untuk ' + username + ': ' + message;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () { if (activeId === id) stopReading(); }, HIDE_AFTER_MS);
    say('Ramalan untuk ' + username + '. ' + cardTitle(draw.cards[0]) + '. ' + message);
  }

  const demoDraw = {
    id: 'demo-live2-1', createdAt: Date.now(), username: '@penonton',
    triggerType: 'gift', giftName: 'Rose', giftCount: 1,
    cards: [
      { nameCn: 'The Moon', image: '/cards/major/18-moon.jpg', positionNameCn: 'Saat Ini', aspect: { nasib: 'Dengarkan suara hatimu. Ada kebenaran yang mulai terlihat, dan intuisi akan membimbing langkahmu.' } },
      { nameCn: 'The Star', image: '/cards/major/17-star.jpg', positionNameCn: 'Harapan' },
      { nameCn: 'The Sun', image: '/cards/major/19-sun.jpg', positionNameCn: 'Masa Depan' }
    ]
  };

  async function poll() {
    if (polling || demo) return;
    if (document.hidden) { schedule(3000); return; }
    polling = true;
    const ctrl = new AbortController();
    const abort = setTimeout(() => ctrl.abort(), 8000);
    try {
      const response = await fetch('/api/live/state?t=' + Date.now(), { cache: 'no-store', signal: ctrl.signal });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const payload = await response.json();
      if (payload && payload.draw) present(payload.draw);
    } catch (_) {
      // Webhook and network may be temporarily unavailable. Keep last valid overlay.
    } finally {
      clearTimeout(abort);
      polling = false;
      schedule(POLL_INTERVAL_MS);
    }
  }
  function schedule(delay) {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(poll, delay);
  }

  if (soundWanted) {
    if ('speechSynthesis' in window) {
      soundToggle.hidden = false;
      soundToggle.textContent = '🔊 Suara aktif';
      soundToggle.setAttribute('aria-pressed', 'true');
      soundToggle.onclick = () => {
        voiceEnabled = !voiceEnabled;
        soundToggle.textContent = voiceEnabled ? '🔊 Suara aktif' : '🔇 Suara mati';
        soundToggle.setAttribute('aria-pressed', String(voiceEnabled));
        if (!voiceEnabled) speechSynthesis.cancel();
      };
    }
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !demo) schedule(0);
    if (document.hidden) {
      try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (_) {}
    }
  });
  window.addEventListener('pagehide', function () {
    clearTimeout(pollTimer);
    clearTimeout(closeTimer);
    clearTimeout(voiceTimer);
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (_) {}
  });
  if (demo) present(demoDraw);
  else schedule(0);


  // GLB character rendered with locally vendored Three.js r146 and GLTFLoader.
  // Never load third-party code or textures from a CDN at streaming time.
  const THREE = window.THREE;
  if (!THREE || typeof THREE.GLTFLoader !== 'function') {
    reportModel('unavailable', 'Three.js atau WebGL loader tidak tersedia.');
    overlay.classList.add('no-webgl');
    return;
  }

  let renderer3d;
  try {
    renderer3d = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
      premultipliedAlpha: false
    });
  } catch (error) {
    reportModel('unavailable', 'Browser gagal membuat WebGL renderer.', error);
    overlay.classList.add('no-webgl');
    return;
  }

  renderer3d.setClearColor(0x000000, 0);
  renderer3d.outputEncoding = THREE.sRGBEncoding;
  renderer3d.toneMapping = THREE.ACESFilmicToneMapping;
  renderer3d.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 50);
  camera.position.set(0, .22, 8.25);
  camera.lookAt(0, .16, 0);
  scene.add(new THREE.HemisphereLight(0xf1deff, 0x382055, 1.55));
  const key = new THREE.DirectionalLight(0xffe6c7, 2.15);
  key.position.set(-3, 5, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xb37bff, .9);
  fill.position.set(4, 2, 3);
  scene.add(fill);

  let character = null;
  let head = null, leftArm = null, rightArm = null, heldPivot = null;
  let eyeLeft = null, eyeRight = null, mouth = null, heldFace = null;
  let mixer = null, mixerTime = 0, characterBaseY = 0, isCustomModel = false;
  let lastShownCard = '';
  let textureTicket = 0;
  const textures = new THREE.TextureLoader();
  const loader = new THREE.GLTFLoader();
  // The uploaded model is a single unrigged mesh. Keep the original rigged
  // character as a fallback until the optional model asset is available.
  // Versioned asset URL avoids a cached 404 or a previous model after deploy.
  const CUSTOM_MODEL_PATH = '/models/jalur-tarot-custom.glb?v=20261009-2';
  const LEGACY_MODEL_PATH = '/models/jalur-tarot.glb';

  function refreshHeldCard() {
    if (!heldFace || heldCardImage === lastShownCard) return;
    const path = heldCardImage;
    lastShownCard = path;
    const ticket = ++textureTicket;
    textures.load(path, function (map) {
      if (ticket !== textureTicket || !heldFace) {
        map.dispose();
        return;
      }
      // Procedurally created planes use regular Three.js UV orientation;
      // meshes exported from glTF require the glTF texture convention.
      map.flipY = !heldFace.userData.generatedCardFace;
      map.encoding = THREE.sRGBEncoding;
      const oldMaterial = heldFace.material;
      const updatedMaterial = new THREE.MeshBasicMaterial({ map: map, side: THREE.DoubleSide });
      updatedMaterial.userData.dynamicCard = true;
      heldFace.material = updatedMaterial;
      if (oldMaterial && oldMaterial.userData?.dynamicCard) {
        if (oldMaterial.map) oldMaterial.map.dispose();
        oldMaterial.dispose();
      }
    }, undefined, function () {
      if (ticket === textureTicket) lastShownCard = '';
    });
  }

  function buildFloatingTarotCard() {
    const pivot = new THREE.Group();
    pivot.name = 'HeldCardPivot';
    // With the new static model we cannot move hands independently. Place
    // the card in front of its torso as a small hovering magical prop.
    pivot.position.set(-.22, 1.75, .58);
    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(.8, 1.12, .055),
      new THREE.MeshStandardMaterial({ color: 0x432050, metalness: .28, roughness: .4 })
    );
    pivot.add(backing);
    const trim = new THREE.Mesh(
      new THREE.PlaneGeometry(.75, 1.07),
      new THREE.MeshBasicMaterial({ color: 0xe8c684, side: THREE.DoubleSide })
    );
    trim.position.z = .031;
    pivot.add(trim);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(.68, .98),
      new THREE.MeshBasicMaterial({ color: 0xefe5fd, side: THREE.DoubleSide })
    );
    face.name = 'HeldCardFace';
    face.userData.generatedCardFace = true;
    face.position.z = .036;
    pivot.add(face);
    character.add(pivot);
    return { pivot: pivot, face: face };
  }

  function onCharacterLoaded(gltf, custom) {
    isCustomModel = custom;
    character = new THREE.Group();
    character.name = 'TarotHost';
    const asset = gltf.scene;
    character.add(asset);
    if (custom) {
      // Blender and scanned GLBs vary in units and origins. Center the asset
      // in a 3.5-unit stage based on its actual world-space bounding box.
      asset.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(asset);
      const bounds = box.getSize(new THREE.Vector3());
      if (!Number.isFinite(bounds.y) || bounds.y < 0.0001) {
        character.remove(asset);
        character = null;
        throw new Error('Dimensi model GLB tidak valid.');
      }
      asset.scale.multiplyScalar(3.5 / bounds.y);
      asset.updateMatrixWorld(true);
      const scaled = new THREE.Box3().setFromObject(asset);
      const center = scaled.getCenter(new THREE.Vector3());
      asset.position.x -= center.x;
      asset.position.y -= scaled.min.y;
      asset.position.z -= center.z;
      character.position.set(.48, -1.6, 0);
    } else {
      character.position.x = .48;
    }
    characterBaseY = character.position.y;
    scene.add(character);
    head = character.getObjectByName('Head');
    leftArm = character.getObjectByName('LeftArm');
    rightArm = character.getObjectByName('RightArm');
    heldPivot = character.getObjectByName('HeldCardPivot');
    eyeLeft = character.getObjectByName('EyeLeft');
    eyeRight = character.getObjectByName('EyeRight');
    mouth = character.getObjectByName('Mouth');
    heldFace = character.getObjectByName('HeldCardFace');
    if (!heldFace) {
      const card = buildFloatingTarotCard();
      heldPivot = card.pivot;
      heldFace = card.face;
    }
    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(asset);
      mixer.clipAction(gltf.animations[0]).play();
    }
    refreshHeldCard();
    document.querySelector('.host')?.classList.add('is-loaded');
    resize();
    renderFrame(0);
    reportModel(custom ? 'custom' : 'legacy',
      custom ? 'Karakter GLB baru berhasil ditampilkan.' : 'Karakter bawaan aktif (fallback).');
  }

  function loadLegacyCharacter() {
    reportModel('fallback', 'Membuka karakter lama karena GLB baru gagal dimuat.');
    loader.load(LEGACY_MODEL_PATH, function (gltf) {
      try {
        onCharacterLoaded(gltf, false);
      } catch (error) {
        reportModel('error', 'Karakter bawaan juga gagal ditampilkan.', error);
        overlay.classList.add('no-webgl');
      }
    }, undefined, function (error) {
      reportModel('error', 'File model bawaan tidak dapat dimuat.', error);
      overlay.classList.add('no-webgl');
    });
  }

  reportModel('loading', 'Memuat model GLB baru…');
  loader.load(CUSTOM_MODEL_PATH, function (gltf) {
    try {
      onCharacterLoaded(gltf, true);
    } catch (error) {
      if (character) scene.remove(character);
      character = null;
      reportModel('error', 'Model GLB gagal dirender.', error);
      loadLegacyCharacter();
    }
  }, undefined, function (error) {
    reportModel('error', 'Model GLB gagal diunduh atau diproses.', error);
    loadLegacyCharacter();
  });

  let frameHandle = 0, lastFrame = 0;
  let currentWidth = 0, currentHeight = 0;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (currentWidth === w && currentHeight === h) return;
    currentWidth = w;
    currentHeight = h;
    renderer3d.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer3d.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  function renderFrame(time) {
    if (!character) return;
    const t = time / 1000;
    const readingNow = activeId !== null;
    const talkingNow = markTalking();
    const blink = !reducedMotion && t % 4.8 > 4.65 ? .075 : 1;
    refreshHeldCard();

    if (head) {
      head.rotation.z = reducedMotion ? 0 : Math.sin(t * .8) * .035;
      head.rotation.y = reducedMotion ? 0 : Math.sin(t * .43) * .045;
    }
    if (leftArm) leftArm.rotation.z = reducedMotion ? 0 : Math.sin(t * 1.15) * .06 - (readingNow ? .05 : 0);
    if (rightArm) rightArm.rotation.z = reducedMotion ? 0 : Math.sin(t * (readingNow ? 3 : 1.4)) * (readingNow ? .16 : .07);
    if (heldPivot) {
      heldPivot.rotation.y = reducedMotion ? 0 : Math.sin(t * .85) * .13;
      if (isCustomModel) heldPivot.rotation.z = reducedMotion ? 0 : Math.sin(t * 1.1) * .06;
    }
    if (isCustomModel) {
      character.rotation.y = reducedMotion ? 0 : Math.sin(t * .43) * .055;
      character.rotation.z = reducedMotion ? 0 : Math.sin(t * .76) * .015;
    }
    if (mixer) {
      const elapsed = mixerTime ? Math.max(0, Math.min(.05, t - mixerTime)) : 0;
      mixerTime = t;
      mixer.update(elapsed);
    }
    if (eyeLeft) eyeLeft.scale.y = blink;
    if (eyeRight) eyeRight.scale.y = blink;
    if (mouth) mouth.scale.y = .033 * (talkingNow && !reducedMotion ? (1.1 + Math.abs(Math.sin(t * 10)) * 2.1) : 1);
    character.position.y = characterBaseY + (reducedMotion ? 0 : Math.sin(t * 1.6) * .038);
    renderer3d.render(scene, camera);
  }
  function frame(time) {
    frameHandle = requestAnimationFrame(frame);
    if (document.hidden || !character) return;
    const frameDelay = reducedMotion ? 1000 : 34; // 30 fps maximum, 1 fps when reduced motion
    if (time - lastFrame < frameDelay) return;
    lastFrame = time;
    resize();
    renderFrame(time);
  }
  canvas.addEventListener('webglcontextlost', function (event) {
    event.preventDefault();
    cancelAnimationFrame(frameHandle);
    document.querySelector('.host')?.classList.remove('is-loaded');
    reportModel('error', 'Konteks WebGL hilang.');
    overlay.classList.add('no-webgl');
  });
  window.addEventListener('pagehide', function () {
    cancelAnimationFrame(frameHandle);
    renderer3d.dispose();
  });
  frameHandle = requestAnimationFrame(frame);
})();
