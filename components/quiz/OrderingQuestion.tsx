"use client";

import type { PublicQuizQuestion } from "@/lib/quiz/types";

/**
 * Ordering question using Move up / Move down buttons rather than drag-and-drop,
 * so it works with keyboards, screen readers, and touch devices.
 */
export default function OrderingQuestion({
  question,
  index,
  value,
  onChange,
  disabled,
}: {
  question: PublicQuizQuestion;
  index: number;
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const labels = new Map(question.options.map((o) => [o.id, o.label]));

  function move(position: number, delta: number) {
    const target = position + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[position], next[target]] = [next[target], next[position]];
    onChange(next);
  }

  return (
    <fieldset className="rounded-xl border border-white/10 bg-[#111111] p-5">
      <legend className="px-1 text-base font-semibold text-white">
        {index}. {question.prompt}
      </legend>
      <p className="mt-1 px-1 text-xs text-gray-500">
        Put the steps in the correct order.
      </p>
      <ol className="mt-4 space-y-2">
        {value.map((id, position) => {
          const label = labels.get(id) ?? id;
          return (
            <li
              key={id}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3 text-sm text-gray-200"
            >
              <span
                className="w-6 shrink-0 text-center font-mono text-gray-500"
                aria-hidden="true"
              >
                {position + 1}
              </span>
              <span className="flex-1">
                <span className="sr-only">
                  Position {position + 1} of {value.length}:{" "}
                </span>
                {label}
              </span>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  disabled={disabled || position === 0}
                  onClick={() => move(position, -1)}
                  aria-label={`Move "${label}" up`}
                  className="rounded-md border border-white/15 px-2 py-1 text-white transition-colors hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <span aria-hidden="true">↑</span>
                </button>
                <button
                  type="button"
                  disabled={disabled || position === value.length - 1}
                  onClick={() => move(position, 1)}
                  aria-label={`Move "${label}" down`}
                  className="rounded-md border border-white/15 px-2 py-1 text-white transition-colors hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <span aria-hidden="true">↓</span>
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </fieldset>
  );
}
