import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SYSTEM_PROMPT, validateMessages, buildParams } from '../api/_prompt.js';

const u = (content) => ({ role: 'user', content });
const a = (content) => ({ role: 'assistant', content });

test('SYSTEM_PROMPT contains persona then knowledge', () => {
  const p = SYSTEM_PROMPT.indexOf('You are Cha Cha');
  const k = SYSTEM_PROMPT.indexOf('# Knowledge: Chung-Han Tsai');
  assert.ok(p >= 0 && k > p);
});

test('validateMessages accepts a single user message', () => {
  assert.deepEqual(validateMessages([u('hi')]), { ok: true, messages: [u('hi')] });
});

test('validateMessages rejects non-arrays, empty, and more than 10 messages', () => {
  assert.equal(validateMessages(null).ok, false);
  assert.equal(validateMessages([]).ok, false);
  const eleven = Array.from({ length: 11 }, (_, i) => (i % 2 ? a('x') : u('x')));
  assert.equal(validateMessages(eleven).ok, false);
});

test('validateMessages requires alternating roles ending with user', () => {
  assert.equal(validateMessages([u('a'), u('b')]).ok, false);
  assert.equal(validateMessages([u('a'), a('b')]).ok, false);
  assert.equal(validateMessages([a('a'), u('b')]).ok, false);
});

test('validateMessages enforces content types and length limits', () => {
  assert.equal(validateMessages([u('x'.repeat(501))]).ok, false);
  assert.equal(validateMessages([u('q'), a('x'.repeat(1501)), u('q')]).ok, false);
  assert.equal(validateMessages([{ role: 'user', content: 42 }]).ok, false);
  assert.equal(validateMessages([u('   ')]).ok, false);
  assert.equal(validateMessages([{ role: 'system', content: 'x' }]).ok, false);
});

test('validateMessages keeps only the last 6 messages, starting with user', () => {
  const nine = [u('1'), a('2'), u('3'), a('4'), u('5'), a('6'), u('7'), a('8'), u('9')];
  const res = validateMessages(nine);
  assert.equal(res.ok, true);
  assert.deepEqual(res.messages.map((m) => m.content), ['5', '6', '7', '8', '9']);
});

test('buildParams caches the system prompt and keeps answers short', () => {
  const params = buildParams({ messages: [u('hi')], model: 'claude-haiku-5-5' });
  assert.equal(params.model, 'claude-haiku-5-5');
  assert.deepEqual(params.system, [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }]);
  assert.equal(params.max_tokens, 2000);
  assert.deepEqual(params.output_config, { effort: 'low' });
  assert.deepEqual(params.messages, [u('hi')]);
});
