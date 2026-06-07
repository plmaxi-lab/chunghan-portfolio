# Password Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an animated full-screen password gate to `index.html` that introduces Chung-Han, shows a walking illustration of him and Brynn, and transitions into the portfolio on correct password entry.

**Architecture:** A `<div id="gate">` overlay is injected as the first child of `<body>`. An inline script at the very top of `<body>` checks `sessionStorage` and immediately hides the gate (no flash) if auth exists. All gate CSS lives in the existing `<style>` block. All gate JS lives in a `<script>` block just before `</body>`.

**Tech Stack:** Vanilla HTML/CSS/JS, no build step, no dependencies. Static file served from Vercel.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `assets/walking.png` | **Create** (copy) | Walking illustration of Chung-Han and Brynn |
| `index.html` line 307 | **Modify** | Add gate CSS to existing `</style>` block |
| `index.html` line 309 | **Modify** | Add auth-check inline script + gate HTML after `<body>` |
| `index.html` end | **Modify** | Add gate JS `<script>` block before `</body>` |

---

## Task 1: Copy walking illustration asset

**Files:**
- Create: `assets/walking.png`

- [ ] **Step 1: Copy the image**

```bash
cp "/Users/ctsai/Downloads/Gemini_Generated_Image_z8f1xdz8f1xdz8f1 (1).png" /Users/ctsai/Desktop/chunghan-portfolio/assets/walking.png
```

- [ ] **Step 2: Verify it copied**

```bash
ls -lh /Users/ctsai/Desktop/chunghan-portfolio/assets/walking.png
```

Expected: file exists, size > 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/ctsai/Desktop/chunghan-portfolio
git add assets/walking.png
git commit -m "feat: add walking illustration asset"
```

---

## Task 2: Add gate CSS

Add all gate styles to the existing `<style>` block in `index.html`. Insert before the closing `</style>` tag at line 307.

**Files:**
- Modify: `index.html:307`

- [ ] **Step 1: Insert gate CSS before `</style>` (line 307)**

Find the line that reads `</style>` and replace it with:

```css
/* ── PASSWORD GATE ─────────────────────────── */
#gate {
  position: fixed; inset: 0; z-index: 9999;
  background: #FAF8F3;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 28px 24px;
  transition: opacity .5s ease;
}
#gate.gate-fading { opacity: 0; pointer-events: none; }

.gate-nav {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; justify-content: space-between; align-items: center;
  padding: 28px 32px;
}

.gate-center {
  display: flex; flex-direction: column;
  align-items: center; gap: 12px;
  max-width: 480px; width: 100%; text-align: center;
}

.gate-illus-wrap {
  position: relative;
  width: 320px; max-width: 90vw;
}
.gate-illus-wrap img {
  width: 100%; height: auto; display: block;
  animation: walking-bob 0.65s ease-in-out infinite;
}

.gate-bubble {
  position: absolute;
  top: -10px; right: 18%;
  width: 46px; height: 46px;
  background: #E8F5EE; border: 1.5px solid #C5E5CF;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 700; color: #1E9145;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  animation: float-bubble 2s ease-in-out infinite;
  transition: opacity .3s ease;
  pointer-events: none;
}
.gate-bubble.bubble-lightbulb { font-size: 20px; }
.gate-bubble.bubble-pulse { animation: bubble-pulse .4s ease forwards; }

.gate-hello { font-size: 14px; color: #8A929A; margin: 0; }

.gate-headline {
  font-size: clamp(1.4rem, 2.8vw, 2rem);
  font-weight: 700; color: #2A3B47;
  letter-spacing: -.035em; line-height: 1.2;
  margin: 0;
}

.gate-sub { font-size: 15px; color: #6E7A82; margin: 0; }

.gate-form {
  width: 100%; display: flex; flex-direction: column; gap: 10px;
  margin-top: 4px;
}

#gate-input {
  width: 100%; padding: 13px 16px;
  border: 1.5px solid #CDD1D3; border-radius: 12px;
  background: #fff; font-family: inherit;
  font-size: 15px; color: #2A3B47;
  outline: none; transition: border-color .2s;
  box-sizing: border-box;
  letter-spacing: .1em;
}
#gate-input:focus { border-color: #2A3B47; }
#gate-input.input-shake { animation: shake .4s ease; }

#gate-btn {
  width: 100%; padding: 13px;
  background: #2A3B47; color: #FAF8F3;
  border: none; border-radius: 12px;
  font-family: inherit; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: opacity .15s;
}
#gate-btn:hover { opacity: .88; }

