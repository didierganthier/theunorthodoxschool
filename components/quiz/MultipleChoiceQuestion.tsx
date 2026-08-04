"use client";

import type { PublicQuizQuestion } from "@/lib/quiz/types";

/** Multiple-choice question: an accessible checkbox group inside a fieldset. */
export default function MultipleChoiceQuestion({
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

  function toggle(optionId: string) {
    if (value.includes(optionId)) {
      onChange(value.filter((id) => id !== optionId));
    } else {
      onChange([...value, optionId]);
    }
  }

  return (
    <fieldset
      className="rounded-xl border border-white/10 bg-[#111111] p-5"
      aria-describedby={invalid ? errorId : undefined}
    >
      <legend className="px-1 text-base font-semibold text-white">
        {index}. {question.prompt}
      </legend>
      <p className="mt-1 px-1 text-xs text-gray-500">
        Select all that apply
        {question.selectCount ? ` (${question.selectCount} correct).` : "."}
      </p>
      <div className="mt-4 space-y-2">
        {question.options.map((option) => {
          const selected = value.includes(option.id);
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
                type="checkbox"
                name={`${question.id}-${option.id}`}
                value={option.id}
                checked={selected}
                disabled={disabled}
                onChange={() => toggle(option.id)}
                className="h-4 w-4 shrink-0 accent-white"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      {invalid && (
        <p id={errorId} className="mt-3 text-sm text-amber-300">
          Please select at least one answer.
        </p>
      )}
    </fieldset>
  );
}
