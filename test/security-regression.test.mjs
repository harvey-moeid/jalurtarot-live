import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const adminAuth = await readFile(new URL('../src/middleware/adminAuth.ts', import.meta.url), 'utf8');
const admin = await readFile(new URL('../src/routes/admin.ts', import.meta.url), 'utf8');
const live = await readFile(new URL('../src/lib/live.ts', import.meta.url), 'utf8');

test('admin authentication uses server-side random sessions', () => {
  assert.match(adminAuth, /randomUUID\(\)/);
  assert.match(adminAuth, /admin:session:/);
  assert.match(adminAuth, /ADMIN_SESSION_TTL_SECONDS/);
  assert.doesNotMatch(adminAuth, /return ['"]?changeme/);
  assert.doesNotMatch(admin, /base64.*password/i);
});

test('admin login is rate limited and cookies are hardened', () => {
  assert.match(admin, /isLoginRateLimited/);
  assert.match(admin, /recordFailedLogin/);
  assert.match(admin, /HttpOnly; Secure; SameSite=Strict/);
  assert.match(admin, /Max-Age=\$\{ADMIN_SESSION_TTL_SECONDS\}/);
});

test('live draw persistence reports KV failure to callers', () => {
  assert.match(live, /Promise<boolean>/);
  assert.match(live, /return true/);
  assert.match(live, /return false/);
  assert.match(admin, /if \(!saved\) return c\.redirect/);
});
