import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CASE_IDS } from '../js/chacha-core.js';
import { answerQuestion } from '../js/chacha-match.js';

const BANK = JSON.parse(readFileSync(new URL('../data/answers.json', import.meta.url), 'utf8'));
const words = (s) => s.split(/\s+/).filter(Boolean).length;

test('bank has about 100 entries with unique ids and 8 starters', () => {
  assert.ok(BANK.length >= 95, `only ${BANK.length}`);
  assert.equal(new Set(BANK.map((e) => e.id)).size, BANK.length);
  assert.equal(BANK.filter((e) => e.starter).length, 8);
});

test('every answer follows the copy rules', () => {
  for (const e of BANK) {
    assert.ok(!e.a.includes('—') && !e.q.includes('—'), `${e.id}: em dash`);
    assert.ok(words(e.a) <= 120, `${e.id}: ${words(e.a)} words`);
    assert.doesNotMatch(e.a, /\bI (led|shipped|built|designed|managed)\b|\bmy (team|wife)\b/, `${e.id}: first person`);
    if (e.case !== undefined) assert.ok(Object.hasOwn(CASE_IDS, e.case), `${e.id}: bad case`);
  }
});

test('every question and alias matches its own entry', () => {
  const misses = [];
  for (const e of BANK) {
    for (const phrase of [e.q, ...(e.aliases || [])]) {
      const r = answerQuestion(phrase, BANK);
      if (r.type !== 'answer' || r.entry.id !== e.id) misses.push(`${e.id} ← "${phrase}" got ${r.type === 'answer' ? r.entry.id : r.type}`);
    }
  }
  assert.deepEqual(misses, []);
});

// How real visitors might phrase things, none of them copied from the bank.
const VISITOR = [
  ['So who is this guy?', 'intro'],
  ['what has he done with artificial intelligence', 'ai-shipped'],
  ['Give me an example of a pivot', 'strategy-change'],
  ['how do you get people to trust an AI system', 'ai-trust'],
  ['how many people did he manage', 'team'],
  ['what was his job at cisco', 'splunk'],
  ['tell me about kasa', 'tplink'],
  ['What did he build at TP-Link?', 'tplink'],
  ['why is he on the job market', 'why-left'],
  ['what does he want to do next', 'looking-for'],
  ['Is he a good manager?', 'lead-style'],
  ['how does he deal with conflict with product managers', 'pushback'],
  ['biggest mistake he made', 'failure'],
  ['what would he improve about himself', 'weakness'],
  ['does he know kubernetes', 'security'],
  ['experience with monitoring tools?', 'observability'],
  ['What is assertive AI?', 'assertive'],
  ['what about agentic ai', 'assertive'],
  ['how does he use claude code', 'ai-workflow'],
  ['tell me about the tea company', 'teappo'],
  ['where does he live', 'location'],
  ['what school did he go to', 'education'],
  ['how do I reach him', 'contact'],
  ['what is the password', 'password'],
  ['are you a real person?', 'chacha-real'],
  ['what are you', 'chacha-who'],
  ['how do you measure if design worked', 'metrics-success'],
  ['tell me about the regex101 feedback', 'regex'],
  ['what is the maturity model', 'maturity'],
  ['how does he mentor junior designers', 'grow-people'],
  ['Thank you!', 'thanks'],
  ['hello', 'hello'],
];

test('realistic visitor phrasings reach the right answer', () => {
  const misses = [];
  for (const [q, id] of VISITOR) {
    const r = answerQuestion(q, BANK);
    if (r.type !== 'answer' || r.entry.id !== id) misses.push(`"${q}" → ${r.type === 'answer' ? r.entry.id : r.type} (want ${id})`);
  }
  assert.deepEqual(misses, []);
});

test('questions outside the notes do not get a wrong answer', () => {
  for (const q of ['What is the capital of France?', 'Who won the World Cup?', 'asdfgh', 'What is his favorite movie?']) {
    assert.equal(answerQuestion(q, BANK).type, 'none', q);
  }
});
