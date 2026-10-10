"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import type { Appearance } from "@/types/profile";

type Props = {
  text: string;
  effect: Appearance["usernameEffect"];
  reducedMotion: boolean;
  accentColor: string;
  preview?: boolean;
};

type TextFrame = {
  source: string;
  effect: "typewriter" | "shuffle" | "glitch";
  parts: string[];
  step: number;
  activeIndex?: number;
};

const SCRAMBLE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const TYPEWRITER_REVEAL_MS = 1200;
const TYPEWRITER_HOLD_MS = 600;
const TYPEWRITER_BACKSPACE_MS = 800;
const TYPEWRITER_BACKSPACE_HOLD_MS = 400;
const TYPEWRITER_CYCLE_MS =
  TYPEWRITER_REVEAL_MS +
  TYPEWRITER_HOLD_MS +
  TYPEWRITER_BACKSPACE_MS +
  TYPEWRITER_BACKSPACE_HOLD_MS;
const GLITCH_REVEAL_MS = 1000;
const GLITCH_HOLD_MS = 500;
const GLITCH_BACK_MS = 800;
const GLITCH_BACK_HOLD_MS = 200;
const GLITCH_CYCLE_MS =
  GLITCH_REVEAL_MS + GLITCH_HOLD_MS + GLITCH_BACK_MS + GLITCH_BACK_HOLD_MS;

const PARTICLE_COLORS: Partial<
  Record<Appearance["usernameEffect"], string>
> = {
  "particles-blue": "#79bbff",
  "particles-green": "#8be6ae",
  "particles-pink": "#f5a1d2",
  "particles-red": "#ff858c",
  "particles-white": "#f5f7ff",
  "particles-gold": "#f3cc78"
};

const PARTICLES = [
  { x: 7, y: 16, size: 2, delay: -0.3, duration: 1.8 },
  { x: 26, y: 82, size: 2, delay: -1.1, duration: 2.1 },
  { x: 45, y: 8, size: 2.5, delay: -0.7, duration: 1.9 },
  { x: 67, y: 90, size: 2, delay: -1.6, duration: 2.2 },
  { x: 88, y: 15, size: 2, delay: -0.9, duration: 2 },
  { x: 97, y: 63, size: 2.5, delay: -1.4, duration: 1.8 },
  { x: 14, y: 53, size: 1.5, delay: -0.5, duration: 2.3 },
  { x: 78, y: 43, size: 1.5, delay: -1.8, duration: 2.1 }
] as const;

const SPARKLE_POSITIONS = [
  { x: 18, y: 12, delay: -0.5, duration: 2.2 },
  { x: 82, y: 82, delay: -1.6, duration: 2.6 },
  { x: 68, y: 5, delay: -1.1, duration: 2.4 }
] as const;

