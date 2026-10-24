import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfileRenderer from "@/components/ProfileRenderer";
import { getPublicProfile } from "@/lib/profile";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPublicProfile("demo");

  if (!data) {
    return { title: "Profile not found" };
  }

  return {
    title: `${data.profile.display_name} (@${data.profile.username})`,
    description: data.profile.bio || `${data.profile.display_name}'s profile`
  };
}

export default async function DemoProfilePage() {
  const data = await getPublicProfile("demo");

  if (!data) notFound();

  return <ProfileRenderer data={data} />;
}
