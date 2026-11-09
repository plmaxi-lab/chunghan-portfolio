// Request handling for /api/chat with dependencies injected, so it can be tested without network.
import { FALLBACK_LINE } from '../js/chacha-core.js';
import { validateMessages, buildParams } from './_prompt.js';

// 9 messages at the per-message caps, in 3-byte (e.g. Chinese) characters, plus JSON overhead.
const MAX_BODY_BYTES = 32 * 1024;
const TIMEOUT_MS = 15000;
const TEXT_HEADERS = { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' };

const plain = (body, status = 200) => new Response(body, { status, headers: TEXT_HEADERS });

// limiter(ip) -> Promise<boolean>; client may be null when no API key is configured.
export function createChatHandler({ client, limiter, model, allowedOrigins }) {
  return async function handle(request) {
    if (request.method !== 'POST') return plain('Method not allowed', 405);
    if (!allowedOrigins.includes(request.headers.get('origin'))) return plain('Forbidden', 403);

    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return plain('Too large', 413);
    let body;
    try { body = JSON.parse(raw); } catch { return plain('Bad request', 400); }
    const checked = validateMessages(body?.messages);
    if (!checked.ok) return plain(checked.error, 400);

    if (!client) return plain(FALLBACK_LINE);
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    try {
      if (!(await limiter(ip))) return plain(FALLBACK_LINE);
    } catch {
      return plain(FALLBACK_LINE);
    }

    let stream;
    try {
      stream = client.messages.stream(buildParams({ messages: checked.messages, model }), { timeout: TIMEOUT_MS });
    } catch {
      return plain(FALLBACK_LINE);
    }

    const encoder = new TextEncoder();
    let cancelled = false;
    return new Response(new ReadableStream({
      async start(controller) {
        let sent = '';
        const send = (text) => {
          if (cancelled) return;
          sent += text;
          controller.enqueue(encoder.encode(text));
        };
        const fallback = () => send(sent ? `\n\n${FALLBACK_LINE}` : FALLBACK_LINE);
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') send(event.delta.text);
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === 'refusal' || !sent) fallback();
        } catch {
          fallback();
        }
        if (!cancelled) controller.close();
      },
      cancel() {
        // Visitor closed the tab: stop generating (and paying for) the rest of the answer.
        cancelled = true;
        stream.abort?.();
      },
    }), { status: 200, headers: TEXT_HEADERS });
  };
}
