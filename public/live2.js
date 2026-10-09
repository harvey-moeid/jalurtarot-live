/* LIVE 2: secure tarot state and illustrated host; legacy 3D is opt-in. */
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
  let lastModelError = '';

  function reportModel(state, message, error) {
    overlay.setAttribute('data-model-state', state);
    if (error) lastModelError = safeText(error.message || error, 150);
    if (state === 'custom') lastModelError = '';
    if (modelDebugEnabled && modelDebug) {
      modelDebug.hidden = false;
      // Do not hide the root cause after falling back to the legacy model.
      const cause = lastModelError && state !== 'custom' ? ' — Penyebab: ' + lastModelError : '';
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
    // Narration is authored server-side and follows the comment topic.
    // Legacy draws without narration retain their existing fallback.
    return brief(draw.narration || aspect || draw.summary || 'Ikuti suara hati dan temukan pesanmu hari ini.', 650);
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
    document.querySelector?.('.host')?.classList.remove('is-reading');
    speechTitle.textContent = 'Selamat datang di LIVE ✨';
    speechMessage.textContent = 'Tulis CINTA, NASIB, atau KARIR di komentar. Ramalan muncul setelah gift atau target like tercapai.';
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
    const topics = { cinta: 'Cinta', karir: 'Karier', nasib: 'Nasib' };
    const titleTopic = topics[draw.topic];
    speechTitle.textContent = titleTopic
      ? 'Bacaan ' + titleTopic + ' untuk ' + brief(username, 23)
      : 'Ramalan untuk ' + brief(username, 23);
    const readingLabel = document.querySelector?.('.reading__label');
    if (readingLabel) readingLabel.textContent = titleTopic ? 'PESAN ' + titleTopic.toUpperCase() : 'PESAN KARTU';
    speechMessage.textContent = brief(message, 115);
    speakingUntil = Date.now() + Math.min(16_000, Math.max(3800, message.length * 80));
    speech.classList.add('talking');
    document.querySelector?.('.host')?.classList.add('is-reading');
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
    topic: 'cinta', question: 'Bagaimana hubungan cintaku ke depan?',
    narration: 'Halo @penonton, aku baca pertanyaanmu tentang cinta. Kita lihat pesannya, ya. Kartu The Moon mengajak kamu mendengarkan intuisi dan tidak terburu-buru mengambil kesimpulan. Kartu The Star menunjukkan harapan, sementara The Sun membawa kehangatan baru. Pelan-pelan saja, tetap jaga komunikasi yang sehat.',
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


  // By default show the approved illustrated character: browser-safe, transparent,
  // no GPU, texture decoding or mobile WebGL dependency. The legacy GLB viewer
  // remains available on demand with ?character=glb for development/debugging.
  const portrait = document.getElementById('host-portrait');
  const useGlb = query.get('character') === 'glb' || !portrait;
  if (!useGlb) {
    const host = document.querySelector('.host');
    host?.classList.add('is-illustrated');
    portrait.addEventListener('load', function () {
      if (portrait.naturalWidth) reportModel('illustrated', 'Karakter Jalur Tarot siap.');
    });
    portrait.addEventListener('error', function () {
      reportModel('error', 'Gambar karakter gagal dimuat. Periksa file publik host.');
      overlay.classList.add('portrait-error');
    });
    if (portrait.complete && portrait.naturalWidth) reportModel('illustrated', 'Karakter Jalur Tarot siap.');
    return;
  }
  portrait?.setAttribute('hidden', '');

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
  let usedBasicGlbLoader = false;
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
    document.querySelector?.('.host')?.classList.add('is-loaded');
    resize();
    renderFrame(0);
    reportModel(custom ? 'custom' : 'legacy',
      custom ? (usedBasicGlbLoader
        ? 'Karakter GLB baru berhasil dimuat melalui renderer alternatif.'
        : 'Karakter GLB baru berhasil ditampilkan.')
        : 'Karakter bawaan aktif (fallback).');
  }


  // Minimal glTF 2.0 binary mesh decoder used only when GLTFLoader r146
  // rejects a custom asset on a browser. This GLB contains one mesh with
  // embedded baseColor JPEG; the recovery path avoids extension plugins
  // and ImageBitmapLoader while keeping the original geometry and color.
  function decodeBasicGlb(data) {
    const view = new DataView(data);
    if (view.byteLength < 28 || view.getUint32(0, true) !== 0x46546c67 ||
      view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== data.byteLength) {
      throw new Error('Berkas GLB tidak valid atau terpotong.');
    }
    const jsonSize = view.getUint32(12, true);
    if (view.getUint32(16, true) !== 0x4e4f534a ||
      jsonSize > data.byteLength - 28) {
      throw new Error('Struktur JSON GLB tidak valid.');
    }
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 20, jsonSize)));
    const binHeader = 20 + jsonSize;
    if (view.getUint32(binHeader + 4, true) !== 0x004e4942) {
      throw new Error('GLB tidak memiliki BIN chunk.');
    }
    const binLength = view.getUint32(binHeader, true);
    const binStart = binHeader + 8;
    if (binStart + binLength > data.byteLength) {
      throw new Error('BIN chunk GLB terpotong.');
    }
    function sliceView(index) {
      const entry = json.bufferViews[index];
      if (!entry) throw new Error('bufferView GLB tidak tersedia.');
      const start = binStart + (entry.byteOffset || 0);
      const end = start + entry.byteLength;
      if (start < binStart || end > binStart + binLength) {
        throw new Error('bufferView GLB melebihi ukuran BIN.');
      }
      return [start, end];
    }
    function accessor(index) {
      const acc = json.accessors[index];
      if (!acc || !Number.isInteger(acc.bufferView) || acc.sparse) {
        throw new Error('Accessor GLB tidak didukung.');
      }
      const typeLength = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type];
      const TypedArray = {
        5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array,
      }[acc.componentType];
      if (!TypedArray || !typeLength || !Number.isInteger(acc.count) || acc.count < 1) {
        throw new Error('Tipe accessor GLB tidak didukung.');
      }
      const bufferView = json.bufferViews[acc.bufferView];
      const itemBytes = typeLength * TypedArray.BYTES_PER_ELEMENT;
      if (bufferView.byteStride && bufferView.byteStride !== itemBytes) {
        throw new Error('Stride akses GLB tidak didukung.');
      }
      const [viewStart, viewEnd] = sliceView(acc.bufferView);
      const from = viewStart + (acc.byteOffset || 0);
      const to = from + itemBytes * acc.count;
      if (to > viewEnd) throw new Error('Accessor GLB terpotong.');
      return { data: new TypedArray(data.slice(from, to)), size: typeLength };
    }
    const rootNode = json.nodes?.find(node => Number.isInteger(node.mesh));
    const primitive = json.meshes?.[rootNode?.mesh]?.primitives?.[0];
    if (!primitive || primitive.attributes?.POSITION === undefined) {
      throw new Error('Mesh utama GLB tidak ditemukan.');
    }
    const geometry = new THREE.BufferGeometry();
    for (const [semantic, name] of [
      ['POSITION', 'position'], ['NORMAL', 'normal'], ['TEXCOORD_0', 'uv'],
    ]) {
      if (primitive.attributes[semantic] !== undefined) {
        const attr = accessor(primitive.attributes[semantic]);
        geometry.setAttribute(name, new THREE.BufferAttribute(attr.data, attr.size));
      }
    }
    if (primitive.indices !== undefined) {
      const idx = accessor(primitive.indices);
      geometry.setIndex(new THREE.BufferAttribute(idx.data, idx.size));
    }
    if (!geometry.hasAttribute('normal')) geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: .78, metalness: .05,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    if (rootNode.translation) mesh.position.fromArray(rootNode.translation);
    if (rootNode.rotation) mesh.quaternion.fromArray(rootNode.rotation);
    if (rootNode.scale) mesh.scale.fromArray(rootNode.scale);
    const asset = new THREE.Group();
    asset.add(mesh);

    // Embedded texture is optional: the character stays visible even when
    // a mobile browser cannot decode one of its glTF material textures.
    const pbr = json.materials?.[primitive.material]?.pbrMetallicRoughness;
    const texInfo = pbr?.baseColorTexture;
    const image = json.images?.[json.textures?.[texInfo?.index]?.source];
    if (image && Number.isInteger(image.bufferView) &&
      typeof URL.createObjectURL === 'function') {
      const [start, end] = sliceView(image.bufferView);
      const blobUrl = URL.createObjectURL(new Blob([data.slice(start, end)], {
        type: image.mimeType || 'image/jpeg',
      }));
      new THREE.TextureLoader().load(blobUrl, function (map) {
        URL.revokeObjectURL(blobUrl);
        map.encoding = THREE.sRGBEncoding;
        material.map = map;
        material.needsUpdate = true;
      }, undefined, function (error) {
        URL.revokeObjectURL(blobUrl);
        reportModel('custom', 'Karakter tampil tanpa tekstur warna.', error);
      });
    }
    return { scene: asset, animations: [] };
  }

  async function recoverCustomGlb(primaryError) {
    reportModel('recovering', 'Mencoba decoder alternatif GLB.', primaryError);
    try {
      const response = await fetch(CUSTOM_MODEL_PATH, { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const backupGltf = decodeBasicGlb(await response.arrayBuffer());
      usedBasicGlbLoader = true;
      onCharacterLoaded(backupGltf, true);
    } catch (fallbackError) {
      usedBasicGlbLoader = false;
      reportModel('error', 'Decoder GLB alternatif juga gagal.', fallbackError);
      loadLegacyCharacter();
    }
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
      recoverCustomGlb(error);
    }
  }, undefined, function (error) {
    recoverCustomGlb(error);
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
    document.querySelector?.('.host')?.classList.remove('is-loaded');
    reportModel('error', 'Konteks WebGL hilang.');
    overlay.classList.add('no-webgl');
  });
  window.addEventListener('pagehide', function () {
    cancelAnimationFrame(frameHandle);
    renderer3d.dispose();
  });
  frameHandle = requestAnimationFrame(frame);
})();
