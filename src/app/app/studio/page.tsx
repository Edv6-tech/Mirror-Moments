'use client';

import { Suspense } from 'react';
import StudioFlow from '@/components/studio/StudioFlow';

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--pearl-50)] flex items-center justify-center text-[var(--ink-900)]">Loading Studio…</div>}>
      <StudioFlow isGuest={false} />
    </Suspense>
  );
}
