create table if not exists public.special_accounts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null
);

alter table public.special_accounts enable row level security;
revoke all on public.special_accounts from anon, authenticated;

create or replace function public.current_user_has_special_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.special_accounts as special
    join public.profiles as profile on profile.id = special.profile_id
    where profile.user_id = auth.uid()
  );
$$;

create or replace function public.admin_get_special_accounts()
returns table (
  profile_id uuid,
  username text,
  display_name text,
  granted_at timestamptz
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
  select profile.id, profile.username, profile.display_name, special.granted_at
  from public.special_accounts as special
  join public.profiles as profile on profile.id = special.profile_id
  order by special.granted_at desc;
end;
$$;

create or replace function public.admin_set_special_account(
  p_username text,
  p_enabled boolean
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

  if p_username is null or char_length(trim(p_username)) = 0 then
    raise exception 'A username is required';
  end if;

  if p_enabled is null then
    raise exception 'Access state is required';
  end if;

  select profile.id into target_profile_id
  from public.profiles as profile
  where profile.username = lower(trim(p_username));

  if target_profile_id is null then
    raise exception 'Profile not found';
  end if;

  if p_enabled then
    insert into public.special_accounts (profile_id, granted_by)
    values (target_profile_id, auth.uid())
    on conflict (profile_id) do nothing;
  else
    delete from public.special_accounts
    where profile_id = target_profile_id;

    update public.profiles as target
    set appearance = jsonb_set(
      target.appearance,
      '{musicTracks}',
      (
        select coalesce(jsonb_agg(track order by ordinal), '[]'::jsonb)
        from (
          select song.value as track, song.ordinal as ordinal
          from jsonb_array_elements(target.appearance -> 'musicTracks')
            with ordinality as song(value, ordinal)
          order by song.ordinal
          limit 3
        ) as limited_songs
      ),
      true
    )
    where target.id = target_profile_id
      and case
        when jsonb_typeof(target.appearance -> 'musicTracks') = 'array'
          then jsonb_array_length(target.appearance -> 'musicTracks') > 3
        else false
      end;
  end if;
end;
$$;

create or replace function public.enforce_special_account_music_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  tracks jsonb;
begin
  tracks := new.appearance -> 'musicTracks';

  if (
    case
      when jsonb_typeof(tracks) = 'array' then jsonb_array_length(tracks) > 3
      else false
    end
  ) and not exists (
    select 1
    from public.special_accounts
    where profile_id = new.id
  )
  then
    raise exception 'A profile can have up to 3 songs. Special accounts have no song limit.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_special_account_music_limit
  on public.profiles;
create trigger profiles_special_account_music_limit
before insert or update of appearance on public.profiles
for each row execute function public.enforce_special_account_music_limit();

revoke all on function public.current_user_has_special_access()
  from public, anon, authenticated;
revoke all on function public.admin_get_special_accounts()
  from public, anon, authenticated;
revoke all on function public.admin_set_special_account(text, boolean)
  from public, anon, authenticated;
revoke all on function public.enforce_special_account_music_limit()
  from public, anon, authenticated;

grant execute on function public.current_user_has_special_access()
  to authenticated;
grant execute on function public.admin_get_special_accounts()
  to authenticated;
grant execute on function public.admin_set_special_account(text, boolean)
  to authenticated;
