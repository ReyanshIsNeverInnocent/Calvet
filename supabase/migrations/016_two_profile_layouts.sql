alter table public.profiles
  drop constraint if exists profiles_mode_check;

update public.profiles
set mode = case
  when mode = 'minimal' then 'compact'
  else 'default'
end;

alter table public.profiles
  alter column mode set default 'default',
  add constraint profiles_mode_check
    check (mode in ('compact', 'default'));