const STYLES = `
.hny-username {
  position: relative;
  display: inline-block;
  max-inline-size: 100%;
  min-inline-size: 0;
  vertical-align: baseline;
  isolation: isolate;
}

.hny-username__sr {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.hny-username__visual {
  position: relative;
  display: block;
  max-inline-size: 100%;
}

.hny-username__decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.hny-username__text {
  position: relative;
  z-index: 1;
  display: block;
  min-inline-size: 0;
  max-inline-size: 100%;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: normal;
  unicode-bidi: isolate;
}

.hny-username__glyph {
  position: relative;
  display: inline-block;
  vertical-align: baseline;
}

.hny-username__glyph-base {
  visibility: hidden;
}

.hny-username__glyph-frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
  text-align: center;
  white-space: pre;
  visibility: visible;
}

.hny-username[data-motion="true"] .hny-username__glyph[data-cursor="true"]::after {
  content: "";
  position: absolute;
  inset-inline-end: -1px;
  inset-block: 10%;
  border-inline-end: 1.5px solid var(--hny-accent);
  opacity: 0.9;
  animation: hny-username-cursor 0.9s ease-in-out infinite;
}

@keyframes hny-username-cursor {
  0%, 49%, 100% { opacity: 0.9; }
  50%, 99% { opacity: 0.2; }
}

/* Typewriter static: underline */
.hny-username[data-effect="typewriter"] .hny-username__text {
  text-decoration-line: underline;
  text-decoration-color: var(--hny-accent);
  text-decoration-thickness: 1.5px;
  text-underline-offset: 0.2em;
}

/* Shuffle static: subtle glow */
.hny-username[data-effect="shuffle"] .hny-username__text {
  text-shadow: 0 0 0.6em color-mix(in srgb, var(--hny-accent) 20%, transparent);
}

/* Rainbow gradient background */
@supports ((background-clip: text) or (-webkit-background-clip: text)) {
  .hny-username[data-effect="rainbow"] .hny-username__text {
    background: linear-gradient(
      90deg,
      #f87171 0%,
      #fb923c 17%,
      #fbbf24 33%,
      #4ade80 50%,
      #60a5fa 67%,
      #a78bfa 83%,
      #f87171 100%
    );
    background-size: 220% 100%;
    background-position: 50% 0;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }

  .hny-username[data-effect="rainbow"][data-motion="true"]
    .hny-username__text {
    animation: hny-username-rainbow 8s ease-in-out infinite alternate;
  }

  @keyframes hny-username-rainbow {
    from { background-position: 0% 0; }
    to { background-position: 100% 0; }
  }

  /* Shimmer: bright accent sweep, preserves text color */
  .hny-username[data-effect="hennessy-shimmer"] .hny-username__text {
    background: linear-gradient(
      90deg,
      transparent 0%,
      transparent 30%,
      var(--hny-accent) 45%,
      rgba(255, 255, 255, 0.4) 50%,
      var(--hny-accent) 55%,
      transparent 70%,
      transparent 100%
    );
    background-size: 300% 100%;
    background-position: -100% 0;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }

  .hny-username[data-effect="hennessy-shimmer"][data-motion="true"]
    .hny-username__text {
    animation: hny-username-shimmer 4s ease-in-out infinite;
  }

  @keyframes hny-username-shimmer {
    0% { background-position: -100% 0; }
    100% { background-position: 200% 0; }
  }
}

/* A small, deterministic particle set keeps the effect lightweight. */
.hny-username__particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hny-username__particle {
  position: absolute;
  left: var(--hny-x);
  top: var(--hny-y);
  inline-size: var(--hny-size);
  block-size: var(--hny-size);
  border-radius: 50%;
  background: var(--hny-particle);
  box-shadow: 0 0 4px var(--hny-particle);
  opacity: 0.4;
  transform: translate(-50%, -50%);
}

.hny-username[data-motion="true"] .hny-username__particle {
  animation: hny-username-particle var(--hny-duration)
    ease-in-out var(--hny-delay) infinite;
}

@keyframes hny-username-particle {
  0% {
    transform: translate(-50%, -50%) translateY(0) scale(0.7);
    opacity: 0.3;
  }
  50% {
    transform: translate(-50%, -50%) translateY(-5px) scale(1);
    opacity: 0.65;
  }
  100% {
    transform: translate(-50%, -50%) translateY(-9px) scale(0.5);
    opacity: 0;
  }
}

/* Sparkles (visual) */
.hny-username__sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hny-username__sparkle {
  position: absolute;
  left: var(--hny-x);
  top: var(--hny-y);
  inline-size: 3px;
  block-size: 3px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 4px #fff, 0 0 8px var(--hny-accent);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0);
}

.hny-username[data-motion="true"] .hny-username__sparkle {
  animation: hny-username-sparkle var(--hny-duration)
    ease-in-out var(--hny-delay) infinite;
}

.hny-username[data-effect="sparkle"][data-motion="false"]
  .hny-username__sparkle {
  opacity: .55;
  transform: translate(-50%, -50%) scale(.65);
}

@keyframes hny-username-sparkle {
  0%, 100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }
  25%, 38% {
    opacity: .8;
    transform: translate(-50%, -50%) scale(.8);
  }
  45%, 100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }
}

/* Prism: two translucent facets sweep */
.hny-username__prism {
  position: absolute;
  inset: 8% 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.hny-username__prism::before,
.hny-username__prism::after {
  content: "";
  position: absolute;
  inset-block: 0;
  inline-size: 28%;
  background: var(--hny-accent);
  opacity: 0.14;
  clip-path: polygon(35% 0, 100% 0, 65% 100%, 0 100%);
}

.hny-username__prism::before {
  inset-inline-start: 8%;
}

.hny-username__prism::after {
  inset-inline-start: 50%;
  inline-size: 16%;
  opacity: 0.08;
}

.hny-username[data-motion="true"] .hny-username__prism::before {
  animation: hny-username-prism 7s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}

.hny-username[data-motion="true"] .hny-username__prism::after {
  animation: hny-username-prism 9s cubic-bezier(0.25, 0.46, 0.45, 0.94) -3.5s infinite reverse;
}

@keyframes hny-username-prism {
  0% { transform: translateX(-25%); }
  100% { transform: translateX(110%); }
}

/* Orbit: subtle ellipses with orbiting diamond */
.hny-username__orbit {
  position: absolute;
  inline-size: 0.95em;
  block-size: 0.95em;
  color: var(--hny-accent);
  pointer-events: none;
  z-index: 0;
}

.hny-username__orbit--start {
  inset-inline-start: -0.1em;
  inset-block-start: -0.2em;
}

.hny-username__orbit--end {
  inset-inline-end: -0.1em;
  inset-block-end: -0.2em;
}

.hny-username__orbit::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 0.8px solid currentColor;
  border-radius: 50%;
  opacity: 0.15;
  transform: scaleY(0.6) rotate(-20deg);
}

.hny-username__orbit-track {
  position: absolute;
  inset: 0;
}

.hny-username__orbit-track::before {
  content: "";
  position: absolute;
  inset-inline-start: 48%;
  inset-block-start: 0;
  inline-size: 0.16em;
  block-size: 0.16em;
  background: currentColor;
  box-shadow: 0 0 4px currentColor;
  clip-path: polygon(
    50% 0, 61% 35%, 100% 50%, 61% 65%,
    50% 100%, 39% 65%, 0 50%, 39% 35%
  );
}

.hny-username[data-motion="true"] .hny-username__orbit-track {
  animation: hny-username-orbit 10s linear infinite;
}

.hny-username[data-motion="true"]
  .hny-username__orbit--end .hny-username__orbit-track {
  animation-duration: 13s;
  animation-direction: reverse;
  animation-delay: -4s;
}

@keyframes hny-username-orbit {
  to { transform: rotate(360deg); }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hny-username *,
  .hny-username *::before,
  .hny-username *::after {
    animation: none !important;
  }

  .hny-username__glyph-base {
    visibility: visible;
  }

  .hny-username__glyph-frame,
  .hny-username__glyph::after {
    display: none;
  }
}

@media (forced-colors: active) {
  .hny-username .hny-username__text {
    color: CanvasText;
    background: none;
    text-shadow: none;
  }

  .hny-username__particles,
  .hny-username__sparkles,
  .hny-username__prism,
  .hny-username__orbit {
    display: none;
  }
}
`;

