import test from 'node:test';
import assert from 'node:assert/strict';
import { giftCoins, giftName, giftRepeat, isStreakInProgress, userName } from '../logic.js';

test('extracts user and gift fields across supported payload variants', () => {
  assert.equal(userName({ user: { uniqueId: 'viewer1' } }), 'viewer1');
  assert.equal(giftName({ gift: { name: 'Rose' } }), 'Rose');
  assert.equal(giftCoins({ giftDetails: { diamond_count: 5 } }), 5);
  assert.equal(giftRepeat({ repeat_count: 3.9 }), 3);
});

test('returns null for unknown coin value instead of treating it as zero', () => {
  assert.equal(giftCoins({ giftName: 'Rose' }), null);
});

test('recognizes streak updates only while repeat is still active', () => {
  assert.equal(isStreakInProgress({ giftType: 1, repeatEnd: 0 }), true);
  assert.equal(isStreakInProgress({ giftType: 1, repeatEnd: false }), true);
  assert.equal(isStreakInProgress({ giftType: 1, repeatEnd: 1 }), false);
  assert.equal(isStreakInProgress({ giftType: 2, repeatEnd: 0 }), false);
  assert.equal(isStreakInProgress({}), false);
});
