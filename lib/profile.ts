import { createClient } from "@/lib/supabase/server";
import { getAppearance } from "@/lib/appearance";
import { demoProfile } from "@/lib/demo-profile";
import type { PublicProfileData } from "@/types/profile";

export async function getPublicProfile(
  username: string
): Promise<PublicProfileData | null> {
  const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_url, banner_url, location, pronouns, status, mode, is_public, appearance, created_at, updated_at"
    )
    .eq("username", normalizedUsername)
    .eq("is_public", true)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Unable to load public profile: ${profileError.message}`);
  }

  if (!profile) {
    return normalizedUsername === "demo" ? demoProfile : null;
  }

  const [socialsResult, projectsResult, mediaResult, badgesResult] =
    await Promise.all([
      supabase
        .from("social_links")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("enabled", true)
        .order("position"),
      supabase
        .from("projects")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("enabled", true)
        .order("position"),
      supabase
        .from("profile_media")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("enabled", true)
        .order("position"),
      supabase
        .from("profile_badges")
        .select("*")
        .eq("profile_id", profile.id)
        .order("issued_at")
    ]);

  if (
    socialsResult.error ||
    projectsResult.error ||
    mediaResult.error ||
    badgesResult.error
  ) {
    const messages = [
      socialsResult.error?.message,
      projectsResult.error?.message,
      mediaResult.error?.message,
      badgesResult.error?.message
    ].filter(Boolean);
    throw new Error(`Unable to load public profile content: ${messages.join("; ")}`);
  }

  return {
    profile: {
      ...profile,
      appearance: getAppearance(profile.appearance)
    },
    socials: socialsResult.data ?? [],
    projects: projectsResult.data ?? [],
    media: (mediaResult.data ?? []).map((media) => ({
      ...media,
      media_url: supabase.storage
        .from("creator-media")
        .getPublicUrl(media.storage_path).data.publicUrl
    })),
    badges: badgesResult.data ?? []
  };
}
