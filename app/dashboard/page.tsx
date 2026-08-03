import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import GithubConnectionCard from "@/components/GithubConnectionCard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/supabase/server";
import { getLearnerProgress } from "@/lib/progress";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your learning progress at The Unorthodox School.",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();

  // When auth is live, require a session. When it is not configured, we still
  // render an honest preview so the foundation is reviewable — clearly labeled.
  let displayName = "learner";
  if (configured) {
    const user = await getCurrentUser();
    if (!user) redirect("/login?next=/dashboard");
    displayName =
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "learner";
  }

  const userId = configured ? (await getCurrentUser())?.id ?? null : null;
  const progress = await getLearnerProgress(userId);

  const stateLabel: Record<string, string> = {
    completed: "Completed",
    "in-progress": "In progress",
    locked: "Locked",
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-sans text-[#ededed]">
      <SiteNav />

      <main id="main" className="flex-1 px-6 pb-24 pt-32">
        <div className="mx-auto max-w-4xl">
          {!configured && (
            <div className="mb-8 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
              Preview mode: learner accounts are not connected yet, so no real
              progress is stored. This is the dashboard foundation, shown
              honestly with empty progress.
            </div>
          )}

          {/* Welcome */}
          <header>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold text-white">
              {progress.totalCompleted > 0
                ? `Welcome back, ${displayName}.`
                : `Welcome, ${displayName}.`}
            </h1>
            <p className="mt-3 text-gray-400">
              Self-paced. Your progress reflects what you have actually
              completed — nothing is marked done for you.
            </p>
          </header>

          {/* Overall progress */}
          <section className="mt-10 rounded-xl border border-white/10 bg-[#111111] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Overall progress</h2>
              <span className="text-sm text-gray-400">
                {progress.totalCompleted} / {progress.totalLessons} lessons
              </span>
            </div>
            <div
              className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Overall program progress"
            >
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-gray-500">
              {progress.percent}% of the program complete.
            </p>
          </section>

          {/* Continue */}
          <section className="mt-6 rounded-xl border border-white/10 bg-[#111111] p-6">
            <h2 className="text-lg font-bold text-white">Continue learning</h2>
            {progress.nextLesson ? (
              <>
                <p className="mt-2 text-sm text-gray-400">
                  Pick up where you left off.
                </p>
                <Link
                  href={`/learn/${progress.nextLesson.moduleSlug}/${progress.nextLesson.lessonSlug}`}
                  className="mt-5 inline-flex rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Continue →
                </Link>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-400">
                You have completed every available lesson. Well done.
              </p>
            )}
          </section>

          {/* Levels */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-white">Your levels</h2>
            <ul className="mt-4 space-y-3">
              {progress.levels.map(({ module, completedLessons, totalLessons, state }) => {
                const locked = state === "locked";
                return (
                  <li
                    key={module.slug}
                    className="rounded-xl border border-white/10 bg-[#111111] p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                          Level {module.level}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-white">
                          {module.title}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">
                          {stateLabel[state]}
                        </span>
                        <p className="text-sm text-gray-400">
                          {completedLessons} / {totalLessons}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      {locked ? (
                        <span className="text-sm text-gray-600">
                          Complete the previous level to unlock.
                        </span>
                      ) : (
                        <Link
                          href={`/learn/${module.slug}`}
                          className="rounded-sm text-sm text-gray-300 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        >
                          {completedLessons > 0 ? "Resume level" : "Open level"} →
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* GitHub + assignment status */}
          <section className="mt-10 grid gap-4 md:grid-cols-2">
            <GithubConnectionCard status="unavailable" />
            <div className="rounded-xl border border-white/10 bg-[#111111] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Current assignment
              </p>
              <h3 className="mt-2 text-lg font-bold text-white">
                No active assignment
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                Technical assignments begin in Level 3. When they open, your
                current assignment and its automated result will appear here.
              </p>
            </div>
          </section>

          {/* Help */}
          <section className="mt-10 rounded-xl border border-white/10 bg-[#111111] p-6">
            <h2 className="text-lg font-bold text-white">Need help?</h2>
            <p className="mt-2 text-sm text-gray-400">
              Being stuck is part of the loop. Review the lesson, search, and
              reach out when you need a hand.
            </p>
            <Link
              href="/how-it-works"
              className="mt-4 inline-flex rounded-sm text-sm text-gray-300 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              How the learning loop works →
            </Link>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
