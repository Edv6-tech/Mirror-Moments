import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--pearl-50)] flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-4 max-w-md">
        <h1 className="font-display text-8xl font-bold tracking-tight text-gradient">
          404
        </h1>
        <h2 className="font-display text-3xl font-semibold text-[var(--ink-900)]">
          This page wandered off.
        </h2>
        <p className="text-sm text-[var(--ink-500)]">
          The occasion outfit or look you are searching for might have been moved or removed.
        </p>
        <div className="pt-4 flex justify-center">
          <Link href="/">
            <Button variant="primary" size="lg">
              Back Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
