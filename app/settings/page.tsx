import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import GithubConnectionCard from "@/components/GithubConnectionCard";
import { siteConfig } from "@/lib/site-config";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/supabase/server";
import { getGithubConnection } from "@/lib/github/server/connection";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account at The Unorthodox School.",
  alternates: { canonical: "/settings" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const configured = isSupabaseConfigured();
  let email = "";
  let userId: string | null = null;
  if (configured) {
    const user = await getCurrentUser();
    if (!user) redirect("/login?next=/settings");
    email = user.email ?? "";
    userId = user.id;
  }

  const github = await getGithubConnection(userId);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-sans text-[#ededed]">
      <SiteNav />
      <main id="main" className="flex-1 px-6 pb-24 pt-32">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Settings
          </p>
          <h1 className="mt-3 text-4xl font-bold text-white">Your account</h1>

          {!configured && (
            <div className="mt-8 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
              Preview mode: accounts are not connected yet, so there is nothing
              to manage. This is the settings foundation.
            </div>
          )}

          <section className="mt-8 rounded-xl border border-white/10 bg-[#111111] p-6">
            <h2 className="text-lg font-bold text-white">Profile</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-300">
                  {email || "Not signed in"}
                </dd>
              </div>
            </dl>
          </section>

          <div className="mt-6">
            <GithubConnectionCard
              status={github.status}
              username={github.username ?? undefined}
            />
          </div>

          {configured && (
            <section className="mt-6 rounded-xl border border-white/10 bg-[#111111] p-6">
              <h2 className="text-lg font-bold text-white">Session</h2>
              <p className="mt-2 text-sm text-gray-400">
                Sign out of this device.
              </p>
              <form action="/auth/signout" method="post" className="mt-4">
                <button
                  type="submit"
                  className="rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Sign out
                </button>
              </form>
            </section>
          )}

          <p className="mt-8 text-sm text-gray-500">
            Need help? Email{" "}
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="rounded-sm text-gray-300 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {siteConfig.supportEmail}
            </a>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
