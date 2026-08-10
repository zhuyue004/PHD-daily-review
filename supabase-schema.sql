-- 在 Supabase Dashboard → SQL Editor 中一次性运行本文件。
create table if not exists public.phd_sync_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.phd_sync_data enable row level security;
grant select, insert, update on public.phd_sync_data to authenticated;

create policy "Users read their own PhD data" on public.phd_sync_data
for select to authenticated using (auth.uid() = user_id);
create policy "Users insert their own PhD data" on public.phd_sync_data
for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update their own PhD data" on public.phd_sync_data
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('phd-note-images', 'phd-note-images', false)
on conflict (id) do nothing;

create policy "Users read their own note images" on storage.objects
for select to authenticated using (bucket_id = 'phd-note-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users upload their own note images" on storage.objects
for insert to authenticated with check (bucket_id = 'phd-note-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update their own note images" on storage.objects
for update to authenticated using (bucket_id = 'phd-note-images' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'phd-note-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete their own note images" on storage.objects
for delete to authenticated using (bucket_id = 'phd-note-images' and (storage.foldername(name))[1] = auth.uid()::text);
