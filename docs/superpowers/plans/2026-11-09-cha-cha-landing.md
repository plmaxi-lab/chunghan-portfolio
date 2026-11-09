# Cha Cha Landing + AI Assistant Implementation Plan

> Executed natively in-session at the user's request ("可以直接執行嗎"), so this plan is a compact task list with interfaces rather than full step-by-step code. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the password wall with a desk-scene landing where visitors chat with Cha Cha (an AI assistant) before unlocking the projects.

**Architecture:** Static `index.html` (hero, modal, chat UI inline) plus one ES module shared by browser and Node (`js/chacha-core.js`). One Vercel function `api/chat.js` streams Claude answers. Logic lives in `api/_prompt.js` and `api/_handler.js` (underscore = not a route), with dependencies injected so `node:test` can test them without network.

**Tech Stack:** Vanilla HTML/CSS/JS, Node 24 ES modules, `@anthropic-ai/sdk`, `@upstash/ratelimit` + `@upstash/redis`, `node:test`, pnpm, Vercel.

**Spec:** `docs/superpowers/specs/2026-11-09-cha-cha-landing-design.md`

## Global Constraints
- Cha Cha speaks about Chung-Han in third person; never as him.
- No em dashes in any Cha Cha copy (canned or generated).
- Fallback (system failure) line, exact: "Too many questions today. Cha Cha needs a nap 😴 Try one below, or email Chung-Han at plmaxi@gmail.com."
- Contact email everywhere: plmaxi@gmail.com.
- Do not split visitors by role; no "design leader turned PM".
- Mobile breakpoint follows the existing site: 720px. Inputs 16px font on mobile.
- Password constant and `sessionStorage.auth === '1'` behavior unchanged.
- `CHACHA_MODEL` env selects the model; default `claude-opus-5-5` until the eval picks.
- pnpm only.

## Review Focus
1. Model emits a `[[case:...]]` marker split across stream chunks → the raw marker must never flash in the bubble (`stripPartialMarker`).
2. Visitor sends a message while a previous answer is still streaming → input disabled until done; no interleaved bubbles.
3. History contains a fallback turn → the failed user turn is dropped so roles still alternate and the next request validates.
4. Refusal or API error after some text has streamed → fallback is appended, not a broken bubble.
5. Visitor already unlocked (reload) → no flash of locked hero/modal; the case card opens `openCase` directly.

## Implementation decisions (beyond spec)
- `max_tokens` is 2000, not 400: current models think before answering and thinking counts toward `max_tokens`. Brevity comes from the persona prompt plus `effort: "low"`.
- `data/` files ship with the deployment (needed by the function via `vercel.json` `includeFiles`), so they are publicly fetchable. They contain only public-tier facts. The eval set lives in `scripts/` and is excluded via `.vercelignore`.
- Section width: nav and hero use a 1360px container; existing sections keep their 1060px reading width.
- Unlocked nav keeps the existing links (Work, Vibe Coding, Principles, Contact) and hamburger.
- Local dev uses `scripts/dev-server.mjs` (static files + `/api/chat`), so no Vercel CLI login is needed.

---

### Task 1: Scaffold
**Files:** create `package.json`, `vercel.json`, `.vercelignore`; modify `.gitignore`.
- [ ] `package.json`: `"type": "module"`, scripts `test` = `node --test test/`, `dev` = `node scripts/dev-server.mjs`, `eval` = `node scripts/eval-chacha.mjs`; deps via pnpm.
- [ ] `vercel.json`: `functions["api/chat.js"].includeFiles = "data/**"`, `maxDuration: 30`.
- [ ] `.vercelignore`: `docs/`, `scripts/`, `test/`, `.superpowers/`.
- [ ] Commit.

