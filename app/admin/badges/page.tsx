import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BadgeManager, { type ManagedBadge } from "./BadgeManager";

const BADGE_ADMIN_USERNAME = "whatthefuck";

type BadgePageProps = {
  searchParams: Promise<{ username?: string | string[] }>;
};

type AdminBadgeRow = {
  profile_id: string;
  username: string;
  display_name: string;
  badge_id: string | null;
  kind: string | null;
  label: string | null;
  issued_at: string | null;
};

export default async function BadgeAdminPage({ searchParams }: BadgePageProps) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    throw new Error(`Unable to verify badge administrator: ${adminError.message}`);
  }

  if (adminProfile?.username !== BADGE_ADMIN_USERNAME) {
    notFound();
  }

  const params = await searchParams;
  const username = typeof params.username === "string" ? params.username.trim() : "";
  let profile: { username: string; display_name: string } | null = null;
  let badges: ManagedBadge[] = [];

  if (username) {
    const { data, error } = await supabase.rpc("admin_get_profile_badges", {
      p_username: username
    });

    if (error) {
      throw new Error(`Unable to load profile badges: ${error.message}`);
    }

    const rows = data as AdminBadgeRow[] | null;
    if (rows?.length) {
      profile = {
        username: rows[0].username,
        display_name: rows[0].display_name
      };
      badges = rows.flatMap((row) =>
        row.badge_id
          ? [{
              id: row.badge_id,
              kind: row.kind ?? "",
              label: row.label ?? ""
            }]
          : []
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#08080b] px-5 py-12 text-[#f5f3fa] sm:px-8">
      <section className="mx-auto w-full max-w-2xl">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          Calvet administration
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Profile badges</h1>
        <p className="mt-2 text-sm leading-6 text-white/55">
          Find a profile, then add, rename, or remove its badges.
        </p>

        <BadgeManager
          initialUsername={username}
          profile={profile}
          badges={badges}
        />
      </section>
    </main>
  );
}
