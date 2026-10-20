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

  const [linksResult, socialsResult, projectsResult] = await Promise.all([
    supabase.from("links").select("*").eq("profile_id", initialProfile.id).order("position"),
    supabase
      .from("social_links")
      .select("*")
      .eq("profile_id", initialProfile.id)
      .order("position"),
    supabase
      .from("projects")
      .select("*")
      .eq("profile_id", initialProfile.id)
      .order("position")
  ]);

  if (linksResult.error || socialsResult.error || projectsResult.error) {
    const messages = [
      linksResult.error?.message,
      socialsResult.error?.message,
      projectsResult.error?.message
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
    />
  );
}
