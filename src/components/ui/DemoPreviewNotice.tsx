export default function DemoPreviewNotice() {
  return (
    <div
      role="status"
      className="rounded-xl border border-[var(--blue-500)]/25 bg-[var(--ice-100)] px-4 py-3 text-sm text-[var(--ink-900)]"
    >
      <strong className="font-semibold">Demo preview.</strong>{' '}
      AI processing is in mock mode, so this is a sample image rather than a result generated from your photo.
    </div>
  );
}
