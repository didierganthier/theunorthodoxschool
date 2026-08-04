"use client";

import Link from "next/link";
import type { PublicQuiz, QuestionResult, QuizNextAction } from "@/lib/quiz/types";

export interface QuizGradeResponse {
  quizSlug: string;
  score: number;
  passed: boolean;
  passingScore: number;
  earnedPoints: number;
  totalPoints: number;
  attemptCount: number;
  attemptsRemaining: number | null;
  results: QuestionResult[];
  nextAction: QuizNextAction;
}

/** Shows the graded outcome with per-question feedback and the next step. */
export default function QuizResults({
  quiz,
  grade,
  onRetry,
}: {
  quiz: PublicQuiz;
  grade: QuizGradeResponse;
  onRetry: () => void;
}) {
  const labels = new Map<string, string>();
  const prompts = new Map<string, string>();
  for (const question of quiz.questions) {
    prompts.set(question.id, question.prompt);
    for (const option of question.options) labels.set(option.id, option.label);
  }

  return (
    <div className="space-y-6">
      <div
        role="status"
        aria-live="polite"
        className={`rounded-xl border p-6 ${
          grade.passed
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-amber-500/40 bg-amber-500/10"
        }`}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          {grade.passed ? "Checkpoint passed" : "Not passed yet"}
        </p>
        <p className="mt-2 text-3xl font-bold text-white">{grade.score}%</p>
        <p className="mt-1 text-sm text-gray-300">
          You need {grade.passingScore}% to pass. You answered{" "}
          {grade.earnedPoints} of {grade.totalPoints} points correctly.
        </p>
        {!grade.passed && grade.attemptsRemaining !== null && (
          <p className="mt-2 text-sm text-amber-200">
            {grade.attemptsRemaining > 0
              ? `Attempts remaining: ${grade.attemptsRemaining}.`
              : "You've used all your attempts. Please contact support."}
          </p>
        )}
      </div>

      <ol className="space-y-3">
        {grade.results.map((result, i) => (
          <li
            key={result.questionId}
            className="rounded-xl border border-white/10 bg-[#111111] p-5"
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 shrink-0 text-sm font-bold ${
                  result.correct ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {result.correct ? "✓ Correct" : "✗ Incorrect"}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-white">
              {i + 1}. {prompts.get(result.questionId) ?? ""}
            </p>
            {!result.correct && (
              <p className="mt-2 text-sm text-gray-300">
                <span className="text-gray-500">Correct answer: </span>
                {result.correctAnswer
                  .map((id) => labels.get(id) ?? id)
                  .join(result.type === "ordering" ? " → " : ", ")}
              </p>
            )}
            {result.explanation && (
              <p className="mt-2 text-sm text-gray-400">{result.explanation}</p>
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        {grade.passed ? (
          grade.nextAction.type === "next-lesson" ? (
            <Link
              href={grade.nextAction.href}
              className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Continue →
            </Link>
          ) : (
            <Link
              href={
                grade.nextAction.type === "dashboard"
                  ? grade.nextAction.href
                  : "/dashboard"
              }
              className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Back to dashboard →
            </Link>
          )
        ) : grade.nextAction.type === "blocked" ? null : (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
