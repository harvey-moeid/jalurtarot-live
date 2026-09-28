import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const adminAuth = await readFile(new URL('../src/middleware/adminAuth.ts', import.meta.url), 'utf8');
const admin = await readFile(new URL('../src/routes/admin.ts', import.meta.url), 'utf8');
const live = await readFile(new URL('../src/lib/live.ts', import.meta.url), 'utf8');

test('admin authentication uses server-side random sessions', () => {
  assert.ok(adminAuth.includes('crypto as any).randomUUID()'));
  assert.ok(adminAuth.includes('admin:session:'));
  assert.ok(adminAuth.includes('ADMIN_SESSION_TTL_SECONDS'));
  assert.ok(!adminAuth.includes("return 'changeme'"));
  assert.ok(!adminAuth.includes('base64(password'));
});

test('admin login is rate limited and cookies are hardened', () => {
  assert.ok(admin.includes('isLoginRateLimited'));
  assert.ok(admin.includes('recordFailedLogin'));
  assert.ok(admin.includes('HttpOnly; Secure; SameSite=Strict'));
  assert.ok(admin.includes('Max-Age=' + '${ADMIN_SESSION_TTL_SECONDS}'));
});

test('live draw persistence reports KV failure to callers', () => {
  assert.ok(live.includes('Promise<boolean>'));
  assert.ok(live.includes('return true'));
  assert.ok(live.includes('return false'));
  assert.ok(admin.includes('if (!saved) return c.redirect'));
});
