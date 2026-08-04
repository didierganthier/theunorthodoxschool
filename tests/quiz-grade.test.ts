import { describe, it, expect } from "vitest";
import { gradeQuiz, toPublicQuiz, answersMatchQuiz } from "@/lib/quiz/grade";
import type { QuizDefinition } from "@/lib/quiz/types";

const def: QuizDefinition = {
  slug: "test-quiz",
  title: "Test Quiz",
  passingScore: 80,
  maxAttempts: null,
  moduleSlug: "m",
  lessonSlug: "l",
  questions: [
    {
      id: "q-single",
      type: "single-choice",
      prompt: "Pick one",
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
        { id: "c", label: "C" },
      ],
      correct: ["b"],
      explanation: "B is right.",
      points: 1,
    },
    {
      id: "q-multi",
      type: "multiple-choice",
      prompt: "Pick many",
      options: [
        { id: "w", label: "W" },
        { id: "x", label: "X" },
        { id: "y", label: "Y" },
        { id: "z", label: "Z" },
      ],
      correct: ["w", "y"],
      explanation: "W and Y.",
      points: 1,
    },
    {
      id: "q-order",
      type: "ordering",
      prompt: "Order these",
      options: [
        { id: "1", label: "One" },
        { id: "2", label: "Two" },
        { id: "3", label: "Three" },
      ],
      correct: ["1", "2", "3"],
      explanation: "Ascending.",
      points: 1,
    },
  ],
};

describe("toPublicQuiz", () => {
  it("strips correct answers and explanations", () => {
    const pub = toPublicQuiz(def, () => 0.5);
    const serialized = JSON.stringify(pub);
    expect(serialized).not.toContain("correct");
    expect(serialized).not.toContain("explanation");
    expect(serialized).not.toContain("is right");
  });

  it("sets selectCount for multiple-choice questions", () => {
    const pub = toPublicQuiz(def, () => 0.5);
    const multi = pub.questions.find((q) => q.id === "q-multi");
    expect(multi?.selectCount).toBe(2);
  });

  it("does not present ordering options already in the correct order", () => {
    // A deterministic rng that would otherwise leave order unchanged still
    // triggers the guard reshuffle for ordering questions.
    const pub = toPublicQuiz(def, () => 0);
    const order = pub.questions.find((q) => q.id === "q-order");
    expect(order?.options.map((o) => o.id).join("|")).not.toBe("1|2|3");
  });

  it("preserves all option ids", () => {
    const pub = toPublicQuiz(def, () => 0.5);
    const single = pub.questions.find((q) => q.id === "q-single");
    expect(single?.options.map((o) => o.id).sort()).toEqual(["a", "b", "c"]);
  });
});

describe("gradeQuiz", () => {
  it("awards full marks for all-correct answers", () => {
    const grade = gradeQuiz(def, {
      "q-single": ["b"],
      "q-multi": ["y", "w"],
      "q-order": ["1", "2", "3"],
    });
    expect(grade.earnedPoints).toBe(3);
    expect(grade.totalPoints).toBe(3);
    expect(grade.score).toBe(100);
    expect(grade.passed).toBe(true);
  });

  it("is all-or-nothing per question", () => {
    const grade = gradeQuiz(def, {
      "q-single": ["b"],
      "q-multi": ["w"], // partial → wrong
      "q-order": ["1", "3", "2"], // wrong order
    });
    expect(grade.earnedPoints).toBe(1);
    expect(grade.score).toBe(33);
    expect(grade.passed).toBe(false);
  });

  it("marks single-choice wrong when more than one option is chosen", () => {
    const grade = gradeQuiz(def, { "q-single": ["a", "b"] });
    const r = grade.results.find((x) => x.questionId === "q-single");
    expect(r?.correct).toBe(false);
  });

  it("ignores option order for multiple-choice", () => {
    const grade = gradeQuiz(def, { "q-multi": ["y", "w"] });
    const r = grade.results.find((x) => x.questionId === "q-multi");
    expect(r?.correct).toBe(true);
  });

  it("respects option order for ordering questions", () => {
    const wrong = gradeQuiz(def, { "q-order": ["3", "2", "1"] });
    expect(wrong.results.find((x) => x.questionId === "q-order")?.correct).toBe(
      false,
    );
  });

  it("reveals the correct answer and explanation in results", () => {
    const grade = gradeQuiz(def, { "q-single": ["a"] });
    const r = grade.results.find((x) => x.questionId === "q-single");
    expect(r?.correctAnswer).toEqual(["b"]);
    expect(r?.explanation).toBe("B is right.");
    expect(r?.type).toBe("single-choice");
  });

  it("scores missing answers as zero without throwing", () => {
    const grade = gradeQuiz(def, {});
    expect(grade.earnedPoints).toBe(0);
    expect(grade.passed).toBe(false);
  });
});

describe("answersMatchQuiz", () => {
  it("accepts answers whose keys are all real question ids", () => {
    expect(answersMatchQuiz(def, { "q-single": ["b"] })).toBe(true);
    expect(answersMatchQuiz(def, {})).toBe(true);
  });

  it("rejects answers that include an unknown question id", () => {
    expect(answersMatchQuiz(def, { "q-unknown": ["b"] })).toBe(false);
  });
});
