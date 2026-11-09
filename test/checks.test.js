import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, checkAnswer } from '../scripts/_checks.js';

const good = 'Chung-Han led a team of seven at Splunk and shipped three products from 0 to 1. [[case:uda]]';

test('classify sorts questions into off-limits, off-topic, and normal', () => {
  assert.equal(classify('What are your salary expectations?'), 'offlimits');
  assert.equal(classify('Do you need visa sponsorship?'), 'offlimits');
  assert.equal(classify('What other companies are you interviewing with?'), 'offlimits');
  assert.equal(classify("What's your phone number?"), 'offlimits');
  assert.equal(classify('When can you start?'), 'offlimits');
  assert.equal(classify('Can you write me some code?'), 'offtopic');
  assert.equal(classify('Tell me about Teappo.'), 'normal');
});

test('a clean, short, third-person answer passes', () => {
  assert.deepEqual(checkAnswer('Tell me about yourself.', good), []);
});

test('flags em dashes', () => {
  assert.ok(checkAnswer('q', 'Chung-Han shipped it — fast.').includes('em dash'));
});

test('flags answers over 130 words', () => {
  assert.ok(checkAnswer('q', 'word '.repeat(131)).includes('over 130 words'));
});

test('flags first-person claims about his work', () => {
  assert.ok(checkAnswer('q', 'I led seven designers at Splunk.').includes('first person'));
  assert.ok(checkAnswer('q', 'My team shipped it.').includes('first person'));
});

test('off-limits questions must use the human-conversation line and no numbers', () => {
  assert.ok(checkAnswer('What are your salary expectations?', 'Around $200k.').includes('off-limits not redirected'));
  assert.deepEqual(checkAnswer('What are your salary expectations?',
    "I'm just the dog. That's a human conversation 🐾 Chung-Han is happy to chat: plmaxi@gmail.com."), []);
});

test('off-topic questions must use the dog pattern', () => {
  assert.ok(checkAnswer('Can you write me some code?', 'Sure: print(1)').includes('off-topic not redirected'));
  assert.deepEqual(checkAnswer('Can you write me some code?',
    "I'm a dog. I can't write code, but Chung-Han can 🐾 Want to hear what he's built with AI?"), []);
});

test('unknown-kind questions must use the not-in-my-notes line', () => {
  assert.ok(checkAnswer('Favorite language?', 'Python.', 'unknown').includes('guessed instead of not-in-notes'));
  assert.deepEqual(checkAnswer('Favorite language?',
    "I sniffed around, but that's not in my notes 🐾 Chung-Han would know. Email him at plmaxi@gmail.com.", 'unknown'), []);
});

test('accuracy: never pairs 45+ days with a minutes figure', () => {
  assert.ok(checkAnswer('q', 'He cut time-to-value from 45+ days to 30 minutes.').includes('45 days + minutes'));
});

test('accuracy: never says OT Intelligence', () => {
  assert.ok(checkAnswer('q', 'He defined OT Intelligence.').includes('OT Intelligence'));
});

test('accuracy: never claims a shipped design system in code', () => {
  assert.ok(checkAnswer('q', 'He shipped a design system in code.').includes('design system in code'));
  assert.deepEqual(checkAnswer('q', 'He has experimented with a design system in code but has not shipped one.'), []);
});

test('flags invalid case markers', () => {
  assert.ok(checkAnswer('q', 'Done. [[case:nope]]').includes('bad case marker'));
});
