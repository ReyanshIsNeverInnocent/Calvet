import { createClient } from "@/lib/supabase/server";
import { defaultAppearance, getAppearance } from "@/lib/appearance";
import type { PublicProfileData } from "@/types/profile";

export const demoProfile: PublicProfileData = {
  profile: {
    id: "hennessy-demo-profile",
    username: "demo",
    display_name: "Nova Chen",
    bio: "Digital maker, late-night thinker, and collector of tiny beautiful things.",
    avatar_url: "",
    banner_url: "",
    location: "Brooklyn, NY",
    pronouns: "they/them",
    status: "",
    mode: "portfolio",
    is_public: true,
    appearance: {
      ...defaultAppearance,
      accentColor: "#a78bfa",
      textColor: "#281a37",
      backgroundColor: "#e8ddf7",
      cardOpacity: 0.88,
      animation: "float",
      backgroundEffect: "aurora",
      cardEffect: "glow",
      usernameEffect: "particles-blue"
    },
    created_at: "",
    updated_at: ""
  },
  links: [
    {
      id: "hennessy-demo-portfolio",
      profile_id: "hennessy-demo-profile",
      title: "Portfolio",
      url: "https://example.com",
      description: "Selected work and experiments",
      icon: "link",
      position: 0,
      enabled: true
    },
    {
      id: "hennessy-demo-listening",
      profile_id: "hennessy-demo-profile",
      title: "Currently listening",
      url: "https://open.spotify.com",
      description: "A little soundtrack for the day",
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
      title: "Small Hours",
      description: "A collection of little tools for more thoughtful days.",
      url: "https://example.com",
      image_url: "",
      tags: ["Design", "Web"],
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
