# chunghan.work — portfolio

Static site plus one serverless function. Visitors land on a desk scene where they can chat with **Cha Cha**, an AI assistant, before unlocking the case studies with a password.

## Files
- `index.html` — the whole site: landing hero, Cha Cha chat UI, password modal, portfolio sections, case-study reader
- `js/chacha-core.js` — shared by browser and server: case-study markers and the fallback line
- `api/chat.js` — Vercel function `POST /api/chat` (Claude, streaming, rate limits); logic in `api/_handler.js` and `api/_prompt.js`
- `data/persona.md`, `data/knowledge.md` — Cha Cha's system prompt (public facts only)
- `data/starters.json` — starter questions answered instantly in the browser, without calling the API
- `assets/` — images, illustrations, resume
- `scripts/` — local dev server, eval, UI verifier (not deployed)
- `test/` — unit tests (`node:test`)

## Environment variables (Vercel → Settings → Environment Variables)
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
- Facts: edit `data/knowledge.md` (third person, public facts only, no em dashes). `pnpm test` checks the basics.
- Voice and rules: `data/persona.md`.
- Starter questions: `data/starters.json` (`case` links a case-study card: `udo`, `onboarding`, `hitl`, `uda`, `pm`).

## Deploy
Push to GitHub; Vercel deploys automatically (framework preset: Other). Domain: `chunghan.work`.
