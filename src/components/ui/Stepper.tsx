'use client';

import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

export interface StepItem {
  id: number;
  label: string;
}

export interface StepperProps {
  steps?: StepItem[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

const DEFAULT_STEPS: StepItem[] = [
  { id: 1, label: 'Upload dress' },
  { id: 2, label: 'Lift dress' },
  { id: 3, label: 'Your photo' },
  { id: 4, label: 'See yourself' },
];

export const Stepper: React.FC<StepperProps> = ({
  steps = DEFAULT_STEPS,
  currentStep = 1,
  onStepClick,
  className,
}) => {
  const currentStepItem = steps.find((s) => s.id === currentStep) || steps[0];

  return (
    <nav aria-label="Studio progress" className={clsx('w-full', className)}>
      {/* Mobile Compact View */}
      <div className="flex sm:hidden flex-col items-center gap-1.5 py-2">
        <div className="text-[14px] font-semibold text-white/90">
          Step {currentStep} of {steps.length} ·{' '}
          <span className="text-[var(--sky-400)] font-bold">{currentStepItem.label}</span>
        </div>
        <div className="w-full max-w-[200px] h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-dashboard-gradient rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Four-Node Stepper */}
      <div className="hidden sm:flex items-center justify-between relative max-w-xl mx-auto py-4">
        {/* Thread line behind nodes */}
        <div className="absolute top-[28px] left-[32px] right-[32px] h-[2px] bg-white/20 -translate-y-1/2 z-0">
          <div
            className="h-full bg-[var(--blue-500)] transition-all duration-300"
            style={{
              width: `${((Math.max(1, currentStep) - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Nodes */}
        {steps.map((step) => {
          const isDone = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;

          return (
            <div
              key={step.id}
              onClick={() => onStepClick?.(step.id)}
              className={clsx(
                'relative z-10 flex flex-col items-center group',
                onStepClick && 'cursor-pointer'
              )}
            >
              {/* Circle Node */}
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] transition-all duration-300',
                  isDone && 'bg-dashboard-gradient text-white shadow-md',
                  isCurrent &&
                    'bg-white text-[var(--blue-700)] ring-4 ring-[var(--sky-400)]/60 shadow-[var(--shadow-glow)] scale-110',
                  isUpcoming && 'bg-[var(--navy-900)] text-white/40 border-2 border-white/30'
                )}
              >
                {isDone ? <Check size={16} strokeWidth={2.5} /> : step.id}
              </div>

              {/* Label */}
              <span
                className={clsx(
                  'text-[12px] font-semibold mt-2 select-none tracking-wide transition-colors',
                  isCurrent ? 'text-white' : isDone ? 'text-white/80' : 'text-white/40'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
};
