# [THIS WEBSITE IS UNDER HEAVY AND SERIOUS CONSTRUCTION. ITS A LONG WAY DOWN DUH.]

# Calvet

Calvet is a dark-mode profile page builder built with Next.js, TypeScript,
Tailwind CSS, Supabase Auth, and PostgreSQL. Profiles can customize their
accent, dark background color or background image, typography, card shape,
spacing, animation, and configurable glass, solid, or gradient profile
surfaces. Surface tint and opacity, glass blur, border color/opacity/thickness,
corner radius, edge highlight, and shadow can be adjusted and previewed live;
the selected surface styling is shared by the profile box and its content
cards. The appearance editor starts with Glass, Neon, and Minimal presets and
four page layouts; detailed color, surface, motion, and entrance controls stay
collapsed until needed. Portfolio layout widens the page and puts projects
before links, while Social uses a compact grid with visible platform labels.
Public profile headers use a tighter layout and show location, pronouns, and
status with compact icons and hover labels. Search and sharing titles and
descriptions can be customized in Settings, with profile details used as
defaults. The dashboard preview uses the same renderer as the public profile
and updates as profile content is edited.
Link URLs get local
provider/title/icon suggestions, and links can be reordered with accessible
controls; these features do not rely on paid APIs or services. Built-in
animation, aurora/grid background, and card glow/gradient controls are also
available in the appearance editor, with reduced-motion support. Display names
can use built-in rainbow, typewriter, shuffle, glitch, fuzzy, sparkle, six particle
colors, or original prism, orbit, and shimmer effects. Text animations respect both
the profile's reduced-motion setting and the operating system preference; the
live preview appears below the editor in a wide landscape frame. Profile and
appearance edits save automatically after a short pause, while link and project
changes continue to save as they are made.
Profiles can add up to three local audio tracks, reorder them, and navigate
between them with the profile player. The player can also be hidden without
removing tracks. Embedded title, artist, and cover metadata are used when
available. Track titles and artists can be edited, and an optional cover image
can replace embedded artwork. Uploaded audio and cover images use a public
Supabase Storage bucket so they can display on public profiles. Public profiles
open with a customizable click-to-enter screen, including an adjustable
background blur. Choose a soft spotlight, glitch, sparkles, aurora, snow, or
rain effect for the screen. That first click starts the track when music is set,
subject to browser audio autoplay rules. The player uses custom previous,
play/pause, next, seek, mute, and hover-to-adjust volume controls. The editable
homepage profile showcase is configured in `lib/home-demo-profile.ts`; `/demo`
is an alias for the live username `demo` profile, so it shows the same account
as `/@demo`.

## Requirements

- Node.js 20.19 or newer
- npm
- A Supabase project
- Optional: Google and Discord OAuth application credentials

## Install

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill in the Supabase values:

```bash
cp .env.example .env.local
```

The Supabase URL and anon/publishable key are available in the Supabase dashboard
under **Project Settings → API**.

Do not add the Supabase service-role key to this project. The app uses the public
anon key and relies on PostgreSQL Row Level Security.

## Set up the database

The SQL files in `supabase/migrations` are versioned database changes. They do
not run automatically just because they are in this repository.

For a **new Supabase project**, open **SQL Editor** and run each migration file
in numeric order (`001` through `011`). You can also
apply them with the Supabase CLI if you have linked the project.

The application chrome (homepage, login, and dashboard) uses dark mode. Each
public profile can independently choose its page background color, text color,
and other appearance settings. These are profile data, not a site-wide theme.
If your database already has migrations `001` and `002`, no SQL change is
required for profile color customization. Migration `003` only aligns the
stored theme marker/default for dark application chrome; it preserves profile
background and text colors. Migration `004` adds safe defaults for built-in
profile background and card effects while preserving each user's existing
appearance settings. Run it once on an existing project to update the default
for new profiles. Migration `005` adds free built-in username effects while
preserving the rest of each user's appearance. Run each new migration once on
an existing project. Migration `006` updates the default profile name and
signup trigger for Calvet. Migration `007` uses the username selected at signup
and leaves new provider sign-ins without a username on the username setup page.
Migration `008` creates the public profile music bucket with owner-only upload
and delete access. Uploaded audio is accessible to anyone with its public file
URL, so only upload music you have permission to share. Migration `009` allows
JPG, PNG, and WebP cover images in that bucket. Run each new migration once on
an existing project. Do not rerun
`001_initial.sql` on an already-set-up database. Migration `010` adds a separate
uploaded-image field for project cards, retaining existing image links as
backwards-compatible fallbacks.
Avatar, banner, background, project, and music-cover images can be uploaded
directly in the dashboard. Avatar and music-cover uploads include a draggable
1:1 crop and zoom step; banners use 3:1. Uploaded images replace any older
configured image links when displayed. These uploads use the public
`profile-music` bucket from migrations `008` and `009`; profile gallery images
and videos use the separate `creator-media` bucket from migration `011`.

