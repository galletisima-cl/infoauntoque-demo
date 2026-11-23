// Guarda y entrega los regalos de amor (todavía sin cobro).
//   GET  /api/regalo?r=SLUG          → regalo público (lo que ve la pareja)
//   GET  /api/regalo?id=ID&k=TOKEN   → regalo para editar
//   POST {accion:"crear", datos}     → crea el regalo y devuelve id, slug y token de edición
//   POST {accion:"guardar"|"subir"|"borrar", id, token, ...}
// Requiere SUPABASE_URL y SUPABASE_SERVICE_KEY (las mismas de /api/track).
const crypto = require("crypto");

const URL_ = process.env.SUPABASE_URL;
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
const rand = n => crypto.randomBytes(n).toString("hex");
const esId = s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(String(s || ""));
const RUTA = /^[0-9a-f-]{36}\/[a-z]+-[0-9a-f]+\.[a-z0-9]+$/;

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

async function duenio(id, token) {
  if (!esId(id) || !token) return null;
  const r = await db("amor_regalos?select=id,slug,token_hash,datos&id=eq." + id);
  const row = r.ok && Array.isArray(r.j) && r.j[0];
  if (!row) return null;
  const a = Buffer.from(row.token_hash), b = Buffer.from(hash(token));
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
  return {
    de: txt(d.de, 40), para: txt(d.para, 40), fecha: fecha(d.fecha),
    cancion: txt(d.cancion, 300), yt: txt(d.yt, 300),
    carta: txt(d.carta, 5000), final: txt(d.final, 1500),
    tl: lista(d.tl, 30).map(x => ({ f: fecha(x.f), t: txt(x.t, 200) })),
    qs: lista(d.qs, 10).map(x => ({ q: txt(x.q, 200), ok: txt(x.ok, 100), no: txt(x.no, 300) })),
    fotos: lista(d.fotos, 20)
      .filter(f => ruta(f.ruta) && ruta(f.mini))
      .map(f => ({ ruta: f.ruta, mini: f.mini, cap: txt(f.cap, 120), peso: num(f.peso), orig: num(f.orig) })),
    video: media(d.video),
    voz: media(d.voz)
  };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!URL_ || !KEY) { res.status(503).json({ error: "Falta configurar la base de datos" }); return; }
  try {
    const base = URL_ + "/storage/v1/object/public/" + BUCKET + "/";

    if (req.method === "GET") {
      const q = req.query || {};
      if (q.ping) { res.status(200).json({ ok: true }); return; }
      if (q.r) {
        const slug = String(q.r).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
        const r = await db("amor_regalos?select=slug,datos&slug=eq." + slug);
        const row = r.ok && Array.isArray(r.j) && r.j[0];
        if (!row) { res.status(404).json({ error: "Este regalo no existe" }); return; }
        res.status(200).json({ slug: row.slug, datos: row.datos, base });
        return;
      }
      const row = await duenio(q.id, q.k);
      if (!row) { res.status(401).json({ error: "El link de edición no es válido" }); return; }
      res.status(200).json({ id: row.id, slug: row.slug, datos: row.datos, base });
      return;
    }

    if (req.method !== "POST") { res.status(405).end(); return; }
    let b = req.body;
    if (typeof b === "string") { try { b = JSON.parse(b); } catch (_) { b = {}; } }
    b = b || {};

    if (b.accion === "crear") {
      const id = crypto.randomUUID(), token = rand(24);
      const datos = limpiar(b.datos, id);
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

    const row = await duenio(b.id, b.token);
    if (!row) { res.status(401).json({ error: "El link de edición no es válido" }); return; }

    if (b.accion === "guardar") {
      const datos = limpiar(b.datos, row.id);
      if (JSON.stringify(datos).length > 80000) { res.status(413).json({ error: "El regalo tiene demasiado texto" }); return; }
      const peso = pesoDe(await archivos(row.id));
      const r = await db("amor_regalos?id=eq." + row.id, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ datos, peso, updated_at: new Date().toISOString() })
      });
      if (!r.ok) { res.status(502).json({ error: "No se pudo guardar" }); return; }
      res.status(200).json({ ok: true, peso });
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
