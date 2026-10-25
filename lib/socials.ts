export type SocialPlatform = {
  value: string;
  label: string;
  baseUrl: string;
  hosts: string[];
  color: string;
};

export const socialPlatformOptions: SocialPlatform[] = [
  {
    value: "github",
    label: "GitHub",
    baseUrl: "https://github.com/",
    hosts: ["github.com"],
    color: "#f1f5f9"
  },
  {
    value: "instagram",
    label: "Instagram",
    baseUrl: "https://www.instagram.com/",
    hosts: ["instagram.com"],
    color: "#f472b6"
  },
  {
    value: "youtube",
    label: "YouTube",
    baseUrl: "https://www.youtube.com/",
    hosts: ["youtube.com"],
    color: "#ff4b4b"
  },
  {
    value: "tiktok",
    label: "TikTok",
    baseUrl: "https://www.tiktok.com/",
    hosts: ["tiktok.com"],
    color: "#67e8f9"
  },
  {
    value: "discord",
    label: "Discord",
    baseUrl: "https://discord.com/users/",
    hosts: ["discord.com"],
    color: "#8ea1ff"
  },
  {
    value: "x",
    label: "X",
    baseUrl: "https://x.com/",
    hosts: ["x.com", "twitter.com"],
    color: "#f1f5f9"
  },
  {
    value: "twitch",
    label: "Twitch",
    baseUrl: "https://www.twitch.tv/",
    hosts: ["twitch.tv"],
    color: "#b69aff"
  },
  {
    value: "spotify",
    label: "Spotify",
    baseUrl: "https://open.spotify.com/user/",
    hosts: ["open.spotify.com"],
    color: "#53e38c"
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    baseUrl: "https://www.linkedin.com/in/",
    hosts: ["linkedin.com"],
    color: "#71b7ff"
  },
  {
    value: "reddit",
    label: "Reddit",
    baseUrl: "https://www.reddit.com/user/",
    hosts: ["reddit.com"],
    color: "#ff895e"
  },
  {
    value: "pinterest",
    label: "Pinterest",
    baseUrl: "https://www.pinterest.com/",
    hosts: ["pinterest.com"],
    color: "#f64b5e"
  },
  {
    value: "snapchat",
    label: "Snapchat",
    baseUrl: "https://www.snapchat.com/add/",
    hosts: ["snapchat.com"],
    color: "#ffe36e"
  },
  {
    value: "threads",
    label: "Threads",
    baseUrl: "https://www.threads.net/",
    hosts: ["threads.net"],
    color: "#f1f5f9"
  },
  {
    value: "facebook",
    label: "Facebook",
    baseUrl: "https://www.facebook.com/",
    hosts: ["facebook.com"],
    color: "#78a9ff"
  },
  {
    value: "bluesky",
    label: "Bluesky",
    baseUrl: "https://bsky.app/profile/",
    hosts: ["bsky.app"],
    color: "#69aaff"
  },
  {
    value: "steam",
    label: "Steam",
    baseUrl: "https://steamcommunity.com/id/",
    hosts: ["steamcommunity.com"],
    color: "#a7c6e8"
  }
];

export function getSocialPlatform(platform: string) {
  return socialPlatformOptions.find((option) => option.value === platform.toLowerCase());
}

export function getSocialUrlSuffix(platform: string, value: string) {
  const option = getSocialPlatform(platform);
  if (!option) return value;

  const trimmed = value.trim();
  if (trimmed.toLowerCase().startsWith(option.baseUrl.toLowerCase())) {
    return trimmed.slice(option.baseUrl.length);
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (
      option.hosts.some(
        (allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`)
      )
    ) {
      let path = url.pathname.replace(/^\/+/, "");
      const basePath = new URL(option.baseUrl).pathname.replace(/^\/+/, "");
      if (basePath && path.toLowerCase().startsWith(basePath.toLowerCase())) {
        path = path.slice(basePath.length);
      }
      return `${path}${url.search}${url.hash}`;
    }
  } catch {
    return trimmed.replace(/^\/+/, "");
  }

  return trimmed;
}

export function buildSocialUrl(platform: string, value: string) {
  const option = getSocialPlatform(platform);
  if (!option) return null;

  let suffix = value.trim();
  if (!suffix) return null;

  if (/^https?:\/\//i.test(suffix)) {
    let url: URL;
    try {
      url = new URL(suffix);
    } catch {
      return null;
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (
      !option.hosts.some(
        (allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`)
      )
    ) {
      return null;
    }
    suffix = getSocialUrlSuffix(platform, suffix);
  } else if (/^[a-z][a-z\d+.-]*:/i.test(suffix) || suffix.startsWith("//")) {
    return null;
  }

  suffix = suffix.replace(/^\/+/, "");
  if (!suffix) return null;
  return `${option.baseUrl}${suffix}`;
}
