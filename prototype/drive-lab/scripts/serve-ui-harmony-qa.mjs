/** Loopback-only production UI fixture. Does not modify the generated package. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('dist/client');
const fixture = resolve('qa/ui-harmony-fixtures.js');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.mp3':'audio/mpeg', '.wav':'audio/wav', '.webp':'image/webp' };
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    if (path.startsWith('/api/')) { res.writeHead(503, {'Content-Type':'application/json'}); res.end('{"error":"local_qa_only"}'); return; }
    const file = path === '/__qa-fixtures.js' ? fixture : resolve(root, '.' + (path === '/' ? '/index.html' : path));
    if (file !== fixture && !file.startsWith(root + '/')) { res.writeHead(403); res.end(); return; }
    let body = await readFile(file);
    if (path === '/') body = Buffer.from(body.toString().replace('<head>', '<head><script src="/__qa-fixtures.js"></script>'));
    res.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'}); res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(5176, '127.0.0.1', () => console.log('Compiled UI fixture: http://127.0.0.1:5176/'));
