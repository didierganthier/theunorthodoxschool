import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import LoginForm from "./LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";
import { callbackErrorMessage } from "@/lib/auth-utils";

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
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);

  const configured = isSupabaseConfigured();

  // In production, missing Supabase configuration is a deployment error for
  // administrators — never a silent "coming soon" placeholder to end users.
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the deployment environment.",
    );
  }

  if (configured) {
    const user = await getCurrentUser();
    if (user) redirect(nextPath);
  }

  const errorMessage = callbackErrorMessage(params.error);

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

          {errorMessage && (
            <p
              role="alert"
              className="mt-6 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-center text-sm text-red-300"
            >
              {errorMessage}
            </p>
          )}

          <div className="mt-8">
            {configured ? (
              <LoginForm nextPath={nextPath} />
            ) : (
              // Development-only fallback. This never renders in production
              // because the guard above throws when config is missing there.
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-8 text-center">
                <h2 className="text-lg font-bold text-amber-200">
                  Supabase not configured (development)
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-amber-100/80">
                  Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                  <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in{" "}
                  <code>.env.local</code>, then restart the dev server to enable
                  the sign-in form.
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
