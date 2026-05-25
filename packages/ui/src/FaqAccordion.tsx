"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-[var(--color-text)]"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              {item.question}
              <span className="text-[var(--color-text-muted)]">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <p className="border-t border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
                {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
