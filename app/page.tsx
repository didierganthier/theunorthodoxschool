import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Faq from "@/components/Faq";
import { curriculum } from "@/lib/curriculum";
import { siteConfig } from "@/lib/site-config";

const benefits = [
  "Learn at your own pace",
  "Complete automated exercises",
  "Receive immediate feedback",
  "Build real projects on GitHub",
  "Unlock lessons by demonstrating progress",
  "Finish with a published project and verifiable skills",
];

const whoFor = [
  "Students who feel school isn't enough",
  "Self-taught learners with no clear direction",
  "Beginners curious about tech & AI",
  "Creatives, freelancers, future builders",
  "Career changers who want proof, not just theory",
  "Anyone ready to learn by doing",
];

const learningLoop = [
  {
    step: "Learn",
    desc: "Short, structured lessons you can complete independently.",
  },
  {
    step: "Practice",
    desc: "Try each idea yourself with focused, hands-on activities.",
  },
  {
    step: "Submit",
    desc: "Complete a checkpoint — a quiz, exercise, or project.",
  },
  {
    step: "Unlock",
    desc: "Pass the checkpoint and the next lesson opens automatically.",
  },
];

const format = [
  {
    label: "Guided lessons",
    value: "Short, structured lessons learners can complete independently.",
  },
  {
    label: "Automated challenges",
    value:
      "Quizzes, interactive exercises, and project checkpoints with immediate feedback.",
  },
  {
    label: "GitHub projects",
    value:
      "Learners complete technical assignments in verified GitHub repositories.",
  },
  {
    label: "Progressive access",
    value: "The next lesson unlocks only after the required checkpoint is passed.",
  },
  {
    label: "Optional community",
    value:
      "Community support may exist, but it is never required to complete the program.",
  },
];

