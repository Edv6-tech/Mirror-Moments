'use client';

import React, { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[14px] font-semibold text-[var(--ink-900)]">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            id={inputId}
            ref={ref}
            type={computedType}
            className={clsx(
              'w-full h-[52px] px-4 rounded-[16px] bg-white text-[15px] text-[var(--ink-900)]',
              'border transition-colors duration-200 outline-none',
              error
                ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-2 focus:ring-[var(--danger)]/20'
                : 'border-[var(--line)] focus:border-[var(--blue-500)] focus:ring-4 focus:ring-[var(--sky-400)]/20',
              isPassword && 'pr-12',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[var(--ink-500)] hover:text-[var(--ink-900)] transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-400)]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error ? (
          <div className="flex items-center gap-1.5 text-[13px] text-[var(--danger)] mt-0.5">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <div className="text-[13px] text-[var(--ink-500)] mt-0.5">{helperText}</div>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
