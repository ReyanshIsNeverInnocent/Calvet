create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null default 'New Hennessy',
  bio text not null default '',
  avatar_url text not null default '',
  banner_url text not null default '',
  location text not null default '',
  pronouns text not null default '',
  status text not null default '',
  mode text not null default 'personal'
    check (mode in ('minimal', 'social', 'portfolio', 'personal')),
  is_public boolean not null default true,
  appearance jsonb not null default '{
    "theme": "dark",
    "accentColor": "#a991ff",
    "textColor": "#f4f1fa",
    "backgroundColor": "#09090d",
    "backgroundImage": "",
    "cardOpacity": 0.75,
    "radius": "large",
    "shadow": true,
    "font": "inter",
    "spacing": "comfortable",
    "animation": "subtle",
    "reducedMotion": false
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username ~ '^[a-z0-9_]{3,24}$'
  ),
  constraint profiles_display_name_length check (
    char_length(display_name) between 1 and 80
  ),
  constraint profiles_bio_length check (
    char_length(bio) <= 280
  )
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  url text not null,
  description text not null default '',
  icon text not null default 'link',
  position integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint links_title_length check (char_length(title) between 1 and 80),
  constraint links_url_protocol check (url ~* '^https?://'),
  constraint links_description_length check (char_length(description) <= 140)
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,
  url text not null,
  position integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_links_platform_length check (
    char_length(platform) between 1 and 40
  ),
  constraint social_links_url_protocol check (url ~* '^https?://')
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  url text not null,
  image_url text not null default '',
  tags text[] not null default '{}',
  position integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_title_length check (char_length(title) between 1 and 100),
  constraint projects_url_protocol check (url ~* '^https?://'),
  constraint projects_description_length check (char_length(description) <= 500)
);

create index if not exists profiles_public_username_idx
  on public.profiles (username)
  where is_public = true;

create index if not exists profiles_user_id_idx
  on public.profiles (user_id);

create index if not exists links_profile_position_idx
  on public.links (profile_id, position);

create index if not exists socials_profile_position_idx
  on public.social_links (profile_id, position);

create index if not exists projects_profile_position_idx
  on public.projects (profile_id, position);

alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.social_links enable row level security;
alter table public.projects enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.links, public.social_links, public.projects
  to anon, authenticated;
grant insert, update, delete on public.profiles, public.links, public.social_links, public.projects
  to authenticated;

-- Public profile reads reveal only fields stored in profiles, never auth.users data.
create policy "Public can read visible profiles"
on public.profiles for select
using (is_public = true);

create policy "Owners can read their own profile"
on public.profiles for select
to authenticated
using (auth.uid() = user_id);

create policy "Owners can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Owners can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners can delete their own profile"
on public.profiles for delete
to authenticated
using (auth.uid() = user_id);

create policy "Public can read enabled links on visible profiles"
on public.links for select
using (
  enabled = true
  and exists (
    select 1
    from public.profiles p
    where p.id = links.profile_id
      and p.is_public = true
  )
);

create policy "Owners can manage links"
on public.links for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = links.profile_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = links.profile_id and p.user_id = auth.uid()
  )
);

create policy "Public can read enabled socials on visible profiles"
on public.social_links for select
using (
  enabled = true
  and exists (
    select 1
    from public.profiles p
    where p.id = social_links.profile_id
      and p.is_public = true
  )
);

create policy "Owners can manage socials"
on public.social_links for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = social_links.profile_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = social_links.profile_id and p.user_id = auth.uid()
  )
);

create policy "Public can read enabled projects on visible profiles"
on public.projects for select
using (
  enabled = true
  and exists (
    select 1
    from public.profiles p
    where p.id = projects.profile_id
      and p.is_public = true
  )
);

create policy "Owners can manage projects"
on public.projects for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = projects.profile_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = projects.profile_id and p.user_id = auth.uid()
  )
);

-- Create a profile for newly registered auth users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_username text;
  chosen_display_name text;
  base_name text;
begin
  base_name := lower(
    regexp_replace(
      coalesce(new.raw_user_meta_data ->> 'user_name', split_part(new.email, '@', 1), 'hennessy_user'),
      '[^a-zA-Z0-9_]',
      '',
      'g'
    )
  );

  if char_length(base_name) < 3 then
    base_name := 'hennessy_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  chosen_username := left(base_name, 15)
    || '_'
    || substr(replace(new.id::text, '-', ''), 1, 8);

  chosen_display_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      'New Hennessy'
    ),
    80
  );

  insert into public.profiles (user_id, username, display_name)
  values (
    new.id,
    chosen_username,
    chosen_display_name
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Keep updated_at current for updates made through the API.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger links_set_updated_at
before update on public.links
for each row execute procedure public.set_updated_at();

create trigger socials_set_updated_at
before update on public.social_links
for each row execute procedure public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute procedure public.set_updated_at();