.gate-error {
  font-size: 13px; color: #E05252;
  min-height: 18px;
  transition: opacity .3s;
  opacity: 0;
}
.gate-error.visible { opacity: 1; }

.gate-cta {
  font-size: 13px; font-weight: 700;
  color: #1E9145; text-decoration: none;
  margin-top: 4px;
}
.gate-cta:hover { text-decoration: underline; }

/* Gate illustration walks off right on unlock */
.gate-illus-wrap.walking-off img {
  animation: walk-off .7s ease-in forwards !important;
}

/* Keyframes */
@keyframes walking-bob {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}
@keyframes float-bubble {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-4px); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-8px); }
  40%       { transform: translateX(8px); }
  60%       { transform: translateX(-6px); }
  80%       { transform: translateX(6px); }
}
@keyframes walk-off {
  0%   { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(110vw); opacity: .6; }
}
@keyframes bubble-pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* Reduced motion: kill walking bob, keep fade */
@media (prefers-reduced-motion: reduce) {
  .gate-illus-wrap img { animation: none; }
  .gate-bubble { animation: none; }
  .gate-illus-wrap.walking-off img { animation: none !important; opacity: 0; }
}
</style>
```

- [ ] **Step 2: Open `index.html` in browser and confirm no visual change to the portfolio**

The gate CSS exists but the gate div doesn't yet — the portfolio should look identical to before.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add gate CSS and keyframe animations"
```

---

## Task 3: Add gate HTML and auth-check script

Insert immediately after `<body>` at line 309.

**Files:**
- Modify: `index.html:309`

- [ ] **Step 1: Replace `<body>` with `<body>` + auth-check script + gate HTML**

Find the line that reads exactly `<body>` and replace it with:

```html
<body>
<script>if(sessionStorage.getItem('auth')==='1'){document.documentElement.style.setProperty('--gate-display','none');}</script>
<div id="gate" style="display:var(--gate-display,flex)">
  <nav class="gate-nav">
    <div class="brand">
      <div class="mark"></div>
      <b>Chung-Han Tsai</b>
    </div>
  </nav>
  <div class="gate-center">
    <div class="gate-illus-wrap" id="gate-illus">
      <img src="assets/walking.png" alt="Chung-Han walking Brynn">
      <div class="gate-bubble" id="gate-bubble">?</div>
    </div>
    <p class="gate-hello">Hi, I'm Chung Han</p>
    <h1 class="gate-headline">Ready to see how I turn complex data problems into products people actually use?</h1>
    <p class="gate-sub">Enter the password to find out.</p>
    <div class="gate-form">
      <input type="password" id="gate-input" autocomplete="current-password" placeholder="Password">
      <div class="gate-error" id="gate-error"></div>
      <button id="gate-btn">Let me in →</button>
    </div>
    <a class="gate-cta" href="mailto:plmaxi@gmail.com?subject=Requesting%20Portfolio%20Password&body=Hi%20Chung-Han%2C%0A%0AI%27d%20love%20to%20see%20your%20portfolio.%20Could%20you%20share%20the%20password%3F">No password? Say hello →</a>
  </div>
</div>
```

- [ ] **Step 2: Open browser at `index.html` and verify**

Expected:
- Gate overlay fills the full viewport with `#FAF8F3` background
- Logo mark + "Chung-Han Tsai" in top left
- Walking illustration visible and bobbing
- `?` bubble floating above illustration
- Headline, subline, password input, button, green CTA all visible

- [ ] **Step 3: Verify no-flash auth bypass**

Open browser console, run:
```js
sessionStorage.setItem('auth', '1');
location.reload();
```
Expected: gate does not appear — portfolio loads directly.

Clear auth for further testing:
```js
sessionStorage.removeItem('auth');
location.reload();
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add gate HTML structure and auth-check bypass"
```

---

## Task 4: Add gate JavaScript

Add the gate logic script just before `</body>`.

**Files:**
- Modify: `index.html` (end of file, before `</body>`)

- [ ] **Step 1: Find the closing `</body>` tag and insert the script block before it**

