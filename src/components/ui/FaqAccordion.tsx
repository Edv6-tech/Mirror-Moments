'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqAccordionProps {
  items: FaqItem[];
  className?: string;
}

export function FaqAccordion({ items, className }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={clsx('space-y-3', className)}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={clsx(
              'rounded-[16px] border transition-all duration-200 overflow-hidden bg-white',
              isOpen
                ? 'border-l-4 border-l-[var(--blue-600)] border-t-[var(--line)] border-r-[var(--line)] border-b-[var(--line)]'
                : 'border-[var(--line)]'
            )}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-[var(--ink-900)] text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-400)] rounded-[16px]"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${i}`}
              id={`faq-question-${i}`}
            >
              <span>{item.question}</span>
              <ChevronDown
                size={18}
                className={clsx(
                  'flex-shrink-0 text-[var(--ink-500)] transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </button>
            <div
              id={`faq-answer-${i}`}
              role="region"
              aria-labelledby={`faq-question-${i}`}
              className={clsx(
                'overflow-hidden transition-all duration-200',
                isOpen ? 'max-h-96' : 'max-h-0'
              )}
            >
              <p className="px-5 pb-4 text-[14px] text-[var(--ink-500)] leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
