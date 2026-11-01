'use client';

import React from 'react';
import clsx from 'clsx';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  icon?: React.ReactNode;
  variant?: 'ice' | 'white' | 'dark' | 'success';
}

export const Chip: React.FC<ChipProps> = ({
  label,
  icon,
  variant = 'ice',
  className,
  ...props
}) => {
  const variantStyles = {
    ice: 'bg-[var(--ice-100)] text-[var(--blue-700)] border border-[var(--blue-500)]/20',
    white: 'bg-white text-[var(--ink-900)] border border-[var(--line)] shadow-sm',
    dark: 'bg-white/10 text-white border border-white/20 backdrop-blur-md',
    success: 'bg-emerald-50 text-[var(--success)] border border-emerald-200',
  }[variant];

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold select-none transition-all',
        variantStyles,
        className
      )}
      {...props}
    >
      {icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{icon}</span>}
      <span>{label}</span>
    </div>
  );
};
