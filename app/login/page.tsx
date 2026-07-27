import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import LoginForm from "./LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your learner dashboard at The Unorthodox School.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/dashboard";

  const configured = isSupabaseConfigured();

  if (configured) {
    const user = await getCurrentUser();
    if (user) redirect(nextPath);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-sans text-[#ededed]">
      <SiteNav />

      <main
        id="main"
        className="flex flex-1 items-center justify-center px-6 pb-24 pt-32"
      >
        <div className="w-full max-w-md">
          <h1 className="text-center text-3xl font-bold text-white">
            Sign in
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-gray-400">
            Access your dashboard and continue where you left off.
          </p>

          <div className="mt-10">
            {configured ? (
              <LoginForm nextPath={nextPath} />
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#111111] p-8 text-center">
                <p className="mb-4 text-2xl" aria-hidden>
                  🔒
                </p>
                <h2 className="text-lg font-bold text-white">
                  Authentication is not available yet
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  Learner accounts open once the platform&apos;s backend is
                  connected. In the meantime, you can apply to join and we&apos;ll
                  reach out.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
