"use client";

import Link from "next/link";
import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  Link2,
  Music2,
  Palette,
  Plus,
  Settings,
  Trash2,
  UserRound
} from "lucide-react";
import { read } from "jsmediatags/dist/jsmediatags.min.js";
import { createClient } from "@/lib/supabase/browser";
import { linkSchema, profileSchema, urlSchema } from "@/lib/validation";
import { getAppearance } from "@/lib/appearance";
import { linkIconOptions, suggestLink } from "@/lib/links";
import ProfileRenderer from "@/components/ProfileRenderer";
import ImageCropDialog from "@/components/ImageCropDialog";
import UsernameEffect from "@/components/UsernameEffect";
import { USERNAME_EFFECTS } from "@/types/profile";
import type {
  Appearance,
  Profile,
  ProfileLink,
  Project,
  SocialLink,
  PublicProfileData,
  MusicTrack
} from "@/types/profile";
import SignOutButton from "@/components/SignOutButton";

type Props = {
  userEmail: string;
  initialProfile: Profile;
  initialLinks: ProfileLink[];
  initialSocials: SocialLink[];
  initialProjects: Project[];
};

type EditorSection = "profile" | "appearance" | "music" | "links" | "settings";

const usernameEffectLabels: Record<Appearance["usernameEffect"], string> = {
  none: "None",
  typewriter: "Typewriter",
  rainbow: "Rainbow",
  shuffle: "Shuffle",
  glitch: "Glitch",
  fuzzy: "Fuzzy",
  sparkle: "Sparkle",
  "particles-blue": "Blue particles",
  "particles-green": "Green particles",
  "particles-pink": "Pink particles",
  "particles-red": "Red particles",
  "particles-white": "White particles",
  "particles-gold": "Gold particles",
  "hennessy-prism": "Prism",
  "hennessy-orbit": "Orbit",
  "hennessy-shimmer": "Shimmer"
};

const usernameEffectOptions = USERNAME_EFFECTS.map((value) => ({
  value,
  label: usernameEffectLabels[value],
  sample: value === "shuffle" ? "Calve7" : "Calvet"
}));

type AudioMetadata = {
  title: string;
  artist: string;
  cover?: Blob;
};

function createUploadId() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getMusicStorageErrorMessage(error: { message: string }) {
  if (error.message.toLowerCase().includes("bucket not found")) {
    return 'The "profile-music" storage bucket is missing. Run supabase/migrations/008_profile_music.sql in the SQL Editor for the Supabase project configured in .env.local, then try again.';
  }

  return error.message;
}

function readAudioMetadata(file: File): Promise<AudioMetadata> {
  return new Promise((resolve) => {
    try {
      read(file, {
        onSuccess: ({ tags }) => {
          try {
            const picture = tags.picture;
            const cover = picture
              ? new Blob([new Uint8Array(picture.data)], { type: picture.format })
              : undefined;

            resolve({
              title: tags.title?.trim() ?? "",
              artist: tags.artist?.trim() ?? "",
              cover
            });
          } catch {
            resolve({ title: tags.title?.trim() ?? "", artist: tags.artist?.trim() ?? "" });
          }
        },
        onError: () => resolve({ title: "", artist: "" })
      });
    } catch {
      resolve({ title: "", artist: "" });
    }
  });
}

type ProfileImageTarget =
  | "avatarImageUpload"
  | "bannerImageUpload"
  | "backgroundImageUpload";

type CropImageState =
  | {
      file: File;
      imageUrl: string;
      target: "avatarImageUpload" | "bannerImageUpload";
    }
  | {
      file: File;
      imageUrl: string;
      target: "musicCover";
      trackId: string;
    };

