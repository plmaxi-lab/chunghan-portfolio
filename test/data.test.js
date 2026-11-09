import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const persona = read('data/persona.md');
const knowledge = read('data/knowledge.md');

test('no em dashes in any Cha Cha copy', () => {
  for (const [name, text] of [['persona', persona], ['knowledge', knowledge]]) {
    assert.ok(!text.includes('—'), `${name} contains an em dash`);
  }
});

test('persona carries the three chosen lines and the case marker rule', () => {
  assert.match(persona, /I sniffed around, but that's not in my notes/);
  assert.match(persona, /I'm just the dog\. That's a human conversation/);
  assert.match(persona, /I'm a dog\. I can't write code, but Chung-Han can/);
  assert.match(persona, /\[\[case:<id>\]\]/);
});

test('knowledge uses the stronger Kasa metrics and the problem-solver framing', () => {
  assert.match(knowledge, /1M\+ users/);
  assert.match(knowledge, /4\.5\+ star/);
  assert.match(knowledge, /hard problems to solve hands-on/);
  assert.doesNotMatch(knowledge, /You are an AI version/);
});

test('knowledge is written in third person (no first-person claims of his work)', () => {
  assert.doesNotMatch(knowledge, /\bI (led|shipped|built|designed|managed|co-founded)\b/);
  assert.doesNotMatch(knowledge, /\bmy (team|wife|tea business|portfolio)\b/i);
});
