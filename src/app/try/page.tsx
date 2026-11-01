'use client';

import { Suspense } from 'react';
import StudioFlow from '@/components/studio/StudioFlow';

export default function GuestStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--navy-950)] flex items-center justify-center text-white">Loading Studio…</div>}>
      <StudioFlow isGuest={true} />
    </Suspense>
  );
}
