"use client";

import type { PublicQuizQuestion } from "@/lib/quiz/types";

/** Single-choice question: an accessible radio group inside a fieldset. */
export default function SingleChoiceQuestion({
  question,
  index,
  value,
  onChange,
  disabled,
  invalid,
}: {
  question: PublicQuizQuestion;
  index: number;
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const errorId = `${question.id}-error`;
  return (
    <fieldset
      className="rounded-xl border border-white/10 bg-[#111111] p-5"
      aria-describedby={invalid ? errorId : undefined}
    >
      <legend className="px-1 text-base font-semibold text-white">
        {index}. {question.prompt}
      </legend>
      {question.lessonRefHint && (
        <p className="mt-1 px-1 text-xs text-gray-500">Choose one answer.</p>
      )}
      <div className="mt-4 space-y-2" role="radiogroup" aria-label={question.prompt}>
        {question.options.map((option) => {
          const selected = value[0] === option.id;
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                selected
                  ? "border-white bg-white/5 text-white"
                  : "border-white/10 text-gray-300 hover:border-white/30"
              } focus-within:outline-none focus-within:ring-2 focus-within:ring-white/70`}
            >
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange([option.id])}
                className="h-4 w-4 shrink-0 accent-white"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      {invalid && (
        <p id={errorId} className="mt-3 text-sm text-amber-300">
          Please choose an answer.
        </p>
      )}
    </fieldset>
  );
}
