import { getAppearance } from "@/lib/appearance";
import type { PublicProfileData } from "@/types/profile";

const profileId = "calvet-demo-profile";

export const demoProfile: PublicProfileData = {
  profile: {
    id: profileId,
    username: "demo",
    display_name: "Nova Chen",
    bio: "Digital maker, late-night thinker, and collector of tiny beautiful things.",
    avatar_url: "",
    banner_url: "",
    location: "Brooklyn, NY",
    pronouns: "they/them",
    status: "Making something new",
    mode: "portfolio",
    is_public: true,
    appearance: getAppearance({
      accentColor: "#a78bfa",
      textColor: "#f4f1fa",
      backgroundColor: "#09090d",
      surfaceColor: "#211d2b",
      cardOpacity: 0.88,
      animation: "float",
      backgroundEffect: "aurora",
      cardEffect: "glow",
      usernameEffect: "particles-blue"
    }),
    created_at: "",
    updated_at: ""
  },
  socials: [
    {
      id: "calvet-demo-github",
      profile_id: profileId,
      platform: "github",
      url: "https://github.com",
      position: 0,
      enabled: true
    },
    {
      id: "calvet-demo-instagram",
      profile_id: profileId,
      platform: "instagram",
      url: "https://instagram.com",
      position: 1,
      enabled: true
    },
    {
      id: "calvet-demo-spotify",
      profile_id: profileId,
      platform: "spotify",
      url: "https://open.spotify.com",
      position: 2,
      enabled: true
    }
  ],
  projects: [
    {
      id: "calvet-demo-project",
      profile_id: profileId,
      title: "Small Hours",
      description: "A collection of little tools for more thoughtful days.",
      url: "https://example.com",
      image_url: "",
      image_upload_url: "",
      tags: ["Design", "Web"],
      position: 0,
      enabled: true
    }
  ],
  media: [],
  badges: [
    {
      id: "calvet-demo-official-badge",
      profile_id: profileId,
      kind: "official-demo",
      label: "Official Calvet Demo",
      is_visible: true,
      position: 0,
      issued_at: ""
    }
  ]
};