Migration `011` adds aggregate daily public-profile views, a separate
`creator-media` bucket for JPG/PNG/WebP images and MP4/WebM videos (15 MB per
file), and administrator-issued profile badges. It does not store visitor IP
addresses or identifiers; repeat profile opens in the same browser tab session
are deduplicated in session storage. View totals are approximate and can be
inflated by automated or direct RPC requests. Media is publicly accessible
once uploaded, so only share content intended for public viewing. The new
bucket has owner-folder upload/update/delete policies and does not change
permissions on `profile-music`. Badge rows have no client write grant or policy;
trusted administrators must issue or revoke them through the Supabase SQL
Editor after reviewing the profile. Run migration `011` once on an existing
project before using the media or analytics dashboard.

Afterward, confirm the profile, content, analytics, badge, and media tables
exist and keep Row Level Security enabled.

To issue a badge, a trusted administrator can insert it from the Supabase SQL
Editor using the profile's username. For example:

```sql
insert into public.profile_badges (profile_id, kind, label)
select id, 'verified', 'Verified'
from public.profiles
where username = 'example';
```

Replace `example` with the account's username and change the `kind` and
`label` to the badge you intend to award. Supported kinds are `verified`,
`creator`, and `early`; each profile can have one badge of each kind. Run this
as a trusted project administrator in **Supabase → SQL Editor**, after
migration `011` has been applied. The badge then appears on the public profile
and in the owner's Settings. To revoke it, run:

```sql
delete from public.profile_badges b
using public.profiles p
where b.profile_id = p.id
  and p.username = 'example'
  and b.kind = 'verified';
```

Only trusted administrators should issue `verified` badges. Users cannot create
or change badge rows through the app; there is intentionally no self-service
verification button.

Email signups choose a username before creating an account. Provider sign-ins
choose one after authentication if they do not already have a profile. Usernames
must be unique and contain 3–24 letters, numbers, or underscores.

If your existing project has only `001_initial.sql`, also run
`002_permissions_and_profile_trigger.sql`; it grants Data API table privileges
(RLS still controls row access) and updates the profile-creation trigger.

## Configure email authentication

In Supabase, open **Authentication → Providers → Email** and enable email
authentication. For local testing you may disable email confirmation in the
provider settings. For production, configure the email confirmation flow and
SMTP settings appropriate to your project.

In **Authentication → URL Configuration**, set the **Site URL** to your
deployed site's origin (for example, `https://your-domain.vercel.app`). Add
both `http://localhost:3000/auth/callback` and
`https://your-domain.vercel.app/auth/callback` to the allowed redirect URLs.
Email confirmation links use the origin where signup started and return through
`/auth/callback`; the deployed URL must be allowlisted for this redirect.

## Configure Google OAuth

1. Create OAuth credentials in Google Cloud Console.
2. Set the authorized redirect URI to the callback URL shown in Supabase under
   **Authentication → Providers → Google**. It will look like:

   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

3. Add the Google client ID and secret to the Supabase Google provider settings.
4. Enable Google as an authentication provider.
5. In Supabase **Authentication → URL Configuration**, add your local site URL
to the allowed redirect URLs:

   `http://localhost:3000/auth/callback`

6. Add the deployed Vercel callback URL too, for example:

   `https://your-domain.vercel.app/auth/callback`

The OAuth redirect URI configured at Google must point to Supabase, not directly
to the Next.js app.

## Configure Discord OAuth

1. Create an application at https://discord.com/developers/applications.
2. Open **OAuth2** and create a client secret.
3. In the Discord application redirect settings, add the Supabase callback URL:

   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

4. In Supabase, open **Authentication → Providers → Discord**, enable the
   provider, and enter the Discord client ID and secret.
5. Add `http://localhost:3000/auth/callback` and your deployed app callback URL
to Supabase's allowed redirect URLs.

Discord authentication here uses Supabase Auth's supported OAuth flow. The app
does not scrape Discord or call undocumented Discord endpoints. OAuth sign-in
does not automatically import Discord decorations or other information that
is not available from the authorized provider response.

## Run locally

```bash
npm run dev
```

Visit http://localhost:3000.

Create an account, open `/dashboard`, and edit the generated profile. A public
profile uses the `/@username` URL format.

## Checks and production build

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

## Deploy to Vercel

1. Import the project into Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `NEXT_PUBLIC_SITE_URL` in the Vercel project environment variables.
3. Deploy the app and allow Supabase Auth redirect URLs for the Vercel domain.