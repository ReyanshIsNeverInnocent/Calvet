import { USERNAME_EFFECTS, type Appearance } from "@/types/profile";

export const defaultAppearance: Appearance = {
  theme: "dark",
  accentColor: "#a991ff",
  textColor: "#f4f1fa",
  backgroundColor: "#09090d",
  backgroundImage: "",
  cardOpacity: 0.32,
  surfaceStyle: "glass",
  surfaceColor: "#211d2b",
  surfaceBlur: 18,
  surfaceBorderColor: "#ffffff",
  surfaceBorderOpacity: 0.18,
  surfaceBorderWidth: 1,
  surfaceRadius: 26,
  surfaceHighlight: true,
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
  avatarImageUpload: "",
  bannerImageUpload: "",
  backgroundImageUpload: "",
  enterText: "click to enter",
  enterBlur: 2,
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
  const legacyEnterBlur: unknown = value?.enterBlur;
  const tracks = Array.isArray(value?.musicTracks)
    ? value.musicTracks
        .filter(
          (track) =>
            track &&
            typeof track.id === "string" &&
            typeof track.url === "string" &&
            typeof track.title === "string" &&
            typeof track.artist === "string" &&
            typeof track.coverUrl === "string" &&
            (track.coverImageUrl === undefined ||
              typeof track.coverImageUrl === "string")
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
    cardOpacity:
      typeof appearance.cardOpacity === "number" &&
      Number.isFinite(appearance.cardOpacity)
        ? Math.min(1, Math.max(0, appearance.cardOpacity))
        : defaultAppearance.cardOpacity,
    surfaceStyle: ["glass", "solid", "gradient"].includes(appearance.surfaceStyle)
      ? appearance.surfaceStyle
      : defaultAppearance.surfaceStyle,
    surfaceColor: isHexColor(appearance.surfaceColor)
      ? appearance.surfaceColor
      : defaultAppearance.surfaceColor,
    surfaceBlur:
      typeof appearance.surfaceBlur === "number" &&
      Number.isFinite(appearance.surfaceBlur)
        ? Math.min(40, Math.max(0, appearance.surfaceBlur))
        : defaultAppearance.surfaceBlur,
    surfaceBorderColor: isHexColor(appearance.surfaceBorderColor)
      ? appearance.surfaceBorderColor
      : defaultAppearance.surfaceBorderColor,
    surfaceBorderOpacity:
      typeof appearance.surfaceBorderOpacity === "number" &&
      Number.isFinite(appearance.surfaceBorderOpacity)
        ? Math.min(1, Math.max(0, appearance.surfaceBorderOpacity))
        : defaultAppearance.surfaceBorderOpacity,
    surfaceBorderWidth:
      typeof appearance.surfaceBorderWidth === "number" &&
      Number.isFinite(appearance.surfaceBorderWidth)
        ? Math.min(4, Math.max(0, appearance.surfaceBorderWidth))
        : defaultAppearance.surfaceBorderWidth,
    surfaceRadius:
      typeof appearance.surfaceRadius === "number" &&
      Number.isFinite(appearance.surfaceRadius)
        ? Math.min(48, Math.max(0, appearance.surfaceRadius))
        : defaultAppearance.surfaceRadius,
    surfaceHighlight:
      typeof appearance.surfaceHighlight === "boolean"
        ? appearance.surfaceHighlight
        : defaultAppearance.surfaceHighlight,
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
    avatarImageUpload:
      typeof appearance.avatarImageUpload === "string" ? appearance.avatarImageUpload : "",
    bannerImageUpload:
      typeof appearance.bannerImageUpload === "string" ? appearance.bannerImageUpload : "",
    backgroundImageUpload:
      typeof appearance.backgroundImageUpload === "string"
        ? appearance.backgroundImageUpload
        : "",
    enterText:
      typeof appearance.enterText === "string" ? appearance.enterText : defaultAppearance.enterText,
    enterBlur:
      typeof appearance.enterBlur === "number" &&
      Number.isFinite(appearance.enterBlur)
        ? Math.min(20, Math.max(0, appearance.enterBlur))
        : legacyEnterBlur === true
          ? defaultAppearance.enterBlur
          : 0,
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
