# Mirror Moment: Project Progress Log

## Current Status
- **Date:** 2026-11-01
- **Current Stage:** Stage 10 Polish — FX7 3D Dark Navy Theme Complete
- **Dev Server:** Running at `http://localhost:3000`
- **Latest Commit:** `240fedd` — feat(ui): FX7 3D tilt dark navy theme — all studios + dashboard complete

---

## Stages Overview

| Stage | Name | Status | Notes |
|---|---|---|---|
| Stage 0 | Accounts, keys and test photos | Completed | Verified keys, 6 test photos in `data/`, BUILD_GUIDE stored |
| Stage 1 | Scaffold, design tokens and core components | Completed | Next.js 16 App Router, TypeScript strict, Cormorant Garamond & Manrope, 10 UI components in `/dev/kit` |
| Stage 2 | Landing page (`/`) | Completed | Silk Aurora background, hero, How It Works, FX-8 before/after slider, features, FAQ accordion, footer |
| Stage 3 | Supabase, authentication and guest mode | Completed | RLS migrations, SSR client/server/middleware, split `/login` and `/signup` auth pages |
| Stage 4 | App shell and Dashboard (`/app`) | Completed | Responsive 264px navy sidebar + mobile bottom nav, stats, AI beauty & fashion suite, recent looks, wardrobe preview, rotating tips |
| Stage 5 | Dress lifter engine (Web Worker) | Completed | Transformers.js SegFormer clothes model, mask extraction, `/dev/lifter` testbench |
| Stage 6 | YouCam server routes | Completed | `/api/tryon/start`, `/api/tryon/status`, `/api/usage` with server-side API key protection and sample mode |
| Stage 7 | The Studio (`/try`, `/app/studio`) | Completed | 4-step virtual try-on flow, FX-4 Dissolve Extraction, FX-5 Weaving Loader, FX-6 Curtain Reveal, sample dresses |
| Stage 8 | Wardrobe, Looks, Look detail, Settings | Completed | `/app/wardrobe` with search & delete modals, `/app/looks` gallery with favourites & downloads, `/app/settings` with privacy toggles |
| Stage 9 | Privacy, hardening and error handling | Completed | `/privacy` charter, branded `/not-found` 404, error boundaries, time-limited URL rules |
| Stage 10 | Polish, testing and deploy | In Progress | All 17 Next.js static and dynamic routes compile cleanly with zero errors |
| Stage 11 | Hackathon submission pack | Pending | Preparing demo instructions and summary |

---

## Recent Commits
- `af8de6d` feat(ui): extend FX7 3D tilt cards to Studio presets, Wardrobe items, and Looks gallery
- `240fedd` feat(ui): FX7 3D tilt dark navy theme — all studios + dashboard complete
- `de99308` docs: add BUILD_GUIDE.md, AGENTS.md, and PROGRESS.md
- `786e58e` feat(stage-1-5): complete landing page, auth, dashboard shell, dress lifter worker, and DB schema
- `758d118` feat(stage-6-9): complete studio 4-step flow, signature FX, API routes, wardrobe, looks, settings, and privacy

---

## Session Update — 2026-11-01 (FX7 3D Dark Navy Theme — All Studios)

### What was built

| Area | Detail |
|---|---|
| **`FX7TiltCard`** (`src/components/effects/FX7TiltCard.tsx`) | New component — 6° mouse-tracking tilt + moving specular gloss highlight. Respects `prefers-reduced-motion`. |
| **Dashboard** (`/app`) | Full rewrite — dark navy gradient bg, hero with 3 tilt model cards, category strip, 10-studio grid with `StudioCard` (FX7 + image strip + glow blob). |
| **Earring page** (`/app/earring`) | Dark navy theme, FX7TiltCard on 4-column preset grid, sky-400 selection ring + Check badge. |
| **Ring page** (`/app/ring`) | Dark navy theme, FX7TiltCard on 3×2 preset grid, dangling old JSX removed. |
| **Makeup page** (`/app/makeup`) | Dark navy theme, FX7TiltCard on look cards, dark Dropzone variant. Effect legend updated. |
| **Necklace page** (`/app/necklace`) | Dark navy theme, FX7TiltCard on 2×2 preset grid, dark sliders with sky-400 accent. |
| **Eye-color page** (`/app/eye-color`) | Dark navy theme, FX7TiltCard on lens swatch grid (4 columns), iris circles preserved. |
| **Nails page** (`/app/nails`) | Dark navy theme, sky-400 accents on all buttons/tabs/sliders, dark Dropzone variant. StepLabel updated. |
| **Build** | ✅ 0 TS errors, 0 build errors, 38 routes (static + dynamic). Commit `240fedd`. |

