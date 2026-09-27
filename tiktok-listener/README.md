# Jalur Tarot TikTok LIVE Listener

Node.js listener using the Euler Stream managed WebSocket SDK instead of the unofficial connector's TikTok room-ID scraping/signing fallback chain.

## Setup
- Node.js 20+
- Euler Stream API key with WebSocket access
- Cloudflare Worker URL and matching LIVE_SECRET

Install in this directory:
```sh
npm install
cp .env.example .env
npm start
``

Set `TIKTOK_USERNAME`, `WORKER_URL`, `LIVE_SECRET`, and `EULER_API_KEY`. On Render, set these in the service Environment tab; do not commit secrets. `SIGN_API_KEY` is accepted as a backward-compatible alias, but use `EULER_API_KEY` for clarity.

## Event handling
- Receives Euler packets named `WebcastGiftMessage` and `WebcastLikeMessage`.
- Gift coins are estimated from message diamond-count fields times gift count; validate against a real gift event before public live use because event schemas can vary.
- Sends accepted events to `POST /api/live/trigger`.
- Reconnects with exponential backoff and logs meaningful Euler close codes. The provider can return NOT_LIVE (4404) when the target is not live.
- Run only one listener instance for this TikTok account to avoid duplicate draws.

## Render
Create a Background Worker with root directory `tiktok-listener`, build command `npm install`, and start command `npm start`. The included `render.yaml` is a Blueprint definition. A continuously running Background Worker uses a paid always-on plan; verify current pricing in Render dashboard.

## Troubleshooting
- `4401`: check the Euler API key.
- `4403`: key/account permission issue; check Euler dashboard/support.
- `4404`: target is offline or username cannot be resolved; confirm the account is LIVE and username is correct.
- `WORKER ERROR 401`: LIVE_SECRET differs from the Cloudflare Worker secret.
- `CONNECTED` but no gifts: check real incoming event logs / account is live, then validate gift message fields.
