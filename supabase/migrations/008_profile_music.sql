insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-music',
  'profile-music',
  true,
  15728640,
  array[
    'audio/mpeg',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/wav',
    'audio/x-wav',
    'audio/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners can upload profile music"
  on storage.objects;
create policy "Owners can upload profile music"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-music'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Owners can update profile music"
  on storage.objects;
create policy "Owners can update profile music"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-music'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'profile-music'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Owners can delete profile music"
  on storage.objects;
create policy "Owners can delete profile music"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-music'
  and auth.uid()::text = (storage.foldername(name))[1]
);
