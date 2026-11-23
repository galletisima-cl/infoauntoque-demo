-- Regalos de amor (todavía sin cobro).
-- Ejecutar una vez en Supabase → SQL Editor.

create table if not exists public.amor_regalos (
  id          uuid primary key,
  slug        text not null unique,          -- va en el link del QR: /amor/?r=slug
  token_hash  text not null,                 -- hash del link secreto de edición
  estado      text not null default 'borrador', -- borrador | pagado (cuando exista el cobro)
  datos       jsonb not null default '{}'::jsonb,
  peso        integer not null default 0,    -- bytes usados en Storage
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists amor_regalos_estado_fecha
  on public.amor_regalos (estado, created_at);

-- Sin políticas: solo la clave de servicio (en Vercel) lee y escribe.
alter table public.amor_regalos enable row level security;

-- Bucket público para fotos, voz y video (las rutas llevan un id aleatorio).
-- Tope de 8 MB por archivo; la cuota de 15 MB por regalo la controla /api/regalo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'amor', 'amor', true, 8388608,
  array['image/webp','image/jpeg',
        'audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/x-m4a','audio/aac',
        'video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
