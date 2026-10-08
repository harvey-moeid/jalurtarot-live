import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { live2OverlayPage } from '../src/routes/live2.ts';

const root = new URL('../', import.meta.url);

test('LIVE 2 loads local Three.js, GLTFLoader and retains the LIVE 1 endpoint', async () => {
  const [html, index, css, script] = await Promise.all([
    Promise.resolve(live2OverlayPage()),
    readFile(new URL('src/index.ts', root), 'utf8'),
    readFile(new URL('public/live2.css', root), 'utf8'),
    readFile(new URL('public/live2.js', root), 'utf8'),
  ]);
  assert.match(html, /JALUR TAROT/);
  assert.doesNotMatch(html, /LUNA TAROT/);
  assert.match(html, /\/vendor\/three\.r146\.min\.js/);
  assert.match(html, /\/vendor\/GLTFLoader\.r146\.js/);
  assert.ok(html.indexOf('three.r146.min.js') < html.indexOf('GLTFLoader.r146.js'));
  assert.ok(html.indexOf('GLTFLoader.r146.js') < html.indexOf('live2.js'));
  assert.match(script, /new THREE\.GLTFLoader/);
  assert.match(script, /\/models\/jalur-tarot\.glb/);
  assert.match(script, /\/models\/jalur-tarot-custom\.glb/);
  assert.match(script, /loadLegacyCharacter/);
  assert.match(script, /new THREE\.Box3/);
  assert.match(script, /new THREE\.PlaneGeometry/);
  assert.match(script, /characterBaseY/);
  assert.match(script, /getObjectByName\('HeldCardFace'\)/);
  assert.match(script, /\/api\/live\/state/);
  assert.match(index, /app\.get\('\/live'/);
  assert.match(index, /app\.get\('\/live2'/);
  assert.match(css, /\.reading\{[\s\S]*?grid-template-rows/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(script, /TIKTOK_CONNECTOR_API_KEY|TIKTOK_CONNECTOR_WEBHOOK_SECRET/);
});

test('original Jalur Tarot model is a valid GLB with animatable parts', async () => {
  const raw = await readFile(new URL('public/models/jalur-tarot.glb', root));
  assert.ok(raw.byteLength > 1500 && raw.byteLength < 2_000_000, 'model is reasonably compact');
  assert.equal(raw.readUInt32LE(0), 0x46546c67, 'GLB magic');
  assert.equal(raw.readUInt32LE(4), 2, 'glTF 2.0');
  assert.equal(raw.readUInt32LE(8), raw.byteLength, 'correct total size');
  const jsonLength = raw.readUInt32LE(12);
  assert.equal(raw.readUInt32LE(16), 0x4e4f534a, 'JSON chunk');
  const model = JSON.parse(raw.subarray(20, 20 + jsonLength).toString('utf8'));
  const binaryOffset = 20 + jsonLength;
  const binLength = raw.readUInt32LE(binaryOffset);
  assert.equal(raw.readUInt32LE(binaryOffset + 4), 0x004e4942, 'BIN chunk');
  assert.equal(binaryOffset + 8 + binLength, raw.byteLength, 'valid binary length');
  assert.equal(model.asset.version, '2.0');
  const names = new Set(model.nodes.map(node => node.name));
  for (const name of ['JalurTarot','Head','LeftArm','RightArm','EyeLeft','EyeRight','Mouth','HeldCardPivot','HeldCardFace']) {
    assert.ok(names.has(name), 'missing model node: ' + name);
  }
  assert.ok(model.meshes.length >= 2);
  assert.ok(model.materials.length >= 5);
  assert.equal(model.buffers[0].byteLength, binLength);
  for (const view of model.bufferViews) {
    assert.ok(view.byteOffset + view.byteLength <= binLength, 'bufferView within BIN payload');
  }
});

test('uploaded custom tarot GLB is part of deployment with embedded textures', async () => {
  const raw = await readFile(new URL('public/models/jalur-tarot-custom.glb', root));
  assert.ok(raw.byteLength > 100_000 && raw.byteLength < 6_000_000, 'uploaded model exists');
  assert.equal(raw.readUInt32LE(0), 0x46546c67, 'glTF binary magic');
  assert.equal(raw.readUInt32LE(4), 2, 'glTF version 2');
  assert.equal(raw.readUInt32LE(8), raw.byteLength, 'correct GLB size');
  const jsonLength = raw.readUInt32LE(12);
  assert.equal(raw.readUInt32LE(16), 0x4e4f534a, 'JSON chunk marker');
  const model = JSON.parse(raw.subarray(20, 20 + jsonLength).toString('utf8'));
  assert.equal(model.asset.version, '2.0');
  assert.ok(model.nodes.length >= 1 && model.meshes.length >= 1);
  assert.ok(model.images.length >= 1 && model.images.every(image => Number.isInteger(image.bufferView)));
  assert.match(await readFile(new URL('public/live2.js', root), 'utf8'), /jalur-tarot-custom\.glb\?v=/);
  assert.match(live2OverlayPage(), /id="host-model-debug"/);
});
