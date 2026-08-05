import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNgPhone, isValidNgPhone, isPlausibleNgPhone } from './phone.js';

test('local format with leading 0', () => {
  assert.equal(normalizeNgPhone('08031234567'), '2348031234567');
});

test('international format with plus', () => {
  assert.equal(normalizeNgPhone('+2348031234567'), '2348031234567');
});

test('international format without plus is unchanged', () => {
  assert.equal(normalizeNgPhone('2348031234567'), '2348031234567');
});

test('national format without leading 0', () => {
  assert.equal(normalizeNgPhone('8031234567'), '2348031234567');
});

test('strips spaces, hyphens, and parentheses', () => {
  assert.equal(normalizeNgPhone('0803 123-4567'), '2348031234567');
  assert.equal(normalizeNgPhone('(0803) 123-4567'), '2348031234567');
});

test('too short returns null', () => {
  assert.equal(normalizeNgPhone('55'), null);
});

test('empty or missing input returns null', () => {
  assert.equal(normalizeNgPhone(''), null);
  assert.equal(normalizeNgPhone(null), null);
  assert.equal(normalizeNgPhone(undefined), null);
});

test('non-mobile prefix (landline-shaped) returns null', () => {
  // Nigerian mobile subscriber numbers start with 7, 8, or 9 after the
  // leading 0 — 0 followed by 1-6 is not a valid mobile prefix.
  assert.equal(normalizeNgPhone('01234567890'), null);
});

test('wrong digit count returns null', () => {
  assert.equal(normalizeNgPhone('080312345'), null);      // too short (9 digits)
  assert.equal(normalizeNgPhone('080312345678'), null);    // too long (12 digits)
});

test('isValidNgPhone mirrors normalizeNgPhone', () => {
  assert.equal(isValidNgPhone('08031234567'), true);
  assert.equal(isValidNgPhone('55'), false);
});

test('isPlausibleNgPhone accepts a non-mobile prefix that normalizeNgPhone rejects', () => {
  // Same landline-shaped number as the "non-mobile prefix" test above —
  // isPlausibleNgPhone only checks digit shape, not the network prefix,
  // so a false rejection at the booking form doesn't cost a real booking.
  assert.equal(isPlausibleNgPhone('01234567890'), true);
  assert.equal(normalizeNgPhone('01234567890'), null);
});

test('isPlausibleNgPhone still rejects implausible shapes', () => {
  assert.equal(isPlausibleNgPhone('55'), false);
  assert.equal(isPlausibleNgPhone(''), false);
  assert.equal(isPlausibleNgPhone('080312345'), false);
  assert.equal(isPlausibleNgPhone('080312345678'), false);
});
