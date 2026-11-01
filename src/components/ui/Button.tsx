'use client';

import React, { forwardRef } from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText = 'Weaving...',
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Size tokens: sm: 36px (px-5), md: 48px (px-7), lg: 56px (px-9)
    const sizeClasses = {
      sm: 'h-[36px] min-h-[44px] px-5 text-[14px]',
      md: 'h-[48px] min-h-[48px] px-7 text-[15px]',
      lg: 'h-[56px] min-h-[56px] px-9 text-[16px]',
    }[size];

    const iconSizeClasses = {
      sm: 'w-[44px] h-[44px] p-0',
      md: 'w-[48px] h-[48px] p-0',
      lg: 'w-[56px] h-[56px] p-0',
    }[size];

    // Variant tokens per B5
    const variantClasses = {
      primary: clsx(
        'bg-dashboard-gradient text-white shadow-[var(--shadow-glow)]',
        'hover:-translate-y-[2px] active:scale-[0.98] active:translate-y-0',
        'transition-all duration-200'
      ),
      secondary: clsx(
        'bg-white/70 backdrop-blur-md border-[1.5px] border-[var(--blue-500)]/40 text-[var(--blue-700)]',
        'hover:border-[var(--blue-500)] hover:bg-[var(--ice-100)] active:scale-[0.98]',
        'transition-all duration-200'
      ),
      ghost: clsx(
        'bg-transparent text-[var(--blue-700)] relative group',
        'hover:text-[var(--blue-600)] active:scale-[0.98]',
        'after:content-[""] after:absolute after:bottom-[8px] after:left-5 after:right-5 after:h-[1.5px] after:bg-[var(--blue-700)] after:scale-x-0 after:origin-left group-hover:after:scale-x-100 after:transition-transform after:duration-200'
      ),
      icon: clsx(
        'bg-white/70 backdrop-blur-md text-[var(--ink-900)] border border-white/80 rounded-full',
        'hover:ring-2 hover:ring-[var(--sky-400)]/50 active:scale-[0.94]',
        'transition-all duration-200 flex items-center justify-center'
      ),
      danger: clsx(
        'bg-white text-[var(--danger)] border border-[var(--danger)]',
        'hover:bg-[var(--danger)]/10 active:scale-[0.98]',
        'transition-all duration-200'
      ),
    }[variant];

    const isDisabledOrLoading = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabledOrLoading}
        className={clsx(
          'relative inline-flex items-center justify-center font-semibold rounded-full select-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sky-400)]',
          variant === 'icon' ? iconSizeClasses : sizeClasses,
          variantClasses,
          variant === 'primary' && !isDisabledOrLoading && 'animate-shimmer',
          isDisabledOrLoading && 'opacity-45 cursor-not-allowed pointer-events-none',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span
                className={clsx(
                  'w-1.5 h-1.5 rounded-full pulse-dot-1',
                  variant === 'secondary' ? 'bg-[var(--blue-700)]' : variant === 'danger' ? 'bg-[var(--danger)]' : 'bg-white'
                )}
              />
              <span
                className={clsx(
                  'w-1.5 h-1.5 rounded-full pulse-dot-2',
                  variant === 'secondary' ? 'bg-[var(--blue-700)]' : variant === 'danger' ? 'bg-[var(--danger)]' : 'bg-white'
                )}
              />
              <span
                className={clsx(
                  'w-1.5 h-1.5 rounded-full pulse-dot-3',
                  variant === 'secondary' ? 'bg-[var(--blue-700)]' : variant === 'danger' ? 'bg-[var(--danger)]' : 'bg-white'
                )}
              />
            </span>
            {variant !== 'icon' && <span>{loadingText}</span>}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            {leftIcon && <span className="w-[18px] h-[18px] flex items-center justify-center">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="w-[18px] h-[18px] flex items-center justify-center">{rightIcon}</span>}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
