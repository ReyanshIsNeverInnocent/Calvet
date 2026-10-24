alter table public.projects
  drop constraint if exists projects_url_protocol;

alter table public.projects
  add constraint projects_url_protocol
  check (url = '' or url ~* '^https?://');
