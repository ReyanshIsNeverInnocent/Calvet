# [THIS WEBSITE IS UNDER HEAVY AND SERIOUS CONSTRUCTION. ITS A LONG WAY DOWN DUH.]

# Calvet

Calvet is a dark-mode profile page builder built with Next.js, TypeScript,
Tailwind CSS, Supabase Auth, and PostgreSQL. Profiles can customize their
accent, dark background color or background image, typography, card shape,
spacing, and animation. The dashboard preview uses the same renderer as the
public profile and updates as profile content is edited. Link URLs get local
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
in numeric order (`001` through `006`). You can also
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
signup trigger for Calvet. Do not rerun `001_initial.sql` on an already-set-up
database.

Afterward, confirm the `profiles`, `links`, `social_links`, and `projects` tables
exist and keep Row Level Security enabled.

New accounts receive a Calvet profile automatically. Their initial username has a
short generated suffix; users can change it in the dashboard.

If your existing project has only `001_initial.sql`, also run
`002_permissions_and_profile_trigger.sql`; it grants Data API table privileges
(RLS still controls row access) and updates the profile-creation trigger.

## Configure email authentication

In Supabase, open **Authentication → Providers → Email** and enable email
authentication. For local testing you may disable email confirmation in the
provider settings. For production, configure the email confirmation flow and
SMTP settings appropriate to your project.

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