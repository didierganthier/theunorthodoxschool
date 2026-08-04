/**
 * Quiz checkpoint types — shared between server and client.
 *
 * IMPORTANT: The PUBLIC types (sent to the browser) never contain correct
 * answers or explanations. Grading is authoritative on the server. The answer
 * key types live here for typing the server-only definitions, but the actual
 * answer DATA lives in a `server-only` module.
 */

export type QuizQuestionType = "single-choice" | "multiple-choice" | "ordering";

export interface QuizOption {
  /** Stable identifier used for grading; never reordered semantics. */
  id: string;
  label: string;
}

// ── Public shapes (safe to send to the browser) ────────────────────────────

export interface PublicQuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  /**
   * Options to render. For single/multiple-choice these are selectable answers.
   * For ordering these are the items to arrange into the correct sequence.
   * Order here may be randomized by the server; grade by `id`, not position.
   */
  options: QuizOption[];
  points: number;
  /** How many options to choose (multiple-choice only), for UI guidance. */
  selectCount?: number;
  /** Optional pointer back to the lesson concept being tested. */
  lessonRefHint?: string;
}

export interface PublicQuiz {
  slug: string;
  title: string;
  description?: string;
  /** Passing score as a percentage (0–100). */
  passingScore: number;
  /** null = unlimited attempts. */
  maxAttempts: number | null;
  questions: PublicQuizQuestion[];
}

// ── Answer-key shapes (server only — imported by a `server-only` module) ────

export interface AnswerKeyQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  /** Canonical option order (before any shuffling). */
  options: QuizOption[];
  /**
   * Correct answer(s), as option ids:
   *   - single-choice: exactly one id
   *   - multiple-choice: one or more ids (order irrelevant)
   *   - ordering: the ids in their correct sequence
   */
  correct: string[];
  explanation: string;
  points: number;
  lessonRefHint?: string;
  /** Shuffle options when presenting (default true). */
  shuffleOptions?: boolean;
}

export interface QuizDefinition {
  slug: string;
  title: string;
  description?: string;
  passingScore: number;
  maxAttempts: number | null;
  moduleSlug: string;
  lessonSlug: string;
  questions: AnswerKeyQuestion[];
}

// ── Grading result shapes ──────────────────────────────────────────────────

export type QuizAnswerMap = Record<string, string[]>;

export interface QuestionResult {
  questionId: string;
  type: QuizQuestionType;
  correct: boolean;
  awardedPoints: number;
  maxPoints: number;
  explanation: string;
  /** The correct answer, revealed only in the graded response. */
  correctAnswer: string[];
  lessonRefHint?: string;
}

export type QuizNextAction =
  | { type: "next-lesson"; href: string }
  | { type: "dashboard"; href: string }
  | { type: "retry" }
  | { type: "blocked" };

export interface QuizGrade {
  quizSlug: string;
  earnedPoints: number;
  totalPoints: number;
  /** Score as a percentage (0–100), rounded. */
  score: number;
  passingScore: number;
  passed: boolean;
  results: QuestionResult[];
}
