/* Service worker de la app del regalo (alcance /amor/: el regalo, el editor y el Virtual Monster).
   - Páginas: primero la red; sin conexión, la última copia guardada.
   - Datos del regalo (GET /api/regalo?r=…): primero la red; sin conexión, la última copia.
   - Tipografías, íconos, librerías y fotos del regalo: se sirven desde la copia y se actualizan por detrás.
   - Videos y audios no se guardan (pesan mucho). El resto de la API nunca pasa por la copia.
   - Notificaciones: muestra el aviso y, al tocarlo, abre (o trae al frente) la página del regalo o del Virtual Monster. */
const V = 'amor-v1';
const PAGINAS = V + '-paginas', DATOS = V + '-datos', MEDIOS = V + '-medios';
const BASE = ['/amor/', '/amor/mascota/', '/amor/app.js', '/amor/icono-192.png', '/amor/mascota/icono-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(PAGINAS).then(c => Promise.all(BASE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !k.startsWith(V)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function primeroRed(req, cache, clave) {
  const c = await caches.open(cache);
  try {
    const r = await fetch(req);
    if (r.ok) c.put(clave || req, r.clone());
    return r;
  } catch (err) {
    const g = await c.match(clave || req, { ignoreVary: true });
    if (g) return g;
    if (req.mode === 'navigate') { const p = await c.match(new URL(req.url).pathname.startsWith('/amor/mascota/') ? '/amor/mascota/' : '/amor/'); if (p) return p; }
    throw err;
  }
}
async function copiaPrimero(e, req) {
  const c = await caches.open(MEDIOS);
  const g = await c.match(req);
  const red = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { c.put(req, r.clone()); recortar(c); } return r; });
  if (g) { e.waitUntil(red.catch(() => {})); return g; }
  return red;
}
// Máximo 120 archivos en la copia de medios
async function recortar(c) { const ks = await c.keys(); for (let i = 0; i < ks.length - 120; i++) await c.delete(ks[i]); }

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    if (u.pathname === '/api/regalo') {
      // Solo el regalo público (?r=); se guarda sin el resto de la dirección para encontrarlo sin conexión
      if (u.searchParams.get('r') && u.searchParams.size === 1) e.respondWith(primeroRed(req, DATOS, '/api/regalo?r=' + u.searchParams.get('r')));
      return;
    }
    if (u.pathname.startsWith('/api/')) return;
    if (req.mode === 'navigate') { e.respondWith(primeroRed(req, PAGINAS, u.pathname)); return; }
    if (u.pathname.startsWith('/amor/')) { e.respondWith(primeroRed(req, PAGINAS)); return; }
    return;
  }
  const medio = ['font', 'style', 'script', 'image'].includes(req.destination);
  const conocido = /(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)$/.test(u.hostname) || /\.supabase\.co$/.test(u.hostname);
  if (medio && conocido) e.respondWith(copiaPrimero(e, req));
});

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Tu regalo', {
    body: d.body || '', icon: '/amor/icono-192.png', badge: '/amor/icono-192.png',
    tag: d.tag || undefined, renotify: !!d.tag, data: { url: d.url || '/amor/' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/amor/', location.origin).href;
  e.waitUntil((async () => {
    const ws = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const igual = ws.find(w => w.url.split('#')[0] === url.split('#')[0]);
    if (igual) { await igual.focus(); return; }
    if (ws[0] && 'navigate' in ws[0]) { try { await ws[0].navigate(url); await ws[0].focus(); return; } catch (_) {} }
    await self.clients.openWindow(url);
  })());
});
