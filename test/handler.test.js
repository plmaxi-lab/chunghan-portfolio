import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChatHandler } from '../api/_handler.js';
import { FALLBACK_LINE } from '../js/chacha-core.js';

const ORIGIN = 'https://chunghan.work';

function fakeClient({ chunks = [], stopReason = 'end_turn', throwAt = null } = {}) {
  const calls = [];
  return {
    calls,
    messages: {
      stream(params, options) {
        calls.push({ params, options });
        if (throwAt === 'start') throw new Error('boom');
        return {
          async *[Symbol.asyncIterator]() {
            for (const text of chunks) {
              yield { type: 'content_block_delta', delta: { type: 'text_delta', text } };
            }
            if (throwAt === 'mid') throw new Error('stream died');
          },
          async finalMessage() { return { stop_reason: stopReason }; },
        };
      },
    },
  };
}

function req(body, { method = 'POST', origin = ORIGIN, ip = '1.2.3.4' } = {}) {
  return new Request('https://chunghan.work/api/chat', {
    method,
    headers: { 'content-type': 'application/json', origin, 'x-forwarded-for': `${ip}, 10.0.0.1` },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });
}

const okBody = { messages: [{ role: 'user', content: 'Who is Chung-Han?' }] };
const allow = async () => true;
const make = (over = {}) => createChatHandler({
  client: fakeClient({ chunks: ['Chung-Han ', 'ships.'] }), limiter: allow, model: 'claude-haiku-5-5',
  allowedOrigins: [ORIGIN], ...over,
});

test('streams the model text on success', async () => {
  const res = await make()(req(okBody));
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/plain/);
  assert.equal(await res.text(), 'Chung-Han ships.');
});

test('passes model, validated messages, and a 15s timeout to the client', async () => {
  const client = fakeClient({ chunks: ['ok'] });
  await (await make({ client })(req(okBody))).text();
  assert.equal(client.calls[0].params.model, 'claude-haiku-5-5');
  assert.deepEqual(client.calls[0].params.messages, okBody.messages);
  assert.equal(client.calls[0].options.timeout, 15000);
});

test('rate limited visitor gets the fallback line, and the client is never called', async () => {
  const client = fakeClient({ chunks: ['nope'] });
  const res = await make({ client, limiter: async () => false })(req(okBody));
  assert.equal(res.status, 200);
  assert.equal(await res.text(), FALLBACK_LINE);
  assert.equal(client.calls.length, 0);
});

test('limiter receives the first forwarded IP', async () => {
  let seen;
  await (await make({ limiter: async (ip) => { seen = ip; return true; } })(req(okBody))).text();
  assert.equal(seen, '1.2.3.4');
});

test('client error before streaming returns the fallback line', async () => {
  const res = await make({ client: fakeClient({ throwAt: 'start' }) })(req(okBody));
  assert.equal(await res.text(), FALLBACK_LINE);
});

test('stream error after some text appends the fallback line', async () => {
  const res = await make({ client: fakeClient({ chunks: ['Partial'], throwAt: 'mid' }) })(req(okBody));
  assert.equal(await res.text(), `Partial\n\n${FALLBACK_LINE}`);
});

test('refusal replaces an empty answer with the fallback line', async () => {
  const res = await make({ client: fakeClient({ chunks: [], stopReason: 'refusal' }) })(req(okBody));
  assert.equal(await res.text(), FALLBACK_LINE);
});

test('refusal after some text appends the fallback line', async () => {
  const res = await make({ client: fakeClient({ chunks: ['Half'], stopReason: 'refusal' }) })(req(okBody));
  assert.equal(await res.text(), `Half\n\n${FALLBACK_LINE}`);
});

test('missing client (no API key) returns the fallback line', async () => {
  const res = await make({ client: null })(req(okBody));
  assert.equal(await res.text(), FALLBACK_LINE);
});

test('limiter failure returns the fallback line', async () => {
  const res = await make({ limiter: async () => { throw new Error('redis down'); } })(req(okBody));
  assert.equal(await res.text(), FALLBACK_LINE);
});

test('invalid body returns 400', async () => {
  const res = await make()(req({ messages: [{ role: 'assistant', content: 'x' }] }));
  assert.equal(res.status, 400);
});

test('malformed JSON returns 400', async () => {
  const bad = new Request('https://chunghan.work/api/chat', {
    method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/json' }, body: '{not json',
  });
  assert.equal((await make()(bad)).status, 400);
});

test('oversized body returns 413', async () => {
  const res = await make()(req({ messages: [{ role: 'user', content: 'x' }], pad: 'y'.repeat(13000) }));
  assert.equal(res.status, 413);
});

test('foreign origin returns 403', async () => {
  const res = await make()(req(okBody, { origin: 'https://evil.example' }));
  assert.equal(res.status, 403);
});

test('missing origin returns 403', async () => {
  const noOrigin = new Request('https://chunghan.work/api/chat', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(okBody),
  });
  assert.equal((await make()(noOrigin)).status, 403);
});

test('non-POST returns 405', async () => {
  const res = await make()(req(null, { method: 'GET' }));
  assert.equal(res.status, 405);
});
