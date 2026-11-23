# InfoAUnToque · demo de perfil digital NFC

Página estática + funciones serverless que guardan eventos anónimos y muestran un informe.

## URL de cada tag
    https://TU-PROYECTO.vercel.app/?n=NEGOCIO&s=nfc&p=PIEZA

- `n` = id del negocio (demo, barberia-x...)
- `s` = origen (`nfc` o `qr`)
- `p` = id de la pieza (mesa1, caja, barbero1...)

## Guardar eventos (Supabase)
1. Usa un proyecto de Supabase existente (o crea uno) y ejecuta `supabase/schema.sql` en SQL Editor. La tabla se llama `infoauntoque_eventos`, así no choca con otras tablas del proyecto.
2. En Vercel → proyecto → Settings → Environment Variables, agrega:
   - `SUPABASE_URL` (Project Settings → API → Project URL)
   - `SUPABASE_SERVICE_KEY` (clave `service_role`; es secreta, nunca la pegues en un chat ni en el código)
   - `INFORME_TOKEN` (una clave larga inventada por ti, para proteger el informe)
3. Redeploy (Deployments → ⋯ → Redeploy).

Sin esas variables, los eventos solo se ven en Vercel → Logs buscando `TRACK`.

## Informe para el dueño
    https://TU-PROYECTO.vercel.app/api/informe?n=NEGOCIO&k=INFORME_TOKEN&dias=7

Muestra toques, clics por botón, origen NFC/QR, piezas, horas y días. Anónimo: no guarda IP ni cookies.

## Personalizar
Edita el objeto NEGOCIO al inicio del script en `index.html`.

## Regalo de amor (`/amor`)
Regalo digital para parejas con QR: fotos, canción, carta, línea del tiempo, voz, video, preguntas y sorpresa final. Todavía sin cobro (todos quedan en estado `borrador`).

1. En Supabase → SQL Editor ejecuta `supabase/amor.sql` (crea la tabla `amor_regalos` y el bucket `amor`).
2. Usa las mismas variables `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` de arriba; no hace falta ninguna nueva.
3. Redeploy.

- Crear o editar: `https://TU-PROYECTO.vercel.app/amor/`
- Link del regalo (el que va en el QR): `/amor/?r=SLUG`
- Link secreto de edición: `/amor/?editar=ID&k=TOKEN` (se muestra al guardar y queda recordado en ese navegador)

Las fotos, la voz y el video se comprimen en el celular y se suben directo a Supabase Storage con un link firmado; `/api/regalo` controla el tope de 15 MB por regalo y 8 MB por archivo.
