import Link from "next/link";
import Image from "next/image";
import { SiGithub, SiInstagram } from "@icons-pack/react-simple-icons";
import {
  ArrowDown,
  ArrowUpRight,
  Box,
  Plus,
  Sparkles
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="home-page min-h-screen overflow-hidden bg-[#08080b] text-[#f5f3fa]">
      <nav className="home-nav mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
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
            priority
          />
          <span>
            calvet<span className="brand-star">✳</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/demo"
            className="rounded-full px-4 py-2.5 text-sm text-white/60 transition hover:text-white"
          >
            Explore
          </Link>
          <Link
            href="/auth/login"
            className="cta-button inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold sm:px-5"
          >
            Make a page <ArrowUpRight size={16} />
          </Link>
        </div>
      </nav>

      <section className="hero-section relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-14 sm:px-8 sm:pb-32 sm:pt-20 lg:grid-cols-[1fr_0.9fr]">
        <div className="hero-copy relative z-10">
          <p className="eyebrow mb-7 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#a29caf]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#aa8cff] shadow-[0_0_14px_#aa8cff]" />
            Your page, your rules
          </p>
          <h1 className="max-w-3xl text-6xl font-semibold leading-[0.98] tracking-[-0.075em] sm:text-7xl lg:text-[6.4rem]">
            Make the
            <br />
            internet feel
            <br />
            <span className="gradient-text">like yours.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#a29eae] sm:text-lg sm:leading-8">
            One page for your links, socials, projects, and whatever you want
            people to find. Built to be yours, not a template with your name on it.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/auth/login"
              className="cta-button inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
            >
              Build your page <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3.5 text-sm font-semibold text-white/75 transition hover:border-white/25 hover:bg-white/[0.04] hover:text-white"
            >
              See what&apos;s possible <ArrowDown size={15} />
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-3 text-xs text-[#858191]">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#c9baff]">
              <Sparkles size={13} />
            </span>
            Your layout. Your colors. Your corner.
          </div>
        </div>

        <div className="hero-art relative mx-auto w-full max-w-[510px] py-8 sm:py-12">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-glow" />
          <div className="floating-chip chip-top">
            <SiInstagram aria-hidden="true" size={15} /> your socials
          </div>
          <div className="floating-chip chip-bottom">
            <Box size={15} /> your projects
          </div>

          <div className="showcase-card">
            <div className="showcase-cover">
              <div className="cover-grid" />
              <div className="cover-orb" />
              <div className="cover-caption">
                <span>PROFILE / 001</span>
                <span className="live-indicator">LIVE</span>
              </div>
            </div>
            <div className="showcase-content">
              <div className="showcase-person">
                <div className="showcase-avatar">n</div>
                <div>
                  <p className="text-lg font-semibold tracking-tight">nova</p>
                  <p className="mt-0.5 text-xs text-white/40">@nova.exe</p>
                </div>
                <span className="ml-auto rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                  online
                </span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
                Designer, sound collector, making things for the screen.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="showcase-link link-purple">
                  <span><SiInstagram aria-hidden="true" size={15} /> Instagram</span><ArrowUpRight size={14} />
                </div>
                <div className="showcase-link link-blue">
                  <span><SiGithub aria-hidden="true" size={15} /> GitHub</span><ArrowUpRight size={14} />
                </div>
                <div className="showcase-link link-wide">
                  <span><Box size={15} /> Selected work</span><ArrowUpRight size={14} />
                </div>
              </div>
              <div className="showcase-footer">
                <span>calvet.page/nova.exe</span>
                <Plus size={14} />
              </div>
            </div>
          </div>
          <div className="side-note" aria-hidden="true">MAKE IT YOURS ↗</div>
        </div>
      </section>

      <section className="feature-strip mx-auto grid max-w-7xl gap-px border-t border-white/[0.08] px-5 sm:grid-cols-3 sm:px-8">
        {[
          ["01", "Make it yours", "Shape the look, color, and feel of your page."],
          ["02", "Put it all here", "Links, social profiles, and projects in one place."],
          ["03", "Make it move", "Subtle motion brings your page to life."]
        ].map(([number, title, description]) => (
          <div key={number} className="feature-item py-8 sm:px-6 sm:py-10">
            <span className="text-xs font-mono text-[#8f7be2]">{number}</span>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-[#8f8b9b]">
              {description}
            </p>
          </div>
        ))}
      </section>

      <footer className="mx-auto flex max-w-7xl items-center justify-between border-t border-white/[0.08] px-5 py-6 text-xs text-white/35 sm:px-8">
        <Link href="/" className="font-bold tracking-[-0.04em]">calvet✳</Link>
        <span>A page that feels like you.</span>
      </footer>
    </main>
  );
}
