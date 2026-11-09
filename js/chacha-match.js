// Answers visitor questions from the written answer bank (data/answers.json) without calling an AI.
// Shared by the browser and tests. No dependencies.
import { NOT_IN_NOTES_LINE, OFF_LIMITS_LINE, OFF_TOPIC_CODE_LINE, OFF_TOPIC_LINE } from './chacha-core.js';

const OFF_LIMITS = /salary|compensation|pay range|how much (does|do|would) (he|you) (make|earn|want)|visa|sponsor|green card|work authori[sz]ation|other compan|interviewing (with|at|for)|other offers?|phone|cell number|home address|where does he live exactly|how old|\bhis age\b|\bage\b|start date|when can (he|you|chung-?han) start|married|religio|politic/i;
const OFF_TOPIC_CODE = /\b(write|give|generate|debug|fix)\b.*\bcode\b|\bcode for me\b/i;
const OFF_TOPIC = /\b(write|compose)\b.*\b(poem|essay|story|song|email)\b|\bhomework\b|\bweather\b|\brecipe\b|\btranslate\b|\bstock price\b/i;

const PHRASES = [
  [/machine learning|artificial intelligence|\bllms?\b|\bgen ?ai\b|generative ai/g, ' ai '],
  [/human[- ]in[- ]the[- ]loop/g, ' hitl '],
  [/0[- ]to[- ]1|zero[- ]to[- ]one|from scratch/g, ' zeroone '],
  [/time[- ]to[- ]value/g, ' ttv '],
  [/smart home/g, ' smarthome '],
  [/design system/g, ' designsystem '],
  [/root cause/g, ' rootcause '],
  [/jobs?[- ]to[- ]be[- ]done|\bjtbd\b/g, ' jtbd '],
  [/claude code/g, ' claudecode '],
];

const STOP = new Set(('a an the and or but of to in on at for with from by about as is are was were be been being do does did done ' +
  'has have had having he him his she her they them their you your yours i me my we our us it its this that these those ' +
  'what whats which who whom whose why how when where can could would should will shall may might must tell know ' +
  'chung han chunghan please any some more much many give show explain describe talk like get got make made ' +
  'really just also very so then there here thing things one ever s t re ve ll d m into than if not no yes ok okay hey hi').split(' '));

const SYN = {
  lead: 'lead', leads: 'lead', leading: 'lead', led: 'lead', leader: 'lead', leaders: 'lead', leadership: 'lead',
  manage: 'lead', manages: 'lead', managing: 'lead', managed: 'lead', manager: 'lead', managers: 'lead', management: 'lead',
  boss: 'lead', mentor: 'mentor', mentoring: 'mentor', mentorship: 'mentor', coach: 'mentor', coaching: 'mentor',
  trustworthy: 'trust', trusted: 'trust', trusting: 'trust',
  introduce: 'intro', introduction: 'intro', summary: 'intro', overview: 'intro', bio: 'intro',
  cha: 'chacha', chacha: 'chacha',
  job: 'role', jobs: 'role', position: 'role', positions: 'role', opportunity: 'role', opportunities: 'role', looking: 'role', seeking: 'role',
  hire: 'hire', hiring: 'hire', recruit: 'hire', recruiting: 'hire', interns: 'hire', intern: 'hire',
  company: 'company', companies: 'company', employer: 'company',
  fail: 'failure', failed: 'failure', failures: 'failure', mistake: 'failure', mistakes: 'failure', wrong: 'failure',
  weakness: 'weakness', weaknesses: 'weakness', weak: 'weakness',
  strength: 'strength', strengths: 'strength', strong: 'strength',
  metric: 'metric', metrics: 'metric', measure: 'metric', measuring: 'metric', kpi: 'metric', kpis: 'metric', numbers: 'metric', impact: 'metric', results: 'metric', outcome: 'metric', outcomes: 'metric',
  tea: 'tea', teas: 'tea', teappo: 'teappo',
  dog: 'dog', puppy: 'dog', pet: 'dog',
  located: 'location', live: 'location', lives: 'location', based: 'location', city: 'location', where: 'location',
  email: 'contact', reach: 'contact', contact: 'contact',
  remote: 'location', relocate: 'location', relocation: 'location',
  conflict: 'conflict', disagree: 'conflict', disagreement: 'conflict', pushback: 'conflict', disagreed: 'conflict',
  pivot: 'pivot', pivoted: 'pivot', reframe: 'pivot', reframed: 'pivot', changed: 'pivot', change: 'pivot',
  quit: 'leave', left: 'leave', leaving: 'leave', layoff: 'leave', laid: 'leave', reorg: 'leave',
  chatbot: 'chatbot', chat: 'chatbot', conversational: 'chatbot', bot: 'chatbot',
};