export default function Home() {
  return (
    <div className="bg-[#0a0a0a] font-sans text-[#ededed]">
      <SiteNav />

      <main id="main">
        {/* 1. HERO */}
        <section className="flex min-h-screen flex-col items-center justify-center px-6 pb-16 pt-28 text-center">
          <p className="mb-6 text-xs uppercase tracking-[0.3em] text-gray-500">
            Self-paced · AI &amp; digital skills · Build on GitHub
          </p>
          <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-white sm:text-7xl">
            Learn differently.
            <br />
            <span className="text-gray-500">Build independently.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
            {siteConfig.description}
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href={siteConfig.enrollment.startLearning.href}
              className="rounded-md bg-white px-8 py-4 text-base font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {siteConfig.enrollment.startLearning.label}
            </Link>
            <Link
              href="/curriculum"
              className="rounded-md border border-white/20 px-8 py-4 text-base font-semibold text-white transition-colors hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Explore the curriculum
            </Link>
          </div>
          <p className="mt-6 max-w-md text-xs leading-relaxed text-gray-600">
            {siteConfig.enrollment.startLearning.description} Looking for a
            sponsored seat?{" "}
            <Link
              href={siteConfig.enrollment.apply.href}
              className="rounded-sm text-gray-400 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {siteConfig.enrollment.apply.label}
            </Link>{" "}
            — {siteConfig.enrollment.apply.disclaimer}
          </p>
        </section>

        {/* 2. WHY THE SCHOOL EXISTS */}
        <section className="border-y border-white/10 bg-[#111111] px-6 py-16">
          <div className="mx-auto max-w-3xl space-y-4 text-center text-lg leading-relaxed text-gray-400">
            <p>Haiti does not lack intelligence.</p>
            <p>Haiti does not lack creativity.</p>
            <p>Haiti does not lack ambition.</p>
            <p className="pt-4 font-medium text-white">
              What&apos;s often missing are systems that recognize unconventional
              potential — and let people prove what they can build.
            </p>
          </div>
        </section>

        {/* 3. WHO IT IS FOR */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-500">
              Who it&apos;s for
            </p>
            <h2 className="mb-12 text-3xl font-bold text-white sm:text-4xl">
              You don&apos;t need a degree.
              <br />
              You need a decision.
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {whoFor.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-white/10 bg-[#111111] p-4"
                >
                  <span aria-hidden className="mt-0.5 text-white">
                    →
                  </span>
                  <span className="text-sm text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. HOW AUTONOMOUS LEARNING WORKS */}
        <section className="border-t border-white/10 bg-[#111111] px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-500">
              How autonomous learning works
            </p>
            <h2 className="mb-12 text-3xl font-bold text-white sm:text-4xl">
              You progress by proving it —
              <br />
              not by attending.
            </h2>
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {learningLoop.map((item, i) => (
                <li
                  key={item.step}
                  className="rounded-lg border border-white/10 p-5"
                >
                  <span className="text-xs uppercase tracking-wider text-gray-600">
                    Step {i + 1}
                  </span>
                  <p className="mt-2 font-semibold text-white">{item.step}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    {item.desc}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-8 max-w-2xl text-sm leading-relaxed text-gray-500">
              There is no &ldquo;Mark as complete&rdquo; button. A lesson is
              complete only when its required checkpoint passes.{" "}
              <Link
                href="/how-it-works"
                className="rounded-sm text-gray-300 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                See how it works
              </Link>
              .
            </p>
          </div>
        </section>

        {/* 5. FIVE-LEVEL CURRICULUM PREVIEW */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-500">
              The curriculum
            </p>
            <h2 className="mb-12 text-3xl font-bold text-white sm:text-4xl">
              5 levels. Real skills.
              <br />
              One verified project you built yourself.
            </h2>
            <div className="space-y-3">
              {curriculum.map((module) => (
                <div
                  key={module.slug}
                  className="flex gap-6 rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
                >
                  <div className="w-20 shrink-0">
                    <span className="text-xs uppercase tracking-wider text-gray-600">
                      Level {module.level}
                    </span>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-white">
                      {module.title}
                    </p>
                    <p className="text-sm leading-relaxed text-gray-500">
                      {module.objective}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/curriculum"
                className="rounded-sm text-sm text-gray-300 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                View the full curriculum
              </Link>
            </div>
          </div>
        </section>

        {/* 6. AUTOMATED EXERCISES + 7. GITHUB PROJECTS (format) */}
        <section className="border-t border-white/10 bg-[#111111] px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-500">
              Format
            </p>
            <h2 className="mb-12 text-3xl font-bold text-white sm:text-4xl">
              Practical. Automated. Verifiable.
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {format.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-white/10 p-5"
                >
                  <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                    {item.label}
                  </p>
                  <p className="text-sm leading-relaxed text-gray-300">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. WHAT LEARNERS FINISH WITH */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-500">
              What you finish with
            </p>
            <h2 className="mb-12 text-3xl font-bold text-white sm:text-4xl">
              Proof, not just a promise.
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-white/10 bg-[#111111] p-4"
                >
                  <span aria-hidden className="mt-0.5 text-white">
                    ✓
                  </span>
                  <span className="text-sm text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. PRICE / APPLICATION CTA */}
        <section className="border-t border-white/10 bg-[#111111] px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-6 text-3xl font-bold text-white sm:text-5xl">
              The future belongs to builders.
            </h2>
            <p className="mb-10 text-lg text-gray-400">
              {siteConfig.recommendedDuration.label}
              <br />
              Price: {siteConfig.price.label}
            </p>
            <Link
              href={siteConfig.enrollment.apply.href}
              className="inline-block rounded-md bg-white px-10 py-5 text-lg font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {siteConfig.enrollment.apply.label}
            </Link>
            <p className="mt-4 text-xs text-gray-600">
              {siteConfig.enrollment.apply.disclaimer}
            </p>
          </div>
        </section>

        {/* 10. FAQ */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-500">
              Frequently asked questions
            </p>
            <h2 className="mb-12 text-3xl font-bold text-white sm:text-4xl">
              Honest answers.
            </h2>
            <Faq />
          </div>
        </section>
      </main>

      {/* 11. FOOTER */}
      <SiteFooter />
    </div>
  );
}
