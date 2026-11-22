-- Tabla de eventos anónimos (sin IP, sin cookies, sin datos personales).
create table if not exists public.infoauntoque_eventos (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  negocio     text not null default 'demo',
  evento      text not null,   -- view | click_whatsapp | click_resena | ...
  origen      text,            -- nfc | qr | directo
  pieza       text,            -- mesa1, caja, barbero1...
  dispositivo text             -- ios | android | otro
);

create index if not exists infoauntoque_eventos_negocio_fecha
  on public.infoauntoque_eventos (negocio, created_at desc);

-- Seguridad: sin políticas, solo la clave de servicio (que vive en el servidor
-- de Vercel) puede leer y escribir. Nadie puede acceder desde el navegador.
alter table public.infoauntoque_eventos enable row level security;
