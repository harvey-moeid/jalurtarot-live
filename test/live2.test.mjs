import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { live2OverlayPage } from '../src/routes/live2.ts';

const scriptUrl = new URL('../public/live2.js', import.meta.url);
const cssUrl = new URL('../public/live2.css', import.meta.url);

test('LIVE 2 has a dedicated 9:16 overlay, assets and accessible labels', async () => {
  const [entry, html, css] = await Promise.all([
    readFile(new URL('../src/index.ts', import.meta.url), 'utf8'),
    Promise.resolve(live2OverlayPage()),
    readFile(cssUrl, 'utf8'),
  ]);
  assert.match(entry, /app\.get\('\/live2'/);
  assert.match(entry, /app\.get\('\/live'/, 'LIVE 1 route must remain intact');
  assert.match(html, /id="host3d"/);
  assert.match(html, /id="host-model-debug"/);
  assert.match(html, /src="\/live2\.js\?v=20261009-3"/);
  assert.match(html, /href="\/live2\.css\?v=20261009-2"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(css, /background:\s*transparent/, 'OBS must remain transparent by default');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /max-aspect-ratio/);
});

test('browser script compiles and does not require external CDNs or public API secrets', async () => {
  const src = await readFile(scriptUrl, 'utf8');
  assert.doesNotThrow(() => new vm.Script(src));
  assert.match(src, /\/api\/live\/state/);
  assert.match(src, /lastId = id/);
  assert.match(src, /WebGL/);
  assert.match(src, /textContent/);
  assert.match(src, /\/\^\\\/cards\\\//);
  assert.doesNotMatch(src, /TIKTOK_CONNECTOR_API_KEY|TIKTOK_CONNECTOR_WEBHOOK_SECRET/);
  assert.doesNotMatch(src, /https?:\/\/(?:unpkg|jsdelivr|cdnjs|esm\.sh)/);
});

test('offline demo renders three distinct cards, one bubble and graceful WebGL fallback', async () => {
  const src = await readFile(scriptUrl, 'utf8');
  const elements = new Map();
  function element(tag) {
    return {
      tag, children: [], hidden: false, textContent: '', src: '', alt: '',
      className: '', attrs: {},
      classList: { values: new Set(), add(v) { this.values.add(v); }, remove(v) { this.values.delete(v); } },
      setAttribute(k,v) { this.attrs[k] = v; },
      append(...items) { this.children.push(...items); },
      appendChild(child) { this.children.push(child); },
      replaceChildren(...children) { this.children = [...children]; },
      getContext() { return null; },
    };
  }
  const ids = ['live2','reading','reading-cards','live-status','speech','speech-title',
    'speech-message','sound-toggle','host3d','viewer-label','reading-name',
    'reading-summary','reading-gift'];
  for (const id of ids) elements.set(id, element(id));
  const doc = {
    hidden: false,
    getElementById: (id) => elements.get(id),
    createElement: (tag) => element(tag),
    addEventListener() {},
  };
  const fake = {
    document: doc,
    window: { addEventListener() {} },
    location: { search: '?demo=1&background=1' },
    matchMedia: () => ({ matches: false }),
    URLSearchParams,
    setTimeout() { return 1; },
    clearTimeout() {},
  };
  assert.doesNotThrow(() => vm.runInNewContext(src, fake, { timeout: 2000 }));
  assert.equal(elements.get('reading').hidden, false);
  assert.equal(elements.get('reading-cards').children.length, 3);
  assert.match(elements.get('speech-title').textContent, /@penonton/);
  assert.match(elements.get('speech-message').textContent, /Dengarkan suara hatimu/);
  assert.equal(elements.get('reading-cards').children[0].children[0].src, '/cards/major/18-moon.jpg');
  assert.ok(elements.get('live2').classList.values.has('with-background'));
  assert.ok(elements.get('live2').classList.values.has('no-webgl'));
});

test('custom GLB errors appear in debug mode and original model remains fallback', async () => {
  const src = await readFile(scriptUrl, 'utf8');
  const elements = new Map();
  function element(id) {
    return {
      hidden: true, textContent: '', attrs: {}, children: [], className: '',
      classList: { add() {}, remove() {} },
      setAttribute(key, value) { this.attrs[key] = value; },
      append() {}, appendChild() {}, replaceChildren() {},
      addEventListener() {},
      getBoundingClientRect() { return { width: 320, height: 420 }; },
    };
  }
  for (const id of ['live2','reading','reading-cards','live-status','speech','speech-title',
    'speech-message','sound-toggle','host3d','viewer-label','reading-name',
    'reading-summary','reading-gift','host-model-debug']) elements.set(id, element(id));
  const requests = [];
  class Renderer {
    setClearColor() {}
    setPixelRatio() {}
    setSize() {}
    dispose() {}
  }
  const THREE = {
    WebGLRenderer: Renderer,
    sRGBEncoding: 1, ACESFilmicToneMapping: 2,
    Scene: class { add() {} },
    PerspectiveCamera: class {
      position = { set() {} };
      lookAt() {}
      updateProjectionMatrix() {}
    },
    HemisphereLight: class {},
    DirectionalLight: class { position = { set() {} }; },
    TextureLoader: class {},
    GLTFLoader: class {
      load(path, success, progress, fail) {
        requests.push(path);
        if (path.includes('custom')) fail(new Error('Simulated GLB parse error'));
      }
    },
  };
  const document = {
    hidden: false,
    getElementById(id) { return elements.get(id); },
    createElement() { return element('new'); },
    querySelector() { return null; },
    addEventListener() {},
  };
  const fake = {
    document, window: { THREE, addEventListener() {} },
    location: { search: '?debug=1' },
    matchMedia: () => ({ matches: false }),
    URLSearchParams,
    setTimeout() { return 1; }, clearTimeout() {},
    requestAnimationFrame() { return 1; }, cancelAnimationFrame() {},
    fetch: async () => ({ ok: false, status: 503 }),
    console: { warn() {} },
  };
  assert.doesNotThrow(() => vm.runInNewContext(src, fake, { timeout: 2000 }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests.length, 2);
  assert.match(requests[0], /jalur-tarot-custom\.glb\?v=/);
  assert.equal(requests[1], '/models/jalur-tarot.glb');
  assert.equal(elements.get('live2').attrs['data-model-state'], 'fallback');
  assert.match(elements.get('host-model-debug').textContent, /FALLBACK/);
  assert.match(elements.get('host-model-debug').textContent, /HTTP 503/,
    'recovery error remains visible even after legacy fallback');
});


test('alternative GLB decoder recovers uploaded model if primary loader fails', async () => {
  const src = await readFile(scriptUrl, 'utf8');
  const glbBuffer = await readFile(new URL('../public/models/jalur-tarot-custom.glb', import.meta.url));
  const bytes = glbBuffer.buffer.slice(glbBuffer.byteOffset, glbBuffer.byteOffset + glbBuffer.byteLength);
  const elements = new Map();
  function vec(x = 0, y = 0, z = 0) {
    return { x, y, z,
      set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; },
      fromArray(a) { return this.set(a[0], a[1], a[2]); },
      multiplyScalar(n) { this.x *= n; this.y *= n; this.z *= n; return this; },
    };
  }
  function element() {
    return {
      hidden: false, textContent: '', attrs: {}, children: [], className: '',
      classList: { add() {}, remove() {} },
      setAttribute(key, value) { this.attrs[key] = value; },
      append(...items) { this.children.push(...items); },
      appendChild(item) { this.children.push(item); },
      replaceChildren(...items) { this.children = items; },
      addEventListener() {},
      getBoundingClientRect() { return { width: 300, height: 450 }; },
    };
  }
  for (const id of ['live2','reading','reading-cards','live-status','speech','speech-title',
    'speech-message','sound-toggle','host3d','viewer-label','reading-name',
    'reading-summary','reading-gift','host-model-debug']) elements.set(id, element());
  const sceneModels = [];
  class Group {
    constructor() {
      this.children = [];
      this.position = vec();
      this.rotation = { y: 0, z: 0 };
      this.scale = vec(1, 1, 1);
      this.userData = {};
    }
    add(child) { this.children.push(child); }
    updateMatrixWorld() {}
    getObjectByName() { return null; }
  }
  class Mesh extends Group {
    constructor(geometry, material) {
      super();
      this.geometry = geometry;
      this.material = material;
      this.quaternion = { fromArray() {} };
    }
  }
  class Box3 {
    setFromObject() { this.min = vec(0, 0, 0); return this; }
    getSize(value) { return value.set(1, 1, 1); }
    getCenter(value) { return value.set(0, 0, 0); }
  }
  class Geometry {
    constructor() { this.attrs = {}; }
    setAttribute(name, attr) { this.attrs[name] = attr; }
    setIndex(attr) { this.indices = attr; }
    hasAttribute(name) { return Boolean(this.attrs[name]); }
    computeVertexNormals() {}
  }
  class Renderer {
    setClearColor() {}
    setPixelRatio() {}
    setSize() {}
    render() {}
    dispose() {}
  }
  const THREE = {
    WebGLRenderer: Renderer,
    sRGBEncoding: 1, ACESFilmicToneMapping: 2,
    Scene: class { add(x) { sceneModels.push(x); } remove() {} },
    PerspectiveCamera: class {
      position = vec();
      lookAt() {}
      updateProjectionMatrix() {}
    },
    HemisphereLight: class {},
    DirectionalLight: class { position = vec(); },
    TextureLoader: class { load() {} },
    GLTFLoader: class { load(path, success, progress, fail) { fail(new Error('Primary loader failed')); } },
    Group, Mesh, Box3,
    Vector3: class { x = 0; y = 0; z = 0 },
    BufferGeometry: Geometry,
    BufferAttribute: class {
      constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; }
    },
    MeshStandardMaterial: class { constructor(options) { this.options = options; } },
    MeshBasicMaterial: class { constructor(options) { this.options = options; } },
    BoxGeometry: class {},
    PlaneGeometry: class {},
    DoubleSide: 2,
  };
  const fake = {
    document: {
      hidden: false,
      getElementById(id) { return elements.get(id); },
      querySelector() { return null; },
      createElement() { return element(); },
      addEventListener() {},
    },
    window: { THREE, addEventListener() {} },
    location: { search: '?demo=1&debug=1' },
    matchMedia: () => ({ matches: true }),
    URLSearchParams,
    URL, Blob, TextDecoder,
    fetch: async () => ({ ok: true, arrayBuffer: async () => bytes }),
    setTimeout() { return 1; }, clearTimeout() {},
    requestAnimationFrame() { return 1; }, cancelAnimationFrame() {},
    console: { warn() {} },
  };
  assert.doesNotThrow(() => vm.runInNewContext(src, fake, { timeout: 2000 }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(elements.get('live2').attrs['data-model-state'], 'custom');
  assert.match(elements.get('host-model-debug').textContent, /renderer alternatif/);
  const host = sceneModels.find(model => model && model.name === 'TarotHost');
  assert.ok(host, 'decoded model is added to the Three.js scene');
  const asset = host.children[0];
  const mesh = asset.children[0];
  assert.ok(mesh.geometry.attrs.position.array.length > 100_000);
  assert.ok(mesh.geometry.attrs.uv.array.length > 100_000);
  assert.ok(mesh.geometry.indices.array.length > 100_000);
});
