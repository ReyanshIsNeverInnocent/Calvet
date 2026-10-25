"use client";

import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Music2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
  UserRound,
  Volume2,
  VolumeX
} from "lucide-react";
import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type WheelEvent
} from "react";
import { createClient } from "@/lib/supabase/browser";
import ProfileBadges from "@/components/ProfileBadges";
import SocialPlatformIcon from "@/components/SocialPlatformIcon";
import UsernameEffect from "@/components/UsernameEffect";
import { isHttpUrl } from "@/lib/music";
import { getSocialPlatform } from "@/lib/socials";
import type { ProfileMedia, PublicProfileData } from "@/types/profile";

const MAX_AUDIO_VOLUME = 0.5;

export default function ProfileRenderer({
  data,
  preview = false
}: {
  data: PublicProfileData;
  preview?: boolean;
}) {
  const { profile, socials, projects } = data;
  const supabase = useMemo(() => createClient(), []);
  const appearance = profile.appearance;
  const avatarImage = appearance.avatarImageUpload || profile.avatar_url;
  const bannerImage = appearance.bannerImageUpload || profile.banner_url;
  const backgroundImage =
    appearance.backgroundImageUpload || appearance.backgroundImage;
  const radius =
    appearance.radius === "small"
      ? "rounded-xl"
      : appearance.radius === "large"
        ? "rounded-[1.6rem]"
        : "rounded-2xl";
  const spacing =
    profile.mode === "minimal" || appearance.spacing === "compact"
      ? { page: "py-6 sm:py-10", section: "mt-7", projects: "mt-8" }
      : appearance.spacing === "comfortable"
        ? { page: "py-8 sm:py-12", section: "mt-8", projects: "mt-10" }
      : appearance.spacing === "airy"
        ? { page: "py-16 sm:py-24", section: "mt-16", projects: "mt-20" }
        : { page: "py-8 sm:py-12", section: "mt-8", projects: "mt-10" };
  const layoutWidth =
    profile.mode === "portfolio"
      ? "max-w-4xl"
      : profile.mode === "minimal" || profile.mode === "social"
        ? "max-w-xl"
        : "max-w-2xl";
  const motionDisabled =
    appearance.reducedMotion ||
    appearance.animation === "none";
  const motion = motionDisabled
    ? ""
    : appearance.animation === "playful"
      ? "profile-card-playful"
      : appearance.animation === "float"
        ? "profile-card-float"
        : appearance.animation === "pulse"
          ? "profile-card-pulse"
          : "profile-card-motion";
  const cardEffect =
    appearance.cardEffect === "glow"
      ? "profile-panel-glow"
      : "";
  const fontFamily =
    appearance.font === "serif"
      ? '"DM Serif Display", Georgia, serif'
      : appearance.font === "system"
        ? "system-ui, sans-serif"
        : "Inter, Arial, sans-serif";
  const surfaceColor = appearance.surfaceColor;
  const surfaceBackground =
    appearance.surfaceStyle === "solid"
      ? `color-mix(in srgb, ${surfaceColor} ${appearance.cardOpacity * 100}%, transparent)`
      : appearance.surfaceStyle === "gradient"
        ? `linear-gradient(135deg, color-mix(in srgb, color-mix(in srgb, ${appearance.accentColor} 24%, ${surfaceColor}) ${appearance.cardOpacity * 100}%, transparent), color-mix(in srgb, ${surfaceColor} ${appearance.cardOpacity * 100}%, transparent) 70%)`
        : `color-mix(in srgb, ${surfaceColor} ${appearance.cardOpacity * 100}%, transparent)`;
  const cardStyle: CSSProperties = {
    background: surfaceBackground,
    "--surface-fallback": `color-mix(in srgb, ${surfaceColor} ${Math.max(appearance.cardOpacity * 100, 28)}%, #111017)`,
    backdropFilter:
      appearance.surfaceStyle === "glass"
        ? `blur(${appearance.surfaceBlur}px)`
        : undefined,
    WebkitBackdropFilter:
      appearance.surfaceStyle === "glass"
        ? `blur(${appearance.surfaceBlur}px)`
        : undefined,
    borderColor: `color-mix(in srgb, ${appearance.surfaceBorderColor} ${appearance.surfaceBorderOpacity * 100}%, transparent)`,
    borderWidth: `${appearance.surfaceBorderWidth}px`,
    borderStyle: "solid",
    borderRadius: `${appearance.surfaceRadius}px`,
    boxShadow: appearance.shadow
      ? "0 18px 48px rgba(0,0,0,.24)"
      : undefined
  } as CSSProperties & { "--surface-fallback": string };
  const musicTracks =
    appearance.musicMode === "upload"
      ? appearance.musicTracks.filter((track) => isHttpUrl(track.url))
      : [];
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaViewerStageRef = useRef<HTMLDivElement>(null);
  const mediaGesture = useRef({
    pointers: new Map<number, { x: number; y: number }>(),
    startDistance: 0,
    startZoom: 1,
    startScrollLeft: 0,
    startScrollTop: 0,
    anchorX: 0,
    anchorY: 0
  });
  const resumeAfterTrackChange = useRef(false);
  const [entered, setEntered] = useState(preview);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const volumeBeforeMute = useRef(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackError, setPlaybackError] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const [mediaZoom, setMediaZoom] = useState(1);
  const [mediaNaturalSize, setMediaNaturalSize] = useState({ width: 0, height: 0 });
  const [mediaStageSize, setMediaStageSize] = useState({ width: 0, height: 0 });
  const activeTrack = musicTracks[activeTrackIndex] ?? musicTracks[0];
  const musicUrl = activeTrack?.url ?? null;
  const activeMedia: ProfileMedia | null =
    activeMediaIndex === null ? null : data.media[activeMediaIndex] ?? null;
  const mediaFitScale =
    mediaNaturalSize.width > 0 &&
    mediaNaturalSize.height > 0 &&
    mediaStageSize.width > 0 &&
    mediaStageSize.height > 0
      ? Math.min(
          1,
          mediaStageSize.width / mediaNaturalSize.width,
          mediaStageSize.height / mediaNaturalSize.height
        )
      : 0;
  const mediaViewerWidth = mediaNaturalSize.width * mediaFitScale * mediaZoom;
  const mediaViewerHeight = mediaNaturalSize.height * mediaFitScale * mediaZoom;

  function clampMediaZoom(value: number) {
    return Math.max(1, Math.min(4, value));
  }

  function zoomMediaAt(nextZoom: number, anchorX: number, anchorY: number) {
    const stage = mediaViewerStageRef.current;
    if (!stage) return;

    const previousZoom = mediaZoom;
    const clampedZoom = clampMediaZoom(nextZoom);
    if (clampedZoom === previousZoom) return;

    const contentX = stage.scrollLeft + anchorX;
    const contentY = stage.scrollTop + anchorY;
    setMediaZoom(clampedZoom);
    requestAnimationFrame(() => {
      stage.scrollLeft = Math.max(
        0,
        contentX * (clampedZoom / previousZoom) - anchorX
      );
      stage.scrollTop = Math.max(
        0,
        contentY * (clampedZoom / previousZoom) - anchorY
      );
    });
  }

  function handleMediaWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const nextZoom = mediaZoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12);
    zoomMediaAt(
      nextZoom,
      event.clientX - bounds.left,
      event.clientY - bounds.top
    );
  }

  function handleMediaPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;

    const stage = event.currentTarget;
    stage.setPointerCapture(event.pointerId);
    const points = mediaGesture.current.pointers;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (points.size === 2) {
      const [first, second] = Array.from(points.values());
      const bounds = stage.getBoundingClientRect();
      mediaGesture.current = {
        ...mediaGesture.current,
        startDistance: Math.hypot(second.x - first.x, second.y - first.y),
        startZoom: mediaZoom,
        startScrollLeft: stage.scrollLeft,
        startScrollTop: stage.scrollTop,
        anchorX: (first.x + second.x) / 2 - bounds.left,
        anchorY: (first.y + second.y) / 2 - bounds.top
      };
    }
  }

  function handleMediaPointerMove(event: PointerEvent<HTMLDivElement>) {
    const gesture = mediaGesture.current;
    const previousPoint = gesture.pointers.get(event.pointerId);
    if (!previousPoint) return;

    gesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (gesture.pointers.size >= 2 && gesture.startDistance > 0) {
      event.preventDefault();
      const [first, second] = Array.from(gesture.pointers.values());
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      const nextZoom = clampMediaZoom(
        gesture.startZoom * (distance / gesture.startDistance)
      );
      const stage = event.currentTarget;
      const ratio = nextZoom / gesture.startZoom;
      setMediaZoom(nextZoom);
      requestAnimationFrame(() => {
        stage.scrollLeft = Math.max(
          0,
          (gesture.startScrollLeft + gesture.anchorX) * ratio - gesture.anchorX
        );
        stage.scrollTop = Math.max(
          0,
          (gesture.startScrollTop + gesture.anchorY) * ratio - gesture.anchorY
        );
      });
    } else if (gesture.pointers.size === 1 && mediaZoom > 1) {
      event.preventDefault();
      event.currentTarget.scrollLeft -= event.clientX - previousPoint.x;
      event.currentTarget.scrollTop -= event.clientY - previousPoint.y;
    }
  }

  function handleMediaPointerUp(event: PointerEvent<HTMLDivElement>) {
    mediaGesture.current.pointers.delete(event.pointerId);
    if (mediaGesture.current.pointers.size < 2) {
      mediaGesture.current.startDistance = 0;
    }
  }

  useEffect(() => {
    if (!activeMedia) return;
    const stage = mediaViewerStageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(([entry]) => {
      setMediaStageSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [activeMedia]);

  useEffect(() => {
    if (!activeMedia) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveMediaIndex(null);
      } else if (event.key === "ArrowLeft" && data.media.length > 1) {
        setActiveMediaIndex((current) =>
          current === null
            ? null
            : (current - 1 + data.media.length) % data.media.length
        );
      } else if (event.key === "ArrowRight" && data.media.length > 1) {
        setActiveMediaIndex((current) =>
          current === null ? null : (current + 1) % data.media.length
        );
      } else if (event.key === "+" || event.key === "=") {
        setMediaZoom((current) => Math.min(4, Number((current + 0.25).toFixed(2))));
      } else if (event.key === "-") {
        setMediaZoom((current) => Math.max(1, Number((current - 0.25).toFixed(2))));
      } else if (event.key === "0") {
        setMediaZoom(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMedia, data.media.length]);

  useEffect(() => {
    if (!mediaViewerStageRef.current || !activeMedia || activeMedia.media_type !== "image") {
      return;
    }
    const stage = mediaViewerStageRef.current;
    const frame = window.requestAnimationFrame(() => {
      stage.scrollTo({
        left: Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2),
        top: Math.max(0, (stage.scrollHeight - stage.clientHeight) / 2)
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeMedia, mediaNaturalSize, mediaStageSize]);

  function openMedia(index: number) {
    setMediaZoom(1);
    setMediaNaturalSize({ width: 0, height: 0 });
    setActiveMediaIndex(index);
  }

  function moveMediaViewer(direction: -1 | 1) {
    setMediaZoom(1);
    setMediaNaturalSize({ width: 0, height: 0 });
    setActiveMediaIndex((current) =>
      current === null
        ? null
        : (current + direction + data.media.length) % data.media.length
    );
  }

  useEffect(() => {
    if (preview || !profile.is_public) return;
    const storageKey = `calvet-profile-view:${profile.id}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch (error) {
      console.error("Unable to record profile view without session storage.", error);
      return;
    }

    void supabase
      .rpc("record_profile_view", {
        profile_username: profile.username
      })
      .then(
        ({ error }) => {
          if (error) {
            console.error("Unable to record profile view.", error);
          }
        },
        (error: unknown) => {
          console.error("Unable to record profile view.", error);
        }
      );
  }, [preview, profile.id, profile.is_public, profile.username, supabase]);

  useEffect(() => {
    if (!resumeAfterTrackChange.current) return;
    resumeAfterTrackChange.current = false;
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume * MAX_AUDIO_VOLUME;
    void audio.play().then(
      () => {
        setPlaying(true);
      },
      () => {
        setPlaying(false);
        setPlaybackError(true);
      }
    );
  }, [activeTrackIndex, volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume * MAX_AUDIO_VOLUME;
    }
  }, [musicUrl, volume]);

  function syncAudioProgress(audio: HTMLAudioElement) {
    setCurrentTime(audio.currentTime);

    let nextDuration = audio.duration;
    if (!Number.isFinite(nextDuration) || nextDuration <= 0) {
      const lastSeekableRange = audio.seekable.length - 1;
      nextDuration =
        lastSeekableRange >= 0
          ? audio.seekable.end(lastSeekableRange)
          : 0;
    }
    if (Number.isFinite(nextDuration) && nextDuration > 0) {
      setDuration(nextDuration);
    }
  }

  async function startMusic() {
    const audio = audioRef.current;
    if (!audio || preview) return;

    setPlaybackError(false);
    try {
      audio.volume = volume * MAX_AUDIO_VOLUME;
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setPlaybackError(true);
    }
  }

  async function enterProfile() {
    setEntered(true);
    if (musicUrl) await startMusic();
  }

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio || preview) return;
    if (audio.paused) {
      await startMusic();
      return;
    }
    audio.pause();
    setPlaying(false);
  }

  async function changeTrack(index: number) {
    if (musicTracks.length < 2) return;
    const nextIndex = (index + musicTracks.length) % musicTracks.length;
    setActiveTrackIndex(nextIndex);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackError(false);
    if (entered && !preview) {
      resumeAfterTrackChange.current = true;
    }
  }

  function formatTime(time: number) {
    if (!Number.isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  return (
    <main
      className={`public-profile ${preview ? "profile-preview" : "min-h-screen"} profile-background-${appearance.backgroundEffect} px-4 sm:px-6 ${motionDisabled ? "profile-motion-disabled" : "profile-page-enter"}`}
      style={{
        color: appearance.textColor,
        "--profile-text-color": appearance.textColor,
        "--profile-accent-color": appearance.accentColor,
        backgroundColor: appearance.backgroundColor,
        backgroundImage: backgroundImage
          ? `linear-gradient(rgba(8,8,12,.62), rgba(8,8,12,.78)), url(${backgroundImage})`
          : "radial-gradient(ellipse at 50% -10%, rgba(117,82,196,.26), transparent 44%), radial-gradient(ellipse at 0% 45%, rgba(34,76,104,.12), transparent 32%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        fontFamily
      } as CSSProperties}
    >
      <div
        className={`mx-auto ${preview ? "max-w-5xl py-6" : `${layoutWidth} ${spacing.page}`}`}
      >
        <article
          data-layout={profile.mode}
          className={`profile-panel profile-surface relative overflow-hidden border p-4 sm:p-6 ${cardEffect}`}
          style={{
            ...cardStyle,
            "--surface-highlight": appearance.surfaceHighlight
              ? "inset 0 1px 0 rgba(255,255,255,.2)"
              : "none"
          } as CSSProperties}
        >
          {appearance.cardEffect === "gradient" && (
            <span aria-hidden="true" className="profile-panel-gradient-overlay" />
          )}
          {appearance.surfaceHighlight && (
            <span aria-hidden="true" className="profile-surface-highlight" />
          )}
          <span
            aria-hidden="true"
            className={`profile-accent-glow pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-20 blur-[90px] ${motionDisabled ? "" : "profile-glow-pulse"}`}
            style={{ backgroundColor: appearance.accentColor }}
          />

          <div className="profile-content relative flex flex-col">
            {bannerImage && (
              <div
                className="profile-banner-fade relative order-0 -mx-5 -mt-5 mb-0 aspect-[3/1] overflow-hidden rounded-t-[inherit] sm:-mx-9 sm:-mt-9"
                style={{
                  "--profile-banner-fade-color": `color-mix(in srgb, ${surfaceColor} ${appearance.cardOpacity * 100}%, transparent)`
                } as CSSProperties}
              >
                <Image
                  src={bannerImage}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            )}

            <section
              className={`profile-identity relative z-10 order-1 text-center ${
                bannerImage ? "-mt-12 sm:-mt-16" : ""
              }`}
            >
              <div className="relative inline-block">
                {avatarImage ? (
                  <Image
                    src={avatarImage}
                    alt={`${profile.display_name} avatar`}
                    width={112}
                    height={112}
                    unoptimized
                    className={`mx-auto h-20 w-20 border border-white/15 object-cover shadow-[0_12px_45px_rgba(0,0,0,.4)] sm:h-24 sm:w-24 ${radius}`}
                  />
                ) : (
                  <div
                    className={`mx-auto flex h-20 w-20 items-center justify-center border border-white/15 text-3xl font-semibold text-white shadow-[0_12px_45px_rgba(0,0,0,.4)] sm:h-24 sm:w-24 ${radius}`}
                    style={{
                      background: `linear-gradient(145deg, ${appearance.accentColor}, #17131f)`
                    }}
                  >
                    {profile.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="profile-name-row mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <h1 className="text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
                  <UsernameEffect
                    key={profile.display_name}
                    text={profile.display_name}
                    effect={appearance.usernameEffect}
                    reducedMotion={motionDisabled}
                    accentColor={appearance.accentColor}
                  />
                </h1>
                <ProfileBadges badges={data.badges} />
              </div>
              <p className="mt-1 text-sm text-white/40">
                <span className="profile-detail-tooltip">
                  <span
                    tabIndex={0}
                    aria-label={`Username: ${profile.username}`}
                    aria-describedby={`profile-username-tooltip-${profile.id}`}
                    className="profile-detail-tooltip-trigger"
                  >
                    @{profile.username}
                  </span>
                  <span
                    id={`profile-username-tooltip-${profile.id}`}
                    role="tooltip"
                    className="profile-detail-tooltip-popover"
                  >
                    Username
                  </span>
                </span>
              </p>

              {profile.status && (
                <span className="profile-detail-tooltip mx-auto mt-3">
                  <span
                    tabIndex={0}
                    aria-label={`Status: ${profile.status}`}
                    aria-describedby={`profile-status-tooltip-${profile.id}`}
                    className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs text-white/70"
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_0_12px_currentColor]"
                      style={{
                        backgroundColor: appearance.accentColor,
                        color: appearance.accentColor
                      }}
                    />
                    {profile.status}
                  </span>
                  <span
                    id={`profile-status-tooltip-${profile.id}`}
                    role="tooltip"
                    className="profile-detail-tooltip-popover"
                  >
                    Status
                  </span>
                </span>
              )}

              {profile.bio && (
                <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/65 sm:text-base">
                  {profile.bio}
                </p>
              )}

              {(profile.location || profile.pronouns) && (
                <div
                  aria-label="Profile details"
                  className="mx-auto mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs"
                >
                  {profile.location && (
                    <span className="inline-flex items-center gap-1.5 text-white/70">
                      <MapPin aria-hidden="true" size={13} className="text-white/45" />
                      <span className="profile-detail-tooltip">
                        <span
                          tabIndex={0}
                          aria-label={`Location: ${profile.location}`}
                          aria-describedby={`profile-location-tooltip-${profile.id}`}
                          className="profile-detail-tooltip-trigger"
                        >
                          {profile.location}
                        </span>
                        <span
                          id={`profile-location-tooltip-${profile.id}`}
                          role="tooltip"
                          className="profile-detail-tooltip-popover"
                        >
                          Location
                        </span>
                      </span>
                    </span>
                  )}
                  {profile.pronouns && (
                    <span className="inline-flex items-center gap-1.5 text-white/70">
                      <UserRound aria-hidden="true" size={13} className="text-white/45" />
                      <span className="profile-detail-tooltip">
                        <span
                          tabIndex={0}
                          aria-label={`Pronouns: ${profile.pronouns}`}
                          aria-describedby={`profile-pronouns-tooltip-${profile.id}`}
                          className="profile-detail-tooltip-trigger"
                        >
                          {profile.pronouns}
                        </span>
                        <span
                          id={`profile-pronouns-tooltip-${profile.id}`}
                          role="tooltip"
                          className="profile-detail-tooltip-popover"
                        >
                          Pronouns
                        </span>
                      </span>
                    </span>
                  )}
                </div>
              )}

              {socials.length > 0 && (
                <div className="profile-socials mt-5 flex flex-wrap justify-center gap-2">
                  {socials.map((social, index) => {
                    const platform = getSocialPlatform(social.platform);
                    return (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={platform?.label ?? social.platform}
                        className={`social-button profile-surface flex h-10 items-center justify-center border text-white/65 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:text-white ${profile.mode === "social" ? "px-3" : "w-10"} ${motion}`}
                        style={{
                          ...cardStyle,
                          color: appearance.socialsMonochrome
                            ? appearance.textColor
                            : platform?.color,
                          animationDelay: motionDisabled ? undefined : `${index * 70}ms`
                        }}
                      >
                        <SocialPlatformIcon
                          platform={social.platform}
                          monochrome={appearance.socialsMonochrome}
                        />
                        {profile.mode === "social" && (
                          <span className="ml-2 text-xs">
                            {platform?.label ?? social.platform}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              )}

              {musicUrl && (
                <section
                  className={`profile-music profile-surface mx-auto mt-5 w-full max-w-xl border p-3 text-left sm:p-4 ${playing ? "is-playing" : ""}`}
                  style={{
                    ...cardStyle,
                    borderRadius: `${Math.max(12, appearance.surfaceRadius - 6)}px`
                  }}
                  aria-label="Music player"
                >
                  <audio
                    ref={audioRef}
                    preload="auto"
                    src={musicUrl}
                    loop={musicTracks.length === 1}
                    onTimeUpdate={(event) => syncAudioProgress(event.currentTarget)}
                    onLoadedMetadata={(event) => syncAudioProgress(event.currentTarget)}
                    onDurationChange={(event) => syncAudioProgress(event.currentTarget)}
                    onCanPlay={(event) => syncAudioProgress(event.currentTarget)}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => {
                      if (musicTracks.length > 1 && entered && !preview) {
                        void changeTrack(activeTrackIndex + 1);
                      } else {
                        setPlaying(false);
                      }
                    }}
                  >
                    Your browser does not support audio playback.
                  </audio>
                  <div className="profile-music-main flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className={`profile-music-art relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24 ${playing ? "is-playing" : ""}`}>
                      {activeTrack?.coverUrl || activeTrack?.coverImageUrl ? (
                        <Image
                          src={activeTrack.coverUrl || activeTrack.coverImageUrl || ""}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <span
                          className="profile-music-art-fallback flex h-full w-full items-center justify-center"
                          style={{
                            background: `linear-gradient(145deg, ${appearance.accentColor}88, #17131f)`,
                            color: appearance.textColor
                          }}
                        >
                          <Music2 size={30} />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span className="profile-music-kicker inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.2em] text-white/45 sm:text-[10px]">
                          <span className="profile-music-equalizer" aria-hidden="true">
                            <i /><i /><i />
                          </span>
                          {playing ? "Now playing" : "On repeat"}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/40">
                          {formatTime(currentTime)} <span className="text-white/20">/</span> {formatTime(duration)}
                        </span>
                      </div>
                      <p className="mt-1 min-w-0 text-sm font-semibold tracking-tight sm:mt-2 sm:text-base">
                        <span className="profile-detail-tooltip">
                          <span
                            tabIndex={0}
                            aria-label={`Song title: ${activeTrack?.title || "on repeat"}`}
                            aria-describedby={`profile-song-title-tooltip-${profile.id}`}
                            className="profile-detail-tooltip-trigger"
                          >
                            {activeTrack?.title || "on repeat"}
                          </span>
                          <span
                            id={`profile-song-title-tooltip-${profile.id}`}
                            role="tooltip"
                            className="profile-detail-tooltip-popover"
                          >
                            Song title
                          </span>
                        </span>
                      </p>
                      <p className="mt-0.5 min-w-0 text-[11px] text-white/50 sm:text-xs">
                        <span className="profile-detail-tooltip">
                          <span
                            tabIndex={0}
                            aria-label={`Artist: ${activeTrack?.artist || profile.display_name}`}
                            aria-describedby={`profile-song-artist-tooltip-${profile.id}`}
                            className="profile-detail-tooltip-trigger"
                          >
                            {activeTrack?.artist || profile.display_name}
                          </span>
                          <span
                            id={`profile-song-artist-tooltip-${profile.id}`}
                            role="tooltip"
                            className="profile-detail-tooltip-popover"
                          >
                            Song artist
                          </span>
                        </span>
                      </p>
                      {playbackError && (
                        <p className="mt-1 text-[10px] text-white/55">
                          Tap play to start the track.
                        </p>
                      )}
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        step={0.01}
                        value={Math.min(currentTime, duration || 0)}
                        aria-label="Seek through song"
                        disabled={preview || !duration}
                        onInput={(event) => {
                          const nextTime = Number(event.currentTarget.value);
                          if (audioRef.current) audioRef.current.currentTime = nextTime;
                          setCurrentTime(nextTime);
                        }}
                        onChange={(event) => {
                          const nextTime = Number(event.currentTarget.value);
                          if (audioRef.current) audioRef.current.currentTime = nextTime;
                          setCurrentTime(nextTime);
                        }}
                        className="profile-music-seek mt-2.5 block w-full"
                        style={{
                          "--music-accent": appearance.accentColor,
                          "--music-progress": `${duration ? (currentTime / duration) * 100 : 0}%`
                        } as CSSProperties}
                      />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Previous song"
                            disabled={musicTracks.length < 2 || preview}
                            onClick={() => void changeTrack(activeTrackIndex - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-30"
                          >
                            <SkipBack size={15} fill="currentColor" />
                          </button>
                          <button
                            type="button"
                            aria-label={playing ? "Pause music" : "Play music"}
                            onClick={() => void toggleMusic()}
                            disabled={preview}
                            className="profile-music-play flex h-9 w-9 items-center justify-center rounded-full text-black transition hover:scale-105 disabled:cursor-default"
                            style={{ backgroundColor: appearance.accentColor }}
                          >
                            {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                          </button>
                          <button
                            type="button"
                            aria-label="Next song"
                            disabled={musicTracks.length < 2 || preview}
                            onClick={() => void changeTrack(activeTrackIndex + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-30"
                          >
                            <SkipForward size={15} fill="currentColor" />
                          </button>
                        </div>
                        <div className="profile-volume-control group relative flex shrink-0 items-center">
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={muted ? 0 : volume}
                            aria-label="Music volume (slider maximum is 50% playback volume)"
                            disabled={preview}
                            onInput={(event) => {
                              const nextVolume = Number(event.currentTarget.value);
                              setVolume(nextVolume);
                              if (nextVolume > 0) {
                                volumeBeforeMute.current = nextVolume;
                              }
                              setMuted(nextVolume === 0);
                              if (audioRef.current) {
                                audioRef.current.volume = nextVolume * MAX_AUDIO_VOLUME;
                                audioRef.current.muted = nextVolume === 0;
                              }
                            }}
                            className="profile-volume-slider"
                            style={{
                              "--volume-progress": `${(muted ? 0 : volume) * 100}%`
                            } as CSSProperties}
                          />
                          <button
                            type="button"
                            aria-label={muted ? "Unmute music" : "Mute music"}
                            aria-pressed={muted}
                            onClick={() => {
                              const nextMuted = !muted;
                              setMuted(nextMuted);
                              if (audioRef.current) {
                                if (!nextMuted && volume === 0) {
                                  setVolume(volumeBeforeMute.current);
                                  audioRef.current.volume =
                                    volumeBeforeMute.current * MAX_AUDIO_VOLUME;
                                }
                                audioRef.current.muted = nextMuted;
                              }
                            }}
                            disabled={preview}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white disabled:cursor-default"
                          >
                            {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

            </section>

            {projects.length > 0 && (
              <section
                className={`profile-projects ${spacing.projects} ${profile.mode === "portfolio" ? "order-2" : "order-3"}`}
              >
                <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                  {appearance.projectsHeading || "Projects"}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {projects.map((project, index) => {
                    const projectCardClass = `project-card profile-surface group overflow-hidden border ${motion}`;
                    const projectCardStyle = {
                      ...cardStyle,
                      animationDelay: motionDisabled ? undefined : `${index * 110}ms`
                    };
                    const projectImage =
                      project.image_upload_url || project.image_url;
                    const projectCardContent = (
                      <div
                        className={`flex items-start gap-3 sm:gap-4 ${
                          projectImage ? "p-3 sm:p-4" : "p-4"
                        }`}
                      >
                        {projectImage && (
                          <div className="relative aspect-square w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black/20 sm:w-20">
                            <Image
                              src={projectImage}
                              alt={`${project.title} preview`}
                              fill
                              unoptimized
                              className="object-contain p-1 transition duration-300 group-hover:scale-[1.04]"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="line-clamp-2 min-w-0 font-semibold">{project.title}</h3>
                            {project.url && (
                              <ArrowUpRight
                                size={16}
                                className="shrink-0 text-white/35 transition group-hover:text-white"
                              />
                            )}
                          </div>
                          {project.description && (
                            <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-white/45">
                              {project.description}
                            </p>
                          )}
                          {project.tags.length > 0 && (
                            <div className="mt-2.5 flex max-w-full flex-nowrap gap-1.5 overflow-hidden">
                              {project.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="max-w-[7rem] shrink-0 truncate whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-0.5 text-[10px] text-white/55"
                                >
                                  {tag}
                                </span>
                              ))}
                              {project.tags.length > 3 && (
                                <span className="shrink-0 px-1 py-0.5 text-[10px] text-white/40">
                                  +{project.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );

                    return project.url ? (
                      <a
                        key={project.id}
                        href={project.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={projectCardClass}
                        style={projectCardStyle}
                      >
                        {projectCardContent}
                      </a>
                    ) : (
                      <article
                        key={project.id}
                        className={projectCardClass}
                        style={projectCardStyle}
                      >
                        {projectCardContent}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {data.media.length > 0 && (
              <section
                className={`profile-media ${spacing.projects} order-4`}
              >
                <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                  {appearance.mediaHeading || "Media"}
                </h2>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5">
                  {data.media.map((item, index) => (
                    <figure key={item.id} className="min-w-0">
                      <button
                        type="button"
                        onClick={() => openMedia(index)}
                        aria-label={`Open ${item.media_type === "video" ? "video" : "image"}: ${item.title || `media ${index + 1}`}`}
                        className="profile-media-thumbnail profile-surface group relative block aspect-square w-full overflow-hidden rounded-2xl border text-left transition duration-200 hover:-translate-y-1 hover:scale-[1.025] hover:border-white/25 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--profile-accent-color)]"
                        style={cardStyle}
                      >
                        {item.media_type === "video" ? (
                          <video
                            muted
                            preload="metadata"
                            playsInline
                            className="h-full w-full bg-black/30 object-cover"
                            aria-hidden="true"
                            src={item.media_url}
                          />
                        ) : (
                          <Image
                            src={item.media_url || ""}
                            alt=""
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 30vw, (max-width: 1024px) 22vw, 18vw"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        )}
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100 group-focus-visible:bg-black/25 group-focus-visible:opacity-100">
                          <ArrowUpRight size={22} />
                        </span>
                      </button>
                      {item.title && (
                        <figcaption className="mt-1.5 truncate px-1 text-[11px] text-white/50">
                          {item.title}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>

      </div>
      {activeMedia && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-3 backdrop-blur-md sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveMediaIndex(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={activeMedia.title || "Media viewer"}
            className="flex max-h-full w-full max-w-6xl flex-col items-center"
          >
            <div className="mb-3 flex w-full items-center justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {activeMedia.title || "Media"}
                </p>
                <p className="mt-0.5 text-xs text-white/45">
                  {(activeMediaIndex ?? 0) + 1} / {data.media.length}
                  {activeMedia.media_type === "image" && ` · ${Math.round(mediaZoom * 100)}%`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Close media viewer"
                  onClick={() => setActiveMediaIndex(null)}
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/75 transition hover:bg-white/15"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
              {data.media.length > 1 && (
                <button
                  type="button"
                  aria-label="Previous media"
                  onClick={() => moveMediaViewer(-1)}
                  className="absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/80 transition hover:bg-black/80 sm:left-2 sm:h-12 sm:w-12"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              {activeMedia.media_type === "video" ? (
                <video
                  controls
                  autoPlay
                  preload="metadata"
                  playsInline
                  className="max-h-[76vh] max-w-[min(84vw,1100px)] rounded-xl bg-black object-contain"
                  src={activeMedia.media_url}
                />
              ) : (
                <div
                  ref={mediaViewerStageRef}
                  className="h-[min(76vh,800px)] w-[min(92vw,1200px)] touch-none overflow-hidden rounded-xl"
                  style={{ touchAction: "none" }}
                  onWheel={handleMediaWheel}
                  onPointerDown={handleMediaPointerDown}
                  onPointerMove={handleMediaPointerMove}
                  onPointerUp={handleMediaPointerUp}
                  onPointerCancel={handleMediaPointerUp}
                  aria-label="Image viewer. Scroll or pinch to zoom; drag to pan while zoomed."
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      minWidth: Math.max(mediaStageSize.width, mediaViewerWidth),
                      minHeight: Math.max(mediaStageSize.height, mediaViewerHeight)
                    }}
                  >
                    <Image
                      src={activeMedia.media_url || ""}
                      alt={activeMedia.title || "Shared image"}
                      width={mediaNaturalSize.width || 1200}
                      height={mediaNaturalSize.height || 900}
                      unoptimized
                      onLoad={(event) =>
                        setMediaNaturalSize({
                          width: event.currentTarget.naturalWidth,
                          height: event.currentTarget.naturalHeight
                        })
                      }
                      className="max-w-none object-contain"
                      style={{
                        width: mediaViewerWidth || "100%",
                        height: mediaViewerHeight || "100%"
                      }}
                    />
                  </div>
                </div>
              )}
              {data.media.length > 1 && (
                <button
                  type="button"
                  aria-label="Next media"
                  onClick={() => moveMediaViewer(1)}
                  className="absolute right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/80 transition hover:bg-black/80 sm:right-2 sm:h-12 sm:w-12"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>
            <p className="mt-3 text-center text-[11px] text-white/35">
              {activeMedia.media_type === "image"
                ? "Scroll or pinch to zoom. Drag to pan when zoomed; use arrow keys to browse."
                : "Use the arrow keys to browse media."}
            </p>
          </section>
        </div>
      )}
      {!preview && !entered && (
        <button
          type="button"
          onClick={() => void enterProfile()}
          className={`profile-enter-screen profile-enter-${appearance.enterEffect} fixed inset-0 z-50 flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-6 text-center`}
          style={{
            color: appearance.textColor,
            backgroundColor: `color-mix(in srgb, ${appearance.backgroundColor} 72%, transparent)`,
            backdropFilter:
              appearance.enterBlur > 0
                ? `blur(${appearance.enterBlur}px)`
                : "none",
            "--enter-accent": appearance.accentColor
          } as CSSProperties}
          aria-label={appearance.enterText || "Click to enter"}
        >
          <span className="profile-enter-orb" aria-hidden="true" />
          <span className="relative z-10">
            <span className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {appearance.enterText}
            </span>
          </span>
        </button>
      )}
    </main>
  );
}
