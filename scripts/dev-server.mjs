// Local dev: serves the static site and routes POST /api/chat to the real handler.
// Usage: ANTHROPIC_API_KEY=... CHACHA_MODEL=claude-haiku-5-5 pnpm dev  → http://localhost:3000
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.gif': 'image/gif', '.pdf': 'application/pdf', '.md': 'text/markdown; charset=utf-8',
};

const { POST } = await import('../api/chat.js');

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === '/api/chat') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const response = await POST(new Request(url, {
      method: req.method, headers: req.headers, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
    }));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) for await (const chunk of response.body) res.write(chunk);
    return res.end();
  }
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(ROOT, rel.endsWith('/') ? `${rel}index.html` : rel);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(PORT, () => console.log(`Cha Cha dev server: http://localhost:${PORT}`));
