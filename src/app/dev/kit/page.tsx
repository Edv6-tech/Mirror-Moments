'use client';

import React, { useState } from 'react';
import {
  Button,
  Input,
  Dropzone,
  Chip,
  Toast,
  Modal,
  Skeleton,
  Stepper,
  GlassCard,
  AuroraBackground,
} from '@/components/ui';
import { Sparkles, ArrowRight, Trash2, Heart, Download } from 'lucide-react';

export default function DevKitPage() {
  const [backgroundTheme, setBackgroundTheme] = useState<'light' | 'dark'>('light');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(2);
  const [inputValue, setInputValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  const isDark = backgroundTheme === 'dark';

  return (
    <AuroraBackground variant={backgroundTheme}>
      <main className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        {/* Header with Theme Toggle */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-8 mb-12 border-b border-[var(--line)]/40 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
                Mirror Moment Component Kit
              </h1>
              <Chip label="Stage 1 · /dev/kit" variant={isDark ? 'dark' : 'ice'} />
            </div>
            <p className="text-[16px] text-[var(--ink-500)] mt-2">
              Design system tokens (Part B) and foundational components for Next.js App Router.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={backgroundTheme === 'light' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setBackgroundTheme('light')}
            >
              Pearl Light
            </Button>
            <Button
              variant={backgroundTheme === 'dark' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setBackgroundTheme('dark')}
            >
              Moonlit Navy
            </Button>
          </div>
        </header>

        <div className="space-y-16">
          {/* SECTION 1: BUTTONS */}
          <section aria-labelledby="buttons-heading">
            <h2 id="buttons-heading" className="font-display text-3xl font-semibold mb-2">
              1. Buttons (B5 Tokens & States)
            </h2>
            <p className="text-[14px] text-[var(--ink-500)] mb-6">
              Variants: Primary, Secondary, Ghost, Icon, Danger · Sizes: sm (36px), md (48px), lg (56px) · States: Rest, Hover, Pressed, Loading, Disabled.
            </p>

            <GlassCard variant={backgroundTheme} className="space-y-8">
              {/* Primary Buttons */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-500)] mb-3">
                  Primary Variant (Gradient + Glow + Shimmer Sweep)
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="primary" size="lg" leftIcon={<Sparkles size={18} />}>
                    Primary Large
                  </Button>
                  <Button variant="primary" size="md">
                    Primary Medium
                  </Button>
                  <Button variant="primary" size="sm">
                    Primary Small
                  </Button>
                  <Button variant="primary" size="md" isLoading loadingText="Weaving...">
                    Primary Loading
                  </Button>
                  <Button variant="primary" size="md" disabled>
                    Primary Disabled
                  </Button>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-500)] mb-3">
                  Secondary Variant (Glass Surface + Blue-500 Border)
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="secondary" size="lg">
                    Secondary Large
                  </Button>
                  <Button variant="secondary" size="md">
                    Secondary Medium
                  </Button>
                  <Button variant="secondary" size="sm">
                    Secondary Small
                  </Button>
                  <Button variant="secondary" size="md" isLoading loadingText="Fitting...">
                    Secondary Loading
                  </Button>
                  <Button variant="secondary" size="md" disabled>
                    Secondary Disabled
                  </Button>
                </div>
              </div>

              {/* Ghost, Icon & Danger */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-500)] mb-3">
                  Ghost, Icon & Danger Variants
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="ghost" size="md" leftIcon={<ArrowRight size={16} />}>
                    Ghost Link
                  </Button>
                  <Button variant="ghost" size="md" isLoading loadingText="Loading...">
                    Ghost Loading
                  </Button>

                  <Button variant="icon" size="md" aria-label="Favourite">
                    <Heart size={20} className="text-[var(--danger)]" />
                  </Button>
                  <Button variant="icon" size="md" aria-label="Download">
                    <Download size={20} />
                  </Button>
                  <Button variant="icon" size="md" isLoading aria-label="Loading" />

                  <Button variant="danger" size="md" leftIcon={<Trash2 size={16} />}>
                    Delete Dress
                  </Button>
                  <Button variant="danger" size="md" isLoading loadingText="Removing...">
                    Danger Loading
                  </Button>
                </div>
              </div>
            </GlassCard>
          </section>

          {/* SECTION 2: INPUTS */}
          <section aria-labelledby="inputs-heading">
            <h2 id="inputs-heading" className="font-display text-3xl font-semibold mb-2">
              2. Inputs (B6)
            </h2>
            <p className="text-[14px] text-[var(--ink-500)] mb-6">
              52px height, 16px radius, white fill, 1px line border, focus sky ring, error state with icon, password toggle.
            </p>

            <GlassCard variant={backgroundTheme}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Dress Name"
                  placeholder="e.g. Silk Emerald Slip Dress"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  helperText="Give your lifted dress a memorable label"
                />

                <Input
                  type="password"
                  label="Account Password"
                  placeholder="Enter your password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  helperText="At least 8 characters"
                />

                <Input
                  label="Error State Input"
                  defaultValue="invalid-format.xyz"
                  error="Please enter a valid format for this photo."
                />

                <Input
                  label="Disabled State"
                  disabled
                  defaultValue="Read-only user identifier"
                />
              </div>
            </GlassCard>
          </section>

          {/* SECTION 3: DROPZONE */}
          <section aria-labelledby="dropzone-heading">
            <h2 id="dropzone-heading" className="font-display text-3xl font-semibold mb-2">
              3. Dropzone (Light & Dark Variants)
            </h2>
            <p className="text-[14px] text-[var(--ink-500)] mb-6">
              28px radius, 2px dashed border, 64px pulsing upload circle, drag-over ripple, file preview with chip.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold uppercase text-[var(--ink-500)] mb-3">
                  Light Variant (Pearl Surface)
                </h3>
                <Dropzone
                  variant="light"
                  label="Drop a dress photo here or browse"
                  hint="JPG or PNG, up to 10 MB"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase text-[var(--ink-500)] mb-3">
                  Dark Variant (Studio Stage)
                </h3>
                <Dropzone
                  variant="dark"
                  label="Drop full-body photo here or browse"
                  hint="Full body, facing forward, good lighting"
                />
              </div>
            </div>
          </section>

          {/* SECTION 4: STEPPER & CHIPS */}
          <section aria-labelledby="stepper-heading">
            <h2 id="stepper-heading" className="font-display text-3xl font-semibold mb-2">
              4. Stepper & Chips
            </h2>
            <p className="text-[14px] text-[var(--ink-500)] mb-6">
              4-node thread line stepper with interactive steps and compact mobile bar.
            </p>

            <GlassCard variant="dark" className="bg-[var(--navy-900)] mb-6">
              <Stepper
                currentStep={activeStep}
                onStepClick={(step) => setActiveStep(step)}
              />
              <div className="flex justify-center gap-3 mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                  disabled={activeStep <= 1}
                >
                  Previous Step
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveStep((prev) => Math.min(4, prev + 1))}
                  disabled={activeStep >= 4}
                >
                  Next Step
                </Button>
              </div>
            </GlassCard>

            <div className="flex flex-wrap items-center gap-3">
              <Chip label="Default Ice Chip" variant="ice" />
              <Chip label="White Card Chip" variant="white" />
              <Chip label="Dark Glass Chip" variant="dark" />
              <Chip label="Verified 100% Fit" variant="success" />
            </div>
          </section>

          {/* SECTION 5: MODAL, TOAST & SKELETON */}
          <section aria-labelledby="feedback-heading">
            <h2 id="feedback-heading" className="font-display text-3xl font-semibold mb-2">
              5. Modals, Toasts & Skeletons
            </h2>
            <p className="text-[14px] text-[var(--ink-500)] mb-6">
              Accessible dialogs, auto-dismissing glass toasts, and shimmering skeleton loaders.
            </p>

            <GlassCard variant={backgroundTheme} className="space-y-6">
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                  Open Modal / Bottom Sheet
                </Button>
                <Button variant="secondary" onClick={() => setIsToastOpen(true)}>
                  Trigger Glass Toast
                </Button>
              </div>

              {/* Skeletons Preview */}
              <div>
                <h3 className="text-sm font-bold uppercase text-[var(--ink-500)] mb-3">
                  Skeleton Loaders with Shimmer Sweep (B6)
                </h3>
                <div className="space-y-3 max-w-md">
                  <div className="flex items-center gap-4">
                    <Skeleton variant="circle" className="w-12 h-12" />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" className="w-3/4" />
                      <Skeleton variant="text" className="w-1/2" />
                    </div>
                  </div>
                  <Skeleton variant="rect" className="w-full h-32" />
                </div>
              </div>
            </GlassCard>
          </section>
        </div>

        {/* Interactive Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add a photo of yourself?"
        >
          <div className="space-y-4">
            <p className="text-[14px] text-[var(--ink-500)]">
              Full-body photos taken in good light give the most accurate draping. You can change this anytime in Settings.
            </p>
            <Dropzone variant="light" label="Upload your portrait" hint="Facing camera, feet visible" />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Skip for now
              </Button>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                Save My Photo
              </Button>
            </div>
          </div>
        </Modal>

        {/* Interactive Toast */}
        <Toast
          isOpen={isToastOpen}
          onClose={() => setIsToastOpen(false)}
          type="success"
          message="Dress isolated onto pedestal successfully."
        />
      </main>
    </AuroraBackground>
  );
}
