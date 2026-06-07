# Password Gate — Design Spec
**Date:** 2026-06-06
**Project:** chunghan-portfolio

---

## Overview

A full-screen password gate overlaid on the portfolio homepage. It introduces Chung-Han personally before the visitor even types anything, uses his walking illustration to create a playful animated "on the way to work" scene, and transitions into the portfolio hero on unlock. Visitors without a password can email to request one.

---

## Architecture

- **Implementation:** A single `<div id="gate">` overlay injected at the top of `index.html`, covering the full viewport. The portfolio HTML renders behind it but is hidden from interaction.
- **No separate page:** No redirect, no `gate.html`. One file, one load.
- **Auth persistence:** On correct password, `sessionStorage.setItem('auth', '1')` is set. On every page load, a script checks for this flag and removes the gate immediately (no flash) if it exists.
- **Password constant:** Defined as `const PASSWORD = "ctsaiwork2026"` near the top of the gate script — easy to change in one place.

---

## Layout

Background: `#FAF8F3`. Gate fills the full viewport and is centered vertically.

**Top-left corner (matching the site nav):**
- Logo mark (dark rounded square with curved cutout)
- "Chung-Han Tsai" in 17px bold `#2A3B47`

**Center column (max-width ~480px, centered):**
1. Walking illustration (`assets/walking.png`) — see Animation section
2. Small label: "Hi, I'm Chung Han" — 14px, `#8A929A`
3. Headline: **"Ready to see how I turn complex data problems into products people actually use?"** — large bold `#2A3B47`, `clamp(1.6rem, 3vw, 2.2rem)`, tight letter-spacing
4. Subline: "Enter the password to find out." — 15px, `#6E7A82`
5. Password input — full width, rounded, matching site card style
6. "Let me in →" button — `#2A3B47` background, `#FAF8F3` text, full width
7. "No password? Say hello →" — `#1E9145`, 13px bold, link

---

## Illustration & Animation

**Source file:** `/Users/ctsai/Downloads/Gemini_Generated_Image_z8f1xdz8f1xdz8f1 (1).png`
**Copied to:** `assets/walking.png`

The image shows Chung-Han walking Brynn (his dog) on a leash — casual, pre-work, personal.

### Idle walking animation
The illustration container gets a continuous `walking-bob` CSS keyframe:
```
0%, 100% { transform: translateY(0); }
50%       { transform: translateY(-5px); }
```
Duration: 0.65s, ease-in-out, infinite. Simulates mid-stride bounce.

### `?` bubble
A positioned HTML `<div>` overlaid above Chung-Han's head:
- Circle, `#E8F5EE` fill, `#C5E5CF` border, ~48px diameter
- Contains "?" in `#1E9145`, bold
- Has its own gentle float animation (±3px, 2s, infinite) offset from the bob

### Wrong password state
Triggered when submitted password doesn't match:
1. Input field gets `shake` CSS keyframe (horizontal jitter, 400ms)
2. Small error text "Not quite. Try again." appears below input in `#E05252`, fades out after 2s
3. The `?` bubble briefly swaps to `!` for 1.5s then reverts

### Correct password sequence
1. `?` bubble cross-fades to a lightbulb icon (SVG inline swap, ~300ms)
2. Lightbulb pulses once (scale 1→1.2→1)
3. After 500ms: illustration slides out to the right — `transform: translateX(110vw)`, 700ms, `ease-in`  
   *(narrative: he's arrived at the office and walked in)*
4. After 900ms: the gate overlay fades out — `opacity: 0`, 500ms
5. `sessionStorage.setItem('auth', '1')` written at step 3

---

## Contact CTA — "No password? Say hello →"

Clicking opens a pre-filled mailto:

```
mailto:plmaxi@gmail.com
  ?subject=Requesting%20Portfolio%20Password
  &body=Hi%20Chung-Han%2C%0A%0AI%27d%20love%20to%20see%20your%20portfolio.%20Could%20you%20share%20the%20password%3F
```

Pre-filled body: *"Hi Chung-Han, I'd love to see your portfolio. Could you share the password?"*

---

## Accessibility & UX Details

- Password input: `type="password"`, `autocomplete="current-password"`, `placeholder="Password"`
- Enter key submits (no mouse required)
- Gate is removed from DOM (not just hidden) after successful unlock so keyboard focus and screen readers see only the portfolio
- Walking bob animation respects `prefers-reduced-motion`: pauses when set

---

## Files Changed

| File | Change |
|---|---|
| `index.html` | Add `<div id="gate">` overlay + inline `<style>` + `<script>` for gate logic |
| `assets/walking.png` | Copy from Downloads |

No new files, no dependencies, no build step.

---

## Out of Scope

- Server-side auth (this is a static site — JS obfuscation is sufficient for a portfolio gate)
- Mobile-specific layout changes beyond responsive font sizing
- Dark mode
