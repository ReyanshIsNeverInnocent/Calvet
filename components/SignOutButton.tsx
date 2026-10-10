"use client";

import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
  }

  return (
    <button
      onClick={signOut}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-black/55 hover:bg-black/5 hover:text-black"
    >
      <LogOut size={16} />
      Sign out
    </button>
  );
}
