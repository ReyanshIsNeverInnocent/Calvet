create table if not exists public.profile_daily_views (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  view_date date not null default current_date,
  views integer not null default 0 check (views >= 0),
  primary key (profile_id, view_date)
);

alter table public.profile_daily_views enable row level security;

revoke all on public.profile_daily_views from anon, authenticated;
grant select on public.profile_daily_views to authenticated;

drop policy if exists "Owners can read profile daily views"
  on public.profile_daily_views;
create policy "Owners can read profile daily views"
on public.profile_daily_views for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = profile_daily_views.profile_id
      and p.user_id = auth.uid()
  )
);

create or replace function public.record_profile_view(profile_username text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_profile_id uuid;
  target_user_id uuid;
begin
  select p.id, p.user_id
  into target_profile_id, target_user_id
  from public.profiles p
  where p.username = lower(trim(profile_username))
    and p.is_public = true;

  if target_profile_id is null or target_user_id = auth.uid() then
    return;
  end if;

  insert into public.profile_daily_views as daily (profile_id, view_date, views)
  values (target_profile_id, current_date, 1)
  on conflict (profile_id, view_date)
  do update set views = daily.views + 1;
end;
$$;

revoke all on function public.record_profile_view(text) from public;
grant execute on function public.record_profile_view(text) to anon, authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'creator-media',
  'creator-media',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners can upload creator media" on storage.objects;
create policy "Owners can upload creator media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'creator-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Owners can update creator media" on storage.objects;
create policy "Owners can update creator media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'creator-media'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'creator-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Owners can delete creator media" on storage.objects;
create policy "Owners can delete creator media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'creator-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create table if not exists public.profile_media (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image', 'video')),
  title text not null default '',
  position integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint profile_media_title_length check (char_length(title) <= 80),
  constraint profile_media_path_owner check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f]{32}\.[a-z]+$')
);

create index if not exists profile_media_profile_position_idx
  on public.profile_media (profile_id, position);

create or replace function public.enforce_profile_media_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  existing_items integer;
begin
  perform 1
  from public.profiles p
  where p.id = new.profile_id
  for update;

  select count(*)::integer
  into existing_items
  from public.profile_media m
  where m.profile_id = new.profile_id
    and m.id <> new.id;

  if existing_items >= 5 then
    raise exception 'A profile can have at most five media items';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_media_limit() from public;

drop trigger if exists profile_media_limit_before_write
  on public.profile_media;
create trigger profile_media_limit_before_write
before insert or update of profile_id on public.profile_media
for each row execute function public.enforce_profile_media_limit();

alter table public.profile_media enable row level security;

grant select, insert, update, delete on public.profile_media to authenticated;
grant select on public.profile_media to anon;

drop policy if exists "Public can read enabled media on visible profiles"
  on public.profile_media;
create policy "Public can read enabled media on visible profiles"
on public.profile_media for select
to anon, authenticated
using (
  enabled = true
  and exists (
    select 1 from public.profiles p
    where p.id = profile_media.profile_id
      and p.is_public = true
  )
);

drop policy if exists "Owners can read their profile media"
  on public.profile_media;
create policy "Owners can read their profile media"
on public.profile_media for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = profile_media.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Owners can manage profile media"
  on public.profile_media;
create policy "Owners can manage profile media"
on public.profile_media for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = profile_media.profile_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = profile_media.profile_id
      and p.user_id = auth.uid()
  )
  and storage_path like auth.uid()::text || '/%'
);

create table if not exists public.profile_badges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('verified', 'creator', 'early')),
  label text not null,
  issued_at timestamptz not null default now(),
  constraint profile_badges_label_length check (char_length(label) between 1 and 40),
  constraint profile_badges_profile_kind_unique unique (profile_id, kind)
);

create index if not exists profile_badges_profile_idx
  on public.profile_badges (profile_id);

alter table public.profile_badges enable row level security;

revoke all on public.profile_badges from anon, authenticated;
grant select on public.profile_badges to anon, authenticated;

drop policy if exists "Public can read badges on visible profiles"
  on public.profile_badges;
create policy "Public can read badges on visible profiles"
on public.profile_badges for select
to anon, authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = profile_badges.profile_id
      and p.is_public = true
  )
);

drop policy if exists "Owners can read their profile badges"
  on public.profile_badges;
create policy "Owners can read their profile badges"
on public.profile_badges for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = profile_badges.profile_id
      and p.user_id = auth.uid()
  )
);

comment on table public.profile_badges is
  'Badges are issued and revoked by trusted database administrators only. No client write grants or policies are provided.';
