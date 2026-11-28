/* Gerado por scripts/gerar-site.mjs — não editar à mão.
 * Rede primeiro, sem cache HTTP: com internet sempre mostra a versão mais nova (inclusive no app instalado);
 * sem internet usa a última cópia. Só guarda arquivos públicos do site (nenhum dado de cliente). */
const VERSION = '0.3.3.mx0k2c1f';
const CACHE = 'fidelis-' + VERSION;
const CORE = ['./', './estilo.css', './app.js', './dados.js', './manifest.webmanifest', './assets/simbolo-dourado.png', './assets/simbolo-dourado-160.png', './assets/icone-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('fidelis-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const escopo = new URL('./', self.location).href;
  if (url.href.startsWith(escopo)) {
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then((k) => k.put(req, c)); } return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? caches.match('./') : undefined)))
    );
  } else if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((k) => k.put(req, c)); return res; })));
  }
});
