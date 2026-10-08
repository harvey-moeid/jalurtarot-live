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

  if (query.get('background') === '1') overlay.classList.add('with-background');

  let lastId = null;
  let activeId = null;
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

  // ---- Lightweight, dependency-free real WebGL character. ----
  let gl;
  try {
    gl = canvas.getContext('webgl', {
      alpha: true, antialias: true, depth: true,
      powerPreference: 'low-power', premultipliedAlpha: false
    });
  } catch (_) {}
  if (!gl) {
    overlay.classList.add('no-webgl');
    return;
  }

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw new Error('WebGL shader compilation failed');
    }
    return shader;
  }
  let program;
  try {
    const vertex = [
      'attribute vec3 aPosition;', 'attribute vec3 aNormal;',
      'uniform mat4 uMVP;', 'uniform mat4 uModel;',
      'varying vec3 vNormal;', 'varying vec3 vWorld;',
      'void main(){', 'vec4 world=uModel*vec4(aPosition,1.0);',
      'vWorld=world.xyz;', 'vNormal=normalize(mat3(uModel)*aNormal);',
      'gl_Position=uMVP*vec4(aPosition,1.0);', '}'
    ].join('\n');
    const fragment = [
      'precision mediump float;', 'varying vec3 vNormal;',
      'varying vec3 vWorld;', 'uniform vec3 uColor;',
      'void main(){', 'vec3 n=normalize(vNormal);',
      'vec3 light=normalize(vec3(-0.5,0.85,1.3));',
      'float diffuse=max(dot(n,light),0.0);',
      'float rim=pow(1.0-max(n.z,0.0),3.0);',
      'vec3 color=uColor*(0.53+diffuse*0.48)+vec3(0.31,0.13,0.47)*rim*0.18;',
      'gl_FragColor=vec4(color,1.0);', '}'
    ].join('\n');
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Cannot link WebGL');
    gl.useProgram(program);
  } catch (_) {
    overlay.classList.add('no-webgl');
    return;
  }

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const aNormal = gl.getAttribLocation(program, 'aNormal');
  const uMVP = gl.getUniformLocation(program, 'uMVP');
  const uModel = gl.getUniformLocation(program, 'uModel');
  const uColor = gl.getUniformLocation(program, 'uColor');

  function makeMesh(vertices, normals, indices) {
    const mesh = { count: indices.length, vertices: gl.createBuffer(), normals: gl.createBuffer(), indices: gl.createBuffer() };
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normals);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return mesh;
  }
  function sphereMesh() {
    const vertices = [], normals = [], indices = [], lat = 14, lon = 20;
    for (let y = 0; y <= lat; y++) {
      const theta = Math.PI * y / lat;
      for (let x = 0; x <= lon; x++) {
        const phi = 2 * Math.PI * x / lon;
        const nx = Math.sin(theta) * Math.cos(phi);
        const ny = Math.cos(theta);
        const nz = Math.sin(theta) * Math.sin(phi);
        vertices.push(nx, ny, nz);
        normals.push(nx, ny, nz);
      }
    }
    for (let y = 0; y < lat; y++) for (let x = 0; x < lon; x++) {
      const a = y * (lon + 1) + x, b = a + lon + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    return makeMesh(vertices, normals, indices);
  }
  function cubeMesh() {
    const faces = [
      { n: [0,0,1], v: [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]] },
      { n: [0,0,-1], v: [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]] },
      { n: [1,0,0], v: [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]] },
      { n: [-1,0,0], v: [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]] },
      { n: [0,1,0], v: [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]] },
      { n: [0,-1,0], v: [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]] }
    ];
    const vertices = [], normals = [], indices = [];
    faces.forEach((face, i) => {
      face.v.forEach(p => { vertices.push(...p); normals.push(...face.n); });
      const start = i * 4;
      indices.push(start, start+1, start+2, start, start+2, start+3);
    });
    return makeMesh(vertices, normals, indices);
  }

  const sphere = sphereMesh();
  const cube = cubeMesh();
  const GOLD = [0.95,0.68,0.29], DEEP = [0.18,0.085,0.3], PURPLE = [0.42,0.22,0.68];
  const SKIN = [1.0,0.71,0.63], HAIR = [0.17,0.085,0.24], ROSE = [0.85,0.32,0.48];
  const WHITE = [1.0,0.96,0.94], IRIS = [0.45,0.22,0.75];

  function identity() {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  }
  function multiply(a,b) {
    const o = new Float32Array(16);
    for (let col=0;col<4;col++) for (let row=0;row<4;row++) {
      for (let k=0;k<4;k++) o[col*4+row] += a[k*4+row]*b[col*4+k];
    }
    return o;
  }
  function translation(x,y,z) { const m=identity(); m[12]=x;m[13]=y;m[14]=z;return m; }
  function scale(x,y,z) { const m=identity();m[0]=x;m[5]=y;m[10]=z;return m; }
  function rotateZ(t) { const m=identity(),c=Math.cos(t),s=Math.sin(t);m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m; }
  function rotateY(t) { const m=identity(),c=Math.cos(t),s=Math.sin(t);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m; }
  function perspective(aspect) {
    const f = 1 / Math.tan(Math.PI*39/360), near=.1, far=40;
    const m=new Float32Array(16);
    m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;m[14]=2*far*near/(near-far);
    return m;
  }
  function bindMesh(mesh) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normals);
    gl.enableVertexAttribArray(aNormal);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
  }
  let projection = identity(), float = 0, tilt = 0, frameNow = 0;
  function draw(mesh,color,x,y,z,sx,sy,sz,rz,ry) {
    const model = multiply(translation(x+0.13,y+float,z),multiply(rotateY((ry||0)+tilt),multiply(rotateZ(rz||0),scale(sx,sy,sz))));
    const view = translation(0,-0.05,-6.8);
    gl.uniformMatrix4fv(uModel, false, model);
    gl.uniformMatrix4fv(uMVP, false, multiply(projection,multiply(view,model)));
    gl.uniform3fv(uColor, new Float32Array(color));
    bindMesh(mesh);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  }
  function ball(color,x,y,z,sx,sy,sz,rz,ry) { draw(sphere,color,x,y,z,sx,sy,sz,rz,ry); }
  function box(color,x,y,z,sx,sy,sz,rz,ry) { draw(cube,color,x,y,z,sx,sy,sz,rz,ry); }

  function renderCharacter(time) {
    const t=time*.001, talk=markTalking(), readingNow=!!activeId;
    float = reducedMotion ? 0 : .06*Math.sin(t*1.8);
    tilt = reducedMotion ? 0 : .04*Math.sin(t*.7);
    const gesture = reducedMotion ? 0 : Math.sin(t*1.6)*.13 + (readingNow ? .12 : 0);
    const handUp = readingNow ? .08 : 0;
    const blink = !reducedMotion && (t%4.4>4.27) ? .07 : 1;
    const mouthHeight = talk && !reducedMotion ? (.046+Math.abs(Math.sin(t*11))*.045) : .025;

    // Back hair and witchy purple-gold flowing dress.
    ball(HAIR,-.12,.4,-.32,1.08,1.43,.51);
    ball(PURPLE,-.8,-.5,-.18,.32,1.1,.26,-.16);
    ball(PURPLE,.82,-.5,-.18,.31,1.08,.27,.18);
    ball(DEEP,0,-.93,0,.9,1.09,.53);
    ball(PURPLE,0,-1.32,.06,.99,.69,.59);
    ball(GOLD,0,-.44,.5,.47,.05,.12);
    ball(PURPLE,0,-.07,.26,.54,.60,.39);
    box(GOLD,0,-.21,.62,.18,.015,.06,0);
    ball(GOLD,0,-.1,.66,.12,.12,.07);

    // Left card arm and right welcoming arm are animated.
    ball(SKIN,-.73,-.33,.30,.22,.51,.22,-.45);
    ball(PURPLE,-.77,-.46,.38,.26,.40,.25,-.47);
    ball(SKIN,-1.0,.12+handUp+gesture,.68,.18,.21,.13,-.12);
    ball(PURPLE,.73,-.34,.24,.23,.52,.23,.55+gesture);
    ball(SKIN,1.03,-.03+gesture,.46,.19,.32,.15,.48+gesture);
    ball(SKIN,1.21,.18+gesture,.52,.24,.16,.15,-.4);
    ball(SKIN,1.36,.24+gesture,.55,.09,.19,.09,.24);

    // Neck, head, ears, cheeks.
    ball(SKIN,0,.12,.42,.23,.27,.23);
    ball(SKIN,0,.96,.30,.78,.82,.69);
    ball(SKIN,-.73,.89,.3,.15,.22,.19);
    ball(SKIN,.73,.89,.3,.15,.22,.19);
    ball(ROSE,-.43,.63,.87,.22,.12,.09);
    ball(ROSE,.43,.63,.87,.22,.12,.09);

    // Big expressive eyes, long eyelashes, highlights.
    [-1,1].forEach(function (sgn) {
      const x=sgn*.32;
      ball(HAIR,x,.98,.93,.28,.26*blink,.075);
      ball(WHITE,x,.98,.964,.235,.207*blink,.05);
      ball(IRIS,x+.04,.95,.997,.125,.17*blink,.042);
      ball(HAIR,x+.05,.946,1.028,.065,.115*blink,.027);
      ball(WHITE,x+.086,1.016,1.053,.042,.048*blink,.02);
      ball(HAIR,x,1.27,.85,.26,.055,.08,-sgn*.12);
    });
    ball(SKIN,0,.70,.965,.10,.125,.11);
    ball(ROSE,0,.51,.975,.20,mouthHeight,.032);
    ball(WHITE,0,.54,.996,.12,.017,.012);

    // Silky hair halo, bangs, side locks and whimsical bun.
    ball(HAIR,0,1.53,.02,.87,.40,.73);
    ball(HAIR,-.66,1.1,.34,.28,.67,.48,-.27);
    ball(HAIR,.64,1.15,.30,.28,.68,.48,.23);
    ball(HAIR,-.32,1.38,.7,.38,.22,.27,-.3);
    ball(HAIR,.3,1.4,.65,.40,.20,.25,.3);
    ball(PURPLE,.75,.12,.23,.23,.78,.25,-.22);
    ball(HAIR,-.74,-.1,.19,.21,.82,.28,.17);
    ball(HAIR,.2,1.9,-.12,.46,.26,.36);
    ball(GOLD,.58,1.56,.57,.14,.14,.08);
    ball(PURPLE,.6,1.6,.65,.08,.08,.07);

    // Tiny floating held tarot card: reveals face when an event arrives.
    const cardAngle = reducedMotion ? 0 : .1*Math.sin(t*1.6);
    const cardY = .32+handUp+gesture;
    box(GOLD,-1.10,cardY,.89,.38,.60,.045,cardAngle,-.08);
    box(DEEP,-1.10,cardY,.949,.33,.55,.014,cardAngle,-.08);
    box(GOLD,-1.10,cardY,.966,.27,.48,.009,cardAngle,-.08);
    box(PURPLE,-1.10,cardY,.983,.25,.46,.010,cardAngle,-.08);
    ball(GOLD,-1.10,cardY,.998,.16,.18,.016);
    ball(DEEP,-1.04,cardY+.07,1.017,.14,.16,.02);
    ball(GOLD,-1.1,cardY-.18,1.01,.05,.05,.019);

    // Pendant and moon accessory.
    ball(GOLD,0,-.02,.68,.1,.16,.06);
    ball(DEEP,.04,.025,.735,.075,.13,.04);
  }

  let frameHandle = 0, lastFrame = 0;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(devicePixelRatio || 1, 1.6);
    const width = Math.min(900, Math.max(1, Math.round(rect.width*pixelRatio)));
    const height = Math.min(1000, Math.max(1, Math.round(rect.height*pixelRatio)));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    gl.viewport(0,0,width,height);
    projection = perspective(width/height);
  }
  function frame(now) {
    frameHandle = requestAnimationFrame(frame);
    if (document.hidden) return;
    if (reducedMotion && lastFrame) return;
    if (now - lastFrame < 30) return; // ~30 FPS to keep OBS CPU/GPU usage modest
    lastFrame = now;
    resize();
    gl.clearColor(0,0,0,0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    frameNow = now;
    renderCharacter(now);
  }
  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    cancelAnimationFrame(frameHandle);
    overlay.classList.add('no-webgl');
  });
  requestAnimationFrame(frame);
})();