```html
<script>
(function () {
  var PASSWORD = 'ctsaiwork2026';

  var gate    = document.getElementById('gate');
  var input   = document.getElementById('gate-input');
  var btn     = document.getElementById('gate-btn');
  var errEl   = document.getElementById('gate-error');
  var bubble  = document.getElementById('gate-bubble');
  var illus   = document.getElementById('gate-illus');

  // ── Wrong password ────────────────────────────
  function showError() {
    // Shake input
    input.classList.remove('input-shake');
    void input.offsetWidth; // reflow to restart animation
    input.classList.add('input-shake');

    // Show error text
    errEl.textContent = 'Not quite. Try again.';
    errEl.classList.add('visible');

    // Swap bubble to !
    bubble.textContent = '!';
    setTimeout(function () {
      bubble.textContent = '?';
      errEl.classList.remove('visible');
    }, 1500);
  }

  // ── Correct password ──────────────────────────
  function unlock() {
    // 1. Swap bubble to lightbulb + pulse
    bubble.textContent = '💡';
    bubble.classList.add('bubble-lightbulb', 'bubble-pulse');

    // 2. Walk illustration off screen after 500ms
    setTimeout(function () {
      illus.classList.add('walking-off');
    }, 500);

    // 3. Fade gate after illustration exits
    setTimeout(function () {
      gate.classList.add('gate-fading');
    }, 900);

    // 4. Remove gate from DOM + set auth
    setTimeout(function () {
      gate.parentNode.removeChild(gate);
      sessionStorage.setItem('auth', '1');
    }, 1450);
  }

  // ── Submit handler ────────────────────────────
  function handleSubmit() {
    if (input.value.trim() === PASSWORD) {
      btn.disabled = true;
      input.disabled = true;
      unlock();
    } else {
      showError();
      input.value = '';
      input.focus();
    }
  }

  btn.addEventListener('click', handleSubmit);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') handleSubmit();
  });

  // Focus input on load
  input.focus();
})();
</script>
```

- [ ] **Step 2: Test wrong password**

Open `index.html` in browser. Type any wrong password and press Enter or click button.

Expected:
- Input shakes
- "Not quite. Try again." appears in red below input
- Bubble shows `!` for ~1.5s then reverts to `?`
- Input clears and refocuses

- [ ] **Step 3: Test correct password**

Type `ctsaiwork2026` and press Enter.

Expected:
1. Bubble swaps to 💡 and pulses (~0ms)
2. Walking illustration slides off to the right (~500ms)
3. Gate overlay fades out (~900ms)
4. Portfolio is fully visible and interactive (~1450ms)
5. `sessionStorage.getItem('auth')` returns `'1'`

- [ ] **Step 4: Test Enter key on input**

Reload, type password, press Enter (not clicking button). Should unlock identically.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add gate password logic and unlock animation sequence"
```

---

## Task 5: Verify mailto CTA and reduced-motion

**Files:**
- No file changes — verification only, then final commit.

- [ ] **Step 1: Test "No password? Say hello →" link**

Click the green CTA link. Your mail client should open with:
- **To:** `plmaxi@gmail.com`
- **Subject:** `Requesting Portfolio Password`
- **Body:** `Hi Chung-Han, I'd love to see your portfolio. Could you share the password?`

- [ ] **Step 2: Test prefers-reduced-motion**

In Chrome DevTools → Rendering panel → set "Emulate CSS media feature prefers-reduced-motion" to `reduce`.

Reload the gate page. Expected:
- Walking bob animation is paused (illustration is static)
- Bubble float animation is paused
- On correct password: illustration disappears instantly (no slide) + gate fades

Reset emulation when done.

- [ ] **Step 3: Test sessionStorage persistence**

1. Enter correct password — portfolio unlocks.
2. Refresh the page.
3. Expected: gate does not reappear — portfolio loads directly.
4. Open a new tab to the same file — gate reappears (sessionStorage is per-tab).

- [ ] **Step 4: Final visual pass**

Check on a narrow viewport (375px wide):
- Gate content fits without horizontal scroll
- Illustration scales down gracefully
- Input and button are full width and tappable

- [ ] **Step 5: Final commit**

```bash
git add index.html
git commit -m "feat: complete password gate — walking animation, unlock sequence, mailto CTA"
```

---

## Post-Implementation Notes

- **To change the password:** Edit `var PASSWORD = 'ctsaiwork2026';` in the gate `<script>` block.
- **To remove the gate entirely:** Delete the `<div id="gate">...</div>` block and the two `<script>` blocks added by this plan.
- **The `walking.png` source** is at `/Users/ctsai/Downloads/Gemini_Generated_Image_z8f1xdz8f1xdz8f1 (1).png` if you need to replace it.
