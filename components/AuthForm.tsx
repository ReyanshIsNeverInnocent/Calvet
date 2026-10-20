"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { SiGoogle } from "@icons-pack/react-simple-icons";
import { MessageCircle } from "lucide-react";

export default function AuthForm({
  initialAuthError = false
}: {
  initialAuthError?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    initialAuthError ? "We couldn't complete sign-in. Please try again." : ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialAuthError) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [initialAuthError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`
            }
          });

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      if (result.data.session) {
        router.push("/dashboard");
        return;
      }

      setMessage("Account created. Check your email to confirm your account.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  async function signInWithProvider(provider: "google" | "discord") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="auth-panel w-full max-w-md rounded-[2rem] border border-white/[0.09] p-7 sm:p-9">
      <div className="mb-7">
        <p className="brand-mark text-sm font-black tracking-[-0.06em]">calvet<span className="brand-star">✳</span></p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#f5f3fa]">
          {mode === "login" ? "Welcome back." : "Create your page."}
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/45">
          Your page is waiting.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-1">
        <button
          onClick={() => setMode("login")}
          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
            mode === "login" ? "bg-white/[0.09] text-white shadow-sm" : "text-white/45"
          }`}
        >
          Log in
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
            mode === "signup" ? "bg-white/[0.09] text-white shadow-sm" : "text-white/45"
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-white/75">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="auth-input mt-2 w-full rounded-2xl px-4 py-3 outline-none transition placeholder:text-white/25"
          />
        </label>

        <label className="block text-sm font-semibold text-white/75">
          Password
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="auth-input mt-2 w-full rounded-2xl px-4 py-3 outline-none transition placeholder:text-white/25"
          />
        </label>

        <button
          disabled={loading}
          className="cta-button w-full rounded-2xl px-4 py-3.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Working…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-white/30">
        <div className="h-px flex-1 bg-white/10" />
        or continue with
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => signInWithProvider("google")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 text-sm font-semibold text-white/75 transition hover:border-white/20 hover:bg-white/[0.075] hover:text-white"
        >
          <SiGoogle aria-hidden="true" size={17} />
          Google
        </button>

        <button
          onClick={() => signInWithProvider("discord")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 text-sm font-semibold text-white/75 transition hover:border-white/20 hover:bg-white/[0.075] hover:text-white"
        >
          <MessageCircle size={17} />
          Discord
        </button>
      </div>

      {message && (
        <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white/75">
          {message}
        </p>
      )}
    </div>
  );
}
