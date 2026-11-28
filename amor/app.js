/* App instalable del regalo (PWA): instalar, avisos (notificaciones push) y aviso abajo de la pantalla.
   Lo usan el regalo (amor/index.html) y el Virtual Monster (amor/mascota/index.html).
   En iPhone las notificaciones solo funcionan con la app agregada a la pantalla de inicio (regla de Apple),
   y esa app guarda sus datos aparte del navegador: la primera vez hay que volver a escribir la contraseña. */
window.APP = (() => {
  const est = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(navigator.userAgent);
  const pushOk = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  let aviso = null; // evento para instalar en Android/Chrome
  const oyentes = [];
  const cambio = () => oyentes.forEach(f => { try { f(); } catch (_) {} });
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); aviso = e; cambio(); });
  addEventListener('appinstalled', () => { aviso = null; cambio(); });
  const reg = 'serviceWorker' in navigator && location.protocol !== 'file:'
    ? navigator.serviceWorker.register('/amor/sw.js', { scope: '/amor/' }).catch(() => null) : Promise.resolve(null);
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (_) {} } };

  /* ---------- estilos de lo que agrega este archivo ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .app-banner{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translate(-50%,140%);z-index:70;width:min(520px,calc(100% - 20px));
    display:flex;align-items:center;gap:10px;padding:10px 10px 10px 14px;border-radius:20px;color:#fff;background:rgba(28,10,24,.82);
    -webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);border:1px solid rgba(255,255,255,.18);
    box-shadow:0 18px 40px -12px rgba(0,0,0,.55);font:14px/1.35 "Mulish",system-ui,sans-serif;transition:transform .5s cubic-bezier(.2,1.4,.4,1)}
  .app-banner.on{transform:translate(-50%,0)}
  .app-banner .ic{font-size:26px;line-height:1}.app-banner .tx{flex:1;text-align:left}.app-banner b{display:block;font-size:15px}
  .app-banner button{border:0;border-radius:999px;min-height:40px;padding:8px 14px;font:600 14px "Mulish",system-ui,sans-serif;cursor:pointer}
  .app-banner .si{background:linear-gradient(135deg,#ff3d6e,#8f3cf7);color:#fff}.app-banner .no{background:none;color:#fff;opacity:.7;padding:8px;min-width:40px;font-size:20px}
  .app-hoja{position:fixed;inset:0;z-index:80;display:grid;place-items:end center;background:rgba(10,0,8,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);padding:12px}
  .app-hoja>div{width:min(460px,100%);background:#1c0a18;color:#fff;border-radius:24px;padding:22px 20px 18px;border:1px solid rgba(255,255,255,.15);font:15px/1.5 "Mulish",system-ui,sans-serif;text-align:left;
    animation:appSube .45s cubic-bezier(.2,1.3,.4,1)}
  @keyframes appSube{from{transform:translateY(60%);opacity:0}}
  .app-hoja h3{font:700 22px "Arima",serif;margin:0 0 6px}.app-hoja ol{padding-left:22px;margin:10px 0}.app-hoja li{margin:8px 0}
  .app-hoja .k{display:inline-grid;place-items:center;min-width:28px;height:28px;padding:0 6px;border-radius:8px;background:rgba(255,255,255,.14);font-weight:700}
.app-toast{position:fixed;left:50%;top:max(14px,env(safe-area-inset-top));transform:translate(-50%,-160%);z-index:90;max-width:calc(100% - 24px);padding:10px 16px;border-radius:16px;
    background:rgba(28,10,24,.9);color:#fff;font:600 14px/1.35 "Mulish",system-ui,sans-serif;box-shadow:0 12px 30px -10px rgba(0,0,0,.5);transition:transform .45s cubic-bezier(.2,1.4,.4,1);text-align:center}
  .app-toast.on{transform:translate(-50%,0)}
  .app-hoja small{display:block;opacity:.7;margin-top:8px}.app-hoja button{width:100%;margin-top:12px;border:0;border-radius:999px;min-height:44px;font:600 15px "Mulish",system-ui,sans-serif;background:linear-gradient(135deg,#ff3d6e,#8f3cf7);color:#fff;text-align:center;display:block}
  .app-hoja p,.app-hoja li,.app-hoja small{text-align:left;text-align-last:auto;hyphens:none}`;
  document.head.appendChild(css);

  function toast(m) {
    let t = document.querySelector('.app-toast'); if (!t) { t = document.createElement('div'); t.className = 'app-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 3200);
  }

  /* ---------- instalar ---------- */
  const puedeInstalar = () => !est && (!!aviso || ios || android);
  function hoja(html) {
    const bg = document.createElement('div'); bg.className = 'app-hoja';
    bg.innerHTML = `<div role="dialog" aria-modal="true">${html}<button type="button">Entendido</button></div>`;
    document.body.appendChild(bg);
    const cerrar = () => bg.remove(); bg.querySelector('button').onclick = cerrar; bg.onclick = e => { if (e.target === bg) cerrar(); };
  }
  async function instalar() {
    if (aviso) { aviso.prompt(); const r = await aviso.userChoice.catch(() => null); aviso = null; cambio(); return r && r.outcome === 'accepted'; }
    if (ios) hoja(`<h3>Guárdalo como app</h3><p style="margin:0">Así lo abres desde un ícono ❤️ en tu pantalla de inicio, a pantalla completa y con avisos.</p>
      <ol><li>Toca <span class="k">⬆️</span> <b>Compartir</b>: en Safari está abajo; en Chrome, arriba a la derecha, al lado de la dirección.</li>
      <li>Elige <b>«Agregar a pantalla de inicio»</b> (si no aparece, desliza la lista hacia abajo).</li><li>Toca <b>Agregar</b> y abre el regalo desde el ícono nuevo.</li></ol>
      <small>La app guarda sus datos aparte del navegador: si tenías una contraseña escrita, te la pedirá una vez más.</small>`);
    else hoja(`<h3>Guárdalo como app</h3><ol><li>Toca el menú <span class="k">⋮</span> del navegador.</li><li>Elige <b>«Instalar app»</b> o <b>«Agregar a pantalla de inicio»</b>.</li></ol>`);
    return false;
  }

  /* ---------- avisos (notificaciones push) ---------- */
  const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)); };
  async function suscripcion() { const r = await reg; return r && r.pushManager ? r.pushManager.getSubscription().catch(() => null) : null; }
  // 'on' | 'off' | 'bloqueado' | 'instalar' (iPhone sin agregar a inicio) | 'no' (este navegador no tiene avisos)
  async function estadoAvisos() {
    if (!pushOk) return ios && !est ? 'instalar' : 'no';
    if (Notification.permission === 'denied') return 'bloqueado';
    return Notification.permission === 'granted' && await suscripcion() ? 'on' : 'off';
  }
  const post = b => fetch('/api/regalo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
    .then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Error ' + r.status); return j; });
  // Debe llamarse directo desde el toque del botón (el permiso se pide en ese mismo momento)
  async function activar({ r, s, quien }) {
    if (!pushOk) { if (ios && !est) instalar(); throw new Error(ios && !est ? 'Primero guárdalo como app en tu pantalla de inicio.' : 'Este navegador no tiene avisos.'); }
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') throw new Error(permiso === 'denied' ? 'Los avisos están bloqueados: actívalos en los ajustes del celular, en Notificaciones.' : 'No diste permiso para los avisos.');
    const rg = await reg; if (!rg) throw new Error('No se pudo preparar la app en este celular.');
    await navigator.serviceWorker.ready;
    let sub = await rg.pushManager.getSubscription();
    if (!sub) { const { publica } = await fetch('/api/regalo?vapid=1').then(x => x.json()); sub = await rg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(publica) }); }
    await post({ accion: 'push', r, s, op: 'alta', sub: sub.toJSON(), quien });
    ls.set('amor-push-' + r, '1'); cambio(); return true;
  }
  async function desactivar({ r, s }) {
    const sub = await suscripcion();
    if (sub) { await post({ accion: 'push', r, s, op: 'baja', ep: sub.endpoint }).catch(() => {}); await sub.unsubscribe().catch(() => {}); }
    ls.set('amor-push-' + r, null); cambio();
  }
  // Al abrir: si este celular ya tiene avisos, se vuelve a anotar en este regalo (por si cambió quién eres)
  async function renovar({ r, s, quien }) {
    const sub = Notification && Notification.permission === 'granted' && await suscripcion();
    if (sub) post({ accion: 'push', r, s, op: 'alta', sub: sub.toJSON(), quien }).catch(() => {});
  }
  let EP = '';
  suscripcion().then(x => { EP = x ? x.endpoint : ''; });

  /* ---------- aviso abajo: "Guárdalo como app" o "Activa los avisos" ---------- */
  function banner(ctx) {
    const el = document.createElement('div'); el.className = 'app-banner'; el.setAttribute('role', 'status');
    document.body.appendChild(el);
    async function pintar() {
      const estA = await estadoAvisos(), cerrado = k => ls.get('amor-banner-' + k + '-' + ctx.r);
      let k = '';
      if (puedeInstalar() && !cerrado('app')) k = 'app';
      else if (est && estA === 'off' && !cerrado('avisos')) k = 'avisos';
      if (!k) { el.classList.remove('on'); return; }
      el.innerHTML = k === 'app'
        ? `<span class="ic">📲</span><span class="tx"><b>Guárdalo como app</b>${ctx.textoApp || 'Ábrelo desde tu pantalla de inicio, sin buscar el link.'}</span><button class="si">${aviso ? 'Instalar' : 'Cómo'}</button><button class="no" aria-label="Cerrar">×</button>`
        : `<span class="ic">🔔</span><span class="tx"><b>Activa los avisos</b>${ctx.textoAvisos || 'Te contamos cuando te escriban o el Virtual Monster te necesite.'}</span><button class="si">Activar</button><button class="no" aria-label="Cerrar">×</button>`;
      el.querySelector('.no').onclick = () => { ls.set('amor-banner-' + k + '-' + ctx.r, '1'); el.classList.remove('on'); };
      el.querySelector('.si').onclick = async () => {
        if (k === 'app') { await instalar(); return; }
        try { await activar({ r: ctx.r, s: ctx.s(), quien: ctx.quien() }); (ctx.listo || toast)('🔔 Avisos activados en este celular'); }
        catch (e) { (ctx.listo || toast)(e.message); }
        pintar();
      };
      setTimeout(() => el.classList.add('on'), ctx.espera || 1800);
    }
    oyentes.push(pintar); pintar();
    return { pintar };
  }

  return { toast, est, ios, android, pushOk, puedeInstalar, instalar, estadoAvisos, activar, desactivar, renovar, banner, ep: () => EP, alCambiar: f => oyentes.push(f) };
})();
