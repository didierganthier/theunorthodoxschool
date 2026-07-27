import { faqItems } from "@/lib/faq";

/**
 * Accessible FAQ using native <details>/<summary> — keyboard operable and
 * works without JavaScript. Accepts an optional subset of items.
 */
export default function Faq({ items = faqItems }: { items?: typeof faqItems }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-lg border border-white/10 bg-[#111111] px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-sm">
            {item.question}
            <span
              aria-hidden
              className="text-gray-500 transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
