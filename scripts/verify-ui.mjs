// Usage: pnpm dev (in another shell), then node scripts/verify-ui.mjs. Needs Google Chrome.
// Drives the Cha Cha landing through the spec's manual checklist. Run with the dev server on :3000.
import { launch } from './_cdp.mjs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const OUT = mkdtempSync(join(tmpdir(), 'chacha-ui-')) + '/';
console.log('screenshots:', OUT);
const b = await launch();
const results = [];
const check = (name, ok, extra = '') => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' :: ' + extra : ''}`);
const has = (cls) => b.eval(`document.documentElement.classList.contains('${cls}')`);
const visible = (sel) => b.eval(`(()=>{const e=document.querySelector('${sel}');if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'})()`);
// Fake streaming API: chunks split a case marker across reads.
const FAKE = `window.__chunks=null;window.fetch=(orig=>async(u,o)=>{if(String(u).includes('/api/chat')){window.__lastBody=JSON.parse(o.body);const parts=window.__chunks||['Chung-Han reframed ','the problem. [[ca','se:udo]',']'];return new Response(new ReadableStream({async start(c){for(const p of parts){c.enqueue(new TextEncoder().encode(p));window.__seen=(window.__seen||[]).concat(document.querySelector('#chatLog .msg.bot:last-of-type')?.textContent||'');window.__busy=(window.__busy||[]).concat([...document.querySelectorAll('#chatLog .msg.bot')].pop()?.getAttribute('aria-busy'));await new Promise(r=>setTimeout(r,60))}c.close()}}),{status:200})}return orig(u,o)})(window.fetch);`;

for (const [w, h, mobile, tag] of [[1440, 900, false, 'desk'], [390, 844, true, 'mob']]) {
  await b.viewport(w, h, mobile);
  await b.goto('http://localhost:3000/');
  await b.eval('sessionStorage.clear()'); await b.goto('http://localhost:3000/');
  await b.eval(FAKE);
  await b.shot(`${OUT}${tag}-1-locked.png`);
  check(`${tag}: locked, skip visible`, await visible('.skip'));
  check(`${tag}: no horizontal overflow`, await b.eval('document.documentElement.scrollWidth<=innerWidth'), await b.eval('document.documentElement.scrollWidth+"/"+innerWidth'));
  check(`${tag}: locked hides work, vibe, principles, contact, footer`, await b.eval(`['work','vibe','principles','contact'].every(id=>getComputedStyle(document.getElementById(id)).display==='none') && getComputedStyle(document.querySelector('.foot')).display==='none'`));

  const artPos = () => b.eval(`(()=>{const r=document.getElementById('heroArt').getBoundingClientRect();return Math.round(r.top)+','+Math.round(r.left)})()`);
  const artBefore = await artPos();
  await b.eval(`document.getElementById('heroArt').click()`); await b.sleep(400);
  check(`${tag}: illustration does not move when chat opens`, (await artPos()) === artBefore);
  check(`${tag}: illustration opens chat`, await has('chat-open') && await visible('#chat'));
  await b.eval(`new Promise(r=>setTimeout(r,800))`);
  check(`${tag}: greeting + 6 starter chips`, await b.eval(`document.querySelectorAll('#chatLog .chip').length`) === 6);
  await b.eval(`document.querySelector('#chatLog .chip').click()`); await b.sleep(1000);
  check(`${tag}: starter answered`, (await b.eval(`[...document.querySelectorAll('#chatLog .msg.bot')].length`)) >= 2);
  check(`${tag}: 3 follow-up chips`, await b.eval(`document.querySelectorAll('#chatLog .chip').length`) === 3);

  const ask = async (q) => { await b.eval(`document.getElementById('chatQ').value=${JSON.stringify(q)};document.getElementById('chatForm').requestSubmit()`); await b.sleep(900); return b.eval(`[...document.querySelectorAll('#chatLog .msg.bot')].pop().textContent`); };
  const fetches = await b.eval('window.__lastBody===undefined');
  const pivot = await ask('How did he pivot?');
  check(`${tag}: typed question answered from the bank`, pivot.includes('topology map'), pivot.slice(0, 60));
  check(`${tag}: case card rendered`, await b.eval(`[...document.querySelectorAll('#chatLog .case-card')].some(c=>c.textContent.includes('Unified Data Observability'))`));
  const unknown = await ask('What is the capital of France?');
  check(`${tag}: unknown question gets not-in-notes line`, unknown.startsWith("I sniffed around, but that's not in my notes"));
  check(`${tag}: unknown question offers up to 3 suggestions`, await b.eval(`(()=>{const n=document.querySelectorAll('#chatLog .chips:last-of-type .chip').length;return n>0&&n<=3})()`));
  const salary = await ask('What are his salary expectations?');
  check(`${tag}: salary gets human-conversation line`, salary.startsWith("I'm just the dog. That's a human conversation"));
  check(`${tag}: no network call to /api/chat`, fetches && await b.eval('window.__lastBody===undefined'));
  await b.shot(`${OUT}${tag}-2-chat.png`);

  await b.key('Escape'); await b.sleep(300);
  check(`${tag}: Esc closes chat`, !(await has('chat-open')));
  check(`${tag}: intro back`, await visible('.entry'));

  // card while locked opens modal
  await b.eval(`document.getElementById('heroArt').click()`); await b.sleep(300);
  await b.eval(`document.querySelector('#chatLog .case-card').click()`); await b.sleep(300);
  check(`${tag}: locked card opens modal`, await visible('#pwModal .pw-box'));
  check(`${tag}: page behind modal is inert`, await b.eval(`document.querySelector('.site').inert===true`));
  await b.shot(`${OUT}${tag}-3-modal.png`);
  await b.eval(`document.getElementById('gate-input').value='wrong';document.getElementById('pwForm').requestSubmit()`); await b.sleep(200);
  check(`${tag}: wrong password shows error`, (await b.eval(`document.getElementById('gate-error').textContent`)) === 'Not quite. Try again.');
  await b.key('Escape'); await b.sleep(200);
  check(`${tag}: Esc closes modal first, chat stays`, !(await visible('#pwModal .pw-box')) && await has('chat-open'));
  await b.eval(`document.querySelector('#chatLog .case-card').click()`); await b.sleep(300);
  await b.eval(`document.getElementById('gate-input').value='ctsaiwork2026';document.getElementById('pwForm').requestSubmit()`); await b.sleep(1700);
  check(`${tag}: unlocked`, await has('unlocked'));
  check(`${tag}: reader is on top of the chat (center and Next button)`, await b.eval(`(()=>{const r=document.getElementById('reader');const c=document.elementFromPoint(innerWidth/2,innerHeight/2);const n=document.getElementById('nextBtn')||document.querySelector('.r-nav button:last-child');const nr=n.getBoundingClientRect();const atNext=document.elementFromPoint(nr.left+nr.width/2,nr.top+nr.height/2);return r.contains(c)&&r.contains(atNext)})()`));
  check(`${tag}: card unlock opens that case in reader`, await b.eval(`document.getElementById('reader').classList.contains('open') && document.getElementById('rTitle')?.textContent.includes('Unified Data Observability')`), await b.eval(`document.getElementById('rTitle')?.textContent||'no rTitle'`));
  await b.key('Escape'); await b.sleep(300);
  check(`${tag}: Esc closes reader but not chat`, !(await b.eval(`document.getElementById('reader').classList.contains('open')`)) && await has('chat-open'));
  await b.shot(`${OUT}${tag}-4-unlocked-chat.png`);
  await b.eval(`document.getElementById('chatClose').click()`); await b.sleep(300);
  check(`${tag}: FAB visible after unlock`, await visible('#chatFab'));
  check(`${tag}: Ask Cha Cha in nav after unlock`, tag==='desk' ? await visible('.nav-chacha') : (await b.eval(`document.getElementById('hamBtn').click()`), await b.sleep(400), await visible('.mob-chat')));
  await b.eval(tag==='desk' ? `document.querySelector('.nav-chacha').click()` : `document.querySelector('.mob-chat').click()`); await b.sleep(500);
  check(`${tag}: nav Ask Cha Cha reopens chat with history, no password`, await has('chat-open') && !(await visible('#pwModal .pw-box')) && (await b.eval(`document.querySelectorAll('#chatLog .msg').length`)) > 3);
  check(`${tag}: mobile menu closed after opening chat`, tag==='desk' || !(await b.eval(`document.getElementById('mobMenu').classList.contains('open')`)));
  await b.eval(`document.getElementById('chatClose').click()`); await b.sleep(300);
  check(`${tag}: See Projects hidden after unlock`, !(await visible('.nav-links .navpw')));
  check(`${tag}: See the work link visible`, await visible('.homecta'));
  check(`${tag}: unlocked shows work section`, await visible('#work'));

  // reload stays unlocked, no modal
  await b.goto('http://localhost:3000/');
  check(`${tag}: reload starts unlocked`, await has('unlocked') && !(await visible('.skip')));
  await b.eval('window.scrollTo(0,0)');
  await b.shot(`${OUT}${tag}-5-reload.png`);
  check(`${tag}: no horizontal overflow unlocked`, await b.eval('document.documentElement.scrollWidth<=innerWidth'));
}
check('no page errors', b.logs.length === 0, b.logs.join(' | '));
console.log(results.join('\n'));
b.close();
