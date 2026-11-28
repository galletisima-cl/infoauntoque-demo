// Guarda y entrega los regalos de amor (todavía sin cobro).
// Cada tarjeta NFC lleva el link /amor/?r=CODIGO. El código es el "slug" del regalo.
//   GET  /api/regalo?r=CODIGO        → regalo público (lo que ve quien recibe)
//                                      { registro:false } si la tarjeta aún no se registra
//                                      { off:true } si quien regala lo deshabilitó
//   GET  /api/regalo?id=ID&k=TOKEN   → regalo para editar (solo quien regala)
//   POST {accion:"registrar", r, tipo, rolDe?, rolPara?, de:{nombre,email,tel}, para:{nombre,tel}, pass} → registra la tarjeta
//        tipo: "amor" (pareja) | "familia" (rolDe/rolPara: hijo, hija, padre, madre) | "amistad"
//   POST {accion:"entrar", r, pass}  → inicia sesión de quien regala (devuelve id y token de sesión)
//   POST {accion:"perfil", id, token, email?, off?, passActual?, passNueva?} → perfil, contraseña y deshabilitar
//   POST {accion:"crear", datos}     → (antiguo) crea un regalo sin tarjeta, con link secreto de edición
//   POST {accion:"guardar"|"subir"|"borrar", id, token, ...}
//   POST {accion:"cuaderno", r:SLUG, s?, op}  → cuaderno de citas compartido (lo editan los dos con el link del regalo)
//   POST {accion:"mascota", r, s?, op:"leer", v?}  → estado compartido del Virtual Monster ({v, estado} o {v, igual:true})
//   POST {accion:"mascota", r, s?, op:"guardar", v, estado} → guarda si v es la versión actual; si no, 409 con lo último
//   POST {accion:"abierto", r, s?, juegos?} → anota que quien recibe ya abrió el regalo (y si desbloqueó los juegos)
//   POST {accion:"entrarPara", r, pass} → sesión de quien recibe (si le puso contraseña a su regalo)
//   POST {accion:"clavePara", r, s?, passActual?, passNueva?, email?, quitar?} → quien recibe pone, cambia o quita su contraseña
//   POST {accion:"push", r, s?, op:"alta", sub, quien} | {op:"baja", ep} → avisos (notificaciones) en este celular
//   GET  /api/regalo?vapid=1 → llave pública para las notificaciones · GET ?manifest=CODIGO → manifest de la app de ese regalo
// Avisos: inmediatos (mensaje de la mascota, lista para evolucionar, idea nueva en el cuaderno) y programados
// (la mascota calcula cuándo va a tener hambre, caca, etc. y los manda en "avisos"; /api/avisos los envía cada 10 min).
// Sesión: header "X-Sesion" en el GET y campo "s" en el POST. Con contraseña de quien recibe, el regalo, el cuaderno
// y la mascota solo se abren con la sesión de quien recibe o la de quien regala.
// Los datos privados van en llaves que parten con "_" (_priv, _mascota): nunca salen en la vista pública
// y el editor no los pisa. Toda escritura usa updated_at como control de versión para no pisar cambios simultáneos.
// Requiere SUPABASE_URL y SUPABASE_SERVICE_KEY (las mismas de /api/track).
const crypto = require("crypto");
const PUSH = require("./_push");

