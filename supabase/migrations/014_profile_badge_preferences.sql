alter table public.profile_badges
  add column if not exists is_visible boolean not null default true,
  add column if not exists position integer not null default 2147483647;

with ranked_badges as (
  select
    id,
    row_number() over (
      partition by profile_id
      order by issued_at, id
    ) - 1 as badge_position
  from public.profile_badges
)
update public.profile_badges as badges
set position = ranked_badges.badge_position
from ranked_badges
where badges.id = ranked_badges.id
  and badges.position = 2147483647;

create or replace function public.update_my_profile_badge_preferences(
  p_preferences jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_profile_id uuid;
begin
  select id into target_profile_id
  from public.profiles
  where user_id = auth.uid();

  if target_profile_id is null then
    raise exception 'Profile not found';
  end if;

  if p_preferences is null or jsonb_typeof(p_preferences) <> 'array' then
    raise exception 'Badge preferences must be a JSON array';
  end if;

  if (
    select count(*) <> count(distinct preferences.id)
    from jsonb_to_recordset(p_preferences)
      as preferences(id uuid, is_visible boolean, display_order integer)
  ) then
    raise exception 'Badge preferences contain duplicate badge IDs';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_preferences)
      as preferences(id uuid, is_visible boolean, display_order integer)
    left join public.profile_badges as badges
      on badges.id = preferences.id
      and badges.profile_id = target_profile_id
    where badges.id is null
      or preferences.is_visible is null
      or preferences.display_order is null
      or preferences.display_order < 0
  ) then
    raise exception 'Badge preferences contain invalid values';
  end if;

  update public.profile_badges as badges
  set
    is_visible = preferences.is_visible,
    position = preferences.display_order
  from jsonb_to_recordset(p_preferences)
    as preferences(id uuid, is_visible boolean, display_order integer)
  where badges.id = preferences.id
    and badges.profile_id = target_profile_id;
end;
$$;

revoke all on function public.update_my_profile_badge_preferences(jsonb)
  from public, anon;
grant execute on function public.update_my_profile_badge_preferences(jsonb)
  to authenticated;

create or replace function public.admin_get_profile_badges_with_preferences(
  p_username text
)
returns table (
  profile_id uuid,
  username text,
  display_name text,
  badge_id uuid,
  kind text,
  label text,
  is_visible boolean,
  display_order integer,
  issued_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_calvet_badge_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.username,
    p.display_name,
    b.id,
    b.kind,
    b.label,
    b.is_visible,
    b.position,
    b.issued_at
  from public.profiles as p
  left join public.profile_badges as b on b.profile_id = p.id
  where p.username = p_username
  order by b.position nulls last, b.issued_at nulls last;
end;
$$;

create or replace function public.admin_update_profile_badge_preferences(
  p_username text,
  p_preferences jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_profile_id uuid;
begin
  if not public.is_calvet_badge_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_preferences is null or jsonb_typeof(p_preferences) <> 'array' then
    raise exception 'Badge preferences must be a JSON array';
  end if;

  select id into target_profile_id
  from public.profiles
  where username = p_username;

  if target_profile_id is null then
    raise exception 'Profile not found';
  end if;

  if (
    select count(*) <> count(distinct preferences.id)
    from jsonb_to_recordset(p_preferences)
      as preferences(id uuid, is_visible boolean, display_order integer)
  ) then
    raise exception 'Badge preferences contain duplicate badge IDs';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_preferences)
      as preferences(id uuid, is_visible boolean, display_order integer)
    left join public.profile_badges as badges
      on badges.id = preferences.id
      and badges.profile_id = target_profile_id
    where badges.id is null
      or preferences.is_visible is null
      or preferences.display_order is null
      or preferences.display_order < 0
  ) then
    raise exception 'Badge preferences contain invalid values';
  end if;

  update public.profile_badges as badges
  set
    is_visible = preferences.is_visible,
    position = preferences.display_order
  from jsonb_to_recordset(p_preferences)
    as preferences(id uuid, is_visible boolean, display_order integer)
  where badges.id = preferences.id
    and badges.profile_id = target_profile_id;
end;
$$;

revoke all on function public.admin_get_profile_badges_with_preferences(text)
  from public, anon;
revoke all on function public.admin_update_profile_badge_preferences(text, jsonb)
  from public, anon;
grant execute on function public.admin_get_profile_badges_with_preferences(text)
  to authenticated;
grant execute on function public.admin_update_profile_badge_preferences(text, jsonb)
  to authenticated;
