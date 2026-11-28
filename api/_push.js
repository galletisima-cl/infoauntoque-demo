// Notificaciones push (Web Push) del regalo y del Virtual Monster. Archivo con "_": Vercel no lo publica como ruta.
// Las llaves VAPID se derivan de SUPABASE_SERVICE_KEY (igual que las firmas de sesión): no hay variables nuevas.
// Si alguna vez cambia la service key, cambian las llaves y cada celular tiene que volver a activar los avisos.
const crypto = require("crypto");
const webpush = require("web-push");

const b64u = b => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
let LLAVES = null;
function llaves() {
  if (LLAVES) return LLAVES;
  const base = String(process.env.SUPABASE_SERVICE_KEY || "");
  for (let i = 0; i < 20; i++) {
    const d = crypto.createHmac("sha256", "amor-vapid:" + base).update(String(i)).digest();
    try {
      const e = crypto.createECDH("prime256v1"); e.setPrivateKey(d);
      LLAVES = { publica: b64u(e.getPublicKey()), privada: b64u(d) };
      webpush.setVapidDetails("https://infoauntoque-demo.vercel.app", LLAVES.publica, LLAVES.privada);
      return LLAVES;
    } catch (_) { /* número fuera de la curva (casi imposible): prueba el siguiente */ }
  }
  throw new Error("No se pudieron crear las llaves VAPID");
}

// Una suscripción guardada: { ep, k:{p256dh, auth}, q: "Él" | "Ella", at }
const MAX_SUBS = 8;
function subLimpia(s, q) {
  const ep = String(s && s.endpoint || "");
  const k = (s && s.keys) || {};
  if (!/^https:\/\/[^\s]{10,800}$/.test(ep) || !/^[A-Za-z0-9_-]{20,200}$/.test(k.p256dh || "") || !/^[A-Za-z0-9_-]{8,100}$/.test(k.auth || "")) return null;
  return { ep, k: { p256dh: k.p256dh, auth: k.auth }, q: q === "Ella" ? "Ella" : q === "Él" ? "Él" : "", at: Date.now() };
}

/* Manda {title, body, url, tag} a las suscripciones del regalo.
   para: "Él" | "Ella" (solo a esa persona) o "" (a todos); sin: endpoint que no recibe (el celular que hizo el cambio).
   Devuelve los endpoints que ya no existen (el celular desinstaló o quitó el permiso), para borrarlos. */
async function enviar(subs, aviso, para, sin) {
  llaves();
  const muertas = [];
  const destino = (Array.isArray(subs) ? subs : []).filter(s => s && s.ep && s.ep !== sin && (!para || !s.q || s.q === para));
  await Promise.all(destino.map(async s => {
    try {
      await webpush.sendNotification({ endpoint: s.ep, keys: s.k }, JSON.stringify(aviso), { TTL: 6 * 3600, urgency: "normal", timeout: 8000 });
    } catch (e) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) muertas.push(s.ep);
      else console.error("PUSH_ERROR " + (e && (e.statusCode || e.message)));
    }
  }));
  return muertas;
}

module.exports = { llaves, subLimpia, enviar, MAX_SUBS };
