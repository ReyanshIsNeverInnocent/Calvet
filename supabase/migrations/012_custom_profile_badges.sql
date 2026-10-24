alter table public.profile_badges
  drop constraint if exists profile_badges_kind_check;

alter table public.profile_badges
  add constraint profile_badges_kind_length
  check (char_length(kind) between 1 and 40);

insert into public.profile_badges (profile_id, kind, label)
select id, 'official-demo', 'Official Calvet Demo'
from public.profiles
where username = 'demo'
on conflict (profile_id, kind)
do update set label = excluded.label;