function stem(w) {
  if (w.length > 5 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

export function tokens(text) {
  let t = ` ${String(text).toLowerCase().replace(/[’']/g, "'")} `;
  for (const [re, rep] of PHRASES) t = t.replace(re, rep);
  const out = [];
  for (const raw of t.split(/[^a-z0-9+]+/)) {
    if (raw.length < 2 || STOP.has(raw)) continue;
    const w = SYN[raw] || SYN[stem(raw)] || stem(raw);
    if (!STOP.has(w) && !out.includes(w)) out.push(w);
  }
  return out;
}

// Each entry: { id, q, aliases: string[], keywords: string[], a, case?, starter? }
// Lowercased words only, for exact matches on short questions made of common words ("who are you?").
const plain = (text) => String(text).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function prepare(entries) {
  return entries.map((e) => ({
    entry: e,
    raw: new Set([e.q, ...(e.aliases || [])].map(plain)),
    phrases: [e.q, ...(e.aliases || [])].map(tokens).filter((p) => p.length),
    keys: new Set((e.keywords || []).flatMap(tokens)),
  }));
}

const cache = new WeakMap();
function score(query, p) {
  let best = 0;
  for (const phrase of p.phrases) {
    const overlap = phrase.filter((w) => query.includes(w)).length;
    if (!overlap) continue;
    const exact = overlap === phrase.length && overlap === query.length ? 0.5 : 0;
    best = Math.max(best, 0.6 * (overlap / phrase.length) + 0.4 * (overlap / query.length) + exact);
  }
  const keyHits = query.filter((w) => p.keys.has(w)).length;
  return best + Math.min(keyHits, 2) * 0.15;
}

export const MATCH_THRESHOLD = 0.55;

export function answerQuestion(text, entries) {
  const raw = String(text || '');
  if (OFF_LIMITS.test(raw)) return { type: 'offlimits', text: OFF_LIMITS_LINE };
  if (OFF_TOPIC_CODE.test(raw)) return { type: 'offtopic', text: OFF_TOPIC_CODE_LINE };
  if (OFF_TOPIC.test(raw)) return { type: 'offtopic', text: OFF_TOPIC_LINE };

  if (!cache.has(entries)) cache.set(entries, prepare(entries));
  const prepared = cache.get(entries);
  const exact = prepared.find((p) => p.raw.has(plain(raw)));
  if (exact) return { type: 'answer', entry: exact.entry, score: 2 };
  const query = tokens(raw);
  const ranked = query.length
    ? prepared.map((p) => ({ p, s: score(query, p) })).sort((x, y) => y.s - x.s)
    : [];
  if (ranked.length && ranked[0].s >= MATCH_THRESHOLD) return { type: 'answer', entry: ranked[0].p.entry, score: ranked[0].s };

  const related = ranked.filter((r) => r.s > 0).slice(0, 3).map((r) => r.p.entry);
  const fill = entries.filter((e) => e.starter && !related.includes(e));
  const suggestions = [...related, ...fill].slice(0, 3);
  return { type: 'none', text: NOT_IN_NOTES_LINE, suggestions: suggestions.length ? suggestions : entries.slice(0, 3) };
}
