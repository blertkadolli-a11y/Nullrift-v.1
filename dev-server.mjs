/* ==========================================================================
   Local dev server.

   Vercel serves public/ statically and runs api/*.js as functions. Locally,
   python3 -m http.server can only do the first half, which meant the prompt
   endpoint could not be exercised until it was deployed. This does both, with
   no dependencies — Node's own http and fs, nothing installed.

   The handlers it imports are the same files Vercel runs in production, so
   what passes here is what ships.

     node dev-server.mjs           → http://localhost:8080
     PORT=3000 node dev-server.mjs → http://localhost:3000
   ========================================================================== */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC = join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

/* Load .env if present so SUPABASE_* reach the handlers the same way Vercel's
   env vars would. Deliberately minimal: KEY=value, # comments, no expansion. */
async function loadEnv() {
  try {
    const raw = await readFile(join(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 1) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
    console.log('  loaded .env');
  } catch (err) { /* no .env — endpoints will report themselves unconfigured */ }
}

/* api/foo.js → /api/foo. Imported per request so edits land on reload without
   restarting; the cache-buster is what defeats the ESM module cache. */
async function runApi(req, res, pathname) {
  const name = pathname.slice('/api/'.length);
  if (!name || !/^[a-z0-9-]+$/i.test(name)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end('{"error":"not_found"}');
  }
  /* .mjs first: Vercel runs these as Node functions, and without a
     package.json declaring "type": "module" a .js file is treated as CommonJS,
     which would crash on the first `import`. .mjs is unambiguous everywhere. */
  let file = null;
  for (const ext of ['.mjs', '.js']) {
    const candidate = join(ROOT, 'api', name + ext);
    try {
      await stat(candidate);
      file = candidate;
      break;
    } catch (err) { /* try the next extension */ }
  }
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end('{"error":"not_found"}');
  }
  try {
    const mod = await import(`file://${file}?t=${Date.now()}`);
    const handler = mod.default;
    if (typeof handler !== 'function') throw new Error('no default export');
    await handler(req, res);
  } catch (err) {
    console.error('  api/' + name + ' threw:', err.message);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end('{"error":"handler_failed"}');
  }
}

async function serveStatic(res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  /* normalize + prefix check: without it, /../api/_data/... would walk out of
     public/ and serve the very file this whole change exists to hide. */
  const target = normalize(join(PUBLIC, rel));
  if (!target.startsWith(PUBLIC)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }
  try {
    const data = await readFile(target);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 — not found under public/');
  }
}

await loadEnv();

createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname.startsWith('/api/')) return runApi(req, res, pathname);
  return serveStatic(res, pathname);
}).listen(PORT, () => {
  console.log('NULLRIFT dev server');
  console.log('  static  public/   → http://localhost:' + PORT + '/gallery.html');
  console.log('  api     api/*.js  → http://localhost:' + PORT + '/api/prompt?id=01');
});
