import "server-only";

import type { QuizDefinition } from "./types";

/**
 * SERVER-ONLY quiz definitions, including correct answers and explanations.
 *
 * The `server-only` import guarantees this module can never be bundled into
 * client code. Client components receive an answer-free `PublicQuiz` produced by
 * `toPublicQuiz()`; grading happens on the server.
 */

const autonomousLearningQuiz: QuizDefinition = {
  slug: "level-0-autonomous-learning",
  title: "Checkpoint: How autonomous learning works",
  description:
    "A quick check that the core ideas of autonomous learning are clear. You can retry as many times as you need.",
  passingScore: 80,
  maxAttempts: null,
  moduleSlug: "level-0-orientation",
  lessonSlug: "how-autonomous-learning-works",
  questions: [
    {
      id: "q-complete",
      type: "single-choice",
      prompt: "What marks a lesson as complete in this program?",
      options: [
        { id: "button", label: 'Clicking a "Mark complete" button' },
        { id: "checkpoint", label: "Passing the lesson's required checkpoint" },
        { id: "time", label: "Spending enough time on the page" },
        { id: "video", label: "Watching a video to the end" },
      ],
      correct: ["checkpoint"],
      explanation:
        "There is no manual complete button. A lesson is complete only when its checkpoint passes — that keeps progress honest.",
      points: 1,
      lessonRefHint: "Completion is proven by a checkpoint, not self-declared.",
    },
    {
      id: "q-retry",
      type: "single-choice",
      prompt:
        "You submit a checkpoint and do not pass. What can you do next?",
      options: [
        { id: "permanent", label: "Nothing — the lesson is failed permanently" },
        { id: "review-retry", label: "Review what you missed and try again" },
        { id: "skip", label: "Skip ahead to the next lesson anyway" },
        { id: "wait", label: "Wait 24 hours before the lesson reopens" },
      ],
      correct: ["review-retry"],
      explanation:
        "Retrying after reviewing is a normal part of the loop — getting something wrong is expected, not a failure.",
      points: 1,
      lessonRefHint: "Learners may retry checkpoints.",
    },
    {
      id: "q-unlock",
      type: "single-choice",
      prompt: "When does the next lesson unlock?",
      options: [
        { id: "days", label: "After a fixed number of days" },
        { id: "approval", label: "When an instructor manually approves it" },
        { id: "pass", label: "After you pass the current lesson's checkpoint" },
        { id: "always", label: "Immediately — lessons are never locked" },
      ],
      correct: ["pass"],
      explanation:
        "Progress is gated by checkpoints: passing the current lesson unlocks the next one.",
      points: 1,
      lessonRefHint: "The next lesson unlocks after passing.",
    },
    {
      id: "q-ai-feedback",
      type: "single-choice",
      prompt:
        "An AI tool gives you feedback on your work. What is the right approach?",
      options: [
        { id: "trust-all", label: "Trust it completely without checking" },
        { id: "ignore", label: "Ignore all AI feedback on principle" },
        {
          id: "verify",
          label: "Use it, but verify it against the lesson and the requirements",
        },
        { id: "only-pass", label: "Trust it only when it says you passed" },
      ],
      correct: ["verify"],
      explanation:
        "AI feedback is useful but not automatically correct — you still verify it against the lesson and the actual requirements.",
      points: 1,
      lessonRefHint: "AI feedback must still be verified.",
    },
    {
      id: "q-true-statements",
      type: "multiple-choice",
      prompt: "Which of the following are true about this program? Select all that apply.",
      options: [
        { id: "no-standards", label: "Self-paced means there are no standards to meet" },
        { id: "checkpoints-progress", label: "Checkpoints determine real progress" },
        { id: "can-retry", label: "You can retry checkpoints" },
        { id: "admin-help", label: "Administrative help exists for platform problems" },
        { id: "attendance", label: "Passing is based on attendance or time spent" },
      ],
      correct: ["checkpoints-progress", "can-retry", "admin-help"],
      explanation:
        "Self-paced still has standards. Progress is proven by checkpoints, retries are allowed, and admin support exists for platform issues — but time spent alone never earns a pass.",
      points: 1,
      lessonRefHint:
        "Self-paced ≠ no standards; checkpoints, retries, and admin help all apply.",
    },
    {
      id: "q-loop-order",
      type: "ordering",
      prompt: "Put the learning loop in the correct order, from first to last.",
      options: [
        { id: "learn", label: "Learn" },
        { id: "practice", label: "Practice" },
        { id: "submit", label: "Submit" },
        { id: "feedback", label: "Feedback" },
        { id: "correct", label: "Correct" },
        { id: "pass", label: "Pass" },
      ],
      correct: ["learn", "practice", "submit", "feedback", "correct", "pass"],
      explanation:
        "The loop is: learn → practice → submit → feedback → correct → pass. Passing then unlocks the next lesson.",
      points: 1,
      lessonRefHint: "The loop: learn, practice, submit, feedback, correct, pass.",
    },
  ],
};

const QUIZZES: QuizDefinition[] = [autonomousLearningQuiz];

const bySlug = new Map(QUIZZES.map((q) => [q.slug, q]));
const byLesson = new Map(
  QUIZZES.map((q) => [`${q.moduleSlug}/${q.lessonSlug}`, q]),
);

export function getQuizBySlug(slug: string): QuizDefinition | undefined {
  return bySlug.get(slug);
}

export function getQuizForLesson(
  moduleSlug: string,
  lessonSlug: string,
): QuizDefinition | undefined {
  return byLesson.get(`${moduleSlug}/${lessonSlug}`);
}