### Open issues / next steps
- Playwright E2E test run (Stage 10)
- Hackathon submission pack (Stage 11)

---

## Session Update — 2026-11-01 (Shoes + Bag + Lifter integration)

### What was built

| Area | Detail |
|---|---|
| **SegFormer worker** (`src/lib/dress-lifter/worker.ts`) | Added `shoes` and `bag` lift modes using model labels `Left-shoe`, `Right-shoe` (indices 9/10) and `Bag` (index 16). All 4 modes now supported: `dress`, `hair`, `shoes`, `bag`. |
| **`useDressLifter` hook** | Mode type widened to `'dress' | 'hair' | 'shoes' | 'bag'`. |
| **`StudioFlow.tsx`** — Core lifter wiring | `useDressLifter` now imported and called in `handleProceedToCrop`. SegFormer runs in-browser before any server call. Transparent PNG + white-bg blob stored in state. **Person is now actually cropped out before saving and before YouCam call.** |
| **`StudioFlow.tsx`** — 4-mode refactor | Replaced binary `isHairMode` flag with `mode: StudioMode` + `MODE_CONFIG` lookup table. All UI copy, API routes, and lifter modes driven by `cfg`. |
| **4-tab mode switcher** | Dress / Hair / Shoes / Bag tabs in the studio header. Each links to `?mode=<mode>`. |
| **Bag style picker** (Step 3) | 5 buttons: Random, Parisian Chic, Urban Chic, Mediterranean Chic, Art Deco — matches YouCam docs exactly. |
| **Shoes gender picker** (Step 3) | Female / Male selector. |
| **`/api/shoes-tryon`** | POST `shoes-transfer`, GET poll. Per docs: `src_file_id`, `ref_file_id`, `gender`, `style`. |
| **`/api/bag-tryon`** | POST `bag`, GET poll. Per docs: `src_file_id`, `ref_file_id`, `gender`, `style`. 4 style presets. |
| **`/api/dress-tryon`** | Updated `garment_category` to `"auto"` (AI picks full/upper/lower). Added `filter_multi_person: "off"`. |
| **`/api/hair-tryon`** | Removed fake `template_bob_01` fallback. Now returns 400 if no ref photo + no templateId. Error codes mapped to friendly messages. Endpoint confirmed: `/s2s/v2.1/task/hair-transfer`. |
| **Dashboard** | 4 studio cards: Dress (Flagship), Hair (Popular), Shoes (New), Bag (New). Chip updated to "4 Studios". |
| **Build** | ✅ 0 TS errors, 28 routes. |
| **Commit** | `b30b99e` |

### Open issues

| Issue | Status |
|---|---|
| Hair try-on templates | No valid template IDs known — ref photo is now required (correct per docs). |
| Person photo for dress | Docs say "upper body from chest up, shoulders visible". UI hint updated. |
| SegFormer shoes/bag accuracy | `segformer_b2_clothes` may not perfectly isolate shoes/bags on all photos. Falls back gracefully. |

---

## Session Update — 2026-11-01 (API verification & cleanup)

### What was built / verified

| Area | Detail |
|---|---|
| **YouCam API live test** | ✅ `POST /s2s/v2.0/file` returned `200` — key is valid and active. |
| **End-to-end dress try-on** | ✅ Full pipeline tested: file upload → `cloth-v4` task → poll → result saved to `/uploads/results/`. Task ID confirmed. |
| **Deleted stale routes** | `/api/retouch` and `/api/makeup-tryon` removed (per earlier decision to remove skin diagnostic, face retouch, body trim). |
| **`.env` confirmed** | API key matches screenshot exactly: `sk-Fnd6W-LBG1oEtq44E-Bk88mKtUAGGmPhPgXztNVyAJxaYAOTHs69n6qq6Rd5h1Vi` |

### Current live API status

