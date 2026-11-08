# Mirror Moment: Staged Build Guide for Antigravity

A virtual dress try-on app. Lift a dress out of any photo, then see yourself wearing it. Blue and white, built to feel like light moving over silk. “Mirror Moment” is the app’s name.

---

## Part A. Before you start

### A1. How to use this guide with Antigravity
- Save this document in the project as `/docs/BUILD_GUIDE.md`. At the start of every Antigravity session say: “Read `/docs/BUILD_GUIDE.md` fully before doing anything.”
- Build one stage at a time (Part E). Every stage has a goal, tasks, a prompt to paste, and acceptance checks. Do not start the next stage until every check passes.
- Use Planning mode for each stage. Read the plan, check it against this guide, then approve.
- Never let the agent guess YouCam endpoints. For each stage that calls YouCam, paste the official documentation for that endpoint into the prompt (docs: https://docs.perfectcorp.com/develop/introduction, Fashion API, AI-Cloth). Anything this guide says about YouCam request shapes is a placeholder until it is checked against those docs.
- After each stage, have the agent update `/docs/PROGRESS.md` with what was built, what was skipped, and any open problems.

### A2. Standing rules for the agent
Put these in the Antigravity rules file (or `AGENTS.md`) so they apply to every task:
1. **Next.js App Router, TypeScript in strict mode, Tailwind CSS.** No other UI framework.
2. `YOUCAM_API_KEY` and the Supabase service-role key exist only on the server. Nothing secret is ever sent to the browser, logged, or committed.
3. Every async action has four states designed and built: loading, success, error, empty.
4. Every animation checks `prefers-reduced-motion` and falls back to a simple fade.
5. Mobile first. Verify at 390 px, 768 px and 1280 px widths before calling a task done.
6. Accessibility: every control has a visible label or `aria-label`, focus rings are visible, everything works by keyboard, text meets WCAG AA contrast.
7. Uploaded photos are private by default. No public buckets, no public URLs without expiry.
8. Use the design tokens in Part B. Do not hard-code colors, radii or shadows in components.
9. Small, named commits per task. If something in this guide is unclear, ask instead of guessing.

### A3. The product in one page
- **Promise:** “Wear the dress before it’s yours.”
- **The idea:** A shopper sees a dress on someone else (a model, a friend, a social post, a store page). They upload that photo. The app removes the person and background and keeps only the dress. They upload a full-length photo of themselves, and the app shows them wearing that dress.
- **The four steps a user takes:**
  1. **Upload a dress photo.** The dress can be worn by someone, on a mannequin, or laid flat.
  2. **Lift the dress out.** The app isolates the dress and shows it alone, glowing on a soft pedestal. The user can refine the edges and name the dress.
  3. **Upload a photo of yourself.** Full body, facing forward.
  4. **See yourself in it.** The app generates a photo of the user wearing the dress. They can download, save, compare before and after, or try another dress.
- **Two ways in:**
  - **Guest (`/try`):** no account, up to 3 tries a day, nothing stored on the server, results can be downloaded.
  - **Account (`/app`):** saved wardrobe of lifted dresses, saved looks, a saved default photo of yourself, and a higher daily limit.
- **Business value (for the YouCam hackathon judges):** shoppers can try any dress they find anywhere, not only dresses in a store catalog. Retailers could reuse the same flow on product pages.

### A4. Tech stack and key decisions
| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (latest stable) App Router, TypeScript | Server routes keep the API key private; one codebase |
| Styling | Tailwind CSS with CSS variables for tokens | Fast, consistent theming |
| Motion | Framer Motion for UI; ogl (small WebGL library) for hero silk shader; CSS for fallbacks | Smooth effects without heavy dependencies |
| Icons | lucide-react | Clean line icons that suit the theme |
| Fonts | Cormorant Garamond (display), Manrope (interface) via next/font | Elegant headlines, readable UI |
| Backend | SQLite for email/password accounts and sessions; Supabase Postgres and private Storage for cloud wardrobe/history | Local account control with private cloud media and try-on records |
| Dress lifting | In the browser with Transformers.js running a clothes-segmentation model (e.g. Xenova/segformer_b2_clothes) | Free, private, no server cost; photos never leave device for this step |
| Try-on | YouCam AI-Cloth through our own server routes | The required API |
| Tests | Playwright | One automated run of the main flow |
| Hosting | Vercel | Simple deploy for Next.js |

**Fallback rule for dress lifting:** YouCam’s clothes API is described as accepting photos of a garment worn by a model as well as flat product shots. So if lifting fails, the app can send the original garment photo with a warning.

### A5. Competitive positioning
- Try-on for your next occasion. Wedding guest, graduation, prom. Not generic outfit swapping.
- The lifted dress is the hero. It is visible in the demo, saved as an asset, and reused across tries.
- Decision tools: A shortlist with side-by-side compare (C12) and a friend vote (C13), because the real event question is “which one?”.
- Shopping value: A store link, price and note on every dress (C11). Describe a retailer widget version in the submission.
- Honest fit: Show the small caption “A vibe check, not a fit guarantee.” under every result, in Studio step 4 and on Look detail.

---

## Part B. Design system

### B1. Mood
“Moonlit silk.” Deep navy gives depth, pearl white gives air, electric blue is the light moving across fabric. The app should feel calm, luxurious and a little magical. Light surfaces dominate. The Studio and the sidebar are dark navy so the dress glows against them.

### B2. Color tokens
| Token | Value | Use |
|---|---|---|
| `--navy-950` | `#050B1F` | Studio stage, footer, darkest areas |
| `--navy-900` | `#0A1F44` | Sidebar, dark bands |
| `--blue-700` | `#1E3FB8` | Primary gradient start, links |
| `--blue-600` | `#2563EB` | Primary gradient middle, focus accents |
| `--blue-500` | `#3B82F6` | Borders on hover, icons |
| `--sky-400` | `#38BDF8` | Glows, highlights, particles |
| `--ice-100` | `#E6F4FF` | Chips, hover fills, dropzone fill |
| `--pearl-50` | `#F7FAFF` | Page background |
| `--white` | `#FFFFFF` | Cards |
| `--ink-900` | `#0B1B3A` | Main text on light |
| `--ink-500` | `#5B6B8C` | Secondary text |
| `--line` | `#D6E4FA` | Borders and dividers |
| `--success` | `#12B886` | Success ticks |
| `--danger` | `#E5484D` | Errors, delete |

**Gradients:** `--grad-primary: linear-gradient(135deg, #1E3FB8 0%, #2563EB 55%, #0873C4 100%)`. White text is only used on blue-600 or darker. Sky-400 is for glows and decoration, never for text backgrounds.

### B3. Typography
- Display (Cormorant Garamond, weight 500–600, tight tracking): page titles and big numbers. H1 clamp(44px, 7vw, 88px), H2 clamp(32px, 4vw, 52px), H3 28 px.
- Interface (Manrope): body 16 px, small 14 px, caption 12 px; labels and buttons 600 weight.
- Tabular numbers for counters and credits. Line height 1.5 for body, 1.05 for display.
- Gradient text (`--grad-primary` clipped to text) is allowed on one key phrase per page, at display sizes only.

### B4. Shape, spacing, depth
- Spacing grid: 4 px base. Section padding 96 px desktop, 56 px mobile.
- Radii: 10 (small), 16 (inputs, small cards), 24 (cards), 32 (panels), 999 (pills, buttons).
- Shadows:
  - soft: `0 8px 30px rgba(29,78,216,.15)`
  - lifted: `0 18px 50px rgba(29,78,216,.22)`
  - glow: `0 0 0 1px rgba(56,189,248,.35), 0 10px 40px rgba(56,189,248,.35)`
- Glass surface (light): fill `rgba(255,255,255,.65)`, backdrop blur 20 px, 1 px border `rgba(255,255,255,.8)`, 1 px inner top highlight.
- Glass surface (dark): fill `rgba(255,255,255,.06)`, backdrop blur 20 px, border `rgba(255,255,255,.14)`.

### B5. Buttons
Pill shape, label 600 weight, optional 18 px icon with 8 px gap, minimum touch size 44 px. Sizes: small 36 px, medium 48 px, large 56 px (padding 20/28/36). Variants: Primary, Secondary, Ghost, Icon, Danger. Loading: three pulsing dots + verb.

### B6. Inputs, dropzone, stepper, feedback
- Text input: 52 px high, radius 16, white fill, 1 px `--line` border.
- Dropzone: radius 28, 2 px dashed `--blue-500` at 40%, fill `--ice-100` at 50%, centered 64 px icon.
- Stepper: 4 nodes joined by thread line (Done, Current, Upcoming).
- Chips: pill, `--ice-100` fill, `--blue-700` label.
- Toasts, Modals, Skeleton loaders with shimmer.

### B7. Motion rules
Easing `cubic-bezier(0.22, 1, 0.36, 1)`. Durations: micro 200 ms, transitions 450 ms, hero reveals 900 ms. Stagger 60 ms.

### B8. Signature effects
- **FX-1 Aurora Silk:** Blurred drifting blobs with 4% film grain / WebGL shader on desktop hero.
- **FX-2 Cursor Light:** Soft 400 px sky glow following pointer.
- **FX-3 Shimmer:** Diagonal white streak across buttons and skeletons.
- **FX-4 Dissolve Extraction:** Scan line down photo, particles drifting upward, 2 px sky outline glow.
- **FX-5 Weaving Loader:** Sky-blue threads converging with rotating status lines.
- **FX-6 Curtain Reveal:** Bright vertical light wipe with sparkle burst.
- **FX-7 Tilt Cards:** 6° tilt with moving highlight.
- **FX-8 Before/After Slider:** Draggable divider with glowing round handle.

---

## Part C. Pages
- **C1. Site map:** `/` (Landing), `/login`, `/signup`, `/try` (Guest Studio), `/privacy`, `/app` (Dashboard), `/app/studio`, `/app/wardrobe`, `/app/looks`, `/app/looks/[id]`, `/app/shortlists`, `/app/shortlists/[id]`, `/vote/[token]`, `/app/settings`.
- **C2. Landing page (`/`)**
- **C3. Authentication (`/login`, `/signup`):** email and password only, stored in SQLite with scrypt password hashes and opaque HTTP-only sessions. Supabase Auth is not used for account credentials.
- **C4. Dashboard (`/app`)**
- **C5. Studio (`/app/studio` and `/try`)**
  - Step 1: Upload a dress photo
  - Step 2: Lift the dress out
  - Step 3: Upload a photo of yourself
  - Step 4: See yourself in it
- **C6. Wardrobe (`/app/wardrobe`)**
- **C7. Looks gallery (`/app/looks`)**
- **C8. Look detail (`/app/looks/[id]`)**
- **C9. Settings (`/app/settings`)**
- **C10. Shared pages (404, Error, `/privacy`)**
- **C11. Dress details (store link, price, note)**
- **C12. Shortlist and compare (`/app/shortlists`, `/app/shortlists/[id]`)**
- **C13. Friend vote (`/vote/[token]`)**

---

## Part D. Data and server design
- **D1. Account and app data:** SQLite stores accounts, sessions, and profiles. Supabase Postgres stores `dresses`, `looks`, `usage_counters`, `shortlists`, `shortlist_looks`, and `votes`. Row-level security remains enabled; server routes use the service role and explicitly filter user-owned rows by the authenticated SQLite account ID.
- **D2. Storage:** `dresses`, `bodies`, `results`. Private buckets with signed URLs.
- **D3. Server routes:** `/api/tryon/start`, `/api/tryon/status`, `/api/tryon/cancel`, `/api/usage`, `/api/account/delete`, `/api/vote/[token]`, `/api/shortlists/[id]/share`.
- **D4. Dress lifting algorithm:** In-browser Web Worker using Transformers.js with clothes-segmentation model.
- **D5. Limits, budget and sample mode:** Daily user limit (10), guest limit (3), `SAMPLE_MODE=true` toggle.
- **D6. Environment variables:** `SQLITE_DB_PATH` (optional; defaults to `data/mirror-moment.sqlite`), `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `YOUCAM_API_KEY`, `YOUCAM_API_BASE`, `DAILY_LIMIT_USER`, `DAILY_LIMIT_GUEST`, `GLOBAL_DAILY_BUDGET`, `TRYON_ENABLED`, `SAMPLE_MODE`. The SQLite file must be stored on a persistent disk in production.
- **D7. Additions for dress details, shortlists and voting**

---

## Part E. Build stages
- **Stage 0:** Accounts, keys and test photos
- **Stage 1:** Scaffold, design tokens and core components
- **Stage 2:** Landing page
- **Stage 3:** SQLite accounts, Supabase data/storage and guest mode
- **Stage 4:** App shell and Dashboard
- **Stage 5:** Dress lifter engine (in-browser Web Worker)
- **Stage 6:** YouCam server routes
- **Stage 7:** The Studio
- **Stage 8:** Wardrobe, Looks, Look detail and Settings
- **Stage 8A:** Dress details, shortlists and friend vote
- **Stage 9:** Privacy, hardening and error handling
- **Stage 10:** Polish, testing and deploy
- **Stage 11:** Hackathon submission pack
