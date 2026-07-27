import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { curriculum } from "@/lib/curriculum";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Curriculum",
  description:
    "Six levels — from orientation to a published capstone project. A preview of the self-paced curriculum at The Unorthodox School.",
  alternates: { canonical: "/curriculum" },
};

export default function CurriculumPage() {
  return (
    <div className="bg-[#0a0a0a] font-sans text-[#ededed]">
      <SiteNav />

      <main id="main" className="px-6 pb-24 pt-32">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-500">
            Curriculum
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            From first step to published project.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
            {siteConfig.recommendedDuration.label} Each level ends with work you
            actually produce — and the next level opens only when you&apos;ve shown
            you&apos;re ready.
          </p>

          <p className="mt-6 inline-flex items-center gap-2 rounded-md border border-white/10 bg-[#111111] px-4 py-2 text-xs text-gray-400">
            <span aria-hidden>👁</span> Preview — sign in to track your progress.
          </p>

          <div className="mt-12 space-y-6">
            {curriculum.map((module) => {
              // Public preview: Level 0 is the available starting point; the
              // rest are shown as previews. This never implies real progress.
              const previewState =
                module.level === 0 ? "available" : "locked";

              return (
                <article
                  key={module.slug}
                  className="rounded-xl border border-white/10 bg-[#111111] p-6 sm:p-8"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md border border-white/10 px-2.5 py-1 text-xs uppercase tracking-wider text-gray-500">
                        Level {module.level}
                      </span>
                      <h2 className="text-xl font-bold text-white">
                        {module.title}
                      </h2>
                    </div>
                    <span
                      className={
                        previewState === "available"
                          ? "rounded-full border border-white/30 px-3 py-1 text-xs text-white"
                          : "rounded-full border border-white/10 px-3 py-1 text-xs text-gray-600"
                      }
                    >
                      {previewState === "available" ? "Start here" : "Locked preview"}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-gray-400">
                    {module.objective}
                  </p>

                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-600">
                        Main topics
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {module.topics.map((topic) => (
                          <li
                            key={topic}
                            className="flex items-start gap-2 text-sm text-gray-300"
                          >
                            <span aria-hidden className="mt-0.5 text-gray-600">
                              •
                            </span>
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-600">
                          Example exercise
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-400">
                          {module.exampleExercise}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-600">
                          Expected artifact
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-400">
                          {module.expectedArtifact}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-14 rounded-xl border border-white/10 bg-[#111111] p-8 text-center">
            <h2 className="text-2xl font-bold text-white">
              Ready to start at Level 0?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-400">
              Orientation is free to begin. Set your learning goal and prepare
              your tools — no fixed start date.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/apply"
                className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Start Learning
              </Link>
              <Link
                href="/how-it-works"
                className="rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                How it works
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