| Endpoint | Status |
|---|---|
| `POST /s2s/v2.0/file` | ✅ 200 OK — uploads working |
| `POST /s2s/v2.0/task/cloth-v4` | ✅ Confirmed working — full try-on result saved |
| `POST /s2s/v2.0/task/makeup-vto` | ✅ Route built — grounded in official docs v1.0 |
| `POST /s2s/v2.1/task/hair-transfer` | ⚠️ Not tested yet — needs ref photo |
| `POST /s2s/v2.0/task/shoes-transfer` | ⚠️ Not tested yet — needs ref shoe photo |
| `POST /s2s/v2.0/task/bag` | ⚠️ Not tested yet — needs ref bag photo |

### Open issues

| Issue | Status |
|---|---|
| Hair/Shoes/Bag live API test | Not yet tested end-to-end — key is valid so should work. |
| SegFormer shoes/bag accuracy | `segformer_b2_clothes` may not perfectly isolate shoes/bags on all photos. Falls back gracefully. |

---

## Session Update — 2026-11-01 (AI Makeup Studio)

### What was built

| Area | Detail |
|---|---|
| **`/api/makeup-vto/route.ts`** | Server route grounded in YouCam AI Makeup VTO v1.0 docs. Accepts `multipart/form-data` with `personPhoto` + `effects` JSON. Uploads selfie via File API, POSTs to `POST /s2s/v2.0/task/makeup-vto`, polls `GET /s2s/v2.0/task/makeup-vto/{task_id}`, saves result locally. |
| **`/app/makeup/page.tsx`** | Full Makeup Studio UI: 6 curated looks (Natural Glow, Red Carpet, Smoky Night, Spring Fresh, Bronze Goddess, Editorial). Step 1: selfie upload. Step 2: look picker with gradient swatches. Step 3: result with FX6CurtainReveal. Download + Try Another actions. Sample photo fallback (no upload required). Effect legend chip list. 4 async states. |
| **Dashboard card** | 5th card "AI Makeup Studio" added with pink/rose gradient, linking to `/app/makeup`. |
| **Chip updated** | "5 Studios" chip on dashboard. |

### Effect presets (grounded in docs)

| Look | Effects applied |
|---|---|
| Natural Glow | skin_smooth, blush (1color1), lip_color (original/gloss), eyelashes (Natural1) |
| Red Carpet | skin_smooth, foundation, lip_color (plump/matte red), eye_liner (Arabic3), eyelashes (UpperDense1), contour (OvalFace6) |
| Smoky Night | skin_smooth, eye_shadow (3colors/shimmer), eye_liner (2colors), eyelashes (UpperDense1), lip_color (nude), highlighter (OvalFace2) |
| Spring Fresh | skin_smooth, blush (2colors6/satin), lip_color (heart-shaped/coral/gloss), eyebrows (SoftArch1), eyelashes (Upper1) |
| Bronze Goddess | skin_smooth, bronzer (Bronzer1), highlighter (shimmer), eye_shadow (2colors/shimmer), lip_color (petal/gloss) |
| Editorial | skin_smooth, eye_liner (3colors/blue), eyelashes (Artistic1), lip_color (vintage/purple/matte), concealer |

### Open issues

| Issue | Status |
|---|---|
| Hair/Shoes/Bag live API test | Not yet tested end-to-end — key is valid so should work. |
| Makeup VTO live test | Route built and TS clean — needs live test with selfie photo. |
| SegFormer shoes/bag accuracy | `segformer_b2_clothes` may not perfectly isolate shoes/bags on all photos. Falls back gracefully. |


---

## Session Update — 2026-11-01 (AI Nail, Eye Color Lens & Necklace VTO)

### What was built

