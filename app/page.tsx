import Link from "next/link";
import Image from "next/image";
import { SiDiscord, SiInstagram, SiSpotify } from "@icons-pack/react-simple-icons";
import { ArrowUpRight, Disc3, Heart, Music2, Sparkles } from "lucide-react";
import { homeDemoProfile } from "@/lib/home-demo-profile";

const homeSocialIcons = {
  instagram: SiInstagram,
  spotify: SiSpotify,
  discord: SiDiscord
} as const;

export default function HomePage() {
  return (
    <main className="home-page min-h-screen overflow-hidden bg-[#08080b] text-[#f5f3fa]">
      <div className="home-atmosphere" aria-hidden="true" />

      <header className="home-topbar">
        <Link
          href="/"
          className="brand-mark inline-flex items-center gap-2 text-xl font-black tracking-[-0.08em]"
          aria-label="Calvet home"
        >
          <Image
            src="/CalvetLogo.jpg"
            alt=""
            width={34}
            height={34}
            className="rounded-lg"
            priority
          />
          <span>calvet</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main navigation">
          <Link
            href="/demo"
            className="whitespace-nowrap rounded-full px-4 py-2.5 text-sm text-white/60 transition hover:text-white"
          >
            Demo
          </Link>
          <Link
            href="/dashboard"
            className="home-create-link whitespace-nowrap"
          >
            Make yours <ArrowUpRight size={15} />
          </Link>
        </nav>
      </header>

      <section className="home-stage" aria-label="Make your own profile page">
        <div className="home-copy">
          <div className="home-eyebrow">
            <span className="home-eyebrow-star"><Sparkles size={13} /></span>
            your corner of the internet
          </div>
          <h1>
            Your page.
            <br />
            Your vibe.
            <br />
            <span className="home-headline-highlight">No rules.</span>
          </h1>
          <p className="home-copy-note">
            A little corner for your links, current obsession, and the song you
            have played 47 times today. Make it yours and make it weird.
          </p>
          <div className="home-actions">
            <Link href="/dashboard" className="home-main-cta">
              Make your page <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="home-note-row">
            <span><Heart size={14} fill="currentColor" /> for your internet era</span>
            <span className="home-note-separator" />
            <span>zero résumé energy</span>
          </div>
        </div>

        <div className="home-showcase" aria-label="Example profile preview">
          <div className="home-showcase-orbit home-showcase-orbit-one" aria-hidden="true" />
          <div className="home-showcase-orbit home-showcase-orbit-two" aria-hidden="true" />
          <span className="home-sticker home-sticker-left" aria-hidden="true">
            currently avoiding homework
          </span>
          <span className="home-sticker home-sticker-right" aria-hidden="true">
            <Sparkles size={13} /> made of you
          </span>
          <span className="home-float-note" aria-hidden="true">
            <Disc3 size={15} /> on repeat
          </span>

          <article className="home-profile-card">
            <div className="home-cover">
              <div className="home-cover-moon" />
              <div className="home-cover-caption">
                <span>{homeDemoProfile.coverCaption}</span>
              </div>
            </div>

            <div className="home-profile-body">
              <div className="home-identity">
                <div
                  className="home-avatar"
                  aria-label={`${homeDemoProfile.displayName} avatar`}
                  role="img"
                  style={
                    homeDemoProfile.avatarUrl
                      ? {
                          backgroundImage: `url("${homeDemoProfile.avatarUrl}")`,
                          backgroundPosition: "center",
                          backgroundSize: "cover"
                        }
                      : undefined
                  }
                >
                  {!homeDemoProfile.avatarUrl && homeDemoProfile.avatarFallback}
                </div>
                <div className="min-w-0">
                  <h2>{homeDemoProfile.displayName} <span>✦</span></h2>
                  <p>@{homeDemoProfile.username}</p>
                </div>
                <span className="home-status"><i /> {homeDemoProfile.status}</span>
              </div>

              <p className="home-bio">
                {homeDemoProfile.bio}
              </p>

              <div className="home-interests" aria-label="Interests">
                {homeDemoProfile.interests.map((interest) => (
                  <span key={interest}>{interest}</span>
                ))}
              </div>

              <div className="home-socials" aria-label="Example social links">
                {homeDemoProfile.socials.map(({ platform, label }) => {
                  const Icon = homeSocialIcons[platform];
                  return (
                    <span key={platform}>
                      <Icon aria-hidden="true" size={17} /> {label}
                    </span>
                  );
                })}
              </div>

              <div className="home-music-card">
                <div className="home-record" aria-hidden="true">
                  <div />
                </div>
                <div className="home-track-copy">
                  <span><Music2 size={12} /> ON REPEAT</span>
                  <strong>{homeDemoProfile.musicTitle}</strong>
                  <small>{homeDemoProfile.musicCaption}</small>
                </div>
                <div className="home-equalizer" aria-hidden="true">
                  <i /><i /><i /><i /><i />
                </div>
              </div>
            </div>
          </article>
          <div className="home-showcase-caption">
            <span className="home-caption-ping" />
            one page, a million little personalities
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <span>calvet</span>
        <span>tiny corner of the internet, big main-character energy</span>
        <Link href="/dashboard">make your own <ArrowUpRight size={13} /></Link>
      </footer>
    </main>
  );
}
