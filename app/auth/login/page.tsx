import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ authError?: string | string[] }>;
}) {
  const { authError } = await searchParams;

  return (
    <main className="auth-page relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 text-[#f5f3fa]">
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-sm font-semibold text-white/45 transition hover:text-white">
          ← Back to Calvet
        </Link>
        <AuthForm initialAuthError={authError === "oauth"} />
      </div>
    </main>
  );
}
