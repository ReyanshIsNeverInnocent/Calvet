import {
  SiBluesky,
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiPinterest,
  SiReddit,
  SiSnapchat,
  SiSpotify,
  SiSteam,
  SiThreads,
  SiTiktok,
  SiTwitch,
  SiX,
  SiYoutube
} from "@icons-pack/react-simple-icons";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Link2,
  Music2
} from "lucide-react";
import { getSocialPlatform } from "@/lib/socials";

export default function SocialPlatformIcon({
  platform,
  size = 20
}: {
  platform: string;
  size?: number;
}) {
  const normalized = platform.toLowerCase();
  const iconProps = {
    "aria-hidden": true as const,
    size,
    color: getSocialPlatform(normalized)?.color
  };

  if (normalized === "github") return <SiGithub {...iconProps} />;
  if (normalized === "instagram") return <SiInstagram {...iconProps} />;
  if (normalized === "youtube") return <SiYoutube {...iconProps} />;
  if (normalized === "tiktok") return <SiTiktok {...iconProps} />;
  if (normalized === "discord") return <SiDiscord {...iconProps} />;
  if (normalized === "twitch") return <SiTwitch {...iconProps} />;
  if (normalized === "spotify") return <SiSpotify {...iconProps} />;
  if (normalized === "pinterest") return <SiPinterest {...iconProps} />;
  if (normalized === "x" || normalized === "twitter") return <SiX {...iconProps} />;
  if (normalized === "reddit") return <SiReddit {...iconProps} />;
  if (normalized === "snapchat") return <SiSnapchat {...iconProps} />;
  if (normalized === "facebook") return <SiFacebook {...iconProps} />;
  if (normalized === "threads") return <SiThreads {...iconProps} />;
  if (normalized === "bluesky") return <SiBluesky {...iconProps} />;
  if (normalized === "steam") return <SiSteam {...iconProps} />;
  if (normalized === "music") return <Music2 aria-hidden="true" size={size} />;
  if (normalized === "link") return <Link2 aria-hidden="true" size={size} />;
  if (normalized === "linkedin" || normalized === "briefcase") {
    return <BriefcaseBusiness aria-hidden="true" size={size} />;
  }

  return <ArrowUpRight aria-hidden="true" size={size} />;
}
