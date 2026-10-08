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
  ['/images-data.js', ['images-data.js', 'text/javascript; charset=utf-8']],
  ['/extra-components.js', ['extra-components.js', 'text/javascript; charset=utf-8']],
]);
const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  if (new URL(req.url, 'http://localhost').pathname === '/images-data.js') {
    try {
      const images = Object.fromEntries(fs.readdirSync(path.join(__dirname, 'img')).filter(name => /^\d+\.(png|jpe?g|webp|gif)$/i.test(name)).map(name => [path.parse(name).name, `img/${name}`]));
      const body = Buffer.from(`window.COMPONENT_IMAGES = ${JSON.stringify(images)};`);
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Content-Length': body.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(500); res.end('No se pudieron leer las imágenes'); }
    return;
  }
  let asset;
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    asset = assets.get(pathname);
    if (/^\/img\/\d+\.(png|jpe?g|webp|gif)$/i.test(pathname)) {
      const extension = path.extname(pathname).toLowerCase();
      asset = [pathname.slice(1), {'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'}[extension]];
    }
  } catch {}
  if (!asset) { res.writeHead(404); res.end('No encontrado'); return; }
  fs.readFile(path.join(__dirname, asset[0]), (err, body) => {
    if (err) { res.writeHead(err.code === 'ENOENT' ? 404 : 500); res.end('No se pudo cargar el archivo'); return; }
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
