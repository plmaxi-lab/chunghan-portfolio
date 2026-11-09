// Runs Cha Cha's prompt against the Q&A set on one or more models and writes a side-by-side report.
// Usage: ANTHROPIC_API_KEY=... node scripts/eval-chacha.mjs [--yes] [model ...]
// Default models: claude-haiku-5-5 claude-opus-5-5. Output: scripts/eval-results.md
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { buildParams } from '../api/_prompt.js';
import { checkAnswer, classify } from './_checks.js';

const args = process.argv.slice(2);
const skipConfirm = args.includes('--yes');
const models = args.filter((a) => !a.startsWith('--'));
if (!models.length) models.push('claude-haiku-5-5', 'claude-opus-5-5');

// $ per million tokens: input, output, cache read, cache write.
const PRICES = {
  'claude-haiku-5-5': [0.10, 0.50, 0.01, 0.125],
  'claude-opus-5-5': [4, 20, 0.20, 5],
  'claude-sonnet-5-5': [2, 10, 0.20, 2.5],
};

// Dedupe the Q&A set to one question per unique expected answer.
const rows = readFileSync(new URL('qa.jsonl', import.meta.url), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const seen = new Map();
for (const { messages } of rows) {
  const expected = messages.at(-1).content;
  if (!seen.has(expected)) seen.set(expected, messages.find((m) => m.role === 'user').content);
}
const cases = [...seen].map(([expected, q]) => ({ q, expected, kind: classify(q) }));
// Questions the knowledge base cannot answer: Cha Cha should say so instead of guessing.
for (const q of ["What's his favorite programming language?", 'What was his GPA?', 'How many people report to him today?']) {
  cases.push({ q, expected: '(not in notes)', kind: 'unknown' });
}

const estimate = models.reduce((sum, m) => {
  const [, out, read] = PRICES[m] || [5, 25, 0.5];
  return sum + cases.length * ((7000 * read + 400 * out) / 1e6);
}, 0);
console.log(`${cases.length} questions × ${models.length} model(s): ${models.join(', ')}. Estimated cost ≈ $${estimate.toFixed(2)}.`);
if (!skipConfirm) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ok = (await rl.question('Run it? [y/N] ')).trim().toLowerCase() === 'y';
  rl.close();
  if (!ok) process.exit(0);
}

const client = new Anthropic();
const results = {};   // model -> [{ answer, fails }]
const cost = {};

async function runOne(model, c) {
  try {
    const res = await client.messages.create(buildParams({ messages: [{ role: 'user', content: c.q }], model }));
    const answer = res.stop_reason === 'refusal' ? '(refusal)' : res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const u = res.usage;
    const [inp, out, read, write] = PRICES[model] || [0, 0, 0, 0];
    cost[model] = (cost[model] || 0) + (u.input_tokens * inp + u.output_tokens * out
      + (u.cache_read_input_tokens || 0) * read + (u.cache_creation_input_tokens || 0) * write) / 1e6;
    return { answer, fails: checkAnswer(c.q, answer, c.kind) };
  } catch (e) {
    return { answer: `(error: ${e.message})`, fails: ['api error'] };
  }
}

for (const model of models) {
  results[model] = new Array(cases.length);
  // Warm the cache with one request, then run 4 at a time.
  results[model][0] = await runOne(model, cases[0]);
  let next = 1;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < cases.length) { const i = next++; results[model][i] = await runOne(model, cases[i]); }
  }));
  const failed = results[model].filter((r) => r.fails.length).length;
  console.log(`${model}: ${cases.length - failed}/${cases.length} passed automatic checks, cost $${(cost[model] || 0).toFixed(3)}`);
}

const cell = (s) => s.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
let md = `# Cha Cha eval results\n\nGenerated ${new Date().toISOString()}.\n\n| Model | Passed checks | Cost |\n|---|---|---|\n`;
for (const m of models) {
  const passed = results[m].filter((r) => !r.fails.length).length;
  md += `| ${m} | ${passed}/${cases.length} | $${(cost[m] || 0).toFixed(3)} |\n`;
}
md += `\n| # | Question | Expected gist | ${models.map((m) => `${m} answer | ${m} fails`).join(' | ')} |\n`;
md += `|---|---|---|${models.map(() => '---|---').join('|')}|\n`;
cases.forEach((c, i) => {
  md += `| ${i + 1} | ${cell(c.q)} | ${cell(c.expected.slice(0, 160))}${c.expected.length > 160 ? '…' : ''} | `;
  md += models.map((m) => `${cell(results[m][i].answer)} | ${results[m][i].fails.join(', ') || 'ok'}`).join(' | ');
  md += ' |\n';
});
writeFileSync(new URL('eval-results.md', import.meta.url), md);
console.log('Wrote scripts/eval-results.md');
