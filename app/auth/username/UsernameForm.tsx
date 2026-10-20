"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { usernameSchema } from "@/lib/validation";

export default function UsernameForm({
  userId,
  displayName
}: {
  userId: string;
  displayName: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = usernameSchema.safeParse(username);

    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Enter a valid username.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("profiles").insert({
      user_id: userId,
      username: parsed.data,
      display_name: displayName
    });

    if (error) {
      setMessage(
        error.code === "23505"
          ? "That username is already taken. Please choose another."
          : `We couldn't save your username: ${error.message}`
      );
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="auth-page relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 text-[#f5f3fa]">
      <div className="auth-panel w-full max-w-md rounded-[2rem] border border-white/[0.09] p-7 sm:p-9">
        <p className="brand-mark text-sm font-black tracking-[-0.06em]">
          calvet<span className="brand-star">✳</span>
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
          Choose your username.
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/45">
          This is how people will find your page.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-white/75">
            Username
            <div className="auth-input mt-2 flex items-center rounded-2xl px-4 transition focus-within:ring-2 focus-within:ring-white/20">
              <span className="text-white/35">/@</span>
              <input
                autoFocus
                required
                minLength={3}
                maxLength={24}
                pattern="[a-zA-Z0-9_]+"
                autoCapitalize="none"
                autoCorrect="off"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()
                  )
                }
                spellCheck={false}
                aria-describedby="username-help"
                className="w-full bg-transparent px-2 py-3 outline-none placeholder:text-white/25"
                placeholder="yourname"
              />
            </div>
            <span id="username-help" className="mt-1 block text-xs font-normal text-white/40">
              3–24 letters, numbers, or underscores.
            </span>
          </label>

          <button
            disabled={loading}
            className="cta-button w-full rounded-2xl px-4 py-3.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving…" : "Continue"}
          </button>
        </form>

        {message && (
          <p role="alert" className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white/75">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
