export const USERNAME_EFFECTS = [
  "none",
  "typewriter",
  "rainbow",
  "shuffle",
  "glitch",
  "fuzzy",
  "sparkle",
  "particles-blue",
  "particles-green",
  "particles-pink",
  "particles-red",
  "particles-white",
  "particles-gold",
  "hennessy-prism",
  "hennessy-orbit",
  "hennessy-shimmer"
] as const;

export type MusicTrack = {
  id: string;
  url: string;
  title: string;
  artist: string;
  coverUrl: string;
  coverImageUrl?: string;
};

export type Appearance = {
  theme: "dark";
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  backgroundImage: string;
  cardOpacity: number;
  surfaceStyle: "glass" | "solid" | "gradient";
  surfaceColor: string;
  surfaceBlur: number;
  surfaceBorderColor: string;
  surfaceBorderOpacity: number;
  surfaceBorderWidth: number;
  surfaceRadius: number;
  surfaceHighlight: boolean;
  radius: "small" | "medium" | "large";
  shadow: boolean;
  font: "inter" | "system" | "serif";
  spacing: "compact" | "comfortable" | "airy";
  animation: "none" | "subtle" | "playful" | "float" | "pulse";
  backgroundEffect: "none" | "aurora" | "grid";
  cardEffect: "none" | "glow" | "gradient";
  usernameEffect: (typeof USERNAME_EFFECTS)[number];
  reducedMotion: boolean;
  musicMode: "off" | "upload";
  musicUrl: string;
  musicTitle: string;
  musicArtist: string;
  musicCoverUrl: string;
  musicTracks: MusicTrack[];
  socialsMonochrome: boolean;
  projectsHeading: string;
  mediaHeading: string;
  avatarImageUpload: string;
  bannerImageUpload: string;
  backgroundImageUpload: string;
  seoTitle: string;
  seoDescription: string;
  enterText: string;
  enterBlur: number;
  enterEffect:
    | "none"
    | "spotlight"
    | "glitch"
    | "sparkles"
    | "aurora"
    | "snow"
    | "rain";
};

export type Profile = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  location: string;
  pronouns: string;
  status: string;
  mode: "minimal" | "social" | "portfolio" | "personal";
  is_public: boolean;
  appearance: Appearance;
  created_at: string;
  updated_at: string;
};

export type SocialLink = {
  id: string;
  profile_id: string;
  platform: string;
  url: string;
  position: number;
  enabled: boolean;
};

export type Project = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  url: string;
  image_url: string;
  image_upload_url: string;
  tags: string[];
  position: number;
  enabled: boolean;
};

export type ProfileMedia = {
  id: string;
  profile_id: string;
  storage_path: string;
  media_type: "image" | "video";
  media_url?: string;
  title: string;
  position: number;
  enabled: boolean;
  created_at: string;
};

export type ProfileBadge = {
  id: string;
  profile_id: string;
  kind: string;
  label: string;
  is_visible: boolean;
  position: number;
  issued_at: string;
};

export type PublicProfileData = {
  profile: Omit<Profile, "user_id">;
  socials: SocialLink[];
  projects: Project[];
  media: ProfileMedia[];
  badges: ProfileBadge[];
};
