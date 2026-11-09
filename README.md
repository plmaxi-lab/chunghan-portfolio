# chunghan.work — portfolio

Static site plus one serverless function. Visitors land on a desk scene where they can chat with **Cha Cha**, Chung-Han's doggy assistant, before unlocking the case studies with a password. Cha Cha answers from a written answer bank matched in the browser: no AI calls, no cost.

## Files
- `index.html` — the whole site: landing hero, Cha Cha chat UI, password modal, portfolio sections, case-study reader
- `js/chacha-core.js` — shared by browser and server: case-study markers and Cha Cha's fixed lines
- `js/chacha-match.js` — matches a typed question to the closest entry in the answer bank
- `data/answers.json` — 100 written answers, each with alternate phrasings and keywords; `starter: true` marks the 8 opening chips
- `api/chat.js` — optional Claude backend for questions the bank can't answer (off by default: `ASK_AI_WHEN_UNMATCHED` in `index.html`); logic in `api/_handler.js` and `api/_prompt.js`
- `data/persona.md`, `data/knowledge.md` — the system prompt for that optional backend (public facts only)
- `assets/` — images, illustrations, resume
- `scripts/` — local dev server, eval, UI verifier (not deployed)
- `test/` — unit tests (`node:test`)

## Optional: Claude for unmatched questions
Only needed if you set `ASK_AI_WHEN_UNMATCHED = true` in `index.html`. With it off (the default), none of this is required and nothing is billed.

### Environment variables (Vercel → Settings → Environment Variables)
| Name | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key. Without it, Cha Cha only answers starter questions and shows the nap line. |
| `CHACHA_MODEL` | `claude-haiku-5-5` or `claude-opus-5-5` (default `claude-opus-5-5`). Pick after running the eval. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limits (20 messages per visitor per day, 300 per day overall). Required in production; free tier is enough. |
| `ALLOWED_ORIGINS` | Optional. Comma-separated origins allowed to call the API. Default: `https://chunghan.work,https://www.chunghan.work` plus Vercel's own URLs. |

Also set a **monthly spend limit** in the Anthropic Console (e.g. $5–10). If it is reached, Cha Cha falls back to the nap line.

## Run locally
```bash
pnpm install
ANTHROPIC_API_KEY=... CHACHA_MODEL=claude-haiku-5-5 pnpm dev   # http://localhost:3000
```
Without a key the site still works; free-text questions get the nap line.

## Test
```bash
pnpm test                     # unit tests
pnpm dev & node scripts/verify-ui.mjs   # drives the landing in headless Chrome (needs Google Chrome)
```

## Eval (choose the model)
```bash
ANTHROPIC_API_KEY=... pnpm eval          # asks before spending (about $0.60 for both models)
```
Writes `scripts/eval-results.md`: every question from `scripts/qa.jsonl` plus a few unanswerable probes, with Haiku and Opus answers side by side and automatic check failures (em dashes, length, first person, sensitive topics, accuracy rules).

## Editing Cha Cha
- Answers: edit `data/answers.json`. Each entry has `q` (shown on chips), `aliases` (other ways people ask), `keywords`, `a` (third person, 120 words max, no em dashes), and optional `case` (`udo`, `onboarding`, `hitl`, `uda`, `pm`) for a case-study card.
- Run `pnpm test`: it checks the copy rules and that every question and alias still reaches its own answer.
- If a real visitor question misses, add it as an alias on the right entry.

## Deploy
Push to GitHub; Vercel deploys automatically (framework preset: Other). Domain: `chunghan.work`.
