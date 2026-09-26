-- Mesa Sonora: configuração do banco (rode uma vez no SQL Editor do Supabase)

create table if not exists public.sounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('music','ambient','sfx')),
  source text not null default 'file' check (source in ('file','youtube')),
  url text,
  yt_id text,
  storage_path text,
  volume real default 0.8,
  duration real,
  created_at timestamptz not null default now()
);

create table if not exists public.live_state (
  id int primary key default 1 check (id = 1),
  music jsonb,
  amb jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
insert into public.live_state (id) values (1) on conflict do nothing;

alter table public.sounds enable row level security;
alter table public.live_state enable row level security;

drop policy if exists "todos leem sons" on public.sounds;
drop policy if exists "mestre edita sons" on public.sounds;
drop policy if exists "todos leem estado" on public.live_state;
drop policy if exists "mestre edita estado" on public.live_state;
create policy "todos leem sons" on public.sounds for select using (true);
create policy "mestre edita sons" on public.sounds for all to authenticated using (true) with check (true);
create policy "todos leem estado" on public.live_state for select using (true);
create policy "mestre edita estado" on public.live_state for all to authenticated using (true) with check (true);

-- tempo real
do $$ begin
  begin alter publication supabase_realtime add table public.sounds; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.live_state; exception when duplicate_object then null; end;
end $$;

-- armazenamento dos arquivos enviados
insert into storage.buckets (id, name, public, file_size_limit)
values ('sons', 'sons', true, 52428800)
on conflict (id) do update set public = true;

drop policy if exists "mestre envia sons" on storage.objects;
drop policy if exists "mestre apaga sons" on storage.objects;
create policy "mestre envia sons" on storage.objects for insert to authenticated with check (bucket_id = 'sons');
create policy "mestre apaga sons" on storage.objects for delete to authenticated using (bucket_id = 'sons');

-- sons de exemplo (arquivos já estão no site, na pasta /sons)
insert into public.sounds (name, kind, source, url, volume, duration, created_at)
select * from (values
  ('Tensão sombria', 'music', 'file', '/sons/tensao.webm', 0.75, 60, now() + interval '0 seconds'),
  ('Exploração (calma)', 'music', 'file', '/sons/exploracao.webm', 0.7, 53, now() + interval '1 seconds'),
  ('Batalha (tambores)', 'music', 'file', '/sons/batalha.webm', 0.75, 29, now() + interval '2 seconds'),
  ('Chuva', 'ambient', 'file', '/sons/chuva.webm', 0.6, 40, now() + interval '3 seconds'),
  ('Vento na caverna', 'ambient', 'file', '/sons/vento.webm', 0.7, 40, now() + interval '4 seconds'),
  ('Fogueira do acampamento', 'ambient', 'file', '/sons/fogueira.webm', 0.9, 40, now() + interval '5 seconds'),
  ('Floresta à noite', 'ambient', 'file', '/sons/floresta_noite.webm', 0.7, 42, now() + interval '6 seconds'),
  ('Riacho', 'ambient', 'file', '/sons/riacho.webm', 0.6, 40, now() + interval '7 seconds'),
  ('Masmorra gotejando', 'ambient', 'file', '/sons/masmorra.webm', 0.8, 42, now() + interval '8 seconds'),
  ('Taverna movimentada', 'ambient', 'file', '/sons/taverna.webm', 0.6, 44, now() + interval '9 seconds'),
  ('Vento no castelo', 'ambient', 'file', '/sons/vento_castelo.webm', 0.6, 44, now() + interval '10 seconds'),
  ('Rugido de dragão + fogo', 'sfx', 'file', '/sons/dragao.webm', 1, 8, now() + interval '11 seconds'),
  ('Rugido de fera', 'sfx', 'file', '/sons/rugido.webm', 1, 5, now() + interval '12 seconds'),
  ('Uivo de lobo', 'sfx', 'file', '/sons/lobo.webm', 0.9, 9, now() + interval '13 seconds'),
  ('Risada de goblin', 'sfx', 'file', '/sons/goblin.webm', 0.9, 3, now() + interval '14 seconds'),
  ('Grito de guerra orc', 'sfx', 'file', '/sons/grito_orc.webm', 1, 4, now() + interval '15 seconds'),
  ('Gemido de morto-vivo', 'sfx', 'file', '/sons/zumbi.webm', 0.9, 6, now() + interval '16 seconds'),
  ('Aranha gigante', 'sfx', 'file', '/sons/aranha.webm', 1, 3, now() + interval '17 seconds'),
  ('Passos de ogro', 'sfx', 'file', '/sons/passos_ogro.webm', 1, 6, now() + interval '18 seconds'),
  ('Rocha caindo', 'sfx', 'file', '/sons/rocha.webm', 1, 4, now() + interval '19 seconds'),
  ('Espada batendo', 'sfx', 'file', '/sons/espada.webm', 1, 3, now() + interval '20 seconds'),
  ('Flecha certeira', 'sfx', 'file', '/sons/flecha.webm', 1, 1.3, now() + interval '21 seconds'),
  ('Explosão', 'sfx', 'file', '/sons/explosao.webm', 1, 8, now() + interval '22 seconds'),
  ('Feitiço', 'sfx', 'file', '/sons/magia.webm', 0.9, 5, now() + interval '23 seconds'),
  ('Porta rangendo', 'sfx', 'file', '/sons/porta.webm', 1, 4, now() + interval '24 seconds'),
  ('Moedas de ouro', 'sfx', 'file', '/sons/moedas.webm', 0.8, 3, now() + interval '25 seconds'),
  ('Batimento cardíaco', 'sfx', 'file', '/sons/coracao.webm', 1, 4, now() + interval '26 seconds'),
  ('Trovão', 'sfx', 'file', '/sons/trovao.webm', 1, 5, now() + interval '27 seconds'),
  ('Tambor de guerra', 'sfx', 'file', '/sons/tambor.webm', 1, 1.2, now() + interval '28 seconds'),
  ('Sino do templo', 'sfx', 'file', '/sons/sino.webm', 0.9, 3.5, now() + interval '29 seconds')
) as v(name, kind, source, url, volume, duration, created_at)
where not exists (select 1 from public.sounds);

-- v2: pastas, favoritos, lado (pan) e trechos do YouTube
alter table public.sounds add column if not exists folder text;
alter table public.sounds add column if not exists favorite boolean not null default false;
alter table public.sounds add column if not exists pan real not null default 0;
alter table public.sounds add column if not exists yt_start real;
alter table public.sounds add column if not exists yt_end real;

-- v3: cor e ícone (emoji) de cada botão
alter table public.sounds add column if not exists color text;
alter table public.sounds add column if not exists emoji text;

-- v4: cor das pastas
create table if not exists public.folders (
  name text primary key,
  color text,
  created_at timestamptz default now()
);
alter table public.folders enable row level security;
drop policy if exists "todos leem pastas" on public.folders;
drop policy if exists "mestre edita pastas" on public.folders;
create policy "todos leem pastas" on public.folders for select using (true);
create policy "mestre edita pastas" on public.folders for all to authenticated using (true) with check (true);
do $$ begin
  begin alter publication supabase_realtime add table public.folders; exception when duplicate_object then null; end;
end $$;

-- v5: ordem manual de sons e pastas (arrastar e soltar)
alter table public.sounds add column if not exists sort real;
alter table public.folders add column if not exists sort real;
