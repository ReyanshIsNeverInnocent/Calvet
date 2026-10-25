import { z } from "zod";
import { USERNAME_EFFECTS } from "@/types/profile";

export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(24)
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores are allowed")
  .transform((value) => value.toLowerCase());

export const urlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), "Only HTTP and HTTPS URLs are supported");

const optionalImageUrlSchema = z
  .string()
  .max(2048)
  .refine(
    (value) => value === "" || urlSchema.safeParse(value).success,
    "Enter a valid HTTP or HTTPS image URL, or leave it empty."
  );

export const profileSchema = z.object({
  username: usernameSchema,
  display_name: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(280),
  avatar_url: z.string().url().or(z.literal("")),
  banner_url: z.string().url().or(z.literal("")),
  location: z.string().trim().max(80),
  pronouns: z.string().trim().max(40),
  status: z.string().trim().max(100),
  mode: z.enum(["minimal", "social", "portfolio", "personal"]),
  is_public: z.boolean(),
  appearance: z.object({
    theme: z.literal("dark"),
    accentColor: z.string().regex(/^#[0-9a-f]{6}$/i),
    textColor: z.string().regex(/^#[0-9a-f]{6}$/i),
    backgroundColor: z.string().regex(/^#[0-9a-f]{6}$/i),
    backgroundImage: z.string().url().or(z.literal("")),
    cardOpacity: z.number().min(0).max(1),
    surfaceStyle: z.enum(["glass", "solid", "gradient"]),
    surfaceColor: z.string().regex(/^#[0-9a-f]{6}$/i),
    surfaceBlur: z.number().min(0).max(40),
    surfaceBorderColor: z.string().regex(/^#[0-9a-f]{6}$/i),
    surfaceBorderOpacity: z.number().min(0).max(1),
    surfaceBorderWidth: z.number().min(0).max(4),
    surfaceRadius: z.number().min(0).max(48),
    surfaceHighlight: z.boolean(),
    radius: z.enum(["small", "medium", "large"]),
    shadow: z.boolean(),
    font: z.enum(["inter", "system", "serif"]),
    spacing: z.enum(["compact", "comfortable", "airy"]),
    animation: z.enum(["none", "subtle", "playful", "float", "pulse"]),
    backgroundEffect: z.enum(["none", "aurora", "grid"]),
    cardEffect: z.enum(["none", "glow", "gradient"]),
    usernameEffect: z.enum(USERNAME_EFFECTS),
    reducedMotion: z.boolean(),
    musicMode: z.enum(["off", "upload"]),
    musicUrl: z.string().max(2048),
    musicTitle: z.string().trim().max(120),
    musicArtist: z.string().trim().max(120),
    musicCoverUrl: z.string().max(2048),
    musicTracks: z
      .array(
        z.object({
          id: z.string().min(1).max(100),
          url: z.string().url().max(2048),
          title: z.string().trim().max(120),
          artist: z.string().trim().max(120),
          coverUrl: optionalImageUrlSchema,
          coverImageUrl: optionalImageUrlSchema.optional()
        })
      )
      .max(3),
    socialsMonochrome: z.boolean(),
    projectsHeading: z.string().trim().max(32),
    mediaHeading: z.string().trim().max(32),
    avatarImageUpload: z.string().url().or(z.literal("")),
    bannerImageUpload: z.string().url().or(z.literal("")),
    backgroundImageUpload: z.string().url().or(z.literal("")),
    enterText: z.string().trim().min(1).max(60),
    enterBlur: z.number().min(0).max(20),
    enterEffect: z.enum([
      "none",
      "spotlight",
      "glitch",
      "sparkles",
      "aurora",
      "snow",
      "rain"
    ])
  })
});
