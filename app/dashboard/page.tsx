import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: initialProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Unable to load your profile: ${profileError.message}`);
  }

  if (!initialProfile) {
    redirect("/auth/username");
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 29);
  const sinceDate = since.toISOString().slice(0, 10);

  const [
    linksResult,
    socialsResult,
    projectsResult,
    mediaResult,
    badgesResult,
    viewsResult
  ] = await Promise.all([
    supabase
      .from("links")
      .select("*")
      .eq("profile_id", initialProfile.id)
      .order("position"),
    supabase
      .from("social_links")
      .select("*")
      .eq("profile_id", initialProfile.id)
      .order("position"),
    supabase
      .from("projects")
      .select("*")
      .eq("profile_id", initialProfile.id)
      .order("position"),
    supabase
      .from("profile_media")
      .select("*")
      .eq("profile_id", initialProfile.id)
      .order("position"),
    supabase
      .from("profile_badges")
      .select("*")
      .eq("profile_id", initialProfile.id)
      .order("issued_at"),
    supabase
      .from("profile_daily_views")
      .select("view_date, views")
      .eq("profile_id", initialProfile.id)
      .gte("view_date", sinceDate)
      .order("view_date")
  ]);

  if (
    linksResult.error ||
    socialsResult.error ||
    projectsResult.error ||
    mediaResult.error ||
    badgesResult.error ||
    viewsResult.error
  ) {
    const messages = [
      linksResult.error?.message,
      socialsResult.error?.message,
      projectsResult.error?.message,
      mediaResult.error?.message,
      badgesResult.error?.message,
      viewsResult.error?.message
    ].filter(Boolean);
    throw new Error(`Unable to load your profile content: ${messages.join("; ")}`);
  }

  return (
    <DashboardClient
      userEmail={user.email ?? ""}
      initialProfile={initialProfile}
      initialLinks={linksResult.data ?? []}
      initialSocials={socialsResult.data ?? []}
      initialProjects={projectsResult.data ?? []}
      initialMedia={(mediaResult.data ?? []).map((media) => ({
        ...media,
        media_url: supabase.storage
          .from("creator-media")
          .getPublicUrl(media.storage_path).data.publicUrl
      }))}
      initialBadges={badgesResult.data ?? []}
      initialViews={viewsResult.data ?? []}
    />
  );
}