| Area | Detail |
|---|---|
| **Nail VTO TS fix** (`/app/nails/page.tsx` line 297) | Fixed `'hint' in t ? t.hint : undefined` → explicit cast `(t as { hint: string }).hint` to resolve TS2322 unknown type error. |
| **`/api/nail-vto/route.ts`** | Server route grounded in YouCam AI Nail VTO v1.0 docs. POST `/s2s/v2.0/task/nail-vto`, poll `GET /s2s/v2.0/task/nail-vto/{task_id}`. Accepts `multipart/form-data` with `handPhoto` + `effectPayload` JSON. Full effect builder for nail_polish (9 textures, per-finger colour) and press_on_nails (3 textures + 6 shapes). Sample hand photo fallback. |
| **`/app/app/nails/page.tsx`** | Full Nail Studio UI: nail type switch (polish / press-on), 16-colour palette, 9 texture chips, 6 press-on shapes, nail length slider, hand photo dropzone, result with FX6CurtainReveal + download. 4 async states. |
| **`/api/eye-color-vto/route.ts`** | Server route grounded in YouCam AI Eye Color Lens VTO docs. POST `/s2s/v2.0/task/eye-color-vto`, poll `GET /s2s/v2.0/task/eye-color-vto/{task_id}`. Accepts `multipart/form-data` with `selfiePhoto` (optional) + `lensPhoto` or `lensUrl`. Uploads lens PNG as `ref_file_id` or passes `ref_file_url` for presets. Validates sizes per docs (selfie long side ≤ 1920, short side ≥ 320, lens 200×200 to 600×600, < 10 MB each). |
| **`/app/app/eye-color/page.tsx`** | Full Eye Color Lens UI: 8 lens presets (Natural Hazel, Honey Brown, Ocean Blue, Forest Green, Violet, Storm Grey, Icy Blue, Amethyst) with CSS iris swatch rendering, selfie dropzone (optional), FX5WeavingLoader while processing, FX6CurtainReveal on result, download + reset. 4 async states. |
| **`/api/necklace-vto/route.ts`** | Server route grounded in YouCam AI Necklace VTO docs. POST `/s2s/v2.0/task/2d-vto/necklace`, poll `GET /s2s/v2.0/task/2d-vto/necklace/{task_id}`. Accepts `multipart/form-data` with `selfiePhoto`, `necklacePhoto` or `necklaceUrl`, `shadowIntensity`, `ambientLightIntensity`. Maps all 5 documented error codes (PHOTO_DETECTION_FAIL, OBJECT_DETECTION_FAIL, PHOTO_CHECK_INVALID, INPUT_ERROR, INPUT_MAIN_IMAGE_EMPTY) to user-friendly messages. |
| **`/app/app/necklace/page.tsx`** | Full Necklace VTO UI: 4 curated preset necklaces (Delicate Gold Chain, Pearl Strand, Diamond Pendant, Silver Choker) with thumbnail grid, custom necklace photo upload, shadow intensity slider (0–1, default 0.15), ambient light slider (0–1, default 1.0), selfie dropzone with neck-visibility tips, FX5WeavingLoader, FX6CurtainReveal on result, download + reset. 4 async states. |
| **Dashboard update** | Added 3 new studio cards: AI Nail Studio (fuchsia/purple), AI Eye Colour Lens (cyan/blue), AI Necklace Try-On (amber/yellow). Chip updated to **"8 Studios"**. Section heading updated to "AI Fashion & Beauty Studios". |
| **TypeScript** | ✅ 0 errors (`npx tsc --noEmit` exit code 0) |
| **Build** | ✅ 0 errors (`npx next build` exit code 0) |
| **Commit** | `900727c` — `feat(beauty): add AI Nail, Eye Color Lens, and Necklace VTO studios — routes, pages, dashboard cards (8 Studios)` |

### Current live API status

| Endpoint | Route | Status |
|---|---|---|
| `POST /s2s/v2.0/file` | (youcamClient) | ✅ 200 OK — uploads working |
| `POST /s2s/v2.0/task/cloth-v4` | `/api/dress-tryon` | ✅ Confirmed working |
| `POST /s2s/v2.0/task/makeup-vto` | `/api/makeup-vto` | ✅ Route built & clean |
| `POST /s2s/v2.0/task/nail-vto` | `/api/nail-vto` | ✅ Route built & clean |
| `POST /s2s/v2.0/task/eye-color-vto` | `/api/eye-color-vto` | ✅ Route built & clean |
| `POST /s2s/v2.0/task/2d-vto/necklace` | `/api/necklace-vto` | ✅ Route built & clean |
| `POST /s2s/v2.1/task/hair-transfer` | `/api/hair-tryon` | ⚠️ Not tested live |
| `POST /s2s/v2.0/task/shoes-transfer` | `/api/shoes-tryon` | ⚠️ Not tested live |
| `POST /s2s/v2.0/task/bag` | `/api/bag-tryon` | ⚠️ Not tested live |

## Session Update — 2026-11-01 (Real YouCam CDN samples + Eye Color fix)

### What was built

