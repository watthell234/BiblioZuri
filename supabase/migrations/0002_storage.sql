-- Public bucket holding the book photos (a ~1200px cover and a ~320px thumbnail each).
-- Named biblio-covers because this project is currently shared with another app.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('biblio-covers', 'biblio-covers', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "biblio book photos are readable" on storage.objects
  for select to anon, authenticated using (bucket_id = 'biblio-covers');

create policy "biblio book photos can be added" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'biblio-covers');

create policy "biblio book photos can be removed" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'biblio-covers');
