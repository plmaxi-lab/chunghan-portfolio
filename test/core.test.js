import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASE_IDS, FALLBACK_LINE, parseCaseMarker, stripPartialMarker } from '../js/chacha-core.js';

test('CASE_IDS maps the five case ids to CASES indexes', () => {
  assert.deepEqual(CASE_IDS, { udo: 0, onboarding: 1, hitl: 2, uda: 3, pm: 4 });
});

test('FALLBACK_LINE is the approved nap line', () => {
  assert.equal(FALLBACK_LINE, 'Too many questions today. Cha Cha needs a nap 😴 Try one below, or email Chung-Han at plmaxi@gmail.com.');
});

test('parseCaseMarker removes a trailing marker and returns its id', () => {
  assert.deepEqual(parseCaseMarker('He shipped it in 3 months. [[case:udo]]'),
    { text: 'He shipped it in 3 months.', caseId: 'udo' });
});

test('parseCaseMarker drops unknown ids but still strips the marker', () => {
  assert.deepEqual(parseCaseMarker('Nice. [[case:nope]]'), { text: 'Nice.', caseId: null });
});

test('parseCaseMarker returns the first valid id when several markers appear', () => {
  assert.deepEqual(parseCaseMarker('A [[case:bad]] B [[case:hitl]] [[case:uda]]'),
    { text: 'A B', caseId: 'hitl' });
});

test('parseCaseMarker leaves text without markers unchanged', () => {
  assert.deepEqual(parseCaseMarker('Just text.'), { text: 'Just text.', caseId: null });
});

test('stripPartialMarker hides a marker that is still arriving', () => {
  assert.equal(stripPartialMarker('He shipped it. [[ca'), 'He shipped it.');
  assert.equal(stripPartialMarker('He shipped it. ['), 'He shipped it.');
  assert.equal(stripPartialMarker('He shipped it. [[case:ud'), 'He shipped it.');
});

test('stripPartialMarker removes complete markers', () => {
  assert.equal(stripPartialMarker('Done. [[case:udo]]'), 'Done.');
});

test('stripPartialMarker keeps ordinary brackets that are not a marker start', () => {
  assert.equal(stripPartialMarker('Steps [1] and [2] shipped.'), 'Steps [1] and [2] shipped.');
});

test('stripPartialMarker hides a marker missing only its last bracket', () => {
  assert.equal(stripPartialMarker('Answer [[case:udo]'), 'Answer');
});
