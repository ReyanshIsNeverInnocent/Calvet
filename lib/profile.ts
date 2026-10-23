import { createClient } from "@/lib/supabase/server";
import { defaultAppearance, getAppearance } from "@/lib/appearance";
import type { PublicProfileData } from "@/types/profile";

export const demoProfile: PublicProfileData = {
  profile: {
    id: "hennessy-demo-profile",
    username: "demo",
    display_name: "nova",
    bio: "collecting playlists, making silly little things, probably avoiding my homework",
    avatar_url: "",
    banner_url: "",
    location: "",
    pronouns: "",
    status: "currently vibing",
    mode: "personal",
    is_public: true,
    appearance: {
      ...defaultAppearance,
      accentColor: "#b49aff",
      textColor: "#f4f1fa",
      backgroundColor: "#0d0b12",
      cardOpacity: 0.82,
      animation: "playful",
      backgroundEffect: "aurora",
      cardEffect: "glow",
      usernameEffect: "none"
    },
    created_at: "",
    updated_at: ""
  },
  links: [
    {
      id: "hennessy-demo-portfolio",
      profile_id: "hennessy-demo-profile",
      title: "my corner",
      url: "https://example.com",
      description: "some things I made",
      icon: "link",
      position: 0,
      enabled: true
    },
    {
      id: "hennessy-demo-listening",
      profile_id: "hennessy-demo-profile",
      title: "on repeat",
      url: "https://open.spotify.com",
      description: "my current playlist",
      icon: "music",
      position: 1,
      enabled: true
    }
  ],
  socials: [
    {
      id: "hennessy-demo-github",
      profile_id: "hennessy-demo-profile",
      platform: "github",
      url: "https://github.com",
      position: 0,
      enabled: true
    }
  ],
  projects: [
    {
      id: "hennessy-demo-project",
      profile_id: "hennessy-demo-profile",
      title: "tiny game",
      description: "a small thing I made while avoiding homework.",
      url: "https://example.com",
      image_url: "",
      tags: ["indie game", "late night"],
      position: 0,
      enabled: true
    }
  ]
};

export async function getPublicProfile(
  username: string
): Promise<PublicProfileData | null> {
  const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();

  if (normalizedUsername === "demo") {
    return demoProfile;
  }

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
    return null;
  }

  const [linksResult, socialsResult, projectsResult] =
    await Promise.all([
      supabase
        .from("links")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("enabled", true)
        .order("position"),
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
        .order("position")
    ]);

  if (linksResult.error || socialsResult.error || projectsResult.error) {
    const messages = [
      linksResult.error?.message,
      socialsResult.error?.message,
      projectsResult.error?.message
    ].filter(Boolean);
    throw new Error(`Unable to load public profile content: ${messages.join("; ")}`);
  }

  return {
    profile: {
      ...profile,
      appearance: getAppearance(profile.appearance)
    },
    links: linksResult.data ?? [],
    socials: socialsResult.data ?? [],
    projects: projectsResult.data ?? []
  };
}
