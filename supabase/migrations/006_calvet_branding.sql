alter table public.profiles
  alter column display_name set default 'New Calvet';

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
      coalesce(new.raw_user_meta_data ->> 'user_name', split_part(new.email, '@', 1), 'calvet_user'),
      '[^a-zA-Z0-9_]',
      '',
      'g'
    )
  );

  if char_length(base_name) < 3 then
    base_name := 'calvet_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  chosen_username := left(base_name, 15)
    || '_'
    || substr(replace(new.id::text, '-', ''), 1, 8);

  chosen_display_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      'New Calvet'
    ),
    80
  );

  insert into public.profiles (user_id, username, display_name)
  values (new.id, chosen_username, chosen_display_name)
  on conflict (user_id) do nothing;

  return new;
end;
$$;