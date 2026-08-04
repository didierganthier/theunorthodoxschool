import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import CheckpointLearningGoal from "@/components/CheckpointLearningGoal";
import ContinueReadingButton from "@/components/ContinueReadingButton";
import Quiz from "@/components/quiz/Quiz";
import { getLesson } from "@/lib/curriculum";
import { getQuizForLesson } from "@/lib/quiz/definitions";
import { toPublicQuiz } from "@/lib/quiz/grade";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { getLearnerProgress } from "@/lib/progress";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleSlug: string; lessonSlug: string }>;
}): Promise<Metadata> {
  const { moduleSlug, lessonSlug } = await params;
  const found = getLesson(moduleSlug, lessonSlug);
  if (!found) return { title: "Lesson not found" };
  return {
    title: found.lesson.title,
    description: found.lesson.objective,
    robots: { index: false, follow: false },
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ moduleSlug: string; lessonSlug: string }>;
}) {
  const { moduleSlug, lessonSlug } = await params;
  const found = getLesson(moduleSlug, lessonSlug);
  if (!found) notFound();

  const { module, lesson, index } = found;

  const configured = isSupabaseConfigured();
  let userId: string | null = null;
  if (configured) {
    const user = await getCurrentUser();
    if (!user) redirect(`/login?next=/learn/${moduleSlug}/${lessonSlug}`);
    userId = user.id;
  }

  const progress = await getLearnerProgress(userId);
  const level = progress.levels.find((l) => l.module.slug === module.slug);
  if (level?.state === "locked") redirect("/learn");

  const lessonKey = `${module.slug}/${lesson.slug}`;
  const completed = progress.completed.has(lessonKey);

  // Gate access: previous lesson must be complete (unless Supabase is off, so
  // the foundation stays reviewable, or the lesson is already completed).
  const prevLesson = index > 0 ? module.lessons[index - 1] : null;
  const prevDone =
    !prevLesson || progress.completed.has(`${module.slug}/${prevLesson.slug}`);
  if (configured && !completed && !prevDone) {
    redirect(`/learn/${module.slug}`);
  }

  // Preload a previously saved learning-goal answer to prefill the checkpoint.
  let savedAnswers: Record<string, string> | undefined;
  if (configured && userId && lesson.checkpoint?.kind === "learning-goal") {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from("exercise_attempts")
        .select("payload")
        .eq("user_id", userId)
        .eq("module_slug", module.slug)
        .eq("lesson_slug", lesson.slug)
        .eq("passed", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.payload && typeof data.payload === "object") {
        savedAnswers = data.payload as Record<string, string>;
      }
    }
  }

  const nextLesson =
    index < module.lessons.length - 1 ? module.lessons[index + 1] : null;

  // Build the answer-free public quiz for quiz checkpoints. The answer key
  // never leaves the server.
  const quizDef =
    lesson.checkpoint?.kind === "quiz"
      ? getQuizForLesson(module.slug, lesson.slug)
      : null;
  const publicQuiz = quizDef ? toPublicQuiz(quizDef) : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-sans text-[#ededed]">
      <SiteNav />
      <main id="main" className="flex-1 px-6 pb-24 pt-32">
        <article className="mx-auto max-w-2xl">
          <Link
            href={`/learn/${module.slug}`}
            className="rounded-sm text-sm text-gray-500 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            ← Level {module.level}: {module.title}
          </Link>

          <header className="mt-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>Lesson {index + 1} of {module.lessons.length}</span>
              <span aria-hidden>•</span>
              <span>{lesson.estimatedMinutes} min</span>
              {completed && (
                <>
                  <span aria-hidden>•</span>
                  <span className="text-emerald-300">✓ Completed</span>
                </>
              )}
            </div>
            <h1 className="mt-3 text-4xl font-bold text-white">{lesson.title}</h1>
            <p className="mt-4 text-lg text-gray-400">{lesson.objective}</p>
          </header>

          {/* Content blocks */}
          {lesson.content && lesson.content.length > 0 && (
            <div className="mt-10 space-y-5">
              {lesson.content.map((block, i) => {
                if (block.type === "heading") {
                  return (
                    <h2 key={i} className="pt-2 text-xl font-bold text-white">
                      {block.text}
                    </h2>
                  );
                }
                if (block.type === "list") {
                  return (
                    <ul key={i} className="list-disc space-y-2 pl-5 text-gray-300">
                      {block.items.map((item, j) => (
                        <li key={j} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={i} className="leading-relaxed text-gray-300">
                    {block.text}
                  </p>
                );
              })}
            </div>
          )}

          {/* Key ideas */}
          {lesson.keyIdeas && lesson.keyIdeas.length > 0 && (
            <section className="mt-10 rounded-xl border border-white/10 bg-[#111111] p-6">
              <h2 className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Key ideas
              </h2>
              <ul className="mt-4 space-y-2 text-gray-300">
                {lesson.keyIdeas.map((idea, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed">
                    <span aria-hidden className="text-gray-600">
                      —
                    </span>
                    <span>{idea}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Example */}
          {lesson.example && (
            <section className="mt-6">
              <h2 className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Example
              </h2>
              <p className="mt-3 leading-relaxed text-gray-400">{lesson.example}</p>
            </section>
          )}

          {/* Practice */}
          {lesson.practice && (
            <section className="mt-6">
              <h2 className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Practice
              </h2>
              <p className="mt-3 leading-relaxed text-gray-400">
                {lesson.practice}
              </p>
            </section>
          )}

          {/* Checkpoint */}
          {lesson.checkpoint?.kind === "learning-goal" && (
            <section className="mt-12 border-t border-white/10 pt-10">
              <h2 className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Checkpoint
              </h2>
              <h3 className="mt-3 text-2xl font-bold text-white">
                {lesson.checkpoint.title}
              </h3>
              <p className="mt-3 leading-relaxed text-gray-400">
                {lesson.checkpoint.description}
              </p>
              <div className="mt-8">
                <CheckpointLearningGoal
                  moduleSlug={module.slug}
                  lessonSlug={lesson.slug}
                  checkpointSlug={lesson.checkpoint.slug}
                  fields={lesson.checkpoint.fields ?? []}
                  initialValues={savedAnswers}
                  alreadyPassed={completed}
                />
              </div>
            </section>
          )}

          {/* Quiz checkpoint */}
          {lesson.checkpoint?.kind === "quiz" && publicQuiz && (
            <section className="mt-12 border-t border-white/10 pt-10">
              <h2 className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Checkpoint
              </h2>
              <div className="mt-6">
                <Quiz
                  quiz={publicQuiz}
                  moduleSlug={module.slug}
                  lessonSlug={lesson.slug}
                  alreadyPassed={completed}
                />
              </div>
            </section>
          )}

          {/* Lessons without an interactive checkpoint complete by continuing */}
          {!lesson.checkpoint && (
            <section className="mt-12 border-t border-white/10 pt-8">
              <p className="text-sm text-gray-500">
                This is a reading lesson. Read it, do the practice, then confirm
                you have read it to unlock the next lesson.
              </p>
              <ContinueReadingButton
                moduleSlug={module.slug}
                lessonSlug={lesson.slug}
                nextHref={
                  nextLesson
                    ? `/learn/${module.slug}/${nextLesson.slug}`
                    : "/dashboard"
                }
                alreadyCompleted={completed}
              />
            </section>
          )}

          {/* Prev / next navigation */}
          <nav
            className="mt-12 flex items-center justify-between border-t border-white/10 pt-6"
            aria-label="Lesson navigation"
          >
            {prevLesson ? (
              <Link
                href={`/learn/${module.slug}/${prevLesson.slug}`}
                className="rounded-sm text-sm text-gray-400 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                ← {prevLesson.title}
              </Link>
            ) : (
              <span />
            )}
            {nextLesson ? (
              <Link
                href={`/learn/${module.slug}/${nextLesson.slug}`}
                className="rounded-sm text-right text-sm text-gray-400 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                {nextLesson.title} →
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-sm text-right text-sm text-gray-400 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Back to dashboard →
              </Link>
            )}
          </nav>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
