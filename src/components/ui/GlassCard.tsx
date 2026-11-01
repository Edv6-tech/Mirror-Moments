'use client';

import React from 'react';
import clsx from 'clsx';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark';
  radius?: '16' | '24' | '32';
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'light',
  radius = '24',
  className,
  children,
  ...props
}) => {
  const radiusClasses = {
    '16': 'rounded-[16px]',
    '24': 'rounded-[24px]',
    '32': 'rounded-[32px]',
  }[radius];

  return (
    <div
      className={clsx(
        radiusClasses,
        variant === 'light' ? 'glass-surface-light text-[var(--ink-900)]' : 'glass-surface-dark text-white',
        'p-6 transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
