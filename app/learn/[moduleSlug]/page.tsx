import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getModule } from "@/lib/curriculum";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/supabase/server";
import { getLearnerProgress } from "@/lib/progress";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}): Promise<Metadata> {
  const { moduleSlug } = await params;
  const mod = getModule(moduleSlug);
  if (!mod) return { title: "Level not found" };
  return {
    title: `Level ${mod.level}: ${mod.title}`,
    description: mod.objective,
    robots: { index: false, follow: false },
  };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const { moduleSlug } = await params;
  const mod = getModule(moduleSlug);
  if (!mod) notFound();

  const configured = isSupabaseConfigured();
  let userId: string | null = null;
  if (configured) {
    const user = await getCurrentUser();
    if (!user) redirect(`/login?next=/learn/${moduleSlug}`);
    userId = user.id;
  }

  const progress = await getLearnerProgress(userId);
  const level = progress.levels.find((l) => l.module.slug === mod.slug);
  if (level?.state === "locked") {
    redirect("/learn");
  }

  const isPreviewLevel = mod.level > 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-sans text-[#ededed]">
      <SiteNav />
      <main id="main" className="flex-1 px-6 pb-24 pt-32">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/learn"
            className="rounded-sm text-sm text-gray-500 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            ← All levels
          </Link>

          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-gray-500">
            Level {mod.level}
          </p>
          <h1 className="mt-2 text-4xl font-bold text-white">{mod.title}</h1>
          <p className="mt-4 text-gray-400">{mod.objective}</p>

          {isPreviewLevel && (
            <div className="mt-6 rounded-lg border border-white/10 bg-[#111111] p-4 text-sm text-gray-400">
              Full lesson content for this level is authored in a later sprint.
              Below is the planned lesson sequence.
            </div>
          )}

          <ol className="mt-10 space-y-3">
            {mod.lessons.map((lesson, i) => {
              const completed = progress.completed.has(
                `${mod.slug}/${lesson.slug}`,
              );
              // A lesson is available if it's the first, the previous is done,
              // or Supabase isn't configured (foundation is reviewable).
              const prevDone =
                i === 0 ||
                progress.completed.has(
                  `${mod.slug}/${mod.lessons[i - 1].slug}`,
                );
              const available = !configured || completed || prevDone;
              const canOpen = available && !isPreviewLevel;

              return (
                <li
                  key={lesson.slug}
                  className="rounded-xl border border-white/10 bg-[#111111] p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-gray-600">
                        Lesson {i + 1}
                      </span>
                      <h2 className="mt-1 text-base font-semibold text-white">
                        {lesson.title}
                      </h2>
                    </div>
                    <span
                      className="whitespace-nowrap text-xs text-gray-500"
                      aria-hidden={!completed}
                    >
                      {completed
                        ? "✓ Completed"
                        : canOpen
                          ? `${lesson.estimatedMinutes} min`
                          : "Locked"}
                    </span>
                  </div>
                  <div className="mt-4">
                    {canOpen ? (
                      <Link
                        href={`/learn/${mod.slug}/${lesson.slug}`}
                        className="rounded-sm text-sm text-gray-300 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      >
                        {completed ? "Review lesson" : "Start lesson"} →
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-600">
                        {isPreviewLevel
                          ? "Opens in a later sprint"
                          : "Complete the previous lesson to unlock"}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
