import { NextResponse, type NextRequest } from "next/server";
import { getLesson } from "@/lib/curriculum";
import { getQuizForLesson } from "@/lib/quiz/definitions";
import { gradeQuiz, answersMatchQuiz } from "@/lib/quiz/grade";
import type { QuizAnswerMap, QuizNextAction } from "@/lib/quiz/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getLearnerProgress } from "@/lib/progress";

/**
 * Grades a quiz checkpoint submission server-side and records progress.
 *
 * The server is authoritative: it verifies the lesson, the learner's access,
 * that the quiz belongs to the lesson, and the submitted question ids — then
 * grades, stores the attempt, and (on pass) unlocks the next lesson through the
 * existing lesson_progress progression.
 */
export async function POST(request: NextRequest) {
  let body: {
    moduleSlug?: string;
    lessonSlug?: string;
    quizSlug?: string;
    answers?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const { moduleSlug, lessonSlug, quizSlug, answers } = body;
  if (!moduleSlug || !lessonSlug || !quizSlug || typeof answers !== "object" || answers === null) {
    return NextResponse.json(
      { message: "Missing required fields." },
      { status: 400 },
    );
  }

  // The lesson must exist and be a quiz checkpoint.
  const found = getLesson(moduleSlug, lessonSlug);
  if (!found || found.lesson.checkpoint?.kind !== "quiz") {
    return NextResponse.json(
      { message: "This quiz is not available." },
      { status: 404 },
    );
  }

  // The quiz must belong to THIS lesson (prevents cross-lesson submissions).
  const def = getQuizForLesson(moduleSlug, lessonSlug);
  if (!def || def.slug !== quizSlug) {
    return NextResponse.json(
      { message: "This quiz does not match the lesson." },
      { status: 400 },
    );
  }

  // Normalize answers to string[] per question and reject unknown ids.
  const normalized: QuizAnswerMap = {};
  for (const [key, value] of Object.entries(answers)) {
    if (Array.isArray(value)) {
      normalized[key] = value.filter((v): v is string => typeof v === "string");
    } else if (typeof value === "string") {
      normalized[key] = [value];
    } else {
      normalized[key] = [];
    }
  }
  if (!answersMatchQuiz(def, normalized)) {
    return NextResponse.json(
      { message: "Your answers don't match this quiz. Please reload and retry." },
      { status: 400 },
    );
  }

  // Authentication + persistence are required to record an official attempt.
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { message: "Quizzes are temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Quizzes are temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { message: "Please sign in to submit this quiz." },
      { status: 401 },
    );
  }

  // Access gating: the level must be unlocked and the previous lesson complete.
  const progress = await getLearnerProgress(user.id);
  const level = progress.levels.find((l) => l.module.slug === moduleSlug);
  if (!level || level.state === "locked") {
    return NextResponse.json(
      { message: "This lesson is locked." },
      { status: 403 },
    );
  }
  const prevLesson =
    found.index > 0 ? found.module.lessons[found.index - 1] : null;
  const prevDone =
    !prevLesson || progress.completed.has(`${moduleSlug}/${prevLesson.slug}`);
  if (!prevDone) {
    return NextResponse.json(
      { message: "Complete the previous lesson first." },
      { status: 403 },
    );
  }

  // Enforce a maximum-attempts limit if configured.
  const { data: existing } = await supabase
    .from("lesson_progress")
    .select("attempt_count, completed_at")
    .eq("user_id", user.id)
    .eq("module_slug", moduleSlug)
    .eq("lesson_slug", lessonSlug)
    .maybeSingle();

  const priorAttempts = (existing?.attempt_count as number | undefined) ?? 0;
  const alreadyPassed = Boolean(existing?.completed_at);

  if (
    def.maxAttempts !== null &&
    !alreadyPassed &&
    priorAttempts >= def.maxAttempts
  ) {
    return NextResponse.json(
      {
        message:
          "You've reached the maximum number of attempts for this quiz. Please contact support.",
        blocked: true,
      },
      { status: 403 },
    );
  }

  // Grade server-side.
  const grade = gradeQuiz(def, normalized);

  // Record the attempt (never log applicant/learner free-text needlessly).
  await supabase.from("exercise_attempts").insert({
    user_id: user.id,
    module_slug: moduleSlug,
    lesson_slug: lessonSlug,
    checkpoint_slug: def.slug,
    payload: { answers: normalized, score: grade.score, passed: grade.passed },
    passed: grade.passed,
    score: grade.earnedPoints,
    max_score: grade.totalPoints,
  });

  // Atomically increment attempt_count and set completion on the first pass.
  const { data: progressRow } = await supabase.rpc("record_lesson_attempt", {
    p_module_slug: moduleSlug,
    p_lesson_slug: lessonSlug,
    p_passed: grade.passed,
  });

  const attemptCount =
    (progressRow?.attempt_count as number | undefined) ?? priorAttempts + 1;
  const attemptsRemaining =
    def.maxAttempts === null ? null : Math.max(0, def.maxAttempts - attemptCount);

  const nextLesson =
    found.index < found.module.lessons.length - 1
      ? found.module.lessons[found.index + 1]
      : null;

  let nextAction: QuizNextAction;
  if (grade.passed) {
    nextAction = nextLesson
      ? { type: "next-lesson", href: `/learn/${moduleSlug}/${nextLesson.slug}` }
      : { type: "dashboard", href: "/dashboard" };
  } else if (attemptsRemaining === 0) {
    nextAction = { type: "blocked" };
  } else {
    nextAction = { type: "retry" };
  }

  return NextResponse.json({
    quizSlug: def.slug,
    score: grade.score,
    passed: grade.passed,
    passingScore: grade.passingScore,
    earnedPoints: grade.earnedPoints,
    totalPoints: grade.totalPoints,
    attemptCount,
    attemptsRemaining,
    results: grade.results,
    nextAction,
  });
}