const URL_ = String(process.env.SUPABASE_URL || "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = "amor";
const CUOTA = 15 * 1048576;       // 15 MB por regalo
const MAX_ARCHIVO = 8 * 1048576;  // igual al límite del bucket
const MAX_ARCHIVOS = 45;          // 20 fotos + 20 miniaturas + voz + video + margen
const TIPOS = {
  "image/webp": "webp", "image/jpeg": "jpg",
  "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/mpeg": "mp3",
  "audio/x-m4a": "m4a", "audio/aac": "aac",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov"
};

const hash = t => crypto.createHash("sha256").update(String(t)).digest("hex");
// Contraseña: scrypt con sal (se guarda en token_hash como "scrypt$sal$hash")
const passHash = p => { const sal = crypto.randomBytes(16).toString("hex"); return "scrypt$" + sal + "$" + crypto.scryptSync(String(p), sal, 32).toString("hex"); };
function passOk(p, guardado) {
  const [tipo, sal, h] = String(guardado || "").split("$");
  if (tipo !== "scrypt" || !sal || !h) return false;
  const a = Buffer.from(h, "hex"), b = crypto.scryptSync(String(p), sal, 32);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
// Sesión firmada (sin tabla extra): s.VENCE.FIRMA. Cambiar la contraseña invalida las sesiones anteriores.
const firma = (id, vence, th) => crypto.createHmac("sha256", "amor-sesion:" + process.env.SUPABASE_SERVICE_KEY).update(id + "." + vence + "." + th).digest("hex");
const sesion = (id, th) => { const v = Date.now() + 30 * 864e5; return "s." + v + "." + firma(id, v, th); };
function sesionOk(id, token, th) {
  const [s0, v, f] = String(token).split(".");
  if (s0 !== "s" || !(+v > Date.now()) || !f) return false;
  const a = Buffer.from(f), b = Buffer.from(firma(id, +v, th));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
// Sesión de quien recibe: p.VENCE.FIRMA, firmada con el hash de su contraseña (cambiarla o quitarla cierra las sesiones)
const firmaPara = (id, vence, ph) => crypto.createHmac("sha256", "amor-para:" + process.env.SUPABASE_SERVICE_KEY).update(id + "." + vence + "." + ph).digest("hex");
const sesionPara = (id, ph) => { const v = Date.now() + 90 * 864e5; return "p." + v + "." + firmaPara(id, v, ph); };
function paraOk(id, token, ph) {
  const [p0, v, f] = String(token || "").split(".");
  if (p0 !== "p" || !ph || !(+v > Date.now()) || !f) return false;
  const a = Buffer.from(f), b = Buffer.from(firmaPara(id, +v, ph));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const privDe = d => (d && d._priv) || {};
const protegido = d => !!privDe(d).passPara;
// ¿Quién es? "de" (quien regala), "para" (quien recibe con contraseña) o null
function quienEs(fila, token) {
  token = String(token || "");
  if (!fila || !token) return null;
  if (token.startsWith("s.")) return sesionOk(fila.id, token, fila.token_hash) ? "de" : null;
  if (token.startsWith("p.")) return paraOk(fila.id, token, privDe(fila.datos).passPara) ? "para" : null;
  if (/^[0-9a-f]{48}$/.test(token)) { // link secreto antiguo
    const a = Buffer.from(fila.token_hash), b = Buffer.from(hash(token));
    return a.length === b.length && crypto.timingSafeEqual(a, b) ? "de" : null;
  }
  return null;
}
const CODIGO = /^[a-z0-9][a-z0-9-]{7,59}$/; // códigos de tarjeta: 8+ caracteres
const publico = d => { const o = Object.assign({}, d); Object.keys(o).forEach(k => { if (k[0] === "_") delete o[k]; }); return o; };
const privados = d => Object.keys(d || {}).reduce((o, k) => (k[0] === "_" ? (o[k] = d[k], o) : o), {});
const slugOk = r => String(r || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
const rand = n => crypto.randomBytes(n).toString("hex");
const esId = s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(String(s || ""));
const RUTA = /^[0-9a-f-]{36}\/[a-z]+-[0-9a-f]+\.[a-z0-9]+$/;
const TEMAS = ["pasion", "pastel", "noche", "vintage", "comics", "navidad"];
const FONDOS = ["corazones", "coronas", "flores", "copas", "likes", "navidad"]; // figuras que flotan en el fondo
const CIUDADES = ["arica", "antofagasta", "laserena", "valparaiso", "santiago", "concepcion", "temuco", "puertomontt", "puntaarenas"];
// Tipo de regalo y perfiles. En familia, uno es hijo/hija y el otro padre/madre.
const TIPOS_REGALO = ["amor", "familia", "amistad"];
const HIJOS = ["hijo", "hija"], PADRES = ["padre", "madre"];
const rolesOk = (de, para) => (HIJOS.includes(de) && PADRES.includes(para)) || (PADRES.includes(de) && HIJOS.includes(para));
function tipoDe(d) {
  const tipo = TIPOS_REGALO.includes(d && d.tipo) ? d.tipo : "amor";
  if (tipo === "familia" && rolesOk(d.rolDe, d.rolPara)) return { tipo, rolDe: d.rolDe, rolPara: d.rolPara };
  return { tipo: tipo === "familia" ? "amor" : tipo, rolDe: "", rolPara: "" };
}
const tel = t => String(t || "").replace(/[^\d+ ]/g, "").slice(0, 20);

async function llamar(base, path, opt = {}) {
  const r = await fetch(URL_ + base + path, Object.assign({}, opt, {
    headers: Object.assign({ apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" }, opt.headers)
  }));
  const t = await r.text();
  let j = null;
  try { j = t ? JSON.parse(t) : null; } catch (_) { j = null; }
  return { ok: r.ok, status: r.status, j };
}
const db = (p, o) => llamar("/rest/v1/", p, o);
const st = (p, o) => llamar("/storage/v1/", p, o);

/* Cambia una fila sin pisar lo que otro guardó entremedio: lee, aplica fn y guarda solo si updated_at sigue igual.
   fn(fila) devuelve {status, j} para cortar con esa respuesta, o {cambio, ok} para guardar `cambio` y responder `ok`. */
const marca = () => new Date().toISOString().replace("Z", String(Math.floor(Math.random() * 1000)).padStart(3, "0") + "Z");
async function cambiar(filtro, fn, err) {
  for (let i = 0; i < 6; i++) {
    const r0 = await db("amor_regalos?select=id,slug,token_hash,datos,updated_at&" + filtro);
    if (!r0.ok) return { status: 502, j: { error: "No se pudo leer el regalo" } };
    const fila = Array.isArray(r0.j) && r0.j[0];
    const out = await fn(fila || null);
    if (out.status) return out;
    const r = await db("amor_regalos?select=id&id=eq." + fila.id + "&updated_at=eq." + encodeURIComponent(fila.updated_at), {
      method: "PATCH", headers: { Prefer: "return=representation" },
      body: JSON.stringify(Object.assign({}, out.cambio, { updated_at: marca() })) });
    if (!r.ok) return { status: 502, j: { error: err || "No se pudo guardar" } };
    if (Array.isArray(r.j) && r.j.length) return { status: 200, j: out.ok };
    await new Promise(ok => setTimeout(ok, 40 + Math.random() * 120)); // otro guardó justo ahora: reintenta
  }
  return { status: 409, j: { error: "Se cruzaron dos cambios; intenta otra vez" } };
}
const corta = (status, error, extra) => ({ status, j: Object.assign({ error }, extra || {}) });
// Revisa que el regalo exista, esté habilitado y que la sesión sirva si tiene contraseña de quien recibe
function revisar(fila, s) {
  if (!fila) return corta(404, "Este regalo no existe");
  if (privDe(fila.datos).off) return corta(403, "Este regalo está deshabilitado");
  const soy = quienEs(fila, s);
  if (protegido(fila.datos) && !soy) return corta(401, "Este regalo tiene contraseña", { bloqueado: true });
  return { soy };
}
const MAX_MASCOTA = 60000; // caracteres del estado de la mascota

/* Avisos */
const persona = q => q === "Él" || q === "Ella" ? q : "";
const txtAviso = (x, n) => String(x == null ? "" : x).replace(/[\u0000-\u001f]/g, " ").slice(0, n);
// Programados: [{t, txt, para}] → se guardan en datos._avisos y el más próximo en datos._prox (para buscarlos rápido)
function avisosLimpios(lista) {
  const ahora = Date.now();
  return (Array.isArray(lista) ? lista : []).slice(0, 12)
    .filter(a => a && +a.t > ahora - 60000 && +a.t < ahora + 48 * 3600000 && a.txt)
    .map(a => ({ t: Math.round(+a.t), txt: txtAviso(a.txt, 140), para: persona(a.para), k: txtAviso(a.k, 20) }))
    .sort((a, b) => a.t - b.t);
}
function conAvisos(datos, lista) {
  const d = Object.assign({}, datos);
  if (lista.length) { d._avisos = lista; d._prox = String(lista[0].t); } else { delete d._avisos; delete d._prox; }
  return d;
}
// Manda avisos y borra las suscripciones que ya no existen
async function avisar(fila, items, sin) {
  const subs = (fila && fila.datos && fila.datos._push) || [];
  if (!subs.length || !items.length) return;
  const muertas = [];
  for (const it of items.slice(0, 4)) muertas.push(...await PUSH.enviar(subs, it.aviso, it.para, sin));
  if (muertas.length) await cambiar("id=eq." + fila.id, f => f ? { cambio: { datos: Object.assign({}, f.datos, { _push: (f.datos._push || []).filter(x => !muertas.includes(x.ep)) }) }, ok: {} } : corta(404, ""));
}
const COLORES = { pasion: "#b0103a", pastel: "#e88aa8", noche: "#14123a", vintage: "#7a4b2a", comics: "#1f4fd1", navidad: "#0f5132" };
const MARCAS = { amor: "Con amor", familia: "Con cariño", amistad: "Entre amigos" };

async function duenio(id, token) {
  if (!esId(id) || !token) return null;
  const r = await db("amor_regalos?select=id,slug,token_hash,datos&id=eq." + id);
  const row = r.ok && Array.isArray(r.j) && r.j[0];
  if (!row) return null;
  if (String(token).startsWith("s.")) return sesionOk(row.id, token, row.token_hash) ? row : null;
  const a = Buffer.from(row.token_hash), b = Buffer.from(hash(token)); // link secreto antiguo
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? row : null;
}

async function archivos(id) {
  const r = await st("object/list/" + BUCKET, { method: "POST", body: JSON.stringify({ prefix: id, limit: 100, offset: 0 }) });
  return r.ok && Array.isArray(r.j) ? r.j.filter(f => f.id) : [];
}
const pesoDe = fs => fs.reduce((a, f) => a + ((f.metadata && f.metadata.size) || 0), 0);

function slugDe(d) {
  const s = [d && d.para, d && d.de]
    .map(x => String(x || "").toLowerCase().normalize("NFD").replace(/[^a-z]/g, "").slice(0, 20))
    .filter(Boolean).join("-");
  return s || "regalo";
}

function limpiar(d, id) {
  d = d && typeof d === "object" ? d : {};
  const txt = (s, n) => String(s == null ? "" : s).slice(0, n);
  const fecha = f => /^\d{4}-\d{2}-\d{2}$/.test(f || "") ? f : "";
  const ruta = r => typeof r === "string" && r.startsWith(id + "/") && RUTA.test(r) ? r : null;
  const num = n => Math.max(0, Math.round(+n || 0));
  const media = m => m && ruta(m.ruta) ? { ruta: m.ruta, peso: num(m.peso), orig: num(m.orig) } : null;
  const lista = (a, n) => (Array.isArray(a) ? a : []).slice(0, n).filter(x => x && typeof x === "object");
  return Object.assign(tipoDe(d), {
    de: txt(d.de, 40), para: txt(d.para, 40), fecha: fecha(d.fecha),
    cancion: txt(d.cancion, 300), yt: txt(d.yt, 300),
    carta: txt(d.carta, 5000), final: txt(d.final, 1500),
    tl: lista(d.tl, 30).map(x => ({ f: fecha(x.f), t: txt(x.t, 200) })),
    qs: lista(d.qs, 10).map(x => {
      // Formato nuevo: { q, ops: [4 opciones], ok: índice }. El antiguo { q, ok: texto, no: "a|b" } se convierte.
      const ops = Array.isArray(x.ops)
        ? x.ops.slice(0, 4).map(o => txt(o, 100))
        : [x.ok, ...String(x.no || "").split("|")].map(o => txt(String(o || "").trim(), 100)).slice(0, 4);
      while (ops.length < 4) ops.push("");
      const ok = Array.isArray(x.ops) ? Math.min(3, Math.max(0, Math.round(+x.ok || 0))) : 0;
      return { q: txt(x.q, 200), ops, ok };
    }),
    telDe: tel(d.telDe), telPara: tel(d.telPara),
    tema: TEMAS.includes(d.tema) ? d.tema : "pasion",
    fondo: FONDOS.includes(d.fondo) ? d.fondo : "corazones",
    cielo: {
      on: !!(d.cielo && d.cielo.on),
      ciudad: d.cielo && CIUDADES.includes(d.cielo.ciudad) ? d.cielo.ciudad : "santiago",
      f: fecha(d.cielo && d.cielo.f),
      h: /^\d{2}:\d{2}$/.test((d.cielo && d.cielo.h) || "") ? d.cielo.h : "22:00"
    },
    wrapped: !!d.wrapped,
    ruleta: {
      on: !!(d.ruleta && d.ruleta.on),
      items: (Array.isArray(d.ruleta && d.ruleta.items) ? d.ruleta.items : []).slice(0, 8).map(x => txt(x, 40))
    },
    citas: (Array.isArray(d.citas) ? d.citas : []).slice(0, 15).map(x => txt(x, 80)).filter(Boolean),
    cartas: lista(d.cartas, 5).map(x => ({ t: txt(x.t, 60), x: txt(x.x, 1000) })),
    // secciones que quien regala apagó con su interruptor
    ocultas: (Array.isArray(d.ocultas) ? d.ocultas : []).filter(x => ["fotos", "razones", "cancion", "video", "voz", "carta", "cielo", "historia", "juegos", "citas", "sorpresa"].includes(x)),
    razones: lista(d.razones, 10).map(r => ({ t: txt(r.t, 160), ruta: ruta(r.ruta), peso: ruta(r.ruta) ? num(r.peso) : 0, orig: ruta(r.ruta) ? num(r.orig) : 0 })),
    fotos: lista(d.fotos, 20)
      .filter(f => ruta(f.ruta) && ruta(f.mini))
      .map(f => ({ ruta: f.ruta, mini: f.mini, cap: txt(f.cap, 120), peso: num(f.peso), orig: num(f.orig) })),
    video: media(d.video),
    voz: media(d.voz)
  });
}

/* Cuaderno de citas: lista compartida { id, t (texto), e ("p" pendiente | "h" hecha), f (fecha), n (recuerdo) }.
   Parte con las ideas que eligió quien regala; después la editan los dos desde el regalo. */
const MAX_CITAS = 40;
const fechaOk = f => /^\d{4}-\d{2}-\d{2}$/.test(f || "") ? f : "";
const citaLimpia = c => ({
  id: String(c.id || rand(4)).replace(/[^a-z0-9]/g, "").slice(0, 12) || rand(4),
  t: String(c.t || "").slice(0, 80), e: c.e === "h" ? "h" : "p", f: fechaOk(c.f), n: String(c.n || "").slice(0, 300)
});
const semilla = citas => (citas || []).map(t => citaLimpia({ t }));
const cuadernoDe = d => Array.isArray(d && d.cuaderno) ? d.cuaderno.map(citaLimpia).filter(c => c.t) : semilla(d && d.citas);
// Si quien regala cambia las ideas en el editor: agrega las nuevas y quita las pendientes que desmarcó.
function ajustarCuaderno(viejo, nuevo) {
  const cu = cuadernoDe(viejo), antes = (viejo && viejo.citas) || [], ahora = nuevo.citas || [];
  const quitadas = antes.filter(t => !ahora.includes(t));
  const out = cu.filter(c => !(c.e === "p" && quitadas.includes(c.t)));
  ahora.filter(t => !antes.includes(t) && !out.some(c => c.t === t)).forEach(t => out.push(citaLimpia({ t })));
  return out.slice(0, MAX_CITAS);
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!URL_ || !KEY) { res.status(503).json({ error: "Falta configurar la base de datos" }); return; }
  try {
    const base = URL_ + "/storage/v1/object/public/" + BUCKET + "/";

    if (req.method === "GET") {
      const q = req.query || {};
      if (q.ping) { res.status(200).json({ ok: true }); return; }
      if (q.vapid) { res.status(200).json({ publica: PUSH.llaves().publica }); return; }
      if (q.manifest != null) {
        // Manifest de la app instalable: una app por regalo, que abre ese regalo
        const slug = slugOk(q.manifest);
        let d = {};
        if (slug) { const r = await db("amor_regalos?select=datos&slug=eq." + slug); d = (r.ok && Array.isArray(r.j) && r.j[0] && r.j[0].datos) || {}; }
        const marca = MARCAS[tipoDe(d).tipo] || "Con amor", color = COLORES[d.tema] || COLORES.pasion;
        const inicio = "/amor/" + (slug ? "?r=" + slug : "");
        res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=300");
        res.status(200).send(JSON.stringify({
          id: inicio, name: d.para ? marca + " · " + String(d.para).slice(0, 20) : marca, short_name: marca,
          description: "Un regalo con fotos, cartas, juegos y un Virtual Monster para cuidar entre los dos.",
          start_url: inicio, scope: "/amor/", display: "standalone", orientation: "portrait", lang: "es-CL",
          background_color: "#14060d", theme_color: color,
          icons: [
            { src: "/amor/icono-192.png", sizes: "192x192", type: "image/png" },
            { src: "/amor/icono-512.png", sizes: "512x512", type: "image/png" },
            { src: "/amor/icono-mask-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
          shortcuts: slug ? [{ name: "Virtual Monster", url: "/amor/mascota/?r=" + slug, icons: [{ src: "/amor/mascota/icono-192.png", sizes: "192x192" }] }] : []
        }));
        return;
      }
      if (q.r) {
        const slug = slugOk(q.r);
        const r = await db("amor_regalos?select=id,slug,token_hash,datos&slug=eq." + slug);
        if (!r.ok) { res.status(502).json({ error: "No se pudo leer el regalo" }); return; }
        const row = Array.isArray(r.j) && r.j[0];
        if (!row) {
          if (CODIGO.test(slug)) { res.status(200).json({ registro: false, codigo: slug }); return; }
          res.status(404).json({ error: "Este regalo no existe" }); return;
        }
        const d = row.datos || {};
        if (d._priv && d._priv.off) { res.status(200).json({ off: true, slug: row.slug, de: d.de || "" }); return; }
        const soy = quienEs(row, (req.headers || {})["x-sesion"]);
        if (protegido(d) && !soy) {
          // Con contraseña de quien recibe: solo lo justo para la pantalla del candado
          const t = tipoDe(d);
          res.status(200).json({ bloqueado: true, slug: row.slug, de: d.de || "", para: d.para || "", tipo: t.tipo, rolDe: t.rolDe, rolPara: t.rolPara, tema: d.tema || "pasion", fondo: d.fondo || "corazones" });
          return;
        }
        const ab = d._abierto || null;
        res.status(200).json({ slug: row.slug, datos: publico(d), base, soy, protegido: protegido(d), abierto: !!ab, juegos: !!(ab && ab.juegos) });
        return;
      }
      const row = await duenio(q.id, q.k);
      if (!row) { res.status(401).json({ error: "El link de edición no es válido" }); return; }
      const pv = (row.datos && row.datos._priv) || {};
      res.status(200).json({ id: row.id, slug: row.slug, datos: publico(row.datos), base,
        perfil: { email: pv.email || "", off: !!pv.off, conClave: String(row.token_hash).startsWith("scrypt$"), paraClave: !!pv.passPara } });
      return;
    }

    if (req.method !== "POST") { res.status(405).end(); return; }
    let b = req.body;
    if (typeof b === "string") { try { b = JSON.parse(b); } catch (_) { b = {}; } }
    b = b || {};

    if (b.accion === "crear") {
      const id = crypto.randomUUID(), token = rand(24);
      const datos = limpiar(b.datos, id);
      datos.cuaderno = semilla(datos.citas);
      for (let i = 0; i < 4; i++) {
        const slug = slugDe(datos) + "-" + rand(2);
        const r = await db("amor_regalos", {
          method: "POST", headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ id, slug, token_hash: hash(token), datos })
        });
        if (r.ok) { res.status(200).json({ id, slug, token }); return; }
        if (r.status !== 409) break;
      }
      res.status(502).json({ error: "No se pudo crear el regalo" });
      return;
    }

    if (b.accion === "registrar" || b.accion === "entrar") {
      const slug = String(b.r || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
      const pass = String(b.pass || "");
      const r0 = await db("amor_regalos?select=id,token_hash&slug=eq." + slug);
      const fila = r0.ok && Array.isArray(r0.j) && r0.j[0];
      if (b.accion === "entrar") {
        if (!fila || !passOk(pass, fila.token_hash)) { res.status(401).json({ error: "La contraseña no es correcta" }); return; }
        res.status(200).json({ id: fila.id, slug, token: sesion(fila.id, fila.token_hash) }); return;
      }
      if (fila) { res.status(409).json({ error: "Esta tarjeta ya está registrada" }); return; }
      if (!CODIGO.test(slug)) { res.status(400).json({ error: "El código de la tarjeta no es válido" }); return; }
      const de = b.de || {}, para = b.para || {}, email = String(de.email || "").trim().toLowerCase().slice(0, 120);
      if (!String(de.nombre || "").trim() || !String(para.nombre || "").trim()) { res.status(400).json({ error: "Faltan los nombres" }); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { res.status(400).json({ error: "Revisa el correo" }); return; }
      if (pass.length < 6) { res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" }); return; }
      if (!TIPOS_REGALO.includes(b.tipo)) { res.status(400).json({ error: "Elige el tipo de regalo" }); return; }
      if (b.tipo === "familia" && !rolesOk(b.rolDe, b.rolPara)) { res.status(400).json({ error: "Elige quién eres tú y a quién se lo regalas" }); return; }
      const id = crypto.randomUUID(), th = passHash(pass);
      const datos = limpiar(Object.assign({ tema: "pasion", wrapped: true }, b.datos || {}, {
        de: de.nombre, para: para.nombre, telDe: de.tel, telPara: para.tel,
        tipo: b.tipo, rolDe: b.rolDe, rolPara: b.rolPara }), id);
      datos.cuaderno = semilla(datos.citas);
      datos._priv = { email, registrado: new Date().toISOString() };
      const r = await db("amor_regalos", { method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ id, slug, token_hash: th, datos }) });
      if (!r.ok) { res.status(r.status === 409 ? 409 : 502).json({ error: r.status === 409 ? "Esta tarjeta ya está registrada" : "No se pudo registrar" }); return; }
      res.status(200).json({ id, slug, token: sesion(id, th) });
      return;
    }

    if (b.accion === "cuaderno") {
      const slug = slugOk(b.r), op = b.op || {};
      if (op.tipo === "leer") {
        const r0 = await db("amor_regalos?select=id,token_hash,datos&slug=eq." + slug);
        const fila = r0.ok && Array.isArray(r0.j) && r0.j[0];
        const rv = revisar(fila, b.s); if (rv.status) { res.status(rv.status).json(rv.j); return; }
        res.status(200).json({ cuaderno: cuadernoDe(fila.datos) }); return;
      }
      let filaOk = null;
      const out = await cambiar("slug=eq." + slug, fila => {
        const rv = revisar(fila, b.s); if (rv.status) return rv;
        filaOk = fila;
        const cu = cuadernoDe(fila.datos), i = cu.findIndex(c => c.id === op.id);
        if (op.tipo === "agregar") {
          const t = String(op.t || "").trim().slice(0, 80);
          if (!t) return corta(400, "Escribe la cita");
          if (cu.length >= MAX_CITAS) return corta(413, "El cuaderno está lleno (40 citas)");
          cu.push(citaLimpia({ t, f: op.f }));
        } else if (op.tipo === "editar" && i >= 0) {
          const c = op.cambios || {};
          cu[i] = citaLimpia(Object.assign({}, cu[i], ["e", "f", "n"].reduce((o, k) => (k in c ? (o[k] = c[k], o) : o), {})));
        } else if (op.tipo === "borrar" && i >= 0) {
          cu.splice(i, 1);
        } else return corta(400, "Esa cita ya no existe");
        return { cambio: { datos: Object.assign({}, fila.datos, { cuaderno: cu }) }, ok: { cuaderno: cu } };
      }, "No se pudo guardar el cuaderno");
      if (out.status === 200 && op.tipo === "agregar" && filaOk) {
        const d = filaOk.datos, cupon = tipoDe(d).tipo === "familia";
        await avisar(filaOk, [{ para: "", aviso: { title: cupon ? "🎟️ Cupón nuevo" : "📒 Idea nueva en el cuaderno", body: txtAviso(op.t, 80),
          url: "/amor/?r=" + slug + "#secCuad", tag: "cuaderno-" + slug } }], String(b.ep || ""));
      }
      res.status(out.status).json(out.j);
      return;
    }

    /* Virtual Monster compartido: el estado completo lo arma el celular; el servidor guarda la versión más nueva
       y rechaza una escritura hecha sobre una versión vieja (así no se pisan los dos celulares). */
    if (b.accion === "mascota") {
      const slug = slugOk(b.r);
      if (b.op === "leer") {
        const r0 = await db("amor_regalos?select=id,token_hash,datos&slug=eq." + slug);
        if (!r0.ok) { res.status(502).json({ error: "No se pudo leer la mascota" }); return; }
        const fila = Array.isArray(r0.j) && r0.j[0];
        const rv = revisar(fila, b.s); if (rv.status) { res.status(rv.status).json(rv.j); return; }
        const m = fila.datos._mascota;
        if (!m) { res.status(200).json({ v: 0, estado: null, soy: rv.soy }); return; }
        if (b.v != null && +b.v === m.v) { res.status(200).json({ v: m.v, igual: true, soy: rv.soy }); return; }
        res.status(200).json({ v: m.v, estado: m.s, at: m.at, soy: rv.soy }); return;
      }
      if (b.op !== "guardar") { res.status(400).json({ error: "Acción desconocida" }); return; }
      const e = b.estado;
      if (!e || typeof e !== "object" || Array.isArray(e) || typeof e.fase !== "string") { res.status(400).json({ error: "Estado de la mascota no válido" }); return; }
      const txt = JSON.stringify(e);
      if (txt.length > MAX_MASCOTA) { res.status(413).json({ error: "La mascota tiene demasiados datos" }); return; }
      const prog = Array.isArray(b.avisos) ? avisosLimpios(b.avisos) : null;
      let filaOk = null;
      const out = await cambiar("slug=eq." + slug, fila => {
        const rv = revisar(fila, b.s); if (rv.status) return rv;
        filaOk = fila;
        const m = fila.datos._mascota || { v: 0 };
        if (Math.round(+b.v || 0) !== m.v) return { status: 409, j: { error: "La mascota cambió en el otro celular", conflicto: true, v: m.v, estado: m.s || null } };
        const nuevo = { v: m.v + 1, s: JSON.parse(txt), at: Date.now() };
        let datos = Object.assign({}, fila.datos, { _mascota: nuevo });
        if (prog) datos = conAvisos(datos, prog);
        return { cambio: { datos }, ok: { v: nuevo.v, at: nuevo.at } };
      }, "No se pudo guardar la mascota");
      // Avisos inmediatos que manda el celular: [{para, title, body}] (mensaje nuevo, lista para evolucionar, nació…)
      if (out.status === 200 && filaOk && Array.isArray(b.ya) && b.ya.length) {
        await avisar(filaOk, b.ya.slice(0, 3).filter(x => x && x.body).map(x => ({ para: persona(x.para),
          aviso: { title: txtAviso(x.title || "Virtual Monster", 60), body: txtAviso(x.body, 140), url: "/amor/mascota/?r=" + slug, tag: "monster-" + slug + "-" + txtAviso(x.k, 20) } })),
          String(b.ep || ""));
      }
      res.status(out.status).json(out.j);
      return;
    }

    /* Avisos en este celular: guarda o borra su suscripción (máx. 8 por regalo) */
    if (b.accion === "push") {
      const slug = slugOk(b.r);
      const nueva = b.op === "alta" ? PUSH.subLimpia(b.sub, b.quien) : null;
      if (b.op === "alta" && !nueva) { res.status(400).json({ error: "No se pudieron activar los avisos en este celular" }); return; }
      const ep = nueva ? nueva.ep : String(b.ep || "");
      const out = await cambiar("slug=eq." + slug, fila => {
        const rv = revisar(fila, b.s); if (rv.status) return rv;
        let subs = (fila.datos._push || []).filter(x => x.ep !== ep);
        if (nueva) subs = [nueva, ...subs].slice(0, PUSH.MAX_SUBS);
        return { cambio: { datos: Object.assign({}, fila.datos, { _push: subs }) }, ok: { ok: true, activos: !!nueva } };
      }, "No se pudieron guardar los avisos");
      res.status(out.status).json(out.j);
      return;
    }

    /* Regalo abierto: al volver a cargarlo se muestra el menú (Ver regalo, VirPet Monster, Escape Room) en cualquier celular.
       Se guarda en datos._abierto = { at (primera vez), juegos (desbloqueó los juegos), atJuegos }. Quien regala no lo marca. */
    if (b.accion === "abierto") {
      const slug = slugOk(b.r);
      const out = await cambiar("slug=eq." + slug, fila => {
        const rv = revisar(fila, b.s); if (rv.status) return rv;
        const ab = fila.datos._abierto || null;
        if (rv.soy === "de") return { status: 200, j: { abierto: !!ab, juegos: !!(ab && ab.juegos) } };
        if (ab && (ab.juegos || !b.juegos)) return { status: 200, j: { abierto: true, juegos: !!ab.juegos } }; // nada nuevo: no escribe
        const nuevo = Object.assign({ at: Date.now() }, ab || {});
        if (b.juegos) { nuevo.juegos = true; nuevo.atJuegos = Date.now(); }
        return { cambio: { datos: Object.assign({}, fila.datos, { _abierto: nuevo }) }, ok: { abierto: true, juegos: !!nuevo.juegos } };
      }, "No se pudo guardar");
      res.status(out.status).json(out.j);
      return;
    }

    /* Contraseña de quien recibe (opcional): con ella, nadie más abre el regalo aunque toque la tarjeta */
    if (b.accion === "entrarPara") {
      const r0 = await db("amor_regalos?select=id,datos&slug=eq." + slugOk(b.r));
      const fila = r0.ok && Array.isArray(r0.j) && r0.j[0];
      if (!fila) { res.status(404).json({ error: "Este regalo no existe" }); return; }
      const pv = privDe(fila.datos);
      if (pv.off) { res.status(403).json({ error: "Este regalo está deshabilitado" }); return; }
      if (!pv.passPara) { res.status(400).json({ error: "Este regalo no tiene contraseña" }); return; }
      if (!passOk(String(b.pass || ""), pv.passPara)) { res.status(401).json({ error: "La contraseña no es correcta" }); return; }
      res.status(200).json({ token: sesionPara(fila.id, pv.passPara) });
      return;
    }
    if (b.accion === "clavePara") {
      const out = await cambiar("slug=eq." + slugOk(b.r), async fila => {
        if (!fila) return corta(404, "Este regalo no existe");
        const pv = Object.assign({}, privDe(fila.datos));
        if (pv.off) return corta(403, "Este regalo está deshabilitado");
        const soy = quienEs(fila, b.s);
        if (soy === "de") return corta(403, "Esta contraseña es solo de quien recibe el regalo");
        if (pv.passPara && !(soy === "para" && passOk(String(b.passActual || ""), pv.passPara))) return corta(401, "La contraseña actual no es correcta");
        let ok;
        if (b.quitar) { delete pv.passPara; delete pv.emailPara; ok = { ok: true, protegido: false }; }
        else {
          const nueva = String(b.passNueva || "");
          if (nueva.length < 6) return corta(400, "La contraseña debe tener al menos 6 caracteres");
          const email = String(b.email || "").trim().toLowerCase().slice(0, 120);
          if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return corta(400, "Revisa el correo");
          pv.passPara = passHash(nueva);
          if ("email" in b) pv.emailPara = email;
          ok = { ok: true, protegido: true, token: sesionPara(fila.id, pv.passPara) };
        }
        return { cambio: { datos: Object.assign({}, fila.datos, { _priv: pv }) }, ok };
      }, "No se pudo guardar la contraseña");
      res.status(out.status).json(out.j);
      return;
    }

    const row = await duenio(b.id, b.token);
    if (!row) { res.status(401).json({ error: "El link de edición no es válido" }); return; }

    if (b.accion === "guardar") {
      const limpio = limpiar(b.datos, row.id);
      if (JSON.stringify(limpio).length > 80000) { res.status(413).json({ error: "El regalo tiene demasiado texto" }); return; }
      const peso = pesoDe(await archivos(row.id));
      const out = await cambiar("id=eq." + row.id, fila => {
        if (!fila || quienEs(fila, b.token) !== "de") return corta(401, "El link de edición no es válido");
        const datos = Object.assign({}, limpio, privados(fila.datos)); // correo, contraseña de quien recibe y mascota: no se pisan
        datos.cuaderno = ajustarCuaderno(fila.datos, limpio); // el cuaderno lo editan los dos: no se pisa
        return { cambio: { datos, peso }, ok: { ok: true, peso } };
      });
      res.status(out.status).json(out.j);
      return;
    }

    if (b.accion === "perfil") {
      const out = await cambiar("id=eq." + row.id, fila => {
        if (!fila || quienEs(fila, b.token) !== "de") return corta(401, "El link de edición no es válido");
        const pv = Object.assign({}, privDe(fila.datos)), cambio = {};
        if ("email" in b) {
          const email = String(b.email || "").trim().toLowerCase().slice(0, 120);
          if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return corta(400, "Revisa el correo");
          pv.email = email;
        }
        if ("off" in b) pv.off = !!b.off;
        if (b.quitarPara) { delete pv.passPara; delete pv.emailPara; } // si quien recibe olvidó su contraseña
        let th = fila.token_hash;
        if (b.passNueva != null) {
          const nueva = String(b.passNueva);
          if (nueva.length < 6) return corta(400, "La contraseña debe tener al menos 6 caracteres");
          if (String(th).startsWith("scrypt$") && !passOk(String(b.passActual || ""), th)) return corta(401, "La contraseña actual no es correcta");
          th = cambio.token_hash = passHash(nueva);
        }
        cambio.datos = Object.assign({}, fila.datos, { _priv: pv });
        return { cambio, ok: { ok: true, perfil: { email: pv.email || "", off: !!pv.off, conClave: String(th).startsWith("scrypt$"), paraClave: !!pv.passPara },
          token: cambio.token_hash ? sesion(fila.id, th) : undefined } };
      }, "No se pudo guardar el perfil");
      res.status(out.status).json(out.j);
      return;
    }

    if (b.accion === "subir") {
      const ext = TIPOS[String(b.tipo || "").split(";")[0]];
      if (!ext) { res.status(415).json({ error: "Ese tipo de archivo no se puede subir" }); return; }
      const bytes = Math.round(+b.bytes || 0);
      if (bytes <= 0 || bytes > MAX_ARCHIVO) { res.status(413).json({ error: "Cada archivo puede pesar hasta 8 MB" }); return; }
      const fs = await archivos(row.id);
      if (fs.length >= MAX_ARCHIVOS) { res.status(413).json({ error: "Llegaste al máximo de archivos" }); return; }
      if (pesoDe(fs) + bytes > CUOTA) { res.status(413).json({ error: "Se acabó el espacio del regalo (15 MB)" }); return; }
      const clase = String(b.clase || "archivo").replace(/[^a-z]/g, "").slice(0, 10) || "archivo";
      const ruta = row.id + "/" + clase + "-" + rand(6) + "." + ext;
      const r = await st("object/upload/sign/" + BUCKET + "/" + ruta, { method: "POST", body: "{}" });
      if (!r.ok || !r.j || !r.j.url) { res.status(502).json({ error: "No se pudo preparar la subida" }); return; }
      res.status(200).json({ ruta, subida: URL_ + "/storage/v1" + r.j.url });
      return;
    }

    if (b.accion === "borrar") {
      const rutas = (Array.isArray(b.rutas) ? b.rutas : [])
        .filter(x => typeof x === "string" && x.startsWith(row.id + "/") && RUTA.test(x)).slice(0, 5);
      if (rutas.length) await st("object/" + BUCKET, { method: "DELETE", body: JSON.stringify({ prefixes: rutas }) });
      res.status(200).json({ ok: true });
      return;
    }

    res.status(400).json({ error: "Acción desconocida" });
  } catch (e) {
    console.error("REGALO_ERROR " + e.message);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Para /api/avisos (el envío programado cada 10 minutos)
module.exports.interno = { db: (p, o) => db(p, o), cambiar: (f, fn, e) => cambiar(f, fn, e), avisar: (f, i, s) => avisar(f, i, s), conAvisos: (d, l) => conAvisos(d, l) };
