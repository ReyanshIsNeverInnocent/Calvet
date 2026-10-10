import { urlSchema } from "@/lib/validation";

export const linkIconOptions = [
  { value: "link", label: "Website" },
  { value: "github", label: "GitHub" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "twitch", label: "Twitch" },
  { value: "spotify", label: "Spotify" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "x", label: "X" },
  { value: "music", label: "Music" },
  { value: "briefcase", label: "Work" }
] as const;

export type LinkIconName = (typeof linkIconOptions)[number]["value"];

const knownProviders: {
  hosts: string[];
  title: string;
  icon: LinkIconName;
}[] = [
  { hosts: ["github.com"], title: "GitHub", icon: "github" },
  { hosts: ["instagram.com"], title: "Instagram", icon: "instagram" },
  { hosts: ["youtube.com", "youtu.be"], title: "YouTube", icon: "youtube" },
  { hosts: ["twitch.tv"], title: "Twitch", icon: "twitch" },
  { hosts: ["spotify.com"], title: "Spotify", icon: "spotify" },
  { hosts: ["linkedin.com"], title: "LinkedIn", icon: "linkedin" },
  { hosts: ["x.com", "twitter.com"], title: "X", icon: "x" }
];

export function suggestLink(rawUrl: string): {
  url: string;
  title: string;
  icon: LinkIconName;
} | null {
  const trimmedUrl = rawUrl.trim();

  if (
    !trimmedUrl ||
    (/^[a-z][a-z\d+.-]*:/i.test(trimmedUrl) &&
      !/^https?:\/\//i.test(trimmedUrl))
  ) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;
  const parsedUrl = urlSchema.safeParse(candidate);

  if (!parsedUrl.success) {
    return null;
  }

  const url = new URL(parsedUrl.data);
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const provider = knownProviders.find(({ hosts }) =>
    hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))
  );

  if (provider) {
    return { url: parsedUrl.data, title: provider.title, icon: provider.icon };
  }

  const labels = hostname.split(".");
  const usesCountryCodeDomain =
    labels.length > 2 &&
    labels[labels.length - 1].length === 2 &&
    labels[labels.length - 2].length <= 3;
  const domainLabel = labels[Math.max(0, labels.length - (usesCountryCodeDomain ? 3 : 2))];
  const title = domainLabel
    ? domainLabel.charAt(0).toUpperCase() + domainLabel.slice(1)
    : hostname;

  return { url: parsedUrl.data, title, icon: "link" };
}
