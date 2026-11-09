import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokens, answerQuestion } from '../js/chacha-match.js';
import { NOT_IN_NOTES_LINE, OFF_LIMITS_LINE, OFF_TOPIC_CODE_LINE, OFF_TOPIC_LINE } from '../js/chacha-core.js';

const BANK = [
  { id: 'teappo', q: "What's Teappo?", aliases: ['tea business', 'his tea company'], keywords: ['teappo', 'tea'], a: 'Teappo is a tea brand.' },
  { id: 'lead-style', q: "What's his leadership style?", aliases: ['how does he manage a team', 'management style'], keywords: ['lead'], a: 'Player-coach.' },
  { id: 'ai-trust', q: 'How does he design for trust in AI?', aliases: ['trustworthy ai', 'human in the loop'], keywords: ['trust'], a: 'Keep humans in control.' },
  { id: 'intro', q: 'Who is Chung-Han in 30 seconds?', aliases: ['tell me about yourself', 'introduce him', 'background'], keywords: ['intro'], a: 'A problem solver.' },
];

test('tokens lowercases, drops stopwords and punctuation, and stems simple suffixes', () => {
  assert.deepEqual(tokens("What's Chung-Han's leadership like?"), ['lead']);
  assert.deepEqual(tokens('Designing dashboards'), ['design', 'dashboard']);
});

test('tokens maps synonyms to one canonical word', () => {
  assert.deepEqual(tokens('managing'), ['lead']);
  assert.deepEqual(tokens('machine learning'), ['ai']);
});

test('answers an exact starter question', () => {
  const r = answerQuestion("What's Teappo?", BANK);
  assert.equal(r.type, 'answer');
  assert.equal(r.entry.id, 'teappo');
});

test('answers paraphrases through aliases and keywords', () => {
  assert.equal(answerQuestion('tell me about his tea business', BANK).entry.id, 'teappo');
  assert.equal(answerQuestion('How does he manage people?', BANK).entry.id, 'lead-style');
  assert.equal(answerQuestion('can you introduce chung han', BANK).entry.id, 'intro');
  assert.equal(answerQuestion('how do you make AI trustworthy', BANK).entry.id, 'ai-trust');
});

test('unrelated text returns the not-in-notes line with up to 3 suggestions', () => {
  const r = answerQuestion('What is the capital of France?', BANK);
  assert.equal(r.type, 'none');
  assert.equal(r.text, NOT_IN_NOTES_LINE);
  assert.ok(r.suggestions.length > 0 && r.suggestions.length <= 3);
});

test('gibberish and empty input do not match', () => {
  assert.equal(answerQuestion('asdf qwer zxcv', BANK).type, 'none');
  assert.equal(answerQuestion('   ', BANK).type, 'none');
});

test('off-limits questions get the human-conversation line', () => {
  for (const q of ['What are his salary expectations?', 'Does he need visa sponsorship?', "What's his phone number?",
    'What other companies is he interviewing with?', 'When can he start?', 'How old is he?']) {
    const r = answerQuestion(q, BANK);
    assert.equal(r.type, 'offlimits', q);
    assert.equal(r.text, OFF_LIMITS_LINE);
  }
});

test('code requests get the code line; other off-topic asks get the dog pattern', () => {
  assert.equal(answerQuestion('Can you write me some Python code?', BANK).text, OFF_TOPIC_CODE_LINE);
  assert.equal(answerQuestion('write a poem for me', BANK).text, OFF_TOPIC_LINE);
});

test('mentioning code in a normal question is not off-topic', () => {
  assert.notEqual(answerQuestion('Does he prototype in code?', BANK).type, 'offtopic');
});
