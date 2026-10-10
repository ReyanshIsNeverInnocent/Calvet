grant usage on schema public to anon, authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant select on public.profiles, public.links, public.social_links, public.projects
  to anon, authenticated;
grant insert, update, delete on public.profiles, public.links, public.social_links, public.projects
  to authenticated;

alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

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
      coalesce(
        new.raw_user_meta_data ->> 'user_name',
        split_part(new.email, '@', 1),
        'hennessy_user'
      ),
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
  values (new.id, chosen_username, chosen_display_name)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
