import { USERNAME_EFFECTS, type Appearance } from "@/types/profile";

export const defaultAppearance: Appearance = {
  theme: "dark",
  accentColor: "#a991ff",
  textColor: "#f4f1fa",
  backgroundColor: "#09090d",
  backgroundImage: "",
  cardOpacity: 0.75,
  radius: "large",
  shadow: true,
  font: "inter",
  spacing: "comfortable",
  animation: "subtle",
  backgroundEffect: "none",
  cardEffect: "none",
  usernameEffect: "none",
  reducedMotion: false,
  musicMode: "off",
  musicUrl: "",
  musicTitle: "",
  musicArtist: "",
  musicCoverUrl: "",
  musicTracks: [],
  enterText: "click to enter",
  enterEffect: "spotlight"
};

export function isHexColor(color: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(color);
}

export function normalizeUsernameEffect(
  value: unknown
): Appearance["usernameEffect"] {
  if (value === "fuzzle") {
    return "glitch";
  }

  return USERNAME_EFFECTS.find((candidate) => candidate === value) ?? "none";
}

export function getAppearance(value: Partial<Appearance> | null | undefined): Appearance {
  const appearance = { ...defaultAppearance, ...value, theme: "dark" as const };
  const tracks = Array.isArray(value?.musicTracks)
    ? value.musicTracks
        .filter(
          (track) =>
            track &&
            typeof track.id === "string" &&
            typeof track.url === "string" &&
            typeof track.title === "string" &&
            typeof track.artist === "string" &&
            typeof track.coverUrl === "string"
        )
        .slice(0, 3)
    : [];
  const normalizedTracks =
    tracks.length > 0
      ? tracks
      : !Array.isArray(value?.musicTracks) &&
          appearance.musicMode === "upload" &&
          appearance.musicUrl
        ? [
            {
              id: "legacy-track",
              url: appearance.musicUrl,
              title: appearance.musicTitle || "on repeat",
              artist: appearance.musicArtist || "",
              coverUrl: appearance.musicCoverUrl || ""
            }
          ]
        : [];

  return {
    ...appearance,
    animation: ["none", "subtle", "playful", "float", "pulse"].includes(
      appearance.animation
    )
      ? appearance.animation
      : defaultAppearance.animation,
    backgroundEffect: ["none", "aurora", "grid"].includes(
      appearance.backgroundEffect
    )
      ? appearance.backgroundEffect
      : defaultAppearance.backgroundEffect,
    cardEffect: ["none", "glow", "gradient"].includes(appearance.cardEffect)
      ? appearance.cardEffect
      : defaultAppearance.cardEffect,
    musicMode: ["off", "upload"].includes(appearance.musicMode)
      ? appearance.musicMode
      : defaultAppearance.musicMode,
    musicUrl:
      typeof appearance.musicUrl === "string" ? appearance.musicUrl : "",
    musicTitle:
      typeof appearance.musicTitle === "string" ? appearance.musicTitle : "",
    musicArtist:
      typeof appearance.musicArtist === "string" ? appearance.musicArtist : "",
    musicCoverUrl:
      typeof appearance.musicCoverUrl === "string" ? appearance.musicCoverUrl : "",
    musicTracks: normalizedTracks,
    enterText:
      typeof appearance.enterText === "string" ? appearance.enterText : defaultAppearance.enterText,
    enterEffect: [
      "none",
      "spotlight",
      "glitch",
      "sparkles",
      "aurora",
      "snow",
      "rain"
    ].includes(appearance.enterEffect)
      ? appearance.enterEffect
      : defaultAppearance.enterEffect,
    usernameEffect: normalizeUsernameEffect(appearance.usernameEffect),
    backgroundColor: isHexColor(appearance.backgroundColor)
      ? appearance.backgroundColor
      : defaultAppearance.backgroundColor,
    textColor: isHexColor(appearance.textColor)
      ? appearance.textColor
      : defaultAppearance.textColor
  };
}
