import type { Metadata } from "next";
import ProfileRenderer from "@/components/ProfileRenderer";
import { demoProfile } from "@/lib/profile";

export const metadata: Metadata = {
  title: "Example profile"
};

export default function DemoProfilePage() {
  return <ProfileRenderer data={demoProfile} />;
}
