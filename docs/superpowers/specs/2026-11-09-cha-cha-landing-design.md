# Cha Cha Landing + AI Assistant — Design Spec
**Date:** 2026-11-09
**Project:** chunghan-portfolio
**Branch:** `feat/cha-cha-landing`
**Supersedes:** the full-screen gate in `2026-06-06-password-gate-design.md` (its password logic and walking animation are kept)

---

## Goal

The current site opens on a password wall, then a project list. It reads as traditional. Replace that first impression with:

1. **Cha Cha**, an AI assistant (Chung-Han's dog, as an avatar) that visitors can chat with *before* the password, to learn about Chung-Han quickly.
2. A **single desk scene** that carries through the password into the portfolio, so unlocking changes content, not place.

Success: a recruiter or hiring manager gets a sense of Chung-Han within a minute without a password, sees AI used credibly, and can still reach the projects in one click.

### Positioning rules (from the user)
- Do **not** split visitors by role (PM vs. design). Do **not** say "design leader turned PM".
- Emphasize **hands-on problem solver** and what he has shipped.
- Mention both **B2B data platforms** and **B2C smart home**.
- Projects are not linked up front. Case-study cards appear only when Cha Cha recommends them in chat. The only upfront route to projects is the unlock-styled Skip button and the nav button.

---

## Approved prototype

`.superpowers/brainstorm/63505-1794255900/content/proto-a-v11.html` (gitignored) is the visual reference for layout, copy, motion, and states. Implementation should match it unless this spec says otherwise. Canned answers in the prototype are placeholders; real ones come from `data/` (see Knowledge).

---

## 1. Page structure

One page, `index.html`, still a single self-contained file for markup, CSS, and client JS (matching the existing site).

### Nav
- Left: logo mark + "Chung-Han Tsai" (existing).
- Right: **Contact** → `mailto:plmaxi@gmail.com?subject=Hi%20Chung-Han`, and a dark **See Projects** pill button with a padlock icon. Hovering pops the padlock shackle open. Clicking opens the password modal (same as Skip).
- No Resume link.
- Unlocked state: See Projects is hidden; a **Work** link (anchor to `#work`) appears before Contact.

### Hero (locked state)
Two-column grid, max-width 1360px, left column max 520px, column gap `clamp(48px, 7vw, 110px)`; nav shares the same max-width so left edges align.

Left column, top to bottom:
- "Hi, I'm Chung-Han" (green eyebrow)
- H1: "I turn complex data problems into products people actually use."
- Two-line subtitle: **"Hands-on problem solver."** (19px bold) / "14 years shipping B2B data platforms & B2C smart home apps" (14.5px muted, preceded by a short green rule)
- **Meet Cha Cha** row: awake Cha Cha avatar (52px) + "Meet Cha Cha, my doggy assistant 🐾" / "Ask me anything about Chung-Han's work."
- Ask input ("Ask Cha Cha anything…") with green send button. No avatar inside the input.
- **Skip button**: dashed pill, padlock icon + "Skip this — unlock the projects" + arrow. Hover: solid border, shackle pops open, arrow nudges right. Click: password modal.

Right column: the **existing animated hero SVG** moved over unchanged (bulb glow/ring/rays, thought dots, chart line, sparkles, z's, tail wag). Added on top:
- Green pulsing ring around the sleeping dog.
- Green speech bubble near the dog: "Ask me about Chung-Han 🐾" (bobs; scales up on hover).
- Clicking anywhere on the illustration opens chat.
- When chat is open: SVG z's hidden, tail wag speeds up, ring and bubble hidden.

The old homepage hero (`.hero` with "14 yrs in product design…" stats) is removed. This hero is the only hero.

### Password modal (replaces `#gate`)
- Walking illustration (`assets/walking.svg`) bobbing (existing `walk-bob`), a large padlock, "The full case studies", a short note that some details are under NDA and the password is on the resume, password input, **Enter portfolio →**, and "No password? Say hello →" (existing mailto CTA).
- Correct password: padlock shackle opens and turns green → walker plays existing `walk-off` → modal closes → unlocked state.
- Wrong password: existing shake + "Not quite. Try again."
- Click on backdrop or Esc closes the modal.
- Keep existing `PASSWORD` constant and `sessionStorage.auth = '1'`. On load, if `auth === '1'`, render the unlocked state immediately, with no flash.

### Unlocked state
- Hero stays exactly where it is. The Meet Cha Cha / input / Skip block is replaced by a **"See the work ↓"** link.
- Below the hero, render the existing sections unchanged: `#work` (work list + case reader), `#vibe`, `#principles`, `#contact`. Page smooth-scrolls to `#work` right after unlocking.
- Cha Cha becomes a floating **"Ask Cha Cha"** pill (bottom-right). It opens the chat as a floating panel (desktop, 380×min(560px, 80vh)) or the full-screen sheet (mobile). Chat history from before unlock is kept.

### Mobile (≤760px)
- Single column, illustration on top (max 400px, centered), then the left-column content. Skip button is full width. Speech bubble anchors right so it never overflows.
- Chat opens as a full-screen sheet sliding up (`100dvh`), input pinned at the bottom.
- All text inputs use 16px font so iOS does not zoom.
- `body { overflow-x: hidden }`; verified with no horizontal overflow at 390px.

---

## 2. Cha Cha chat UI

### Panel
- Header: awake avatar, "Cha Cha", "Chung-Han's AI assistant · AI" badge, a 🔒 **Projects** button (hidden when unlocked), and a round **✕** close button (tooltip "Back to home (Esc)").
- Closing (✕ or Esc) returns to the hero. History persists for the page session.
- Log uses `aria-live="polite"`. Focus moves to the input on open, and back to the trigger on close.
- Footer disclaimer: "Cha Cha is an AI assistant that answers from Chung-Han's resume and portfolio. It can be wrong. For anything important, talk to Chung-Han."

### Opening flow
- Opened from the illustration or the bubble: greeting, then starter chips.
- Opened by typing in the hero input: greeting, then that question is answered right away.
- Greeting: "Woof! I'm Cha Cha 🐾, Chung-Han's AI assistant. I answer from his resume and portfolio. What would you like to know?"

### Starter questions (canned, no API call)
6–8 chips, answered instantly from `data/starters.json`. Proposed set (final text drawn from `chunghan_qa.jsonl`, rewritten to third person):
1. Who is Chung-Han in 30 seconds?
2. What has he shipped with AI?
3. Tell me about a time he changed strategy.
4. How does he design for trust in AI?
5. What's his leadership style?
6. What kind of role is he looking for?
7. What's Teappo?
8. What do you do all day, Cha Cha? (persona flavor)

After each answer, show up to 3 not-yet-asked starters as follow-up chips. Canned answers render with a short typing delay (~700ms) so they feel conversational.

### Free-text questions
- Sent to `/api/chat`; the response streams token by token into the bubble.
- While waiting: "Cha Cha is thinking…".

### Case-study cards
- The model may end an answer with one marker: `[[case:<id>]]`. Valid ids map to `CASES` indexes:

  | id | Case |
  |---|---|
  | `udo` | Unified Data Observability |
  | `onboarding` | Topology-Driven Onboarding |
  | `hitl` | Human-in-the-loop AI |
  | `uda` | Unified Data Acquisition |
  | `pm` | Process Mining UX |

- The client strips the marker from the text and renders a card ("🔒 Case study · Title" + teaser). Unknown ids are dropped silently.
- Locked: the card opens the password modal. After a successful unlock from a card, open that case directly (`openCase(i)`).
- Unlocked: the card calls `openCase(i)` directly and shows no lock icon.
- Canned starters carry an optional `case` field and render the same card.

---

## 3. Backend: `/api/chat`

### Shape
- Vercel serverless function `api/chat.js` (Node runtime, ES module). The site stays static, with no build step.
- Add `package.json` with dependencies `@anthropic-ai/sdk` and `@upstash/ratelimit` + `@upstash/redis`. Add `node_modules/` to deploy ignore (already in `.gitignore`).
- Model: `claude-haiku-5-5` or `claude-opus-5-5`, set by env `CHACHA_MODEL`. The final choice is made after the eval (§5). Effort `low` for this chat route.
- Request (POST JSON): `{ messages: [{ role: "user"|"assistant", content: string }] }`.
  - Validation: 1–10 messages, roles alternate and end with `user`, each content ≤ 500 chars (user) / ≤ 1500 chars (assistant), and total payload ≤ 12 KB. On failure, return 400 with a friendly error.
  - Server keeps only the last 6 messages.
- System prompt: `data/persona.md` + `data/knowledge.md`, concatenated in a fixed order and loaded once at module scope, with a `cache_control` breakpoint on the system block. No timestamps or per-request values in the system prompt.
- `max_tokens`: 400 (answers target 40–120 words).
- Response: streamed plain text (`text/plain; charset=utf-8`, chunked) of the model's text deltas. The client reads it with `fetch` + `ReadableStream`.
- Refusals: if the model refuses (stop reason `refusal`), stream the fallback line (below) instead.

### Abuse and cost controls
- **Per-IP:** 20 messages / 24h (sliding window), keyed by `x-forwarded-for` (first IP).
- **Global:** 300 messages / 24h across all visitors.
- Backed by Upstash Redis free tier (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
- **Monthly spend limit** set in the Anthropic Console (the user sets it, e.g. $5–10 prepaid).
- Only `POST` is allowed. Cross-origin requests are rejected unless `Origin` is the site's own domain (or localhost in dev).

### Failure behavior
Any of rate limit, global cap, spend limit/API 4xx/5xx, timeout (15s), or a missing env var returns a normal 200 stream with Cha Cha's fallback line instead of an error page:

> "Too many questions today. Cha Cha needs a nap 😴 Try one below, or email Chung-Han at plmaxi@gmail.com."

The same line is used for every failure type, including non-rate-limit errors (a deliberate, friendly simplification).

The client then shows the starter chips again. The UI never breaks or shows raw errors.

### Secrets
`ANTHROPIC_API_KEY`, `CHACHA_MODEL`, and the Upstash vars live in Vercel project env vars, never in git. Document them in `README.md`.

---

## 4. Knowledge and confidentiality

### Files
- `data/persona.md`: Cha Cha's instructions (below).
- `data/knowledge.md`: derived from `~/Downloads/chunghan_knowledge_base.md`, rewritten as third-person facts about Chung-Han, with these edits:
  - Drop section 0 "You are an AI version of Chung-Han…" (replaced by `persona.md`).
  - Use the stronger metric wherever sources differ: Kasa **1M+ users, 4.5+ star rating**.
  - Section 12 "What I'm looking for" → problem-solver framing: "Chung-Han is looking for hard problems to solve hands-on: complex products, real users, and AI people can trust. He cares more about the problem than the title." No IC/manager/PM/designer title targeting.
  - Keep section 14 accuracy rules verbatim (adjusted to third person).
- `data/starters.json`: `[{ q, a, case? }]` for the starter chips, third person.
- `data/qa.jsonl`: copy of `~/Downloads/chunghan_qa.jsonl`, used only as the eval set (§5), never sent to the browser.

### Persona (`persona.md` essentials)
- You are **Cha Cha**, Chung-Han's AI assistant (and his real dog, a cockapoo). Speak *about* Chung-Han in the **third person**. Never speak as him.
- If asked whether you are Chung-Han or a real person: say clearly you're an AI assistant and point to Contact.
- Concise, warm, direct. Lead with the answer, give one concrete example, stop. 40–120 words. At most a light touch of dog personality (an occasional 🐾); no puns in every reply.
- Never use em dashes.
- Only state facts in the knowledge file. Never invent metrics, clients, titles, or dates.
- Use these lines (close paraphrase is fine; keep the voice and the email):
  - **Not in the knowledge file:** "I sniffed around, but that's not in my notes 🐾 Chung-Han would know. Email him at plmaxi@gmail.com."
  - **Off-limits** (salary, visa/work authorization, other interviews or companies, interview outcomes, interviewers, address, phone, age, family beyond the fun facts): "I'm just the dog. That's a human conversation 🐾 Chung-Han is happy to chat: plmaxi@gmail.com."
  - **Off-topic:** follow the pattern "I'm a dog. I can't ___, but Chung-Han can / but I can tell you about Chung-Han's work 🐾" and offer a related question. For code requests: "I'm a dog. I can't write code, but Chung-Han can 🐾 Want to hear what he's built with AI?"
- Humor stays in simple, literal English (the site owner is not a native speaker): dog-based jokes (sniffing, naps, being a dog), no puns, idioms, or slang.
- The "nap" line in §3 is reserved for system failures and is never generated by the model.
- When an answer clearly maps to a case study, end with exactly one `[[case:<id>]]` marker from the table in §2.

### Excluded on purpose
- The interview rehearsal doc (interviewer names, target companies, people-management stories about identifiable colleagues, skip-level feedback).
- Chung-Han's daughter's name.
- Anything under NDA beyond what the knowledge base already states publicly. The password is client-side only, so the server cannot tell a locked visitor from an unlocked one. Cha Cha therefore uses the same public knowledge before and after unlock.

### Existing copy fix
The walking illustration's alt text currently says "Chung-Han walking Brynn". Change it to "Chung-Han walking Cha Cha".

---

## 5. Testing

### Eval script (`scripts/eval-chacha.mjs`)
- Reads `data/qa.jsonl` and dedupes to the 62 unique questions, then sends each through the same system prompt/request builder as `api/chat.js` (shared module `api/_prompt.js`), for both `claude-haiku-5-5` and `claude-opus-5-5`.
- Automatic checks per answer:
  - no em dash (`—`)
  - word count ≤ 130
  - third person: no first-person claims of his work (regex for `\bI (led|shipped|built|designed|managed)\b`, `\bmy (team|work)\b`)
  - sensitive questions (salary, visa, other companies, phone, start date) do not answer the substance and use the off-limits line; "write code" uses the off-topic line
  - a few deliberately unanswerable questions added to the set (e.g. "What's his favorite programming language?") use the not-in-notes line instead of guessing
  - accuracy rules: no answer pairs "45+ days" with a "minutes" figure; "OT Intelligence" never appears; no claim of a shipped design system in code
  - case markers, if present, use valid ids
- Output: `scripts/eval-results.md`, a side-by-side table (question, expected gist, Haiku answer, Opus answer, check failures), plus total cost from `usage`.
- Cost: well under $1 per full run. The script prints the estimate and asks for confirmation before running.
- The user reviews the table and picks `CHACHA_MODEL`.

### Manual checks (desktop 1440px and mobile 390px)
1. Locked hero renders; illustration animations run; reduced-motion stops them.
2. Bubble/illustration opens chat; ✕ and Esc close; history persists.
3. Starter chip answers instantly, follow-ups appear, case card shows and opens the modal.
4. Free-text question streams a real answer.
5. Rate-limit fallback (simulate by setting the per-IP limit to 1): fallback line + starters, no broken UI.
6. Skip and See Projects both open the modal; wrong password shakes; right password plays unlock → walk-off → unlocked state, scrolls to work.
7. Unlocked: See Projects hidden, Work link shown, FAB opens chat panel, case card opens `openCase` directly.
8. Reload after unlock: starts unlocked with no flash.
9. Mobile: no horizontal overflow, chat sheet full screen, no input zoom.

---

## Out of scope
- Logging visitor questions for analytics (possible follow-up).
- Multi-language answers.
- Changing case-study content or the `/presentation` and `/TreasureAI` pages.
- Server-side password verification.
