alter table public.profiles
  alter column appearance
  set default '{
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
    "backgroundEffect": "none",
    "cardEffect": "none",
    "reducedMotion": false
  }'::jsonb;

update public.profiles
set appearance =
  '{"backgroundEffect": "none", "cardEffect": "none"}'::jsonb
  || coalesce(appearance, '{}'::jsonb);
