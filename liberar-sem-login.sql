-- Mesa Sonora: libera o banco para funcionar SEM login (qualquer um que clicar em "Sou o mestre" pode editar).
-- Rode UMA vez no Supabase: SQL Editor → New query → cole tudo → Run.

drop policy if exists "mestre edita sons" on public.sounds;
create policy "mestre edita sons" on public.sounds for all to anon, authenticated using (true) with check (true);

drop policy if exists "mestre edita estado" on public.live_state;
create policy "mestre edita estado" on public.live_state for all to anon, authenticated using (true) with check (true);

drop policy if exists "mestre edita pastas" on public.folders;
create policy "mestre edita pastas" on public.folders for all to anon, authenticated using (true) with check (true);

drop policy if exists "mestre edita o mapa" on public.map_state;
create policy "mestre edita o mapa" on public.map_state for all to anon, authenticated using (true) with check (true);

-- arquivos (sons e imagens enviados)
drop policy if exists "mestre envia sons" on storage.objects;
drop policy if exists "mestre apaga sons" on storage.objects;
drop policy if exists "mestre atualiza sons" on storage.objects;
create policy "mestre envia sons" on storage.objects for insert to anon, authenticated with check (bucket_id = 'sons');
create policy "mestre apaga sons" on storage.objects for delete to anon, authenticated using (bucket_id = 'sons');
create policy "mestre atualiza sons" on storage.objects for update to anon, authenticated using (bucket_id = 'sons') with check (bucket_id = 'sons');
