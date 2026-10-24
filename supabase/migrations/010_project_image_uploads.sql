alter table public.projects
  add column if not exists image_upload_url text not null default '';
