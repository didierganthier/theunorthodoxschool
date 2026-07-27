import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/supabase/server";
import { getLearnerProgress } from "@/lib/progress";

export const metadata: Metadata = {
  title: "Learn",
  description: "Your levels and lessons at The Unorthodox School.",
  alternates: { canonical: "/learn" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LearnIndexPage() {
  const configured = isSupabaseConfigured();
  let userId: string | null = null;

  if (configured) {
    const user = await getCurrentUser();
    if (!user) redirect("/login?next=/learn");
    userId = user.id;
  }

  const progress = await getLearnerProgress(userId);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-sans text-[#ededed]">
      <SiteNav />
      <main id="main" className="flex-1 px-6 pb-24 pt-32">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Learn
          </p>
          <h1 className="mt-3 text-4xl font-bold text-white">Your levels</h1>
          <p className="mt-3 text-gray-400">
            Move through the levels in order. Each level unlocks when you
            complete the one before it.
          </p>

          <ul className="mt-10 space-y-4">
            {progress.levels.map(({ module, completedLessons, totalLessons, state }) => {
              const locked = state === "locked";
              return (
                <li
                  key={module.slug}
                  className="rounded-xl border border-white/10 bg-[#111111] p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-xl">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                        Level {module.level}
                      </p>
                      <h2 className="mt-2 text-xl font-bold text-white">
                        {module.title}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-gray-400">
                        {module.objective}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm text-gray-500">
                      {completedLessons} / {totalLessons}
                    </span>
                  </div>
                  <div className="mt-5">
                    {locked ? (
                      <span className="text-sm text-gray-600">
                        Locked — finish Level {module.level - 1} first.
                      </span>
                    ) : (
                      <Link
                        href={`/learn/${module.slug}`}
                        className="inline-flex rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      >
                        Open Level {module.level} →
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
