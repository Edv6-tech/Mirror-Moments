'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Check,
} from 'lucide-react';
import { Button, GlassCard, Input, Modal } from '@/components/ui';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [deleteOriginals, setDeleteOriginals] = useState(true);
  const [defaultPhotoUrl, setDefaultPhotoUrl] = useState<string | null>(null);
  const [usage, setUsage] = useState({ used: 0, limit: 10, remaining: 10 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [profileResponse, usageResponse] = await Promise.all([
        fetch('/api/profile', { cache: 'no-store' }),
        fetch('/api/usage', { cache: 'no-store' }),
      ]);
      const [profileData, usageData] = await Promise.all([profileResponse.json(), usageResponse.json()]);
      if (!profileResponse.ok || !profileData.ok) throw new Error(profileData.message || 'Your profile could not be loaded.');
      setName(profileData.profile.name);
      setEmail(profileData.profile.email);
      setDeleteOriginals(profileData.profile.deleteOriginals);
      setDefaultPhotoUrl(profileData.profile.defaultPhotoUrl);
      if (usageResponse.ok && usageData.ok) setUsage({ used: usageData.used, limit: usageData.limit, remaining: usageData.remaining });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Settings could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Profile changes could not be saved.');
      setSavedSuccess(true);
      window.setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Profile changes could not be saved.');
    } finally { setIsSaving(false); }
  };

  const handlePrivacyChange = async () => {
    const nextValue = !deleteOriginals;
    setDeleteOriginals(nextValue);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deleteOriginals: nextValue }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Privacy preference could not be saved.');
    } catch (error) {
      setDeleteOriginals(!nextValue);
      setErrorMessage(error instanceof Error ? error.message : 'Privacy preference could not be saved.');
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const photo = event.target.files?.[0];
    if (!photo) return;
    setIsSavingPhoto(true);
    setErrorMessage(null);
    try {
      const form = new FormData(); form.append('photo', photo);
      const response = await fetch('/api/profile/photo', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Default photo could not be saved.');
      setDefaultPhotoUrl(data.photoUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Default photo could not be saved.');
    } finally {
      setIsSavingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handlePhotoRemove = async () => {
    setIsSavingPhoto(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/profile/photo', { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Default photo could not be removed.');
      setDefaultPhotoUrl(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Default photo could not be removed.');
    } finally { setIsSavingPhoto(false); }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/account/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation: deleteConfirmationInput }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Account could not be deleted.');
      window.location.assign('/');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Account could not be deleted.');
    } finally { setIsDeleting(false); }
  };

  return (
    <div className="app-page-atmosphere max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* ── Title ── */}
      <div className="pb-4 border-b border-[var(--line)]">
        <p className="app-page-kicker mb-2"><User size={13} /> Personal space</p>
        <h1 className="app-page-title font-display text-4xl font-semibold tracking-tight text-[var(--ink-900)]">
          Settings
        </h1>
        <p className="text-sm text-[var(--ink-500)] mt-1">
          Manage your profile, try-on defaults, and privacy preferences.
        </p>
      </div>

      {errorMessage && <div role="alert" className="rounded-2xl border border-[var(--danger)]/30 bg-white p-4 text-sm text-[var(--danger)]">{errorMessage} <button type="button" className="ml-2 underline" onClick={() => void loadProfile()}>Retry</button></div>}

      {/* ── 1. Profile Card ── */}
      <GlassCard variant="light" className="app-lift-card p-6 sm:p-8 space-y-6">
        <h2 className="font-display text-2xl font-semibold text-[var(--ink-900)]">
          Profile
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Email Address"
            value={email}
            disabled
            helperText="Email cannot be changed directly."
          />

          <div className="pt-2 flex items-center gap-3">
            <Button variant="primary" size="md" type="submit" isLoading={isSaving} loadingText="Saving…" disabled={isLoading}>
              {isLoading ? 'Loading…' : 'Save Changes'}
            </Button>
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--success)] font-semibold">
                <Check size={16} /> Saved!
              </span>
            )}
          </div>
        </form>
      </GlassCard>

      {/* ── 2. My Saved Photo ── */}
      <GlassCard variant="light" className="app-lift-card p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-2xl font-semibold text-[var(--ink-900)]">
          My Saved Photo
        </h2>
        <p className="text-xs text-[var(--ink-500)]">
          Used to skip the selfie step and immediately preview dresses in the Studio.
        </p>

        <div className="flex items-center gap-4 pt-2">
          <div className="w-16 h-20 rounded-2xl overflow-hidden border border-[var(--line)] bg-[var(--ice-100)] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={defaultPhotoUrl ?? '/sample_face_valid.jpg'}
              alt="Default silhouette"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/png" onChange={handlePhotoUpload} className="sr-only" aria-label="Choose default photo" />
              <Button variant="secondary" size="sm" leftIcon={<Upload size={14} />} isLoading={isSavingPhoto} loadingText="Saving…" onClick={() => photoInputRef.current?.click()}>
                {defaultPhotoUrl ? 'Replace Photo' : 'Choose Photo'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void handlePhotoRemove()} disabled={!defaultPhotoUrl || isSavingPhoto}>
                Remove
              </Button>
            </div>
            <p className="text-[11px] text-[var(--ink-500)]">JPG or PNG, up to 10 MB</p>
          </div>
        </div>
      </GlassCard>

      {/* ── 3. Usage & Quota ── */}
      <GlassCard variant="light" className="app-lift-card p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-2xl font-semibold text-[var(--ink-900)]">
          Usage & Credits
        </h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-900)]">
            <span>Tries today</span>
            <span>{usage.used} of {usage.limit} used ({usage.remaining} remaining)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--ice-100)] overflow-hidden">
            <div className="bg-dashboard-gradient h-full rounded-full" style={{ width: `${usage.limit ? Math.min(100, usage.used / usage.limit * 100) : 0}%` }} />
          </div>
          <p className="text-[11px] text-[var(--ink-500)]">Resets daily at 00:00 UTC.</p>
        </div>
      </GlassCard>

      {/* ── 4. Privacy Preferences ── */}
      <GlassCard variant="light" className="app-lift-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-[var(--blue-600)]" />
          <h2 className="font-display text-2xl font-semibold text-[var(--ink-900)]">
            Privacy
          </h2>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-[var(--line)]">
          <div>
            <p className="text-sm font-semibold text-[var(--ink-900)]">
              Delete original photos after lifting
            </p>
            <p className="text-xs text-[var(--ink-500)] mt-0.5">
              Only the isolated dress and resulting look will be retained.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={deleteOriginals}
            onClick={() => void handlePrivacyChange()}
            className={`relative inline-flex h-[30px] w-[52px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
              deleteOriginals ? 'bg-[var(--blue-600)]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-[26px] w-[26px] transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                deleteOriginals ? 'translate-x-[24px]' : 'translate-x-[2px]'
              } mt-[2px]`}
            />
          </button>
        </div>

        <div className="pt-1">
          <Link
            href="/privacy"
            className="text-xs font-semibold text-[var(--blue-600)] hover:underline"
          >
            Read our complete Privacy Charter →
          </Link>
        </div>
      </GlassCard>

      {/* ── 5. Danger Zone ── */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 space-y-4">
        <div className="flex items-center gap-2 text-[var(--danger)]">
          <AlertTriangle size={20} />
          <h2 className="font-display text-2xl font-semibold">Danger Zone</h2>
        </div>
        <p className="text-xs text-[var(--ink-500)] leading-relaxed">
          Permanently delete your account, your wardrobe, saved photos, and all generated looks. This cannot be undone.
        </p>

        <div>
          <Button
            variant="danger"
            size="md"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete my account and data
          </Button>
        </div>
      </div>

      {/* ── Delete Modal ── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete account permanently?"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink-500)] leading-relaxed">
            Please type <span className="font-mono font-bold text-[var(--danger)]">DELETE</span> to confirm that you want to wipe all your data from Mirror Moment.
          </p>

          <Input
            value={deleteConfirmationInput}
            onChange={(e) => setDeleteConfirmationInput(e.target.value)}
            placeholder="DELETE"
            label="Type DELETE to confirm"
          />

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={deleteConfirmationInput !== 'DELETE'}
              onClick={() => void handleDeleteAccount()}
              isLoading={isDeleting}
              loadingText="Deleting…"
            >
              Delete Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