| Area | Detail |
|---|---|
| **Eye Color page/route sync fix** | `eye-color/page.tsx` was out of sync — still sent `lensUrl` after the route was rewritten to expect `lensId`. Fixed `handleApply` to send `form.append('lensId', selectedLens)`. Preset `url` field removed from `LENS_PRESETS` — presets now only carry `id`, `name`, `color`. CSS iris swatches use `backgroundColor: lens.color`. |
| **`youcamClient.ts` endpoint param** | Confirmed correct — 4th `endpoint` param is wired through to `registerEndpoint`. No fix needed; eye-color route uses its own `uploadEyeFile()` and doesn't need it. |
| **Earring presets** | Replaced 5 Unsplash URLs with `plugins-media.makeupar.com/strapi/assets/thumbnail_earring_product_0N_<hash>.png` (4 presets + custom). Fixed TS errors: state init + reset + `onClear` all updated from `'gold_hoops'` → `'gold_drop'`. |
| **Ring presets** | Replaced 6 Unsplash URLs with `plugins-media.makeupar.com/strapi/assets/ring_product_0N_<hash>.png`. |
| **Necklace presets** | Replaced 4 Unsplash URLs with `plugins-media.makeupar.com/strapi/assets/necklace_product_0N_<hash>.png`. Comment updated to note real CDN origin. |
| **StudioFlow sample presets** | Added `SAMPLE_PRESETS` data block (4 products per mode) + `selectedSample` state + `handleSampleSelect` async function. Step 1 canvas now shows a 4-item grid of real YouCam CDN product thumbnails **above** the Dropzone with a divider. Selecting a preset: sets preview, tries to fetch as File (CORS fallback graceful). Right-column status text updated to reflect both sample and upload paths. "Try Another" reset clears `selectedSample`. `handleProceedToCrop` guard updated: if `sourceFile` is null (CORS blocked), skips SegFormer and uses `sourcePreview` directly. Step 4 try-on: passes `refUrl`/`garmentUrl` for sample-only paths. |
| **Lens PNGs committed** | 8 generated iris PNGs (`public/lenses/*.png`) committed along with `scripts/generate-lenses.mjs`. |
| **TypeScript** | ✅ 0 errors (`npx tsc --noEmit` exit code 0) |
| **Commit** | `17afb9e` — `feat(samples): real YouCam CDN presets in all studios, fix eye-color page/route sync (lensId), sample preset grids for dress/hair/shoes/bag` |

### CDN URL note
> The YouCam CDN (`plugins-media.makeupar.com/strapi/assets/`) uses hashed filenames that cannot be guessed from patterns. Confirmed URLs (earring product 04, necklace product 01, clothes 01/03, etc.) are used directly. For other presets (ring, hair, shoes, bag) the URLs follow the same pattern but the hashes were constructed from available naming evidence — if a URL 404s, the `onError` handler on each `<img>` hides it and shows a "Sample" placeholder text fallback. This is a graceful degradation; actual hash discovery requires YouCam docs playground inspection.

### Open issues

| Issue | Status |
|---|---|
| CDN hash discovery | Ring, hair, shoes, bag preset URLs have constructed hashes — need verification against live YouCam playground or docs. If they 404, users see a "Sample" fallback chip and can still upload their own. |
| Hair/Shoes/Bag live API test | Not yet tested end-to-end. |
| SegFormer sample CORS | If CDN URLs block CORS fetch in `handleSampleSelect`, `sourceFile` stays null and SegFormer is skipped — item is passed as URL to backend routes. Backend routes need to accept `garmentUrl`/`refUrl` fields (currently only dress-tryon does). |

---

## Session Update — 2026-11-01 (Editorial page visuals and typography)

### What was built

| Area | Detail |
|---|---|
| **Page inspiration sections** | Added a shared, route-aware inspiration section at the bottom of the dashboard, Studio, Wardrobe, Looks, Settings, makeup, eye-colour, nails, earring, ring, and necklace pages. Each section links to relevant try-on features and uses descriptive fashion/beauty imagery. |
| **Visual polish** | Added gentle entrance, glow drift, and image zoom effects using the existing theme tokens. All additions respect `prefers-reduced-motion`; cards remain keyboard focusable. |
| **Typography** | Switched the global display font to Playfair Display and body font to DM Sans. |
| **Preserved design** | Kept the existing dashboard hero/banner and white-and-coral theme unchanged. |

### Skipped and open checks

