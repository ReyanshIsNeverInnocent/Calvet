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
  reducedMotion: false
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
    usernameEffect: normalizeUsernameEffect(appearance.usernameEffect),
    backgroundColor: isHexColor(appearance.backgroundColor)
      ? appearance.backgroundColor
      : defaultAppearance.backgroundColor,
    textColor: isHexColor(appearance.textColor)
      ? appearance.textColor
      : defaultAppearance.textColor
  };
}
