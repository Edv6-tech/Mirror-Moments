'use client';

import { Suspense } from 'react';
import StudioFlow from '@/components/studio/StudioFlow';

export default function GuestStudioPage() {
  return (
    <main className="app-dashboard-theme min-h-screen">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--white)] text-[var(--ink-900)]">Loading Studio…</div>}>
        <StudioFlow isGuest={true} />
      </Suspense>
    </main>
  );
}
