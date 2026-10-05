const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const port = Number(process.env.PORT || 5501);
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/scenarios-data.js', ['scenarios-data.js', 'text/javascript; charset=utf-8']],
]);
const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  let asset;
  try { asset = assets.get(new URL(req.url, 'http://localhost').pathname); } catch {}
  if (!asset) { res.writeHead(404); res.end('No encontrado'); return; }
  fs.readFile(path.join(__dirname, asset[0]), (err, body) => {
    if (err) { res.writeHead(500); res.end('No se pudo cargar la página'); return; }
    res.writeHead(200, { 'Content-Type': asset[1], 'Content-Length': body.length, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  });
});
server.on('error', err => { console.error(`No se pudo iniciar el servidor: ${err.message}`); process.exitCode = 1; });
server.listen(port, '0.0.0.0', () => {
  console.log(`Gloomhaven disponible en http://localhost:${port}`);
  for (const [name, addresses] of Object.entries(os.networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family !== 'IPv4' || address.internal) continue;
      const label = /tailscale/i.test(name) ? 'Tailscale (también fuera de casa)' : 'Red local / otra interfaz';
      console.log(`${label}: http://${address.address}:${port}`);
    }
  }
  console.log('La PC debe permanecer encendida. Ctrl+C detiene el servidor.');
});