export default function DashboardClient({
  userEmail,
  initialProfile,
  initialLinks,
  initialSocials,
  initialProjects
}: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile>({
    ...initialProfile,
    appearance: getAppearance(initialProfile.appearance)
  });
  const [links, setLinks] = useState(initialLinks);
  const [socials, setSocials] = useState(initialSocials);
  const [projects, setProjects] = useState(initialProjects);
  const [active, setActive] = useState<EditorSection>("profile");
  const [notice, setNotice] = useState("");
  const [cropImage, setCropImage] = useState<CropImageState | null>(null);
  const profileSaveRevision = useRef(0);
  const profileSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const previousProfile = useRef(profile);
  const [linkUrlInput, setLinkUrlInput] = useState("");
  const [linkTitleInput, setLinkTitleInput] = useState("");
  const [linkIconInput, setLinkIconInput] = useState("link");
  const [addingLink, setAddingLink] = useState(false);
  const [reorderingLinks, setReorderingLinks] = useState(false);
  const [reorderingSocials, setReorderingSocials] = useState(false);

  function updateProfile<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function updateAppearance<K extends keyof Appearance>(
    key: K,
    value: Appearance[K]
  ) {
    setProfile((current) => ({
      ...current,
      appearance: { ...current.appearance, [key]: value }
    }));
  }

  function applyAppearancePreset(
    preset: "glass" | "neon" | "minimal"
  ) {
    const presets = {
      glass: {
        accentColor: "#a991ff",
        backgroundColor: "#09090d",
        surfaceStyle: "glass",
        surfaceColor: "#211d2b",
        cardOpacity: 0.32,
        surfaceBlur: 18,
        surfaceBorderColor: "#ffffff",
        surfaceBorderOpacity: 0.18,
        surfaceBorderWidth: 1,
        surfaceRadius: 26,
        surfaceHighlight: true,
        cardEffect: "none",
        backgroundEffect: "none",
        animation: "subtle"
      },
      neon: {
        accentColor: "#a991ff",
        backgroundColor: "#09090d",
        surfaceStyle: "glass",
        surfaceColor: "#110e1b",
        cardOpacity: 0.48,
        surfaceBlur: 14,
        surfaceBorderColor: "#a991ff",
        surfaceBorderOpacity: 0.38,
        surfaceBorderWidth: 1,
        surfaceRadius: 22,
        surfaceHighlight: true,
        cardEffect: "glow",
        backgroundEffect: "aurora",
        animation: "playful"
      },
      minimal: {
        accentColor: "#c1b7a5",
        backgroundColor: "#101010",
        surfaceStyle: "solid",
        surfaceColor: "#181818",
        cardOpacity: 0.9,
        surfaceBlur: 0,
        surfaceBorderColor: "#ffffff",
        surfaceBorderOpacity: 0.08,
        surfaceBorderWidth: 1,
        surfaceRadius: 16,
        surfaceHighlight: false,
        cardEffect: "none",
        backgroundEffect: "none",
        animation: "none"
      }
    } satisfies Record<
      "glass" | "neon" | "minimal",
      Pick<
        Appearance,
        | "accentColor"
        | "backgroundColor"
        | "surfaceStyle"
        | "surfaceColor"
        | "cardOpacity"
        | "surfaceBlur"
        | "surfaceBorderColor"
        | "surfaceBorderOpacity"
        | "surfaceBorderWidth"
        | "surfaceRadius"
        | "surfaceHighlight"
        | "cardEffect"
        | "backgroundEffect"
        | "animation"
      >
    >;

    setProfile((current) => ({
      ...current,
      appearance: { ...current.appearance, ...presets[preset] }
    }));
  }

  function setMusicTracks(
    tracks: MusicTrack[],
    musicMode?: Appearance["musicMode"]
  ) {
    const firstTrack = tracks[0];
    setProfile((current) => ({
      ...current,
      appearance: {
        ...current.appearance,
        musicMode:
          musicMode ??
          (tracks.length === 0
            ? "off"
            : current.appearance.musicMode),
        musicTracks: tracks,
        musicUrl: firstTrack?.url ?? "",
        musicTitle: firstTrack?.title ?? "",
        musicArtist: firstTrack?.artist ?? "",
        musicCoverUrl: firstTrack?.coverUrl ?? ""
      }
    }));
  }

  useEffect(() => {
    if (previousProfile.current === profile) {
      return;
    }
    previousProfile.current = profile;

    const revision = ++profileSaveRevision.current;
    const timer = window.setTimeout(() => {
      const result = profileSchema.safeParse({
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        banner_url: profile.banner_url,
        location: profile.location,
        pronouns: profile.pronouns,
        status: profile.status,
        mode: profile.mode,
        is_public: profile.is_public,
        appearance: getAppearance(profile.appearance)
      });

      if (!result.success) {
        setNotice(
          result.error.issues[0]?.message ?? "Please check your profile fields."
        );
        return;
      }

      setNotice("Saving changes…");
      profileSaveQueue.current = profileSaveQueue.current
        .then(async () => {
          if (revision !== profileSaveRevision.current) {
            return;
          }

          const { error } = await supabase
            .from("profiles")
            .update({
              ...result.data,
              updated_at: new Date().toISOString()
            })
            .eq("id", profile.id);

          if (revision !== profileSaveRevision.current) {
            return;
          }

          if (error) {
            setNotice(
              error.code === "23505"
                ? "That username is already taken."
                : `Could not save changes: ${error.message}`
            );
            return;
          }

          setNotice("Changes saved automatically.");
        })
        .catch((error: unknown) => {
          if (revision === profileSaveRevision.current) {
            setNotice(
              error instanceof Error
                ? `Could not save changes: ${error.message}`
                : "Could not save profile changes."
            );
          }
        });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [profile, supabase]);

  async function addLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    const suggestion = suggestLink(linkUrlInput);
    if (!suggestion) {
      setNotice("Enter a valid HTTP or HTTPS URL.");
      return;
    }

    const linkValues = linkSchema.safeParse({
      title: linkTitleInput || suggestion.title,
      url: suggestion.url,
      description: "",
      icon: linkIconInput,
      position: Math.max(-1, ...links.map((link) => link.position)) + 1,
      enabled: true
    });

    if (!linkValues.success) {
      setNotice(linkValues.error.issues[0]?.message ?? "Please check the link details.");
      return;
    }

    setAddingLink(true);
    const { data, error } = await supabase
      .from("links")
      .insert({
        profile_id: profile.id,
        ...linkValues.data
      })
      .select("*")
      .single();

    setAddingLink(false);

    if (error) {
      setNotice(error.message);
      return;
    }

    setLinks((current) => [...current, data]);
    setLinkUrlInput("");
    setLinkTitleInput("");
    setLinkIconInput("link");
    setNotice("Link added.");
  }

  async function uploadMusicFile(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;
    const existingTracks = profile.appearance.musicTracks;
    const availableSlots = 3 - existingTracks.length;
    if (availableSlots <= 0) {
      setNotice("A profile can have up to 3 songs. Remove one before adding another.");
      return;
    }

    const contentTypes: Record<string, string> = {
      mp3: "audio/mpeg",
      m4a: "audio/mp4",
      aac: "audio/aac",
      ogg: "audio/ogg",
      wav: "audio/wav",
      webm: "audio/webm"
    };
    const filesToUpload = files.slice(0, availableSlots);
    const warnings: string[] = [];
    if (files.length > availableSlots) {
      warnings.push(`Only ${availableSlots} more song${availableSlots === 1 ? "" : "s"} can be added.`);
    }
    const uploadedTracks: MusicTrack[] = [];

    for (const file of filesToUpload) {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (
        !extension ||
        !contentTypes[extension] ||
        (file.type && !file.type.startsWith("audio/"))
      ) {
        warnings.push(`${file.name}: use MP3, M4A, AAC, OGG, WAV, or WebM.`);
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        warnings.push(`${file.name}: audio files must be 15 MB or smaller.`);
        continue;
      }

      try {
        setNotice(`Reading song info for ${file.name}...`);
        const metadata = await readAudioMetadata(file);
        setNotice(`Uploading ${file.name}...`);
        const path = `${profile.user_id}/${createUploadId()}.${extension}`;
        const { data, error } = await supabase.storage
          .from("profile-music")
          .upload(path, file, {
            cacheControl: "31536000",
            contentType: contentTypes[extension],
            upsert: false
          });

        if (error) {
          warnings.push(`${file.name}: ${getMusicStorageErrorMessage(error)}`);
          continue;
        }

        let coverUrl = "";
        if (metadata.cover) {
          const coverTypes: Record<string, string> = {
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/png": "png",
            "image/webp": "webp"
          };
          const coverType = coverTypes[metadata.cover.type.toLowerCase()];
          if (metadata.cover.size > 5 * 1024 * 1024) {
            warnings.push(`${file.name}: embedded cover exceeds 5 MB and was skipped.`);
          } else if (coverType) {
            const coverContentType =
              metadata.cover.type.toLowerCase() === "image/jpg"
                ? "image/jpeg"
                : metadata.cover.type.toLowerCase();
            const coverPath = `${profile.user_id}/${createUploadId()}.${coverType}`;
            try {
              const { data: coverData, error: coverError } = await supabase.storage
                .from("profile-music")
                .upload(coverPath, metadata.cover, {
                  cacheControl: "31536000",
                  contentType: coverContentType,
                  upsert: false
                });

              if (coverError) {
                warnings.push(`${file.name}: cover upload failed: ${getMusicStorageErrorMessage(coverError)}`);
              } else {
                coverUrl = supabase.storage
                  .from("profile-music")
                  .getPublicUrl(coverData.path).data.publicUrl;
              }
            } catch (error) {
              warnings.push(
                `${file.name}: cover upload failed: ${error instanceof Error ? error.message : "An unexpected error occurred."}`
              );
            }
          } else {
            warnings.push(`${file.name}: embedded cover format is unsupported.`);
          }
        }

        uploadedTracks.push({
          id: createUploadId(),
          url: supabase.storage.from("profile-music").getPublicUrl(data.path)
            .data.publicUrl,
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
          artist: metadata.artist,
          coverUrl
        });
      } catch (error) {
        warnings.push(
          `${file.name}: ${error instanceof Error ? error.message : "An unexpected upload error occurred."}`
        );
      }
    }

    if (uploadedTracks.length > 0) {
      setMusicTracks([...existingTracks, ...uploadedTracks], "upload");
    }
    setNotice(
      warnings.length > 0
        ? `${uploadedTracks.length} song${uploadedTracks.length === 1 ? "" : "s"} added. ${warnings.join(" ")}`
        : `${uploadedTracks.length} song${uploadedTracks.length === 1 ? "" : "s"} added. Your profile is saving.`
    );
  }

  async function uploadProfileImage(
    event: ChangeEvent<HTMLInputElement>,
    target: ProfileImageTarget | "projectImageUpload",
    projectId?: string
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const imageTypes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };
    const extension = imageTypes[file.type.toLowerCase()];
    if (!extension) {
      setNotice("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice("Images must be 5 MB or smaller.");
      return;
    }

    if (target === "avatarImageUpload" || target === "bannerImageUpload") {
      setCropImage({ file, imageUrl: URL.createObjectURL(file), target });
      return;
    }

    try {
      await uploadProfileImageFile(file, extension, target, projectId);
    } catch (error) {
      setNotice(
        `Could not upload image: ${error instanceof Error ? error.message : "An unexpected error occurred."}`
      );
    }
  }

  async function uploadProfileImageFile(
    file: Blob,
    extension: string,
    target: ProfileImageTarget | "projectImageUpload",
    projectId?: string
  ) {
    setNotice("Uploading image...");
    const path = `${profile.user_id}/${createUploadId()}.${extension}`;
    const { data, error } = await supabase.storage
      .from("profile-music")
      .upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw new Error(getMusicStorageErrorMessage(error));
    }

    const { data: publicUrl } = supabase.storage
      .from("profile-music")
      .getPublicUrl(data.path);

    if (target === "projectImageUpload") {
      if (!projectId) {
        throw new Error("Could not identify the project for this image.");
      }
      await updateProject(projectId, { image_upload_url: publicUrl.publicUrl });
      return;
    }

    updateAppearance(target, publicUrl.publicUrl);
    setNotice("Image uploaded. Your profile is saving.");
  }

  function selectMusicCover(
    event: ChangeEvent<HTMLInputElement>,
    trackId: string
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const coverExtensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };
    const extension = coverExtensions[file.type.toLowerCase()];
    if (!extension) {
      setNotice("Choose a JPG, PNG, or WebP image for the cover.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice("Cover images must be 5 MB or smaller.");
      return;
    }

    setCropImage({
      file,
      imageUrl: URL.createObjectURL(file),
      target: "musicCover",
      trackId
    });
  }

  async function uploadMusicCoverFile(file: Blob, trackId: string) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Cropped cover images must be 5 MB or smaller.");
    }

    try {
      setNotice("Uploading cropped cover...");
      const path = `${profile.user_id}/${createUploadId()}.png`;
      const { data, error } = await supabase.storage
        .from("profile-music")
        .upload(path, file, {
          cacheControl: "31536000",
          contentType: "image/png",
          upsert: false
        });
      if (error) {
        throw new Error(getMusicStorageErrorMessage(error));
      }

      const { data: publicUrl } = supabase.storage
        .from("profile-music")
        .getPublicUrl(data.path);
      setMusicTracks(
        profile.appearance.musicTracks.map((track) =>
          track.id === trackId
            ? { ...track, coverUrl: publicUrl.publicUrl }
            : track
        )
      );
      setNotice("Cover uploaded. Your profile is saving.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      setNotice(`Could not upload cover: ${message}`);
      throw new Error(message);
    }
  }

  async function updateLink(
    id: string,
    patch: Partial<
      Pick<ProfileLink, "title" | "url" | "description" | "icon" | "enabled">
    >
  ) {
    const existingLink = links.find((link) => link.id === id);
    if (!existingLink) {
      setNotice("This link is no longer available. Refresh and try again.");
      return;
    }

    const parsedLink = linkSchema.safeParse({ ...existingLink, ...patch });
    if (!parsedLink.success) {
      setNotice(parsedLink.error.issues[0]?.message ?? "Please check the link details.");
      return;
    }

    const normalizedPatch: Partial<
      Pick<ProfileLink, "title" | "url" | "description" | "icon" | "enabled">
    > = {};
    if (patch.title !== undefined) normalizedPatch.title = parsedLink.data.title;
    if (patch.url !== undefined) normalizedPatch.url = parsedLink.data.url;
    if (patch.description !== undefined) {
      normalizedPatch.description = parsedLink.data.description;
    }
    if (patch.icon !== undefined) normalizedPatch.icon = parsedLink.data.icon;
    if (patch.enabled !== undefined) normalizedPatch.enabled = parsedLink.data.enabled;

    const { error } = await supabase
      .from("links")
      .update(normalizedPatch)
      .eq("id", id);

    if (error) {
      setNotice(error.message);
      return;
    }

    setLinks((current) =>
      current.map((link) =>
        link.id === id ? { ...link, ...normalizedPatch } : link
      )
    );
    setNotice("Link updated.");
  }

  async function moveLink(id: string, direction: -1 | 1) {
    if (reorderingLinks) return;

    const currentIndex = links.findIndex((link) => link.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= links.length) return;

    const reordered = [...links];
    const [movedLink] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, movedLink);
    const positionedLinks = reordered.map((link, position) => ({
      ...link,
      position
    }));

    setLinks(positionedLinks);
    setReorderingLinks(true);
    setNotice("");

    const results = await Promise.all(
      positionedLinks.map((link) =>
        supabase
          .from("links")
          .update({ position: link.position })
          .eq("id", link.id)
      )
    );

    const failedUpdate = results.find((result) => result.error !== null);

    if (failedUpdate?.error) {
      const { data: refreshedLinks, error: refreshError } = await supabase
        .from("links")
        .select("*")
        .eq("profile_id", profile.id)
        .order("position");

      if (refreshError) {
        setLinks(links);
        setReorderingLinks(false);
        setNotice(
          `Could not save link order: ${failedUpdate.error.message}. Could not refresh the saved order: ${refreshError.message}`
        );
        return;
      }

      setLinks(refreshedLinks ?? []);
      setReorderingLinks(false);
      setNotice(`Could not save link order: ${failedUpdate.error.message}`);
      return;
    }

    setReorderingLinks(false);
    setNotice("Link order saved.");
  }

  async function removeLink(id: string) {
    const { error } = await supabase.from("links").delete().eq("id", id);

    if (error) {
      setNotice(error.message);
      return;
    }

    setLinks((current) => current.filter((link) => link.id !== id));
    setNotice("Link removed.");
  }

  async function addSocial() {
    const { data, error } = await supabase
      .from("social_links")
      .insert({
        profile_id: profile.id,
        platform: "github",
        url: "https://github.com",
        position: Math.max(-1, ...socials.map((social) => social.position)) + 1,
        enabled: true
      })
      .select("*")
      .single();

    if (error) {
      setNotice(error.message);
      return;
    }

    setSocials((current) => [...current, data]);
    setNotice("Social link added.");
  }

  async function updateSocial(
    id: string,
    patch: Partial<Pick<SocialLink, "platform" | "url" | "enabled">>
  ) {
    const normalizedPatch = { ...patch };

    if (patch.platform !== undefined) {
      normalizedPatch.platform = patch.platform.trim();
      if (!normalizedPatch.platform || normalizedPatch.platform.length > 40) {
        setNotice("Platform must be between 1 and 40 characters.");
        return;
      }
    }

    if (patch.url !== undefined && !urlSchema.safeParse(patch.url).success) {
      setNotice("Enter a valid HTTP or HTTPS URL.");
      return;
    }

    const { error } = await supabase
      .from("social_links")
      .update(normalizedPatch)
      .eq("id", id);

    if (error) {
      setNotice(error.message);
      return;
    }

    setSocials((current) =>
      current.map((social) =>
        social.id === id ? { ...social, ...normalizedPatch } : social
      )
    );
    setNotice("Social link updated.");
  }

  async function removeSocial(id: string) {
    const { error } = await supabase.from("social_links").delete().eq("id", id);

    if (error) {
      setNotice(error.message);
      return;
    }

    setSocials((current) => current.filter((social) => social.id !== id));
    setNotice("Social link removed.");
  }

  async function moveSocial(id: string, direction: -1 | 1) {
    if (reorderingSocials) return;

    const currentIndex = socials.findIndex((social) => social.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= socials.length) return;

    const reordered = [...socials];
    const [movedSocial] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, movedSocial);
    const positionedSocials = reordered.map((social, position) => ({
      ...social,
      position
    }));

    setSocials(positionedSocials);
    setReorderingSocials(true);
    setNotice("");

    const results = await Promise.all(
      positionedSocials.map((social) =>
        supabase
          .from("social_links")
          .update({ position: social.position })
          .eq("id", social.id)
      )
    );
    const failedUpdate = results.find((result) => result.error !== null);

    if (failedUpdate?.error) {
      const { data: refreshedSocials, error: refreshError } = await supabase
        .from("social_links")
        .select("*")
        .eq("profile_id", profile.id)
        .order("position");

      if (refreshError) {
        setSocials(socials);
        setReorderingSocials(false);
        setNotice(
          `Could not save social order: ${failedUpdate.error.message}. Could not refresh the saved order: ${refreshError.message}`
        );
        return;
      }

      setSocials(refreshedSocials ?? []);
      setReorderingSocials(false);
      setNotice(`Could not save social order: ${failedUpdate.error.message}`);
      return;
    }

    setReorderingSocials(false);
    setNotice("Social order saved.");
  }

  async function addProject() {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        profile_id: profile.id,
        title: "New project",
        description: "",
        url: "https://example.com",
        image_url: "",
        image_upload_url: "",
        tags: [],
        position: projects.length,
        enabled: true
      })
      .select("*")
      .single();

    if (error) {
      setNotice(error.message);
      return;
    }

    setProjects((current) => [...current, data]);
    setNotice("Project added.");
  }

  async function updateProject(
    id: string,
    patch: Partial<
      Pick<
        Project,
        "title" | "description" | "url" | "image_upload_url" | "tags" | "enabled"
      >
    >
  ) {
    if (
      patch.title !== undefined &&
      (!patch.title.trim() || patch.title.trim().length > 100)
    ) {
      setNotice("Project title must be between 1 and 100 characters.");
      return;
    }

    if (patch.description !== undefined && patch.description.length > 500) {
      setNotice("Project description must be 500 characters or fewer.");
      return;
    }

    if (patch.url !== undefined && !urlSchema.safeParse(patch.url).success) {
      setNotice("Enter a valid HTTP or HTTPS project URL.");
      return;
    }

    if (
      patch.image_upload_url !== undefined &&
      patch.image_upload_url !== "" &&
      !urlSchema.safeParse(patch.image_upload_url).success
    ) {
      setNotice("The uploaded project image could not be saved.");
      return;
    }

    const { error } = await supabase.from("projects").update(patch).eq("id", id);

    if (error) {
      setNotice(error.message);
      return;
    }

    setProjects((current) =>
      current.map((project) =>
        project.id === id ? { ...project, ...patch } : project
      )
    );
    setNotice("Project updated.");
  }

  async function removeProject(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      setNotice(error.message);
      return;
    }

    setProjects((current) => current.filter((project) => project.id !== id));
    setNotice("Project removed.");
  }

  async function exportProfile() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      links,
      socials,
      projects
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${profile.username}-calvet-backup.json`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  const sections: { id: EditorSection; label: string; icon: typeof UserRound }[] = [
    { id: "profile", label: "Profile", icon: UserRound },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "music", label: "Music", icon: Music2 },
    { id: "links", label: "Links", icon: Link2 },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  const profileUrl = `/@${encodeURIComponent(profile.username)}`;
  const linkSuggestion = suggestLink(linkUrlInput);

  return (
    <main className="dashboard-shell min-h-screen bg-[#f5f1e7] text-[#292b24]">
      {cropImage && (
        <ImageCropDialog
          key={`${cropImage.file.name}-${cropImage.file.lastModified}`}
          imageUrl={cropImage.imageUrl}
          aspectRatio={
            cropImage.target === "bannerImageUpload"
              ? 3
              : 1
          }
          title={
            cropImage.target === "avatarImageUpload"
              ? "avatar"
              : cropImage.target === "bannerImageUpload"
                ? "banner"
                : "music cover"
          }
          onCancel={() => {
            URL.revokeObjectURL(cropImage.imageUrl);
            setCropImage(null);
          }}
          onSave={async (image) => {
            if (cropImage.target === "musicCover") {
              await uploadMusicCoverFile(image, cropImage.trackId);
            } else {
              await uploadProfileImageFile(image, "png", cropImage.target);
            }
            URL.revokeObjectURL(cropImage.imageUrl);
            setCropImage(null);
          }}
        />
      )}
      <header className="sticky top-0 z-20 border-b border-[#292b24]/10 bg-[#f5f1e7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="brand-mark inline-flex items-center gap-2 text-xl font-black tracking-[-0.08em]"
            aria-label="Calvet home"
          >
            <Image
              src="/CalvetLogo.jpg"
              alt=""
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span>
              calvet
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-black/50 sm:inline">
              {userEmail}
            </span>
            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#292b24]/10 bg-[#fffdf7] px-4 py-2 text-sm font-semibold hover:bg-[#e6edb9]"
            >
              <Eye size={16} />
              View page
              <ExternalLink size={14} />
            </a>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside>
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#77776d]">
            Your page
          </p>
          <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  active === id
                    ? "bg-[#e6edb9] text-[#353a25] shadow-sm"
                    : "text-[#77776d] hover:bg-white/70 hover:text-[#292b24]"
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-8 hidden -rotate-1 rounded-[1.6rem] bg-[#dce5ae] p-5 text-[#39412c] shadow-sm lg:block">
            <p className="font-serif text-lg">
              Your page
            </p>
            <p className="mt-2 break-all text-sm font-medium">
              /@{profile.username}
            </p>
            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#536039] hover:text-[#292b24]"
            >
              Open profile <ExternalLink size={13} />
            </a>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#7965db]">Calvet / editor</p>
              <h1 className="mt-1 font-serif text-4xl tracking-tight">
                {sections.find((item) => item.id === active)?.label}
              </h1>
            </div>

          </div>

          {notice && (
            <div
              role="status"
              className="mb-5 rounded-2xl border border-[#292b24]/10 bg-[#fffdf7] px-4 py-3 text-sm text-[#64645c]"
            >
              {notice}
            </div>
          )}

          {active === "profile" && (
            <div className="space-y-6">
                <div className="rounded-[1.8rem] border border-white/80 bg-[#fffdf7]/90 p-5 shadow-[0_12px_40px_rgba(56,49,37,.06)] sm:p-7">
                  <h2 className="font-serif text-2xl">The basics</h2>
                  <p className="mt-1 text-sm text-[#77776d]">
                    Give visitors a quick sense of who you are.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold">
                      Username
                      <div className="mt-2 flex items-center rounded-xl border border-black/10 px-3 focus-within:border-violet">
                        <span className="text-black/35">/@</span>
                        <input
                          value={profile.username}
                          onChange={(event) =>
                            updateProfile(
                              "username",
                              event.target.value
                                .replace(/[^a-zA-Z0-9_]/g, "")
                                .toLowerCase()
                            )
                          }
                          pattern="[a-zA-Z0-9_]+"
                          maxLength={24}
                          autoCapitalize="none"
                          spellCheck={false}
                          className="w-full bg-transparent px-2 py-3 outline-none"
                        />
                      </div>
                    </label>

                    <label className="text-sm font-semibold">
                      Display name
                      <input
                        value={profile.display_name}
                        onChange={(event) =>
                          updateProfile("display_name", event.target.value)
                        }
                        maxLength={80}
                        className="mt-2 w-full rounded-xl border border-black/10 px-3 py-3 outline-none focus:border-violet"
                      />
                    </label>

                    <label className="text-sm font-semibold">
                      Bio
                      <textarea
                        value={profile.bio}
                        onChange={(event) => updateProfile("bio", event.target.value)}
                        maxLength={280}
                        rows={3}
                        className="mt-2 w-full resize-y rounded-xl border border-black/10 px-3 py-3 outline-none focus:border-violet"
                      />
                      <span className="mt-1 block text-right text-xs font-normal text-black/35">
                        {profile.bio.length}/280
                      </span>
                    </label>

                    <div className="text-sm font-semibold">
                      Avatar image
                      <span className="mt-2 flex items-center gap-3">
                        <label className="cursor-pointer rounded-lg border border-black/10 px-3 py-2 text-xs font-medium hover:border-violet">
                          Upload avatar
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => uploadProfileImage(event, "avatarImageUpload")}
                            className="sr-only"
                          />
                        </label>
                        {profile.appearance.avatarImageUpload && (
                          <button
                            type="button"
                            onClick={() => updateAppearance("avatarImageUpload", "")}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Remove upload
                          </button>
                        )}
                      </span>
                    </div>

                    <div className="text-sm font-semibold">
                      Banner image
                      <span className="mt-2 flex items-center gap-3">
                        <label className="cursor-pointer rounded-lg border border-black/10 px-3 py-2 text-xs font-medium hover:border-violet">
                          Upload banner
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => uploadProfileImage(event, "bannerImageUpload")}
                            className="sr-only"
                          />
                        </label>
                        {profile.appearance.bannerImageUpload && (
                          <button
                            type="button"
                            onClick={() => updateAppearance("bannerImageUpload", "")}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Remove upload
                          </button>
                        )}
                      </span>
                    </div>

                    <label className="text-sm font-semibold">
                      Location
                      <input
                        value={profile.location}
                        onChange={(event) =>
                          updateProfile("location", event.target.value)
                        }
                        maxLength={80}
                        className="mt-2 w-full rounded-xl border border-black/10 px-3 py-3 outline-none focus:border-violet"
                      />
                    </label>

                    <label className="text-sm font-semibold">
                      Pronouns
                      <input
                        value={profile.pronouns}
                        onChange={(event) =>
                          updateProfile("pronouns", event.target.value)
                        }
                        maxLength={40}
                        placeholder="e.g. they/them"
                        className="mt-2 w-full rounded-xl border border-black/10 px-3 py-3 outline-none focus:border-violet"
                      />
                    </label>

                    <label className="text-sm font-semibold">
                      Current status
                      <input
                        value={profile.status}
                        onChange={(event) =>
                          updateProfile("status", event.target.value)
                        }
                        maxLength={100}
                        placeholder="Add a status (optional)"
                        className="mt-2 w-full rounded-xl border border-black/10 px-3 py-3 outline-none focus:border-violet"
                      />
                    </label>

                    <label className="flex items-center gap-3 rounded-xl bg-black/[0.03] p-4 text-sm font-semibold sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={profile.is_public}
                        onChange={(event) =>
                          updateProfile("is_public", event.target.checked)
                        }
                        className="h-4 w-4 accent-violet"
                      />
                      Make this profile publicly visible
                    </label>
                  </div>
                </div>
            </div>
          )}

          {active === "appearance" && (
            <div>
              <div className="rounded-[1.8rem] border border-white/80 bg-[#fffdf7]/90 p-5 shadow-[0_12px_40px_rgba(56,49,37,.06)] sm:p-7">
                <h2 className="font-serif text-2xl">Design</h2>
                <p className="mt-1 text-sm text-[#77776d]">
                  Start with a style, then open the controls only if you want them.
                </p>

                <div className="mt-6 space-y-6">
                  <section>
                    <h3 className="text-sm font-semibold">Choose a style</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {([
                        {
                          id: "glass",
                          title: "Glass",
                          description: "Soft, translucent surfaces",
                          swatch: "from-violet-400/40 via-[#211d2b] to-[#09090d]"
                        },
                        {
                          id: "neon",
                          title: "Neon",
                          description: "Color, glow, and movement",
                          swatch: "from-fuchsia-500/60 via-[#211436] to-[#09090d]"
                        },
                        {
                          id: "minimal",
                          title: "Minimal",
                          description: "Clean, quiet, and solid",
                          swatch: "from-stone-400/20 via-[#222] to-[#101010]"
                        }
                      ] as const).map((preset) => {
                        const selected =
                          preset.id === "glass"
                            ? profile.appearance.surfaceStyle === "glass" &&
                              profile.appearance.cardEffect === "none"
                            : preset.id === "neon"
                              ? profile.appearance.surfaceStyle === "glass" &&
                                profile.appearance.cardEffect === "glow"
                              : profile.appearance.surfaceStyle === "solid";

                        return (
                          <button
                            key={preset.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => applyAppearancePreset(preset.id)}
                            className={`overflow-hidden rounded-2xl border text-left transition ${
                              selected
                                ? "border-violet-500 ring-2 ring-violet-500/20"
                                : "border-black/10 hover:border-black/25"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`block h-16 bg-gradient-to-br ${preset.swatch}`}
                            />
                            <span className="block p-3">
                              <span className="block text-sm font-semibold">
                                {preset.title}
                              </span>
                              <span className="mt-1 block text-xs font-normal text-black/50">
                                {preset.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold">Page layout</h3>
                    <p className="mt-1 text-xs text-black/50">
                      Pick what visitors should notice first.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {([
                        ["minimal", "Minimal", "A tighter, focused page"],
                        ["personal", "Personal", "A balanced profile"],
                        ["social", "Social", "A centered social profile"],
                        ["portfolio", "Portfolio", "Projects before links"]
                      ] as const).map(([mode, title, description]) => (
                        <button
                          key={mode}
                          type="button"
                          aria-pressed={profile.mode === mode}
                          onClick={() => updateProfile("mode", mode)}
                          className={`rounded-xl border p-3 text-left transition ${
                            profile.mode === mode
                              ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/20"
                              : "border-black/10 bg-white hover:border-black/25"
                          }`}
                        >
                          <span className="block text-sm font-semibold">{title}</span>
                          <span className="mt-1 block text-xs font-normal text-black/50">
                            {description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <details className="rounded-2xl border border-black/10 bg-white/60 p-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
                      Customize appearance
                      <span className="ml-2 text-xs font-normal text-black/45">
                        Colors, glass, effects, and more
                      </span>
                    </summary>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <details className="sm:col-span-2 rounded-2xl border border-black/10 bg-white/70 p-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold">
                      Glass surface controls
                      <span className="ml-2 text-xs font-normal text-black/45">
                        Optional tint, blur, and border tuning
                      </span>
                    </summary>
                    <fieldset className="mt-4 space-y-4">
                    <legend className="px-1 text-sm font-semibold">
                      Profile surfaces
                    </legend>
                    <p className="text-xs font-normal leading-5 text-black/50">
                      Tune the profile box and its links, music player, socials, and projects together.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-semibold">
                        Surface style
                        <select
                          value={profile.appearance.surfaceStyle}
                          onChange={(event) =>
                            updateAppearance(
                              "surfaceStyle",
                              event.target.value as Appearance["surfaceStyle"]
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3"
                        >
                          <option value="glass">Glass</option>
                          <option value="solid">Solid (no blur)</option>
                          <option value="gradient">Gradient</option>
                        </select>
                      </label>
                      <ColorField
                        label="Surface tint"
                        value={profile.appearance.surfaceColor}
                        onChange={(value) => updateAppearance("surfaceColor", value)}
                      />
                      <ColorField
                        label="Border color"
                        value={profile.appearance.surfaceBorderColor}
                        onChange={(value) =>
                          updateAppearance("surfaceBorderColor", value)
                        }
                      />
                      <label className="text-sm font-semibold">
                        Surface opacity: {Math.round(profile.appearance.cardOpacity * 100)}%
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.02"
                          value={profile.appearance.cardOpacity}
                          onChange={(event) =>
                            updateAppearance("cardOpacity", Number(event.target.value))
                          }
                          className="mt-4 block w-full accent-violet"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Glass blur: {profile.appearance.surfaceBlur}px
                        <input
                          type="range"
                          min="0"
                          max="40"
                          step="1"
                          value={profile.appearance.surfaceBlur}
                          disabled={profile.appearance.surfaceStyle !== "glass"}
                          onChange={(event) =>
                            updateAppearance("surfaceBlur", Number(event.target.value))
                          }
                          className="mt-4 block w-full accent-violet disabled:opacity-40"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Border opacity: {Math.round(profile.appearance.surfaceBorderOpacity * 100)}%
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.02"
                          value={profile.appearance.surfaceBorderOpacity}
                          onChange={(event) =>
                            updateAppearance(
                              "surfaceBorderOpacity",
                              Number(event.target.value)
                            )
                          }
                          className="mt-4 block w-full accent-violet"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Border thickness: {profile.appearance.surfaceBorderWidth}px
                        <input
                          type="range"
                          min="0"
                          max="4"
                          step="0.5"
                          value={profile.appearance.surfaceBorderWidth}
                          onChange={(event) =>
                            updateAppearance(
                              "surfaceBorderWidth",
                              Number(event.target.value)
                            )
                          }
                          className="mt-4 block w-full accent-violet"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Corner radius: {profile.appearance.surfaceRadius}px
                        <input
                          type="range"
                          min="0"
                          max="48"
                          step="1"
                          value={profile.appearance.surfaceRadius}
                          onChange={(event) =>
                            updateAppearance(
                              "surfaceRadius",
                              Number(event.target.value)
                            )
                          }
                          className="mt-4 block w-full accent-violet"
                        />
                      </label>
                      <label className="flex items-center gap-3 rounded-xl bg-black/[0.03] p-4 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={profile.appearance.surfaceHighlight}
                          onChange={(event) =>
                            updateAppearance("surfaceHighlight", event.target.checked)
                          }
                          className="h-4 w-4 accent-violet"
                        />
                        Top-edge glass highlight
                      </label>
                    </div>
                    </fieldset>
                  </details>

                  <ColorField
                    label="Accent"
                    value={profile.appearance.accentColor}
                    onChange={(value) => updateAppearance("accentColor", value)}
                  />

                  <ColorField
                    label="Page background"
                    value={profile.appearance.backgroundColor}
                    onChange={(value) => updateAppearance("backgroundColor", value)}
                  />

                  <ColorField
                    label="Text"
                    value={profile.appearance.textColor}
                    onChange={(value) => updateAppearance("textColor", value)}
                  />

                  <div className="text-sm font-semibold">
                    Background image
                    <span className="mt-2 flex items-center gap-3">
                      <label className="cursor-pointer rounded-lg border border-black/10 px-3 py-2 text-xs font-medium hover:border-violet">
                        Upload background
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) =>
                            uploadProfileImage(event, "backgroundImageUpload")
                          }
                          className="sr-only"
                        />
                      </label>
                      {profile.appearance.backgroundImageUpload && (
                        <button
                          type="button"
                          onClick={() => updateAppearance("backgroundImageUpload", "")}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Remove upload
                        </button>
                      )}
                    </span>
                  </div>

                  <label className="text-sm font-semibold">
                    Avatar and status shape
                    <select
                      value={profile.appearance.radius}
                      onChange={(event) =>
                        updateAppearance(
                          "radius",
                          event.target.value as Appearance["radius"]
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3"
                    >
                      <option value="small">Soft corners</option>
                      <option value="medium">Rounded</option>
                      <option value="large">Extra rounded</option>
                    </select>
                  </label>

                  <label className="text-sm font-semibold">
                    Typography
                    <select
                      value={profile.appearance.font}
                      onChange={(event) =>
                        updateAppearance(
                          "font",
                          event.target.value as Appearance["font"]
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3"
                    >
                      <option value="inter">Inter</option>
                      <option value="system">System</option>
                      <option value="serif">Serif</option>
                    </select>
                  </label>

                  <label className="text-sm font-semibold">
                    Spacing
                    <select
                      value={profile.appearance.spacing}
                      onChange={(event) =>
                        updateAppearance(
                          "spacing",
                          event.target.value as Appearance["spacing"]
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3"
                    >
                      <option value="compact">Compact</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="airy">Airy</option>
                    </select>
                  </label>

                  <label className="text-sm font-semibold">
                    Animation
                    <select
                      value={profile.appearance.animation}
                      onChange={(event) =>
                        updateAppearance(
                          "animation",
                          event.target.value as Appearance["animation"]
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3"
                    >
                      <option value="none">None</option>
                      <option value="subtle">Subtle</option>
                      <option value="playful">Playful</option>
                      <option value="float">Floating</option>
                      <option value="pulse">Soft pulse</option>
                    </select>
                  </label>

                  <label className="text-sm font-semibold">
                    Background effect
                    <select
                      value={profile.appearance.backgroundEffect}
                      onChange={(event) =>
                        updateAppearance(
                          "backgroundEffect",
                          event.target.value as Appearance["backgroundEffect"]
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3"
                    >
                      <option value="none">None</option>
                      <option value="aurora">Aurora glow</option>
                      <option value="grid">Soft grid</option>
                    </select>
                  </label>

                  <label className="text-sm font-semibold">
                    Profile card effect
                    <select
                      value={profile.appearance.cardEffect}
                      onChange={(event) =>
                        updateAppearance(
                          "cardEffect",
                          event.target.value as Appearance["cardEffect"]
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3"
                    >
                      <option value="none">None</option>
                      <option value="glow">Accent glow</option>
                      <option value="gradient">Color wash</option>
                    </select>
                  </label>

                  <details className="sm:col-span-2 rounded-2xl border border-black/[0.08] bg-black/[0.025] p-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold">
                      Click-to-enter screen
                      <span className="ml-2 text-xs font-normal text-black/45">
                        Text, blur, and entrance effect
                      </span>
                    </summary>
                    <fieldset className="mt-4">
                    <legend className="px-1 text-sm font-semibold">
                      Visitor entrance settings
                    </legend>
                    <p className="mt-1 text-xs font-normal leading-5 text-black/50">
                      Visitors click this screen to open your page. Their click can start your song too.
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-semibold">
                        Enter text
                        <input
                          value={profile.appearance.enterText ?? ""}
                          maxLength={60}
                          onChange={(event) =>
                            updateAppearance("enterText", event.target.value)
                          }
                          placeholder="click to enter"
                          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 outline-none focus:border-violet"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Background blur: {profile.appearance.enterBlur}px
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="0.5"
                          value={profile.appearance.enterBlur}
                          onChange={(event) =>
                            updateAppearance("enterBlur", Number(event.target.value))
                          }
                          className="mt-3 w-full accent-violet-600"
                        />
                        <span className="mt-1 flex justify-between text-xs font-normal text-black/45">
                          <span>Off</span>
                          <span>Strong</span>
                        </span>
                      </label>
                      <label className="text-sm font-semibold">
                        Entrance effect
                        <select
                          value={profile.appearance.enterEffect}
                          onChange={(event) =>
                            updateAppearance(
                              "enterEffect",
                              event.target.value as Appearance["enterEffect"]
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3"
                        >
                          <option value="none">Clean fade</option>
                          <option value="spotlight">Soft spotlight</option>
                          <option value="glitch">Glitch flash</option>
                          <option value="sparkles">Floating sparkles</option>
                          <option value="aurora">Drifting aurora</option>
                          <option value="snow">Slow snowfall</option>
                          <option value="rain">Night rain</option>
                        </select>
                      </label>
                    </div>
                    </fieldset>
                  </details>

                  <details className="sm:col-span-2 rounded-2xl border border-black/[0.08] bg-black/[0.025] p-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold">
                      Username effects
                      <span className="ml-2 text-xs font-normal text-black/45">
                        Animate or style your display name
                      </span>
                    </summary>
                    <fieldset className="mt-4">
                    <legend className="text-sm font-semibold">
                      Pick an effect
                    </legend>
                    <p className="mt-1 text-xs font-normal text-black/45">
                      Choose a free built-in style for your display name.
                    </p>
                    <div
                      role="group"
                      aria-label="Username effects"
                      className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-6"
                    >
                      {usernameEffectOptions.map((option) => {
                        const selected =
                          profile.appearance.usernameEffect === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                              updateAppearance("usernameEffect", option.value)
                            }
                            className={`username-effect-option flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3 text-center transition ${
                              selected
                                ? "border-[#7965db] bg-[#7965db]/10 ring-1 ring-[#7965db]/25"
                                : "border-black/10 bg-white hover:border-black/25"
                            }`}
                          >
                            <span aria-hidden="true">
                              <UsernameEffect
                                text={option.sample}
                                effect={option.value}
                                reducedMotion={
                                  profile.appearance.reducedMotion ||
                                  profile.appearance.animation === "none"
                                }
                                accentColor={profile.appearance.accentColor}
                                preview
                              />
                            </span>
                            <span className="text-xs font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    </fieldset>
                  </details>

                  <p className="text-xs font-normal leading-5 text-black/45 sm:col-span-2">
                    Effects are built in and free. Reduce motion disables
                    animation while leaving static styles available.
                  </p>

                  <label className="flex items-center gap-3 rounded-xl bg-black/[0.03] p-4 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={profile.appearance.shadow}
                      onChange={(event) =>
                        updateAppearance("shadow", event.target.checked)
                      }
                      className="h-4 w-4 accent-violet"
                    />
                    Soft card shadows
                  </label>

                  <label className="flex items-center gap-3 rounded-xl bg-black/[0.03] p-4 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={profile.appearance.reducedMotion}
                      onChange={(event) =>
                        updateAppearance("reducedMotion", event.target.checked)
                      }
                      className="h-4 w-4 accent-violet"
                    />
                    Reduce motion
                  </label>
                    </div>
                  </details>
                </div>
              </div>

            </div>
          )}

          {active === "music" && (
            <div className="space-y-6">
              <div className="rounded-[1.8rem] border border-white/80 bg-[#fffdf7]/90 p-5 shadow-[0_12px_40px_rgba(56,49,37,.06)] sm:p-7">
                <h2 className="font-serif text-2xl">Put something on</h2>
                <p className="mt-1 text-sm text-[#77776d]">
                  Add up to three songs, then put them in whatever order feels right.
                </p>

                <div className="mt-6">
                  <label className="flex max-w-xl cursor-pointer items-center gap-3 rounded-2xl border border-black/10 p-4 transition hover:border-violet">
                    <Music2 size={20} className="shrink-0 text-violet" />
                    <span>
                      <span className="block text-sm font-semibold">Add songs</span>
                      <span className="mt-1 block text-xs font-normal text-black/50">
                        {profile.appearance.musicTracks.length} of 3 songs · MP3, M4A, AAC, OGG, WAV, or WebM, up to 15 MB each
                      </span>
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,audio/webm,.mp3,.m4a,.aac,.ogg,.wav,.webm"
                      onChange={uploadMusicFile}
                      className="sr-only"
                    />
                  </label>
                </div>

                <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 p-4 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={profile.appearance.musicMode !== "off"}
                    disabled={profile.appearance.musicTracks.length === 0}
                    onChange={(event) =>
                      updateAppearance(
                        "musicMode",
                        event.target.checked ? "upload" : "off"
                      )
                    }
                    className="h-4 w-4 accent-violet"
                  />
                  Show music player on my profile
                </label>

                {profile.appearance.musicTracks.length > 0 && (
                  <ol className="mt-5 space-y-3 border-t border-black/10 pt-5">
                    {profile.appearance.musicTracks.map((track, index) => (
                      <li
                        key={track.id}
                        className="rounded-2xl border border-black/10 bg-black/[0.025] p-4"
                      >
                        <div className="flex items-center gap-3">
                          {track.coverUrl || track.coverImageUrl ? (
                            <Image
                              src={track.coverUrl || track.coverImageUrl || ""}
                              alt=""
                              width={52}
                              height={52}
                              unoptimized
                              className="h-13 w-13 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-violet/10 text-violet">
                              <Music2 size={20} />
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {track.title || "Untitled song"}
                            </p>
                            <p className="mt-1 truncate text-xs text-black/45">
                              {track.artist || "Unknown artist"}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              aria-label={`Move song ${index + 1} up`}
                              disabled={index === 0}
                              onClick={() => {
                                const tracks = [...profile.appearance.musicTracks];
                                [tracks[index - 1], tracks[index]] = [
                                  tracks[index],
                                  tracks[index - 1]
                                ];
                                setMusicTracks(tracks);
                              }}
                              className="rounded-lg p-2 text-black/50 hover:bg-black/5 disabled:opacity-25"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Move song ${index + 1} down`}
                              disabled={index === profile.appearance.musicTracks.length - 1}
                              onClick={() => {
                                const tracks = [...profile.appearance.musicTracks];
                                [tracks[index], tracks[index + 1]] = [
                                  tracks[index + 1],
                                  tracks[index]
                                ];
                                setMusicTracks(tracks);
                              }}
                              className="rounded-lg p-2 text-black/50 hover:bg-black/5 disabled:opacity-25"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove ${track.title || "song"}`}
                              onClick={() =>
                                setMusicTracks(
                                  profile.appearance.musicTracks.filter(
                                    (item) => item.id !== track.id
                                  )
                                )
                              }
                              className="rounded-lg p-2 text-black/45 hover:bg-red-500/10 hover:text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <label className="text-xs font-semibold">
                            Song title
                            <input
                              value={track.title}
                              maxLength={120}
                              onChange={(event) => {
                                const tracks = profile.appearance.musicTracks.map(
                                  (item) =>
                                    item.id === track.id
                                      ? { ...item, title: event.target.value }
                                      : item
                                );
                                setMusicTracks(tracks);
                              }}
                              className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet"
                            />
                          </label>
                          <label className="text-xs font-semibold">
                            Artist / extra info
                            <input
                              value={track.artist}
                              maxLength={120}
                              onChange={(event) => {
                                const tracks = profile.appearance.musicTracks.map(
                                  (item) =>
                                    item.id === track.id
                                      ? { ...item, artist: event.target.value }
                                      : item
                                );
                                setMusicTracks(tracks);
                              }}
                              className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet"
                            />
                          </label>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <label className="cursor-pointer rounded-lg border border-black/10 px-3 py-2 text-xs font-medium hover:border-violet">
                            Change cover
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(event) => selectMusicCover(event, track.id)}
                              className="sr-only"
                            />
                          </label>
                          <span className="text-[11px] text-black/45">
                            JPG, PNG, or WebP up to 5 MB
                          </span>
                          {track.coverUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setMusicTracks(
                                  profile.appearance.musicTracks.map((item) =>
                                    item.id === track.id
                                      ? { ...item, coverUrl: "" }
                                      : item
                                  )
                                )
                              }
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              Remove upload
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <p className="px-2 text-xs leading-5 text-white/45">
                Uploaded tracks are publicly playable when your profile is public. Only upload music you have permission to share.
              </p>
            </div>
          )}

          {active === "links" && (
            <div className="space-y-6">
              <div className="rounded-[1.8rem] border border-white/80 bg-[#fffdf7]/90 p-5 shadow-[0_12px_40px_rgba(56,49,37,.06)] sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Your links</h2>
                  <p className="mt-1 text-sm text-black/50">
                    Add useful destinations and keep them in your own order.
                  </p>
                </div>
                <button
                  type="submit"
                  form="quick-add-link"
                  disabled={addingLink}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-3 text-sm font-semibold text-white hover:bg-[#6948ef] disabled:cursor-wait disabled:opacity-60"
                >
                  <Plus size={16} />
                  {addingLink ? "Adding…" : "Add link"}
                </button>
              </div>

              <form
                id="quick-add-link"
                onSubmit={addLink}
                className="mt-5 grid gap-3 rounded-xl border border-dashed border-black/15 bg-black/[0.02] p-4 sm:grid-cols-2"
              >
                <label className="text-xs font-semibold text-black/55 sm:col-span-2">
                  PASTE A LINK
                  <input
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    value={linkUrlInput}
                    onChange={(event) => {
                      const value = event.target.value;
                      const suggestion = suggestLink(value);
                      setLinkUrlInput(value);
                      if (suggestion) {
                        setLinkTitleInput(suggestion.title);
                        setLinkIconInput(suggestion.icon);
                      }
                    }}
                    placeholder="example.com or https://example.com"
                    aria-describedby="quick-add-link-help"
                    className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-3 text-sm text-black"
                  />
                  <span
                    id="quick-add-link-help"
                    className="mt-1 block font-normal text-black/45"
                  >
                    Suggestions are generated locally; no external lookup is used.
                  </span>
                </label>

                {linkSuggestion && (
                  <>
                    <label className="text-xs font-semibold text-black/55">
                      DISPLAY TITLE
                      <input
                        value={linkTitleInput}
                        maxLength={80}
                        onChange={(event) => setLinkTitleInput(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black"
                      />
                    </label>
                    <label className="text-xs font-semibold text-black/55">
                      ICON
                      <select
                        value={linkIconInput}
                        onChange={(event) => setLinkIconInput(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black"
                      >
                        {linkIconOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="text-xs text-black/45 sm:col-span-2">
                      Suggested for {linkSuggestion.url}
                    </p>
                  </>
                )}
              </form>

              <div className="mt-6 space-y-3">
              {links.map((link, index) => (
                <div
                  key={link.id}
                  className="grid gap-3 rounded-xl border border-black/10 p-4 md:grid-cols-[1fr_1.4fr_130px_auto_auto_auto]"
                >
                    <label className="text-xs font-semibold text-black/45">
                      TITLE
                      <input
                        value={link.title}
                        maxLength={80}
                        onChange={(event) =>
                          setLinks((current) =>
                            current.map((item) =>
                              item.id === link.id
                                ? { ...item, title: event.target.value }
                                : item
                            )
                          )
                        }
                        onBlur={() => updateLink(link.id, { title: link.title })}
                        className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black"
                      />
                    </label>

                    <label className="text-xs font-semibold text-black/45">
                      URL
                      <input
                        value={link.url}
                        type="url"
                        onChange={(event) =>
                          setLinks((current) =>
                            current.map((item) =>
                              item.id === link.id
                                ? { ...item, url: event.target.value }
                                : item
                            )
                          )
                        }
                        onBlur={() => updateLink(link.id, { url: link.url })}
                        className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black"
                      />
                    </label>

                    <label className="text-xs font-semibold text-black/45">
                      ICON
                      <select
                        value={
                          linkIconOptions.some((option) => option.value === link.icon)
                            ? link.icon
                            : "link"
                        }
                        onChange={(event) =>
                          setLinks((current) =>
                            current.map((item) =>
                              item.id === link.id
                                ? { ...item, icon: event.target.value }
                                : item
                            )
                          )
                        }
                        onBlur={() => updateLink(link.id, { icon: link.icon })}
                        className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2 py-2 text-sm text-black"
                      >
                        {linkIconOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-black/65">
                      <input
                        type="checkbox"
                        checked={link.enabled}
                        onChange={(event) =>
                          updateLink(link.id, { enabled: event.target.checked })
                        }
                        className="accent-violet"
                      />
                      Visible
                    </label>

                    <div className="flex items-center gap-1 self-end">
                      <button
                        type="button"
                        onClick={() => void moveLink(link.id, -1)}
                        disabled={index === 0 || reorderingLinks}
                        aria-label={`Move ${link.title} up`}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-black/55 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ArrowUp size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void moveLink(link.id, 1)}
                        disabled={index === links.length - 1 || reorderingLinks}
                        aria-label={`Move ${link.title} down`}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-black/55 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ArrowDown size={17} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeLink(link.id)}
                      aria-label={`Remove ${link.title}`}
                      className="flex h-10 w-10 items-center justify-center self-end rounded-lg text-black/40 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>

                    <label className="text-xs font-semibold text-black/45 md:col-span-5">
                      DESCRIPTION
                      <input
                        value={link.description}
                        onChange={(event) =>
                          setLinks((current) =>
                            current.map((item) =>
                              item.id === link.id
                                ? { ...item, description: event.target.value }
                                : item
                            )
                          )
                        }
                        onBlur={() =>
                          updateLink(link.id, { description: link.description })
                        }
                        className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black"
                      />
                    </label>
                  </div>
                ))}

                {links.length === 0 && (
                  <p className="rounded-xl bg-black/[0.03] p-6 text-center text-sm text-black/50">
                    No links yet. Add one to give visitors somewhere to go.
                  </p>
                )}
              </div>

              <div className="mt-10 border-t border-black/10 pt-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">Social profiles</h2>
                    <p className="mt-1 text-sm text-black/50">
                      Add social accounts to the icons on your public page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addSocial}
                    className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-black/5"
                  >
                    <Plus size={16} />
                    Add social
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {socials.map((social, index) => (
                    <div
                      key={social.id}
                      className="grid gap-3 rounded-xl border border-black/10 p-4 sm:grid-cols-[1fr_2fr_auto_auto_auto]"
                    >
                      <label className="text-xs font-semibold text-black/45">
                        PLATFORM
                        <input
                          value={social.platform}
                          maxLength={40}
                          list={`social-platforms-${social.id}`}
                          onChange={(event) =>
                            setSocials((current) =>
                              current.map((item) =>
                                item.id === social.id
                                  ? { ...item, platform: event.target.value }
                                  : item
                              )
                            )
                          }
                          onBlur={() =>
                            updateSocial(social.id, { platform: social.platform })
                          }
                          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black"
                        />
                        <datalist id={`social-platforms-${social.id}`}>
                          <option value="github" />
                          <option value="instagram" />
                          <option value="youtube" />
                          <option value="twitch" />
                          <option value="spotify" />
                          <option value="linkedin" />
                          <option value="x" />
                          <option value="twitter" />
                        </datalist>
                      </label>

                      <label className="text-xs font-semibold text-black/45">
                        URL
                        <input
                          value={social.url}
                          onChange={(event) =>
                            setSocials((current) =>
                              current.map((item) =>
                                item.id === social.id
                                  ? { ...item, url: event.target.value }
                                  : item
                              )
                            )
                          }
                          onBlur={() => updateSocial(social.id, { url: social.url })}
                          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black"
                        />
                      </label>

                      <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-black/65">
                        <input
                          type="checkbox"
                          checked={social.enabled}
                          onChange={(event) =>
                            updateSocial(social.id, { enabled: event.target.checked })
                          }
                          className="accent-violet"
                        />
                        Visible
                      </label>

                      <div className="flex items-center gap-1 self-end">
                        <button
                          type="button"
                          onClick={() => void moveSocial(social.id, -1)}
                          disabled={index === 0 || reorderingSocials}
                          aria-label={`Move ${social.platform} social link up`}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-black/55 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ArrowUp size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void moveSocial(social.id, 1)}
                          disabled={index === socials.length - 1 || reorderingSocials}
                          aria-label={`Move ${social.platform} social link down`}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-black/55 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ArrowDown size={17} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSocial(social.id)}
                        aria-label={`Remove ${social.platform} social link`}
                        className="flex h-10 w-10 items-center justify-center self-end rounded-lg text-black/40 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                  {socials.length === 0 && (
                    <p className="rounded-xl bg-black/[0.03] p-5 text-center text-sm text-black/50">
                      No social profiles yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-10 border-t border-black/10 pt-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">Projects</h2>
                    <p className="mt-1 text-sm text-black/50">
                      Highlight selected work on your public page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addProject}
                    className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-black/5"
                  >
                    <Plus size={16} />
                    Add project
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="grid gap-3 rounded-xl border border-black/10 p-4 md:grid-cols-2"
                    >
                      <label className="text-xs font-semibold text-black/45">
                        TITLE
                        <input
                          value={project.title}
                          maxLength={100}
                          onChange={(event) =>
                            setProjects((current) =>
                              current.map((item) =>
                                item.id === project.id
                                  ? { ...item, title: event.target.value }
                                  : item
                              )
                            )
                          }
                          onBlur={() =>
                            updateProject(project.id, { title: project.title })
                          }
                          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black"
                        />
                      </label>

                      <label className="text-xs font-semibold text-black/45">
                        PROJECT URL
                        <input
                          value={project.url}
                          onChange={(event) =>
                            setProjects((current) =>
                              current.map((item) =>
                                item.id === project.id
                                  ? { ...item, url: event.target.value }
                                  : item
                              )
                            )
                          }
                          onBlur={() => updateProject(project.id, { url: project.url })}
                          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black"
                        />
                      </label>

                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-black hover:border-violet">
                          Upload project image
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) =>
                              uploadProfileImage(event, "projectImageUpload", project.id)
                            }
                            className="sr-only"
                          />
                        </label>
                        <span className="text-[11px] text-black/45">
                          JPG, PNG, or WebP up to 5 MB
                        </span>
                        {project.image_upload_url && (
                          <button
                            type="button"
                            onClick={() =>
                              void updateProject(project.id, { image_upload_url: "" })
                            }
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Remove upload
                          </button>
                        )}
                      </div>

                      <label className="text-xs font-semibold text-black/45">
                        TAGS (COMMA-SEPARATED)
                        <input
                          value={project.tags.join(", ")}
                          onChange={(event) => {
                            const tags = event.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter(Boolean);
                            setProjects((current) =>
                              current.map((item) =>
                                item.id === project.id ? { ...item, tags } : item
                              )
                            );
                          }}
                          onBlur={() => updateProject(project.id, { tags: project.tags })}
                          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black"
                        />
                      </label>

                      <label className="text-xs font-semibold text-black/45 md:col-span-2">
                        DESCRIPTION
                        <textarea
                          value={project.description}
                          maxLength={500}
                          rows={2}
                          onChange={(event) =>
                            setProjects((current) =>
                              current.map((item) =>
                                item.id === project.id
                                  ? { ...item, description: event.target.value }
                                  : item
                              )
                            )
                          }
                          onBlur={() =>
                            updateProject(project.id, {
                              description: project.description
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black"
                        />
                      </label>

                      <label className="flex items-center gap-2 text-sm font-medium text-black/65">
                        <input
                          type="checkbox"
                          checked={project.enabled}
                          onChange={(event) =>
                            updateProject(project.id, {
                              enabled: event.target.checked
                            })
                          }
                          className="accent-violet"
                        />
                        Visible
                      </label>

                      <button
                        type="button"
                        onClick={() => removeProject(project.id)}
                        aria-label={`Remove ${project.title}`}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-black/40 hover:bg-red-50 hover:text-red-600 md:justify-self-end"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <p className="rounded-xl bg-black/[0.03] p-5 text-center text-sm text-black/50">
                      No projects yet.
                    </p>
                  )}
                </div>
              </div>
              </div>
            </div>
          )}

          {active === "settings" && (
            <div className="space-y-5">
              <div className="rounded-[1.8rem] border border-white/80 bg-[#fffdf7]/90 p-5 shadow-[0_12px_40px_rgba(56,49,37,.06)] sm:p-7">
                <h2 className="text-lg font-bold">Account</h2>
                <p className="mt-2 text-sm text-black/55">
                  Signed in as <span className="font-semibold">{userEmail}</span>
                </p>
                <p className="mt-2 text-sm text-black/45">
                  Sign-in providers are managed by Supabase Auth. Configure Google
                  and Discord OAuth in Supabase before enabling them for users.
                </p>
              </div>

              <div className="rounded-[1.8rem] border border-white/80 bg-[#fffdf7]/90 p-5 shadow-[0_12px_40px_rgba(56,49,37,.06)] sm:p-7">
                <h2 className="text-lg font-bold">Your data</h2>
                <p className="mt-1 text-sm text-black/50">
                  Download a JSON snapshot of your profile and content.
                </p>
                <button
                  onClick={exportProfile}
                  className="mt-5 rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-black/5"
                >
                  Export profile JSON
                </button>
              </div>

              <div className="rounded-[1.8rem] border border-white/80 bg-[#fffdf7]/90 p-5 shadow-[0_12px_40px_rgba(56,49,37,.06)] sm:p-7">
                <h2 className="text-lg font-bold">Profile visibility</h2>
                <label className="mt-4 flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={profile.is_public}
                    onChange={(event) =>
                      updateProfile("is_public", event.target.checked)
                    }
                    className="h-4 w-4 accent-violet"
                  />
                  Public profile is enabled
                </label>
              </div>
            </div>
          )}

          <div className="mt-8">
            <PreviewCard data={createPreviewData(profile, links, socials, projects)} />
          </div>
        </section>
      </div>
    </main>
  );
}

function ColorField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <span className="mt-2 flex items-center gap-3 rounded-xl border border-black/10 px-3 py-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent"
        />
        <span className="font-mono text-xs text-black/50">{value}</span>
      </span>
    </label>
  );
}

function createPreviewData(
  profile: Profile,
  links: ProfileLink[],
  socials: SocialLink[],
  projects: Project[]
): PublicProfileData {
  const {
    id,
    username,
    display_name,
    bio,
    avatar_url,
    banner_url,
    location,
    pronouns,
    status,
    mode,
    is_public,
    appearance,
    created_at,
    updated_at
  } = profile;

  return {
    profile: {
      id,
      username,
      display_name,
      bio,
      avatar_url,
      banner_url,
      location,
      pronouns,
      status,
      mode,
      is_public,
      appearance,
      created_at,
      updated_at
    },
    links: links.filter(
      (link) => link.enabled && urlSchema.safeParse(link.url).success
    ),
    socials: socials.filter(
      (social) => social.enabled && urlSchema.safeParse(social.url).success
    ),
    projects: projects.filter(
      (project) => project.enabled && urlSchema.safeParse(project.url).success
    )
  };
}

function PreviewCard({ data }: { data: PublicProfileData }) {
  return (
    <aside className="rounded-[1.8rem] border border-white/[0.08] bg-[#111017] p-4 text-[#f4f1fa] shadow-[0_18px_50px_rgba(0,0,0,.3)]">
      <div className="mb-3 flex items-center justify-between text-xs text-white/55">
        <span>LIVE PREVIEW</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Local changes
        </span>
      </div>
      <div className="mx-auto aspect-[16/9] min-h-[200px] max-h-[520px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#09090d]">
        <div className="h-full overflow-y-auto">
          <ProfileRenderer data={data} preview />
        </div>
      </div>
    </aside>
  );
}
