create or replace function public.is_calvet_badge_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and username = 'whatthefuck'
  );
$$;

revoke all on function public.is_calvet_badge_admin() from public, anon, authenticated;

create or replace function public.admin_get_profile_badges(p_username text)
returns table (
  profile_id uuid,
  username text,
  display_name text,
  badge_id uuid,
  kind text,
  label text,
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
  select p.id, p.username, p.display_name, b.id, b.kind, b.label, b.issued_at
  from public.profiles as p
  left join public.profile_badges as b on b.profile_id = p.id
  where p.username = p_username;
end;
$$;

create or replace function public.admin_upsert_profile_badge(
  p_username text,
  p_kind text,
  p_label text
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

  if p_kind is null or char_length(p_kind) not between 1 and 40 then
    raise exception 'Badge kind must be between 1 and 40 characters';
  end if;

  if p_label is null or char_length(p_label) not between 1 and 40 then
    raise exception 'Badge label must be between 1 and 40 characters';
  end if;

  select id into target_profile_id
  from public.profiles
  where username = p_username;

  if target_profile_id is null then
    raise exception 'Profile not found';
  end if;

  insert into public.profile_badges (profile_id, kind, label)
  values (target_profile_id, p_kind, p_label)
  on conflict (profile_id, kind)
  do update set label = excluded.label;
end;
$$;

create or replace function public.admin_delete_profile_badge(
  p_username text,
  p_kind text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_calvet_badge_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  delete from public.profile_badges as b
  using public.profiles as p
  where b.profile_id = p.id
    and p.username = p_username
    and b.kind = p_kind;
end;
$$;

revoke all on function public.admin_get_profile_badges(text) from public, anon;
revoke all on function public.admin_upsert_profile_badge(text, text, text) from public, anon;
revoke all on function public.admin_delete_profile_badge(text, text) from public, anon;
grant execute on function public.admin_get_profile_badges(text) to authenticated;
grant execute on function public.admin_upsert_profile_badge(text, text, text) to authenticated;
grant execute on function public.admin_delete_profile_badge(text, text) to authenticated;
