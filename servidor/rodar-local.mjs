/* Roda o site + a API no computador SEM instalar PHP:
 * o PHP roda dentro do Node (php-wasm) e os dados ficam num arquivo SQLite (servidor/dados-local.db).
 * Serve para testar a lista compartilhada de sugestões na mesma rede (outros aparelhos no mesmo Wi-Fi).
 *
 *   npm i
 *   npm run local                 → http://localhost:8080   (pasta do site: ./site)
 *   node servidor/rodar-local.mjs outra-pasta
 *
 * Códigos: equipe = "equipe", admin = "admin" (troque com as variáveis KIT_EQUIPE e KIT_ADMIN).
 * Para usar o MySQL de verdade, use PHP normal ou a hospedagem (documentacao/BASE-MYSQL.md).
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize, resolve } from 'node:path';
import { PHP } from '@php-wasm/universal';
import { loadNodeRuntime } from '@php-wasm/node';

const aqui = dirname(fileURLToPath(import.meta.url));
const site = resolve(join(aqui, '..'), process.argv[2] || 'site');
const arqBanco = join(aqui, 'dados-local.db');
const PORTA = +(process.env.PORT || 8080);
const EQUIPE = process.env.KIT_EQUIPE || 'equipe', ADMIN = process.env.KIT_ADMIN || 'admin';

const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: 1 } }));
php.mkdir('/www');
php.writeFile('/www/api.php', readFileSync(join(aqui, 'api.php'), 'utf8'));
php.writeFile('/www/config.php', `<?php return ['dsn' => 'sqlite:/www/dados.db', 'codigo_equipe' => ${JSON.stringify(EQUIPE)}, 'codigo_admin' => ${JSON.stringify(ADMIN)}, 'origens' => ['*']];`);
if (existsSync(arqBanco)) php.writeFile('/www/dados.db', readFileSync(arqBanco));
const guardar = () => { try { if (php.fileExists('/www/dados.db')) writeFileSync(arqBanco, php.readFileAsBuffer('/www/dados.db')); } catch (e) { console.error(e.message); } };

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
let fila = Promise.resolve(); // uma chamada por vez

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api.php') {
    const partes = []; for await (const c of req) partes.push(c);
    fila = fila.then(async () => {
      const r = await php.run({ scriptPath: '/www/api.php', method: req.method, headers: { 'Content-Type': 'application/json', origin: req.headers.origin || '' }, body: new Uint8Array(Buffer.concat(partes)) });
      guardar();
      const h = {}; for (const [k, v] of Object.entries(r.headers)) h[k] = Array.isArray(v) ? v.join(', ') : v;
      res.writeHead(r.httpStatusCode, h); res.end(r.bytes ? Buffer.from(r.bytes) : r.text);
    }).catch((e) => { res.writeHead(500); res.end(JSON.stringify({ ok: false, erro: e.message })); });
    return;
  }
  let caminho = normalize(join(site, decodeURIComponent(url.pathname)));
  if (!caminho.startsWith(site)) { res.writeHead(403); return res.end(); }
  if (existsSync(caminho) && statSync(caminho).isDirectory()) caminho = join(caminho, 'index.html');
  if (!existsSync(caminho)) { res.writeHead(404); return res.end('não encontrado'); }
  let corpo = readFileSync(caminho);
  if (caminho.endsWith('kit-config.js')) corpo = Buffer.concat([corpo, Buffer.from("\nwindow.KIT_CONFIG.apiUrl = '/api.php'; // ligado pelo rodar-local\n")]);
  res.writeHead(200, { 'Content-Type': TIPOS[extname(caminho)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(corpo);
}).listen(PORTA, () => console.log(`Site + lista compartilhada: http://localhost:${PORTA}/?equipe=${EQUIPE}  (admin: ${ADMIN})`));
