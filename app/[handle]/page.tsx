import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/profile";
import ProfileRenderer from "@/components/ProfileRenderer";

type Props = {
  params: Promise<{ handle: string }>;
};

function usernameFromHandle(handle: string) {
  const normalizedHandle = handle.replace(/^%40/i, "@");
  return normalizedHandle.startsWith("@")
    ? normalizedHandle.slice(1)
    : normalizedHandle;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const username = usernameFromHandle(handle);
  const data = await getPublicProfile(username);

  if (!data) {
    return { title: "Profile not found" };
  }

  const description =
    data.profile.bio || `${data.profile.display_name}'s profile`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    title: {
      absolute: `${data.profile.display_name} (@${data.profile.username})`
    },
    description,
    alternates: {
      canonical: `${siteUrl}/@${data.profile.username}`
    },
    openGraph: {
      title: data.profile.display_name,
      description,
      type: "profile",
      images: data.profile.avatar_url ? [data.profile.avatar_url] : undefined
    },
    twitter: {
      card: "summary",
      title: data.profile.display_name,
      description
    }
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const data = await getPublicProfile(usernameFromHandle(handle));

  if (!data) notFound();

  return <ProfileRenderer data={data} />;
}