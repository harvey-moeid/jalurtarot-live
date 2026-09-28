import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueueDraw } from '../queue.js';

test('serializes draw requests in arrival order', async () => {
  const events = [];
  const first = enqueueDraw(async () => {
    events.push('first:start');
    await new Promise(resolve => setTimeout(resolve, 20));
    events.push('first:end');
    return 1;
  });
  const second = enqueueDraw(async () => {
    events.push('second:start');
    events.push('second:end');
    return 2;
  });

  assert.equal(await first, 1);
  assert.equal(await second, 2);
  assert.deepEqual(events, ['first:start', 'first:end', 'second:start', 'second:end']);
});

test('queue continues after a failed draw', async () => {
  const events = [];
  const failed = enqueueDraw(async () => {
    events.push('failed');
    throw new Error('expected');
  });
  const next = enqueueDraw(async () => {
    events.push('next');
    return true;
  });

  await assert.rejects(failed);
  assert.equal(await next, true);
  assert.deepEqual(events, ['failed', 'next']);
});