### Task 2: Shared core (`js/chacha-core.js`) + tests
**Produces:**
- `CASE_IDS: { udo:0, onboarding:1, hitl:2, uda:3, pm:4 }`
- `FALLBACK_LINE: string`
- `parseCaseMarker(text) -> { text: string, caseId: string|null }`: removes every `[[case:x]]`, returns the first valid id; unknown ids are dropped.
- `stripPartialMarker(text) -> string`: for display mid-stream; removes complete markers and a trailing unfinished `[` / `[[...` fragment.
- [ ] Tests first (`test/core.test.js`), then implement, then commit.

### Task 3: Knowledge data
**Files:** create `data/persona.md`, `data/knowledge.md`, `data/starters.json`, `scripts/qa.jsonl`.
- [ ] Persona from spec §4, including the three chosen lines and humor rule.
- [ ] Knowledge: third-person rewrite of `~/Downloads/chunghan_knowledge_base.md` with spec edits (Kasa 1M+ users / 4.5+ stars; problem-solver "looking for"; no first-person bot instructions; accuracy rules kept).
- [ ] Starters: 8 `{ q, a, case? }`, third person, no em dashes.
- [ ] Test: `test/data.test.js` asserts no em dash anywhere in persona/knowledge/starters, starters count 8, valid case ids.
- [ ] Commit.

### Task 4: Server
**Produces:**
- `api/_prompt.js`: `SYSTEM_PROMPT: string` (persona + knowledge), `validateMessages(messages) -> { ok: true, messages } | { ok: false, error }` (1–10 items, alternating, ends with user, user ≤ 500 chars, assistant ≤ 1500, returns last 6), `buildParams({ messages, model }) -> MessageCreateParams` (system block with `cache_control`, `max_tokens: 2000`, `output_config: { effort: "low" }`).
- `api/_handler.js`: `createChatHandler({ client, limiter, model, allowedOrigins }) -> (request: Request) => Promise<Response>`. `limiter(ip) -> Promise<boolean>`.
- `api/chat.js`: wires real Anthropic client + Upstash limiter (20/IP/24h, 300 global/24h); exports `POST` and `GET` (405).
- `scripts/dev-server.mjs`: static server + routes POST `/api/chat` to the handler.
- [ ] Tests (`test/prompt.test.js`, `test/handler.test.js`) with a fake client: success streams text; limiter false → fallback; client throws → fallback; refusal → fallback appended; invalid body → 400; bad origin → 403; GET → 405.
- [ ] Implement, run tests, commit.

### Task 5: Frontend
**Files:** modify `index.html`.
- [ ] Remove `#gate` markup/CSS/script; add password modal (walking + padlock), reusing `PASSWORD`, shake, walk-off.
- [ ] Nav: locked = Contact + See Projects; unlocked = existing links.
- [ ] Hero: new left column (eyebrow, H1, two-line subtitle, Meet Cha Cha, input, Skip); existing SVG moved into right column with ring + bubble.
- [ ] Chat panel/sheet + FAB; starters from `data/starters.json`; free text via `/api/chat` streaming; case cards; ✕/Esc; `aria-live`; focus handling.
- [ ] Unlocked state class on `<html>` set before paint from sessionStorage; "See the work ↓"; scroll to `#work` on unlock; card after unlock opens `openCase`.
- [ ] Fix walking alt text to "Chung-Han walking Cha Cha"; add `assets/chacha-avatar.png`.
- [ ] Verify with headless screenshots (1440 and 390) and the dev server; commit.

### Task 6: Eval
**Files:** `scripts/_checks.js`, `scripts/eval-chacha.mjs`, `test/checks.test.js`.
- [ ] `checkAnswer(question, answer) -> string[]` failures (em dash, >130 words, first-person claims, sensitive/off-topic lines, accuracy rules, marker ids).
- [ ] Eval dedupes `scripts/qa.jsonl` + adds unanswerable probes, runs both models, writes `scripts/eval-results.md`, prints cost, asks before spending.
- [ ] Tests for `checkAnswer`, commit.

### Task 7: Docs + final verification
- [ ] README: env vars, local dev, eval, deploy.
- [ ] Run all tests, manual flow checklist from spec §5, whole-branch review.
