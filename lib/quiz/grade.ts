/**
 * Pure quiz utilities: build the public (answer-free) quiz for the browser and
 * grade a submission server-side. No I/O and no `server-only` marker so these
 * functions can be unit-tested directly.
 */

import type {
  AnswerKeyQuestion,
  PublicQuiz,
  PublicQuizQuestion,
  QuizAnswerMap,
  QuizDefinition,
  QuizGrade,
  QuestionResult,
} from "./types";

/** Fisher–Yates shuffle returning a new array. `rng` is injectable for tests. */
function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toPublicQuestion(
  q: AnswerKeyQuestion,
  rng: () => number = Math.random,
): PublicQuizQuestion {
  const shouldShuffle = q.shuffleOptions ?? true;
  let options = q.options;

  if (shouldShuffle && options.length > 1) {
    options = shuffle(options, rng);
    // For ordering questions, ensure the presented order is not already the
    // correct order (otherwise there is nothing to solve).
    if (q.type === "ordering") {
      const correctOrder = q.correct.join("|");
      let guard = 0;
      while (options.map((o) => o.id).join("|") === correctOrder && guard < 8) {
        options = shuffle(q.options, rng);
        guard += 1;
      }
    }
  }

  return {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    options,
    points: q.points,
    lessonRefHint: q.lessonRefHint,
    selectCount: q.type === "multiple-choice" ? q.correct.length : undefined,
  };
}

/** Strips correct answers + explanations and (optionally) randomizes options. */
export function toPublicQuiz(
  def: QuizDefinition,
  rng: () => number = Math.random,
): PublicQuiz {
  return {
    slug: def.slug,
    title: def.title,
    description: def.description,
    passingScore: def.passingScore,
    maxAttempts: def.maxAttempts,
    questions: def.questions.map((q) => toPublicQuestion(q, rng)),
  };
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const v of b) if (!sa.has(v)) return false;
  return true;
}

function sameOrder(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function isQuestionCorrect(q: AnswerKeyQuestion, submitted: string[]): boolean {
  const clean = submitted.filter((v) => typeof v === "string");
  switch (q.type) {
    case "single-choice":
      return clean.length === 1 && clean[0] === q.correct[0];
    case "multiple-choice":
      return sameSet(clean, q.correct);
    case "ordering":
      return sameOrder(clean, q.correct);
    default:
      return false;
  }
}

/**
 * Grades a submission. All-or-nothing per question. Ignores any submitted keys
 * that are not part of the quiz; missing answers simply score zero.
 */
export function gradeQuiz(def: QuizDefinition, answers: QuizAnswerMap): QuizGrade {
  const results: QuestionResult[] = def.questions.map((q) => {
    const submitted = Array.isArray(answers[q.id]) ? answers[q.id] : [];
    const correct = isQuestionCorrect(q, submitted);
    return {
      questionId: q.id,
      type: q.type,
      correct,
      awardedPoints: correct ? q.points : 0,
      maxPoints: q.points,
      explanation: q.explanation,
      correctAnswer: q.correct,
      lessonRefHint: q.lessonRefHint,
    };
  });

  const earnedPoints = results.reduce((s, r) => s + r.awardedPoints, 0);
  const totalPoints = def.questions.reduce((s, q) => s + q.points, 0);
  const score = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);

  return {
    quizSlug: def.slug,
    earnedPoints,
    totalPoints,
    score,
    passingScore: def.passingScore,
    passed: score >= def.passingScore,
    results,
  };
}

/** True when every submitted key corresponds to a real question in the quiz. */
export function answersMatchQuiz(
  def: QuizDefinition,
  answers: QuizAnswerMap,
): boolean {
  const ids = new Set(def.questions.map((q) => q.id));
  return Object.keys(answers).every((k) => ids.has(k));
}
