import { redirect } from "next/navigation";
import UsernameForm from "./UsernameForm";
import { createClient } from "@/lib/supabase/server";

export default async function UsernamePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to check your profile: ${error.message}`);
  }

  if (profile) {
    redirect("/dashboard");
  }

  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  const displayName =
    typeof metadataName === "string" && metadataName.trim()
      ? metadataName.trim().slice(0, 80)
      : "New Calvet";

  return <UsernameForm userId={user.id} displayName={displayName} />;
}
