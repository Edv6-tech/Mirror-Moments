# Standing Rules for Antigravity (Mirror Moment)

At the start of every session:
> **Read `/docs/BUILD_GUIDE.md` fully before doing anything.**

## Core Engineering Rules
1. **Framework:** Next.js App Router, TypeScript in strict mode, Tailwind CSS. No other UI framework.
2. **Secrets:** `YOUCAM_API_KEY` and the Supabase service-role key exist only on the server. Nothing secret is ever sent to the browser, logged, or committed.
3. **Four Async States:** Every async action has four states designed and built: `loading`, `success`, `error`, `empty`.
4. **Reduced Motion:** Every animation checks `prefers-reduced-motion` and falls back to a simple fade.
5. **Mobile First:** Verify at 390 px, 768 px and 1280 px widths before calling a task done.
6. **Accessibility:** Every control has a visible label or `aria-label`, focus rings are visible, everything works by keyboard, text meets WCAG AA contrast.
7. **Photo Privacy:** Uploaded photos are private by default. No public buckets, no public URLs without expiry.
8. **Design Tokens:** Use the design tokens in Part B of `/docs/BUILD_GUIDE.md`. Do not hard-code colors, radii or shadows in components.
9. **Git Discipline:** Small, named commits per task. If something in this guide is unclear, ask instead of guessing.
10. **Build Discipline:** Build one stage at a time (Part E). Every stage has a goal, tasks, a prompt to paste, and acceptance checks. Do not start the next stage until every check passes.
11. **YouCam Grounding:** Never guess YouCam endpoints. Rely on official documentation for request/response shapes.
12. **Progress Tracking:** Update `/docs/PROGRESS.md` after each stage with what was built, what was skipped, and open problems.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
