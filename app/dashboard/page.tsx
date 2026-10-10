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

  let profile = initialProfile;

  if (!profile) {
    const usernameSuffix = user.id.replace(/-/g, "").slice(-12);
    const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
    const displayName =
      typeof metadataName === "string" && metadataName.trim()
        ? metadataName.trim().slice(0, 80)
        : "New Calvet";
    const { data: createdProfile, error: createProfileError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          username: `calvet_${usernameSuffix}`,
          display_name: displayName
        },
        { onConflict: "user_id", ignoreDuplicates: true }
      )
      .select("*")
      .maybeSingle();

    if (createProfileError) {
      throw new Error(`Unable to create your profile: ${createProfileError.message}`);
    }

    profile = createdProfile;

    if (!profile) {
      const { data: existingProfile, error: reloadProfileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (reloadProfileError) {
        throw new Error(`Unable to reload your profile: ${reloadProfileError.message}`);
      }

      profile = existingProfile;
    }
  }

  if (!profile) {
    throw new Error("Your profile could not be found or created. Please try again.");
  }

  const [linksResult, socialsResult, projectsResult] = await Promise.all([
    supabase.from("links").select("*").eq("profile_id", profile.id).order("position"),
    supabase
      .from("social_links")
      .select("*")
      .eq("profile_id", profile.id)
      .order("position"),
    supabase
      .from("projects")
      .select("*")
      .eq("profile_id", profile.id)
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
      initialProfile={profile}
      initialLinks={linksResult.data ?? []}
      initialSocials={socialsResult.data ?? []}
      initialProjects={projectsResult.data ?? []}
    />
  );
}