function subscribeToMotionPreference(onChange: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", onChange);
  return () => preference.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function splitGraphemes(text: string): string[] {
  if (typeof Intl.Segmenter !== "function") {
    return [text];
  }

  return Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
    ({ segment }) => segment
  );
}

function scrambleCharacter(
  index: number,
  step: number
): string {
  return SCRAMBLE_CHARACTERS[
    (index * 17 + step * 11) % SCRAMBLE_CHARACTERS.length
  ];
}

function shuffleCharacter(
  index: number,
  step: number,
  original: string
): string {
  const candidate = scrambleCharacter(index, step);
  return candidate === original
    ? SCRAMBLE_CHARACTERS[
        (index * 17 + step * 11 + 1) % SCRAMBLE_CHARACTERS.length
      ]
    : candidate;
}

function Orbit({ position }: { position: "start" | "end" }) {
  return (
    <span
      aria-hidden="true"
      className={`hny-username__orbit hny-username__orbit--${position}`}
    >
      <span className="hny-username__orbit-track" />
    </span>
  );
}

export default function UsernameEffect({
  text,
  effect,
  reducedMotion,
  accentColor,
  preview = false
}: Props) {
  const systemReducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    () => true
  );
  const [frame, setFrame] = useState<TextFrame | null>(null);
  const animate =
    !preview && !reducedMotion && !systemReducedMotion;
  const particleColor = PARTICLE_COLORS[effect];

  useEffect(() => {
    if (
      !animate ||
      !text ||
      (effect !== "typewriter" &&
        effect !== "shuffle" &&
        effect !== "glitch")
    ) {
      return;
    }

    const parts = splitGraphemes(text);
    if (parts.length < 2 || parts.length > 160) {
      return;
    }

    const shuffleIndices = parts.flatMap((part, index) =>
      /^[\p{L}\p{N}]$/u.test(part) ? [index] : []
    );
    if (effect === "shuffle" && shuffleIndices.length === 0) {
      return;
    }

    const startedAt = performance.now();
    const intervalMs =
      effect === "glitch"
        ? 40
        : effect === "shuffle"
          ? 140
          : 40;
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      let frameStep: number;

      if (effect === "typewriter") {
        const cyclePos = elapsed % TYPEWRITER_CYCLE_MS;
        if (cyclePos < TYPEWRITER_REVEAL_MS) {
          frameStep = Math.floor(
            (cyclePos / TYPEWRITER_REVEAL_MS) * parts.length
          );
        } else if (cyclePos < TYPEWRITER_REVEAL_MS + TYPEWRITER_HOLD_MS) {
          frameStep = parts.length;
        } else if (
          cyclePos <
          TYPEWRITER_REVEAL_MS +
            TYPEWRITER_HOLD_MS +
            TYPEWRITER_BACKSPACE_MS
        ) {
          const backspaceElapsed =
            cyclePos - TYPEWRITER_REVEAL_MS - TYPEWRITER_HOLD_MS;
          frameStep = Math.max(
            0,
            parts.length -
              Math.floor(
                (backspaceElapsed / TYPEWRITER_BACKSPACE_MS) * parts.length
              )
          );
        } else {
          frameStep = 0;
        }
      } else if (effect === "glitch") {
        const cyclePos = elapsed % GLITCH_CYCLE_MS;
        if (cyclePos < GLITCH_REVEAL_MS) {
          frameStep = Math.floor((cyclePos / GLITCH_REVEAL_MS) * parts.length);
        } else if (cyclePos < GLITCH_REVEAL_MS + GLITCH_HOLD_MS) {
          frameStep = parts.length;
        } else if (
          cyclePos <
          GLITCH_REVEAL_MS + GLITCH_HOLD_MS + GLITCH_BACK_MS
        ) {
          const backElapsed =
            cyclePos - GLITCH_REVEAL_MS - GLITCH_HOLD_MS;
          frameStep = Math.max(
            0,
            parts.length - Math.floor((backElapsed / GLITCH_BACK_MS) * parts.length)
          );
        } else {
          frameStep = 0;
        }
      } else {
        frameStep = Math.floor(elapsed / intervalMs);
      }

      setFrame({
        source: text,
        effect,
        parts,
        step: frameStep,
        activeIndex: effect === "shuffle"
          ? shuffleIndices[frameStep % shuffleIndices.length]
          : undefined
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [animate, effect, text]);

  const activeFrame =
    animate &&
    frame?.source === text &&
    frame.effect === effect
      ? frame
      : null;

  const style = {
    "--hny-accent": accentColor || "currentColor",
    "--hny-particle": particleColor || "currentColor"
  } as CSSProperties;

  return (
    <>
      <style href="hennessy-username-effects" precedence="components">
        {STYLES}
      </style>

      <span
        className="hny-username"
        data-effect={effect}
        data-motion={animate ? "true" : "false"}
        style={style}
      >
        <span className="hny-username__sr">{text}</span>
        <span className="hny-username__visual" aria-hidden="true">
          {(effect === "hennessy-prism" || effect === "hennessy-orbit") && (
            <span className="hny-username__decorations">
              {effect === "hennessy-prism" ? (
                <span className="hny-username__prism" />
              ) : (
                <>
                  <Orbit position="start" />
                  <Orbit position="end" />
                </>
              )}
            </span>
          )}

          {effect === "sparkle" && (
            <span className="hny-username__sparkles">
              {SPARKLE_POSITIONS.map((sparkle, index) => (
                <span
                  key={index}
                  className="hny-username__sparkle"
                  style={
                    {
                      "--hny-x": `${sparkle.x}%`,
                      "--hny-y": `${sparkle.y}%`,
                      "--hny-duration": `${sparkle.duration}s`,
                      "--hny-delay": `${sparkle.delay}s`
                    } as CSSProperties
                  }
                />
              ))}
            </span>
          )}

          {particleColor && (
            <span className="hny-username__particles">
              {PARTICLES.map((particle, index) => (
                <span
                  key={index}
                  className="hny-username__particle"
                  style={
                    {
                      "--hny-x": `${particle.x}%`,
                      "--hny-y": `${particle.y}%`,
                      "--hny-size": `${particle.size}px`,
                      "--hny-delay": `${particle.delay}s`,
                      "--hny-duration": `${particle.duration}s`
                    } as CSSProperties
                  }
                />
              ))}
            </span>
          )}

          <bdi
            className="hny-username__text"
            dir="auto"
            data-fuzzy-text={effect === "fuzzy" ? text : undefined}
          >
            {activeFrame ? (
              activeFrame.parts.map((character, index) => {
                let displayedCharacter = character;
                let isCursor = false;

                if (activeFrame.effect === "typewriter") {
                  const isRevealed = index < activeFrame.step;
                  isCursor = index === activeFrame.step;
                  if (!isRevealed) {
                    displayedCharacter = "";
                  }
                } else if (activeFrame.effect === "shuffle") {
                  if (index === activeFrame.activeIndex) {
                    displayedCharacter = shuffleCharacter(
                      index,
                      activeFrame.step,
                      character
                    );
                  }
                } else if (activeFrame.effect === "glitch") {
                  const isRevealed = index < activeFrame.step;
                  if (!isRevealed && /^[\p{L}\p{N}]$/u.test(character)) {
                    displayedCharacter = scrambleCharacter(index, activeFrame.step);
                  }
                }

                return (
                  <span
                    key={`${index}-${character}`}
                    className="hny-username__glyph"
                    data-cursor={isCursor ? "true" : undefined}
                  >
                    <span className="hny-username__glyph-base">
                      {character}
                    </span>
                    <span className="hny-username__glyph-frame">
                      {displayedCharacter}
                    </span>
                  </span>
                );
              })
            ) : (
              text
            )}
          </bdi>
        </span>
      </span>
    </>
  );
}