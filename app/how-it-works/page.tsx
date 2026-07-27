import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How autonomous learning works at The Unorthodox School: learn, practice, submit, get feedback, correct, pass, and unlock the next lesson.",
  alternates: { canonical: "/how-it-works" },
};

const loop = [
  { step: "Learn", desc: "Read a short, focused lesson you can finish in one sitting." },
  { step: "Practice", desc: "Try the idea yourself with a hands-on activity." },
  { step: "Submit", desc: "Complete the lesson's required checkpoint." },
  { step: "Receive feedback", desc: "Get an immediate, automatic result." },
  { step: "Correct mistakes", desc: "Review what you missed and try again." },
  { step: "Pass the checkpoint", desc: "Meet the requirement to prove you're ready." },
  { step: "Unlock the next lesson", desc: "The next lesson opens automatically." },
];

const exerciseTypes = [
  { name: "Knowledge quizzes", desc: "Quick checks that you understood the core ideas." },
  { name: "Structured written exercises", desc: "Short written responses with minimum-quality requirements." },
  { name: "Interactive browser exercises", desc: "Hands-on activities completed right in your browser." },
  { name: "GitHub assignments", desc: "Real technical work completed in a verified repository." },
  { name: "Deployment checks", desc: "Confirmation that your project builds and publishes correctly." },
  { name: "Reflections", desc: "Short reflections that help you consolidate what you learned." },
];

const supportReasons = [
  "Account problems",
  "Technical problems",
  "Payment issues",
  "Incorrect automatic evaluations",
  "Appeals",
  "Abuse reports",
];

export default function HowItWorksPage() {
  return (
    <div className="bg-[#0a0a0a] font-sans text-[#ededed]">
      <SiteNav />

      <main id="main" className="px-6 pb-24 pt-32">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-500">
            How it works
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            You complete a lesson by proving it —
            <br />
            not by clicking a button.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
            There is no &ldquo;Mark as complete&rdquo; button anywhere in this
            program. A lesson is complete only when its required checkpoint
            passes. That keeps your progress honest and your skills real.
          </p>

          {/* The learning loop */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-white">The learning loop</h2>
            <ol className="mt-8 space-y-3">
              {loop.map((item, i) => (
                <li
                  key={item.step}
                  className="flex items-start gap-4 rounded-lg border border-white/10 bg-[#111111] p-5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-sm text-gray-400">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{item.step}</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Exercise types */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-white">Types of checkpoints</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
              Different lessons use different checkpoints. Each gives immediate,
              automatic feedback.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {exerciseTypes.map((item) => (
                <div
                  key={item.name}
                  className="rounded-lg border border-white/10 p-5"
                >
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Teachers / support */}
          <section className="mt-16 rounded-xl border border-white/10 bg-[#111111] p-8">
            <h2 className="text-2xl font-bold text-white">
              Do you need a teacher?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
              Not for everyday progression. The lessons, checkpoints, and
              automatic feedback are designed to move you forward on your own.
              Administrative support remains available for:
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {supportReasons.map((reason) => (
                <li
                  key={reason}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <span aria-hidden className="mt-0.5 text-gray-600">
                    •
                  </span>
                  {reason}
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-14 text-center">
            <Link
              href="/apply"
              className="inline-block rounded-md bg-white px-8 py-4 text-base font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Start Learning
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
