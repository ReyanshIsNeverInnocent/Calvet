create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_username text;
  chosen_display_name text;
begin
  chosen_username := lower(trim(new.raw_user_meta_data ->> 'calvet_username'));

  if chosen_username is null
    or chosen_username !~ '^[a-z0-9_]{3,24}$'
  then
    return new;
  end if;

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
