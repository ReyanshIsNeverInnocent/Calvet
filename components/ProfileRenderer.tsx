"use client";

import {
  SiGithub,
  SiInstagram,
  SiTwitch,
  SiX,
  SiYoutube
} from "@icons-pack/react-simple-icons";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Link2,
  MapPin,
  Music2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  UserRound,
  Volume2,
  VolumeX
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createClient } from "@/lib/supabase/browser";
import ProfileBadges from "@/components/ProfileBadges";
import UsernameEffect from "@/components/UsernameEffect";
import { isHttpUrl } from "@/lib/music";
import type { PublicProfileData } from "@/types/profile";

const MAX_AUDIO_VOLUME = 0.5;

function ProfileIcon({ name, size = 18 }: { name: string; size?: number }) {
  const normalized = name.toLowerCase();

  if (normalized === "github") return <SiGithub aria-hidden="true" size={size} />;
  if (normalized === "instagram") return <SiInstagram aria-hidden="true" size={size} />;
  if (normalized === "youtube") return <SiYoutube aria-hidden="true" size={size} />;
  if (normalized === "twitch") return <SiTwitch aria-hidden="true" size={size} />;
  if (normalized === "spotify" || normalized === "music") return <Music2 aria-hidden="true" size={size} />;
  if (normalized === "linkedin" || normalized === "briefcase") return <BriefcaseBusiness aria-hidden="true" size={size} />;
  if (normalized === "x" || normalized === "twitter") return <SiX aria-hidden="true" size={size} />;
  if (normalized === "link") return <Link2 aria-hidden="true" size={size} />;

  return <ArrowUpRight aria-hidden="true" size={size} />;
}

export default function ProfileRenderer({
  data,
  preview = false
}: {
  data: PublicProfileData;
  preview?: boolean;
}) {
  const { profile, links, socials, projects } = data;
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
  const activeTrack = musicTracks[activeTrackIndex] ?? musicTracks[0];
  const musicUrl = activeTrack?.url ?? null;

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

              {socials.length > 0 && (
                <div className="profile-socials mt-5 flex flex-wrap justify-center gap-2">
                  {socials.map((social, index) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={social.platform}
                      className={`social-button profile-surface flex h-10 items-center justify-center border text-white/65 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:text-white ${profile.mode === "social" ? "px-3" : "w-10"} ${motion}`}
                      style={{
                        ...cardStyle,
                        animationDelay: motionDisabled ? undefined : `${index * 70}ms`
                      }}
                    >
                      <ProfileIcon name={social.platform} />
                      {profile.mode === "social" && (
                        <span className="ml-2 text-xs capitalize">{social.platform}</span>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </section>

            {links.length > 0 && (
              <section
                className={`profile-links ${spacing.section} ${profile.mode === "portfolio" ? "order-3" : "order-2"} space-y-3`}
              >
                {links.length > 1 && (
                  <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                    Links
                  </h2>
                )}
                {links.map((link, index) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`profile-link profile-surface group flex items-center justify-between border px-4 py-3 text-left text-white/90 ${motion}`}
                    style={{
                      ...cardStyle,
                      animationDelay: motionDisabled ? undefined : `${index * 90}ms`
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.045] text-white/65"
                    >
                      <ProfileIcon name={link.icon} />
                    </span>
                    <span>
                      <span className="block font-semibold">{link.title}</span>
                      {link.description && (
                        <span className="mt-1 block text-sm text-white/40">
                          {link.description}
                        </span>
                      )}
                    </span>
                    <ArrowUpRight
                      size={18}
                      className="shrink-0 text-white/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                    />
                  </a>
                ))}
              </section>
            )}

            {projects.length > 0 && (
              <section
                className={`profile-projects ${spacing.projects} ${profile.mode === "portfolio" ? "order-2" : "order-3"}`}
              >
                <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                  Projects
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {projects.map((project, index) => (
                    <a
                      key={project.id}
                      href={project.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={`project-card profile-surface group overflow-hidden border ${motion}`}
                      style={{
                        ...cardStyle,
                        animationDelay: motionDisabled ? undefined : `${index * 110}ms`
                      }}
                    >
                      {(project.image_upload_url || project.image_url) && (
                        <div className="relative h-36 overflow-hidden">
                          <Image
                            src={project.image_upload_url || project.image_url}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d13]/50 to-transparent" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold">{project.title}</h3>
                          <ArrowUpRight
                            size={16}
                            className="shrink-0 text-white/35 transition group-hover:text-white"
                          />
                        </div>
                        {project.description && (
                          <p className="mt-2 text-sm leading-6 text-white/45">
                            {project.description}
                          </p>
                        )}
                        {project.tags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {project.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-xs text-white/55"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {data.media.length > 0 && (
              <section
                className={`profile-media ${spacing.projects} order-4`}
              >
                <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                  Media
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.media.map((item) => (
                    <figure
                      key={item.id}
                      className="profile-surface overflow-hidden border"
                      style={cardStyle}
                    >
                      {item.media_type === "video" ? (
                        <video
                          controls
                          preload="metadata"
                          playsInline
                          className="aspect-video w-full bg-black object-contain"
                          aria-label={item.title || "Shared video"}
                          src={item.media_url}
                        />
                      ) : (
                        <Image
                          src={item.media_url || ""}
                          alt={item.title || "Shared image"}
                          width={1200}
                          height={900}
                          unoptimized
                          className="max-h-96 w-full object-contain"
                        />
                      )}
                      {item.title && (
                        <figcaption className="px-3 py-2 text-xs text-white/65">
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
