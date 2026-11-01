'use client';

import React from 'react';
import clsx from 'clsx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rect',
  ...props
}) => {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        'bg-[var(--line)]/50 animate-shimmer relative overflow-hidden',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-4 rounded-[8px]',
        variant === 'rect' && 'rounded-[16px]',
        className
      )}
      {...props}
    />
  );
};
