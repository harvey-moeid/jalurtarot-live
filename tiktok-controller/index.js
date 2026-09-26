import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';

const {
  TIKTOK_USERNAME,
  RENDER_API_KEY,
  LISTENER_SERVICE_NAME = 'jalurtarot-tiktok-listener',
  CHECK_TIMEOUT_MS = '20000',
} = process.env;

function required(name, value) {
  if (!value?.trim()) throw new Error(`Environment variable ${name} belum diisi.`);
}

required('TIKTOK_USERNAME', TIKTOK_USERNAME);
required('RENDER_API_KEY', RENDER_API_KEY);

const username = TIKTOK_USERNAME.trim().replace(/^@+/, '');
const timeoutMs = Math.max(5000, Number.parseInt(CHECK_TIMEOUT_MS, 10) || 20000);
const renderApi = 'https://api.render.com/v1';

async function renderRequest(path, options = {}) {
  const res = await fetch(`${renderApi}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${RENDER_API_KEY.trim()}`,
      ...(options.body ? {'Content-Type': 'application/json'} : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    throw new Error(`Render API ${res.status}: ${typeof data === 'string' ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

async function findListenerService() {
  const data = await renderRequest(`/services?name=${encodeURIComponent(LISTENER_SERVICE_NAME.trim())}`);
  const candidates = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
  const services = candidates.map((item) => item?.service || item).filter(Boolean);
  const service = services.find((item) => item.name === LISTENER_SERVICE_NAME.trim())
    || services.find((item) => item.type === 'background_worker');
  if (!service?.id) throw new Error(`Listener Render tidak ditemukan: ${LISTENER_SERVICE_NAME}`);
  return service;
}

async function isTikTokLive() {
  const connection = new TikTokLiveConnection(username);
  let settled = false;
  let timer;

  return new Promise((resolve) => {
    const finish = (live) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void connection.disconnect().catch(() => {});
      resolve(live);
    };

    timer = setTimeout(() => finish(false), timeoutMs);
    connection.on(WebcastEvent.CONNECTED, () => finish(true));
    connection.on(WebcastEvent.ERROR, () => finish(false));
    connection.on(WebcastEvent.DISCONNECTED, () => finish(false));
    connection.connect().catch(() => finish(false));
  });
}

async function setListenerState(service, live) {
  const suspended = service.suspended === 'suspended';
  if ((live && !suspended) || (!live && suspended)) {
    console.log(`RENDER: listener sudah ${live ? 'ON' : 'OFF'}.`);
    return;
  }

  const action = live ? 'resume' : 'suspend';
  console.log(`RENDER: ${action} listener ${service.name} (${service.id})...`);
  await renderRequest(`/services/${service.id}/${action}`, {method: 'POST'});
  console.log(`RENDER: listener berhasil ${live ? 'ON' : 'OFF'}.`);
}

async function main() {
  console.log('Jalur Tarot - Render Live Controller');
  console.log(`TikTok: @${username}`);
  const live = await isTikTokLive();
  console.log(`TIKTOK: @${username} = ${live ? 'LIVE' : 'OFFLINE'}`);
  const service = await findListenerService();
  console.log(`RENDER: status listener = ${service.suspended || 'unknown'}`);
  await setListenerState(service, live);
}

main().catch((err) => {
  console.error(`CONTROLLER ERROR: ${err?.message || err}`);
  process.exit(1);
});
