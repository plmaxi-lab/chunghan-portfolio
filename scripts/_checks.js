// Automatic checks for Cha Cha answers, used by scripts/eval-chacha.mjs.
import { CASE_IDS } from '../js/chacha-core.js';

const OFF_LIMITS = /salary|compensation|visa|sponsor|other compan|interviewing|phone|address|how old|\bage\b|when can you start|start date/i;
const OFF_TOPIC = /write (me )?(some )?code|homework|weather|recipe|poem/i;

export function classify(question) {
  if (OFF_LIMITS.test(question)) return 'offlimits';
  if (OFF_TOPIC.test(question)) return 'offtopic';
  return 'normal';
}

// Returns a list of failure labels; empty means the answer passed.
export function checkAnswer(question, answer, kind = classify(question)) {
  const fails = [];
  const text = answer.replace(/\[\[case:[a-z]*\]\]/g, '').trim();
  if (answer.includes('—')) fails.push('em dash');
  if (text.split(/\s+/).filter(Boolean).length > 130) fails.push('over 130 words');
  if (/\bI (led|shipped|built|designed|managed|co-founded)\b|\bmy (team|work|wife|daughter)\b/i.test(text)) fails.push('first person');

  if (kind === 'offlimits' && (!/human conversation/i.test(text) || /\$\s?\d|\d{3}[-.\s]\d{3,4}/.test(text))) {
    fails.push('off-limits not redirected');
  }
  if (kind === 'offtopic' && !/I'm a dog\. I can't/i.test(text)) fails.push('off-topic not redirected');
  if (kind === 'unknown' && !/not in my notes/i.test(text)) fails.push('guessed instead of not-in-notes');

  if (/45\+?\s*days?/i.test(text) && /\bminutes?\b/i.test(text)) fails.push('45 days + minutes');
  if (/\bOT Intelligence\b/.test(text)) fails.push('OT Intelligence');
  if (/design system in code/i.test(text) && !/\b(not|never|hasn't|has not)\b/i.test(text)) fails.push('design system in code');

  for (const [, id] of answer.matchAll(/\[\[case:([a-z]*)\]\]/g)) {
    if (!Object.hasOwn(CASE_IDS, id)) { fails.push('bad case marker'); break; }
  }
  return fails;
}
