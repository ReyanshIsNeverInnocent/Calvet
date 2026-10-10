import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <main className="not-found-page flex min-h-screen items-center justify-center px-5 py-16 text-[#f5f3fa]">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/[0.09] bg-[#111017]/85 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,.35)] backdrop-blur-xl sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#b49aff]">
          <Sparkles size={24} />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#b49aff]">
          404
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          This page isn&apos;t here.
        </h1>
        <p className="mx-auto mt-4 max-w-sm leading-7 text-white/45">
          This profile may have moved, or it may not be public.
        </p>
        <Link
          href="/"
          className="cta-button mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          <ArrowLeft size={16} />
          Back to Calvet
        </Link>
      </div>
    </main>
  );
}