| Item | Status |
|---|---|
| **Responsive widths** | Rendered and reviewed the dashboard in the running app; explicit 390 px, 768 px, and 1280 px viewport checks remain. |
| **TypeScript** | `npx tsc --noEmit` was started but did not finish within the available check window; no diagnostics were returned before it was stopped. |

---

## Session Update — 2026-11-01 (Full Look Studio)

### What was built

| Area | Detail |
|---|---|
| **Full Look Studio** (`/app/full-look`) | Added a page to choose multiple categories across outfit, beauty, accessories, and jewellery. The selected look plan links to each existing try-on studio, so people can keep several previews open as they style a complete look. |
| **Navigation** | Added Full Look to app navigation and the dashboard studio shortcuts. |
| **Scope** | Each category still creates its preview in its existing studio. A single composited multi-category AI render is not implemented. |

### Open checks

| Item | Status |
|---|---|
| **Responsive widths** | 390 px, 768 px, and 1280 px review remains. |
| **TypeScript** | Not rerun after adding this page. |

---

## Session Update — 2026-11-01 (Clothing region mismatch recovery)

### What changed

| Area | Detail |
|---|---|
| **Garment coverage selection** | Dress Studio now sends YouCam the selected `garment_category` (`full_body`, `upper_body`, `lower_body`, or `auto`) and shows matching target-photo framing guidance. Built-in samples select their expected region. |
| **Sample references** | Replaced incorrectly named/composite dress samples with individual clothing references that match the sample coverage setting. |
| **Live photo requirement** | The live dress API no longer silently substitutes a face-only sample when no target photo is provided. Mock mode keeps its sample response. |
| **Recovery message** | `error_apply_region_mismatch` now returns a clear message explaining how to align the clothing coverage and person photo. |
| **Source** | Followed the [official AI Cloth V4 request and error guidance](https://docs.perfectcorp.com/reference/ai_clothes/v4.0/paths/~1s2s~1v2.0~1task~1cloth-v4/post): `garment_category` accepts the documented categories and mismatch means the source/reference apply regions do not match. |

### Verification

| Item | Status |
|---|---|
| **Studio render** | Confirmed the coverage selector and sample categories render in the running app. No live YouCam task was submitted. |
| **API guard** | Posted an empty local form to `/api/dress-tryon`; it returned HTTP 400 with the missing-photo guidance before any YouCam task could be created. |
| **Code check** | `git diff --check` found no whitespace errors. |

---

## Session Update — 2026-11-01 (Dress result placeholder and workflow guards)

### What changed

| Area | Detail |
|---|---|
| **Comparison slider** | Replaced the blue SVG stand-ins with the real uploaded photo and generated result in both animated and reduced-motion layouts. |
| **Failure state** | Dress try-on errors no longer set the source photo as if it were a successful result; failures stay in the error state. |
| **Garment preparation** | The next-step action stays disabled until sample loading and clothing isolation/saving finish. Changing or clearing a reference resets cached isolation data so a previous garment cannot be reused accidentally. |
| **Sample loading** | Dress sample load failures now display a clear message and cannot silently fall back to a different garment. |
| **Photo guidance** | Dress reference upload labels and hints now match the selected coverage. |

### Verification

| Item | Status |
|---|---|
| **Studio render** | Reloaded the running Studio and confirmed the garment selector, matching upload label, and hint render without a visible compile error. |
| **YouCam** | No live task was submitted during verification. |

## Session Update — 2026-11-01 (Cross-studio try-on error audit)

### What was checked and fixed

| Area | Detail |
|---|---|
| **Hair request wiring** | Hair Studio now sends the target face photo as `userPhoto`, matching the hair route. Live hair requests no longer silently substitute a stock face when the target photo is absent. |
| **Sample loading** | Remote samples are validated and normalized to JPEG before processing. A failed sample load stays on step 1 with an error instead of advancing without a reference image. |
| **Stale preview state** | Dropzone previews now follow their selected/cleared source, so choosing a new sample cannot leave the previous upload displayed. |
| **File type checks** | Dropzone and ImageInput now enforce the advertised accepted MIME types for both file-picker and drag/drop. JPG/PNG metadata is passed accurately to YouCam routes for accessories, makeup, nails, shoes, and bags. |
| **Request validation** | Hair rejects non-JPEG uploads per its endpoint constraints; shoe and bag routes reject unsupported formats and send the actual JPG/PNG MIME and filename. |
| **Success payload checks** | Earring, ring, necklace, and eye-colour screens now reject an `ok` response without a usable result URL instead of entering an empty success state. |
| **Legacy task API** | The unused `/api/tryon/start` and `/api/tryon/status` placeholders no longer fabricate a completed task and stock-photo result. They now return explicit not-implemented/not-found responses. |

### Findings still to address / limitations

| Finding | Status |
|---|---|
| **Legacy draping screen** | The screen now reports the unavailable legacy API honestly, marks its local garment composition as a non-AI mockup, and no longer presents request failure as success. |
| **Mock success imagery** | All active try-on result views display a demo notice when the API returns `mock: true`; it explains that the image is not generated from the uploaded photo. |
| **External product image links** | Selectable sample/reference images and inspiration thumbnails are stored locally under `public/samples`; user-pasted product URLs remain intentionally user-controlled. |
| **Live provider execution** | No real YouCam task was submitted in this audit; live provider errors and rendered fit quality remain unverified. |

### Verification

| Check | Result |
|---|---|
| **TypeScript** | `npx tsc --noEmit` passed. |
| **Patch whitespace** | `git diff --check` found no whitespace errors; Git printed line-ending conversion notices for existing Windows files. |
| **Production build** | `npm run build` passed after network access was allowed for the configured Google Fonts. The middleware convention deprecation was subsequently resolved by migrating to `src/proxy.ts`. |

## Session Update — 2026-11-01 (Remaining try-on risks closed)

### What changed

| Area | Detail |
|---|---|
| **Mock results** | Every active try-on result view reads the API's `mock` flag and displays a visible demo notice explaining that the result is a sample image, not an AI render of the user's photo. |
| **Local sample assets** | Downloaded and checked the existing hair, shoe, bag, jewellery, portrait, hand, and makeup-thumbnail images into `public/samples`. Replaced runtime Unsplash and YouCam CDN sample/image references with local assets. The original provider endpoints remain configurable server URLs, as required to call YouCam. |
| **Legacy draping screen** | Replaced optimistic “AI succeeded” messages after failures with a visible error. The canvas identifies its built-in composite as a styling mockup unless a generated image URL is returned. Progress timers are cleared after completion. |
| **Makeup request validation** | Corrected the eyebrow effect category typo from `eyelrows` to the official `eyebrows` schema. |
| **Next.js convention** | Migrated `src/middleware.ts` to the Next.js 16 `src/proxy.ts` convention without changing the Supabase session logic or matcher. |
| **Asset provenance** | Added `public/samples/README.md` documenting the original sample sources and purpose. |

### Verification

| Check | Result |
|---|---|
| **External sample links** | `rg` found no remaining Unsplash, YouCam CDN thumbnail, or Makeupar sample image URLs in application source. |
| **Provider calls** | No live YouCam job was submitted. |
| **TypeScript and production build** | `npx tsc --noEmit` and `npm run build` both passed. The build no longer reports a middleware deprecation. |

## Session Update — 2026-11-01 (Perfect Corp integration fixes)

### What changed

| Area | Detail |
|---|---|
| **Eye-colour request** | Uses the documented shared file uploader, sends API version `1.0` and the documented effect object, and rejects invalid lens PNG dimensions. |
| **Jewellery requests** | Ring and earring reference images are sent using the documented plural `ref_file_ids` / `ref_file_urls` fields. |
| **Hairstyle catalogue** | Live provider errors and malformed catalogue responses now return clear errors instead of fake template IDs; mock styles remain available only in mock mode. Catalogue cache respects page size and pagination token. |
| **Try-on result privacy** | Generated results are no longer copied into permanent public `public/uploads/results`; the provider's expiring result URL is returned. |
| **Dress framing guidance** | The final photo step now repeats the guidance for the selected garment coverage so its heading and upload instructions agree. |

### Verification

| Check | Result |
|---|---|
| **TypeScript** | `npx tsc --noEmit` passed. |
| **Production build** | App compilation passed; Next.js stopped at its type-check phase with Windows `spawn EPERM`. Standalone `npx tsc --noEmit` passed. |
| **Live YouCam** | No provider task submitted; production account behavior remains unverified. |

### Remaining documented limitation

The official Clothes V4 guide conflicts about target-photo framing: its workflow asks for a full-body photo, while its file-spec section says chest-up. The UI now consistently follows the selected garment coverage, but provider behavior for each region should be confirmed with a real account and representative photos.

## Session Update — 2026-11-01 (Private media and upload hardening)

### What changed

| Area | Detail |
|---|---|
| **Private media storage** | Added private Supabase bucket support for garment, body/hair, and result images. Account records use their existing row-level security, and returned previews use expiring signed URLs. Local development stores media under ignored `data/private-assets` and uses signed 10-minute app URLs. |
| **Saved wardrobe and hair** | Upload/list routes now bind assets to the authenticated account when Supabase is configured. Local development uses a local-demo owner. Public upload URLs are no longer created. |
| **Existing local uploads** | Moved valid existing wardrobe images and generated results out of `public/uploads`, removed the corrupt test garment, cleaned stale public URLs from records, and replaced dashboard references with packaged public sample art. `public/uploads` is now empty. |
| **Upload validation** | Added server checks for actual JPEG/PNG/WebP content, dimensions, file size, advertised MIME, and request body size across try-on routes and saved-image uploads. |
| **URL and path safety** | Restricted local file lookups to the public directory, rejected traversal, and limited user-provided provider image URLs to HTTPS public hostnames. Product-link labels now explain that a direct image link is required. |
| **Build compatibility** | Moved the bag style constant from a route handler into the shared YouCam library so Next.js accepts the route exports. |

### Verification

| Check | Result |
|---|---|
| **TypeScript** | `npx tsc --noEmit` passed. |
| **Production build** | `npm run build -- --webpack` passed, including TypeScript, all 40 static pages, and route collection. |
| **Private image link** | Local app returned a saved wardrobe image with HTTP 200 and `private, no-store` caching. An expired URL returned 404. |
| **Public upload folder** | Confirmed empty after migration. |

### Deployment setup still required

This workspace has no Supabase URL, anon key, or service-role key configured, so cloud storage could not be exercised here. Apply `supabase/migrations/002_private_storage.sql` and configure those server-side values before deployment. The app fails closed for private collection routes in production when storage is not configured.

The official Clothes V4 guide still conflicts about target-photo framing; no live YouCam task was submitted to verify provider behavior.

## Session Update — 2026-11-01 (Try-on access, quota, and saved data fixes)

### What changed

| Area | Detail |
|---|---|
| **Try-on usage limits** | Added per-user and guest daily limits plus an atomic global daily budget for all active YouCam try-on routes. `/api/usage` now reports real counters rather than fixed demo numbers. Local development uses a process-local counter; production requires configured Supabase quota storage and fails closed. |
| **Private generated Looks** | Signed-in try-on results are downloaded, validated, persisted in the private results bucket, and indexed in `generated_looks`. A result is no longer returned as a provider URL if private persistence fails. Guest results remain temporary provider links. |
| **Looks Gallery** | Removed hard-coded sample looks; gallery loads real saved looks with loading, error, and empty states. Favourite updates and deletion call authenticated APIs. |
| **Wardrobe deletion** | Added an owner-scoped deletion route for wardrobe metadata and private images; the page now waits for server success before removing the card. |
| **Profile and photo settings** | Profile name, privacy preference, default photo upload/removal, and actual usage data now use server routes. Default photos are privately stored with signed URLs. |
| **Account deletion** | Added server-side account and private media removal. The API requires an explicit `DELETE` confirmation string; the settings page sends it only after the user types the confirmation. Storage cleanup handles more than one 1,000-item page. |
| **Supabase key configuration** | Added current Supabase URL/publishable/secret variable names while retaining legacy aliases for compatibility. No key values were added to source files. |
| **Dress reference fallback** | Removed silent substitution of a stock garment when a selected/private reference cannot be loaded. |

### Verification and remaining setup

| Check | Result |
|---|---|
| **TypeScript** | `npx tsc --noEmit` passed. |
| **Patch check** | `git diff --check` passed; Git only reported expected Windows line-ending notices. |
| **Production build** | `npm run build -- --webpack` passed after running outside the restricted Windows process sandbox (the restricted run stopped at `spawn EPERM`). All 45 static pages and API routes compiled. |
| **Supabase integration** | Not connected in this workspace. Apply `supabase/migrations/002_private_storage.sql` to the project and configure `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SECRET_KEY` locally before production use. The Supabase secret posted in chat must be rotated and retired; it was not copied into the project. |
| **Live YouCam integration** | No provider task was submitted as part of this change. |
