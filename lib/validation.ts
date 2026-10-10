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
    cardOpacity: z.number().min(0.35).max(1),
    radius: z.enum(["small", "medium", "large"]),
    shadow: z.boolean(),
    font: z.enum(["inter", "system", "serif"]),
    spacing: z.enum(["compact", "comfortable", "airy"]),
    animation: z.enum(["none", "subtle", "playful", "float", "pulse"]),
    backgroundEffect: z.enum(["none", "aurora", "grid"]),
    cardEffect: z.enum(["none", "glow", "gradient"]),
    usernameEffect: z.enum(USERNAME_EFFECTS),
    reducedMotion: z.boolean()
  })
});

export const linkSchema = z.object({
  title: z.string().trim().min(1).max(80),
  url: urlSchema,
  description: z.string().trim().max(140),
  icon: z.string().trim().max(40),
  position: z.number().int().nonnegative(),
  enabled: z.boolean()
});
