// Prompt + request building for Cha Cha. Shared by api/chat.js and scripts/eval-chacha.mjs.
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8');

// Fixed order, no per-request values: keeps the prompt cacheable.
export const SYSTEM_PROMPT = `${read('persona.md')}\n\n${read('knowledge.md')}`;

const MAX_MESSAGES = 10;
const KEEP_MESSAGES = 6;
const MAX_CHARS = { user: 500, assistant: 1500 };

export function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return { ok: false, error: 'Send between 1 and 10 messages.' };
  }
  for (const [i, m] of messages.entries()) {
    const expected = i % 2 === 0 ? 'user' : 'assistant';
    if (!m || m.role !== expected) return { ok: false, error: 'Messages must alternate, starting with user.' };
    if (typeof m.content !== 'string' || !m.content.trim()) return { ok: false, error: 'Each message needs text.' };
    if (m.content.length > MAX_CHARS[m.role]) return { ok: false, error: 'That message is too long.' };
  }
  if (messages.at(-1).role !== 'user') return { ok: false, error: 'The last message must be from the user.' };

  let kept = messages.slice(-KEEP_MESSAGES);
  if (kept[0].role !== 'user') kept = kept.slice(1);
  return { ok: true, messages: kept.map(({ role, content }) => ({ role, content })) };
}

export function buildParams({ messages, model }) {
  return {
    model,
    // Thinking tokens count toward max_tokens; brevity comes from the persona and low effort.
    max_tokens: 2000,
    output_config: { effort: 'low' },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages,
  };
}
