// Envío programado de avisos del Virtual Monster (lo llama el cron de Vercel cada 10 minutos, ver vercel.json).
// Cada regalo guarda en datos._avisos los avisos que calculó la mascota (hambre, caca, luz, tristeza…) y en datos._prox el más próximo.
// Aquí se toman los que ya vencieron, se sacan de la lista y se mandan. Los que vencieron hace más de 2 horas se descartan.
const R = require("./regalo").interno;

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) { res.status(503).json({ error: "Falta configurar la base de datos" }); return; }
  try {
    const ahora = Date.now(), corte = ahora + 60000;
    const r = await R.db("amor_regalos?select=id,slug,datos&datos->>_prox=lt." + corte + "&limit=300");
    if (!r.ok) { res.status(502).json({ error: "No se pudo leer" }); return; }
    let enviados = 0;
    for (const fila of r.j || []) {
      const d = fila.datos || {};
      // primero se sacan de la lista, para no mandarlos dos veces si el cron corre dos veces seguidas
      const out = await R.cambiar("id=eq." + fila.id, f => f
        ? { cambio: { datos: R.conAvisos(f.datos, (f.datos._avisos || []).filter(a => a.t > corte)) }, ok: {} }
        : { status: 404, j: {} });
      if (out.status !== 200) continue;
      if (d._priv && d._priv.off) continue;
      const frescos = (d._avisos || []).filter(a => a.t <= corte && a.t > ahora - 2 * 3600000);
      if (!frescos.length) continue;
      const nombre = (d._mascota && d._mascota.s && d._mascota.s.nombre) || "Virtual Monster";
      await R.avisar(fila, frescos.map(a => ({ para: a.para,
        aviso: { title: nombre, body: a.txt, url: "/amor/mascota/?r=" + fila.slug, tag: "monster-" + fila.slug + "-" + (a.k || "aviso") } })));
      enviados += frescos.length;
    }
    res.status(200).json({ ok: true, regalos: (r.j || []).length, enviados });
  } catch (e) {
    console.error("AVISOS_ERROR " + e.message);
    res.status(500).json({ error: "Error del servidor" });
  }
};
