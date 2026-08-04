"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PublicQuiz, QuizAnswerMap } from "@/lib/quiz/types";
import SingleChoiceQuestion from "./SingleChoiceQuestion";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import OrderingQuestion from "./OrderingQuestion";
import QuizResults, { type QuizGradeResponse } from "./QuizResults";

function initialAnswers(quiz: PublicQuiz): QuizAnswerMap {
  const answers: QuizAnswerMap = {};
  for (const question of quiz.questions) {
    // Ordering questions start from the (already shuffled) presented order.
    answers[question.id] =
      question.type === "ordering" ? question.options.map((o) => o.id) : [];
  }
  return answers;
}

/**
 * Client orchestrator for a quiz checkpoint. It never receives the answer key;
 * grading happens on the server, which returns per-question feedback.
 */
export default function Quiz({
  quiz,
  moduleSlug,
  lessonSlug,
  alreadyPassed,
}: {
  quiz: PublicQuiz;
  moduleSlug: string;
  lessonSlug: string;
  alreadyPassed: boolean;
}) {
  const [answers, setAnswers] = useState<QuizAnswerMap>(() =>
    initialAnswers(quiz),
  );
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grade, setGrade] = useState<QuizGradeResponse | null>(null);
  const [retaking, setRetaking] = useState(false);

  const questionNumber = useMemo(() => {
    const map = new Map<string, number>();
    quiz.questions.forEach((q, i) => map.set(q.id, i + 1));
    return map;
  }, [quiz]);

  function setAnswer(questionId: string, ids: string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: ids }));
    if (invalid.has(questionId)) {
      setInvalid((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Validate that every choice question has a selection.
    const missing = new Set<string>();
    for (const question of quiz.questions) {
      if (question.type === "ordering") continue;
      if ((answers[question.id] ?? []).length === 0) missing.add(question.id);
    }
    if (missing.size > 0) {
      setInvalid(missing);
      setError("Please answer every question before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/learn/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleSlug,
          lessonSlug,
          quizSlug: quiz.slug,
          answers,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.message ?? "Something went wrong. Please try again.");
        return;
      }
      setGrade(data as QuizGradeResponse);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    setGrade(null);
    setInvalid(new Set());
    setError(null);
  }

  if (grade) {
    return <QuizResults quiz={quiz} grade={grade} onRetry={handleRetry} />;
  }

  if (alreadyPassed && !retaking) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
          Checkpoint complete
        </p>
        <p className="mt-2 text-sm text-gray-200">
          You&apos;ve already passed this checkpoint. You can retake it to review,
          or continue to the next lesson.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Continue →
          </Link>
          <button
            type="button"
            onClick={() => setRetaking(true)}
            className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Retake quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <h2 className="text-xl font-bold text-white">{quiz.title}</h2>
        {quiz.description && (
          <p className="mt-1 text-sm text-gray-400">{quiz.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          You need {quiz.passingScore}% to pass
          {quiz.maxAttempts === null
            ? " and can retry as many times as you need."
            : `. You have up to ${quiz.maxAttempts} attempts.`}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
        >
          {error}
        </div>
      )}

      {quiz.questions.map((question) => {
        const index = questionNumber.get(question.id) ?? 0;
        const value = answers[question.id] ?? [];
        if (question.type === "single-choice") {
          return (
            <SingleChoiceQuestion
              key={question.id}
              question={question}
              index={index}
              value={value}
              onChange={(ids) => setAnswer(question.id, ids)}
              disabled={submitting}
              invalid={invalid.has(question.id)}
            />
          );
        }
        if (question.type === "multiple-choice") {
          return (
            <MultipleChoiceQuestion
              key={question.id}
              question={question}
              index={index}
              value={value}
              onChange={(ids) => setAnswer(question.id, ids)}
              disabled={submitting}
              invalid={invalid.has(question.id)}
            />
          );
        }
        return (
          <OrderingQuestion
            key={question.id}
            question={question}
            index={index}
            value={value}
            onChange={(ids) => setAnswer(question.id, ids)}
            disabled={submitting}
          />
        );
      })}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit answers"}
      </button>
    </form>
  );
}
