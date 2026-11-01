# Mirror Moment — Skin & Style Intelligence

> **Know before you buy. Skin and style, judged on your face.**  
> *Built for the YouCam API Skin AI & eCommerce VTO Hackathon (Tracks: Skin AI + eCommerce VTO)*

---

## 1. Problem Statement & Impact

Shoppers today stand in front of store shelves or scroll e-commerce product pages asking two fundamental questions:
1. *"Is this skincare product actually right for my unique skin, or will it break me out?"*
2. *"Will this outfit color and cut look flattering on me?"*

### The Industry Blindspot
- **Ingredient Scanners Judge in Isolation:** Mainstream cosmetic scanner apps score formulas on a generic 0–100 scale based on ingredient hazard lists. They have zero context of the shopper's individual skin barrier, cannot detect ingredient stacking conflicts inside a routine, and frequently mislabel safe actives as toxic.
- **Siloed Experiences:** Skincare analysis and apparel try-on live in completely disconnected apps, leaving consumers to guess how color schemes interact with their skin tone and facial vitality.
- **Costly Return Rates:** Apparel e-commerce suffers from return rates between **25% to 40%** (versus 8%–10% for non-fashion categories, *Videopoint* / *Style3D*), driven largely by color mismatch and fit uncertainty. Virtual try-on technology has been reported to drive up to a **320% conversion lift** (*Perfect Corp case studies*), but lacks personalization tied to skin undertone and vitality.

**Mirror Moment bridges this gap:** It scans your skin using **YouCam Skin AI**, maps your active skin concerns, evaluates skincare products deterministically with reason-by-reason evidence linking ingredients to your skin, detects routine stacking conflicts, and transitions into color-matched **YouCam Apparel Virtual Try-On**.

---

## 2. Core Features

- 📸 **Mobile-First Skin AI Scan:** Selfie upload and camera capture with automated face framing verification (>60% frame width, resolution guidance) powered by YouCam Skin AI.
- 🎯 **Top-3 Concern Profile:** Maps multi-concern metrics (`dark_circle_v2`, `moisture`, `pore`, `wrinkle`, `redness`, `acne`, `oiliness`, `texture`) to prioritized severity bars and plain-language guidance.
- 🧪 **Deterministic Verdict Engine:** 
  - Generates transparent **BUY**, **PATCH-TEST FIRST**, or **SKIP** verdicts.
  - Every reason explicitly links one ingredient to one concern from the user's scan with peer-reviewed literature citations.
  - **Zero Unsafe BUY Guarantee:** Known irritants or cautions for a user's primary concern are strictly barred from receiving a BUY verdict.
  - **Unknown Ingredient Safeguard:** Any uncataloged botanical or synthetic ingredient caps the verdict at PATCH-TEST FIRST.
- ⚡ **Routine Conflict Detection:** Evaluates cross-product ingredient interactions (e.g. Retinoids + AHAs, Retinoids + Benzoyl Peroxide) to prevent barrier compromise.
- 👗 **Color Harmonization & Apparel VTO:** Stylist engine recommends color families (e.g. Navy, Sage Olive, Crisp White) based on skin tone and redness levels, rendering instant garment try-ons on the user's photo.
- 📈 **Weekly Progress Tracking:** Visualizes 4-week skin health index progression.
- 🔒 **Privacy-First Architecture:** Photos are streamed ephemerally through an authenticated server-side proxy and are **never stored permanently** on disk or logged in telemetry.

---

## How it works

Mirror Moment connects a Next.js App Router frontend to Perfect Corp's official YouCam API via a dedicated server module (`youcamClient`):

1. **Virtual Dress Try-On (`POST /api/dress-tryon`)**:
   - Takes your photo and a garment reference image.
   - Uploads both images through YouCam File API (`POST /s2s/v2.0/file`) to obtain secure presigned S3 storage identifiers (`src_file_id`, `ref_file_id`).
   - Dispatches a try-on task via `POST /s2s/v2.0/task/cloth-v4` with `garment_category: "full_body"`.
   - Polls `GET /s2s/v2.0/task/cloth-v4/{task_id}` until completion, caches the result locally, and renders a before/after comparison slider.

2. **AI Hairstyle & Color (`POST /api/hair-tryon`, `GET /api/hair-templates`)**:
   - Requires a front-facing face photo with visible shoulders.
   - Calls `POST /s2s/v2.1/task/hair-transfer` using a chosen template ID or custom reference image.
   - Caches official YouCam template lists for 1 hour. Hair color is marked *coming soon* to guarantee zero fake endpoints.

3. **Virtual Makeup Try-On (`POST /api/makeup-tryon`)**:
   - Dynamically compiles palettes for enabled cosmetics: lipstick (color, texture matte/gloss/satin, intensity), eyeshadow, blush, and foundation.
   - Dispatches `POST /s2s/v2.0/task/makeup-vto` with version `"1.0"`.

4. **Face Retouch & Glow (`POST /api/retouch`)**:
   - Maps skin smoothing to the documented `skin_smooth` palette inside `makeup-vto` and teeth whitening to `POST /s2s/v2.0/task/teeth-whitening`.

5. **Mock Mode & Safety**:
   - Setting `YOUCAM_MOCK=true` runs zero-unit simulated executions with 2-second timing for UI testing and reviews.
   - Secret API keys remain strictly server-side and are never exposed to the client.

---

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile Web UI                          │
│               React 19 + TypeScript + Vite                  │
│       (ScanScreen, SkinProfileView, ProductChecker,         │
│          RoutineView, VirtualTryOnView, ProgressView)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / Multipart
┌──────────────────────────────▼──────────────────────────────┐
│                  Server Proxy (Express + Node)              │
│       • Authenticated S2S Bearer token handling             │
│       • Response caching (CACHE_DIR / data/fixtures)        │
│       • Telemetry logger (evidence/api-log)                 │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼──────────────┐
│     YouCam Skin AI API      │ │    YouCam Apparel VTO       │
│  • /s2s/v2.0/file           │ │  • /s2s/v2.0/file           │
│  • /s2s/v2.0/task/skin-     │ │  • /s2s/v2.0/task/cloth     │
│    analysis                 │ │  • S3 presigned asset upload│
└─────────────────────────────┘ └─────────────────────────────┘
               ▲                               ▲
┌──────────────┴───────────────────────────────┴──────────────┐
│                 Local Verdict Engine (Code)                 │
│  • Parser: INCI tokenization, synonym resolution            │
│  • Matcher: Concern rules + formula conflict rules          │
│  • Scorer: Deterministic BUY / PATCH-TEST / SKIP            │
│  • Knowledge Base: 81 curated ingredients (CosIng / FDA)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. YouCam API Integration & Unit Economics

### Endpoints Implemented
1. **File Management (`POST /s2s/v2.0/file`):** 
   - Registers user selfie and garment references.
   - Streams image binaries directly via presigned Amazon S3 upload URLs.
2. **Skin AI Analysis (`POST /s2s/v2.0/task/skin-analysis`):**
   - Dispatches asynchronous diagnostic tasks with target action metrics: `["wrinkle", "pore", "texture", "acne", "age_spot", "redness", "oiliness", "moisture", "dark_circle_v2", "skin_type"]`.
   - Polls task status and unpacks detailed `score_info.json` report containing raw scores, UI scores, skin age, and diagnostic overlays.
3. **Apparel Virtual Try-On (`POST /s2s/v2.0/task/cloth`):**
   - Submits `src_file_id` (user photo) and `ref_file_id` (garment).
   - Polls task status until rendering completes, returning direct S3 rendered image URLs.

### Unit Protection & Caching Strategy
- The account has approximately 1,000 free API units.
- **Aggressive Caching:** All successful diagnostic reports and rendered try-ons are cached under `data/fixtures/` keyed by garment/photo identifiers.
- Re-querying an existing try-on or demo profile returns in **< 10ms** with **0 API units consumed**.
- Telemetry logs with scrubbed secrets and zero image data are saved in `evidence/api-log/`.

---

## 5. Measured Quality Evidence

To guarantee consumer safety and substantiate our claims, we built a 30-case benchmark test suite (`quality/testset.json`) crossing realistic formulations against four distinct skin archetypes (Sensitive/Redness, Dry/Dehydrated, Oily/Acne-prone, and Mature/Hyperpigmented).

| Metric | Target | Measured Result | Status |
| :--- | :--- | :--- | :--- |
| **Unsafe BUY Results** | **0** | **0** | ✅ **PASS** |
| **Expert Label Agreement** | >= 85.0% | **86.7%** (26/30) | ✅ **PASS** |
| **Formula Conflicts Caught** | All active conflicts | **4 of 4 caught** | ✅ **PASS** |

*Full quality report with individual test cases available at [`evidence/quality/quality-report.md`](evidence/quality/quality-report.md).*

---

## 6. Quickstart Guide

### Prerequisites
- Node.js v20+ (tested on v24)
- npm v10+

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd fashion
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your YouCam API key to `.env`:
   ```env
   YOUCAM_API_KEY=your_key_here
   YOUCAM_BASE_URL=https://yce-api-01.makeupar.com
   PORT=3001
   DEMO_MODE=false
   ```

4. **Run the Application:**
   ```bash
   npm run dev
   ```
   - Express Proxy Server: `http://localhost:3001`
   - Frontend Vite Web App: `http://localhost:5173`

5. **Run the Quality & Acceptance Test Suite:**
   ```bash
   # Run Vitest unit tests
   npm test

   # Run the 30-case quality evaluation
   npm run quality
   ```

---

## 7. Accessibility & Mobile Optimization

- **Color Contrast:** Base UI text contrast is **17.5:1** (#F8FAFC on #0B0F19), far exceeding the WCAG AA 4.5:1 standard.
- **Tap Targets:** Every button, select, and interactive element enforces a minimum touch target size of **44px × 44px**.
- **Keyboard Navigation:** Full focus ring visibility with semantic HTML and ARIA labels.
- **Multimodal Verdicts:** Verdicts are conveyed simultaneously through text labels, distinct icons (Checkmark, Triangle, X-Circle), and color coding.

---

## 8. Disclaimers & Regulatory Notice

- **Not Medical Advice:** Mirror Moment provides cosmetic shopping decision support only. It does not diagnose, treat, prevent, or cure any medical or dermatological condition.
- **Concentration Disclaimer:** Standard cosmetic ingredient declarations list ingredients in descending order of predominance but do not disclose exact percentage concentrations. Verdicts provide probabilistic safety screening, not clinical certainty.

---

## 9. Data Sources & Scientific References

- **EU CosIng:** Cosmetic Ingredient Database, European Commission Directorate-General for Internal Market, Industry, Entrepreneurship and SMEs.
- **FDA OTC Drug Monographs:** Title 21 of the Code of Federal Regulations (Acne and Skin Protectant products).
- **Mukherjee S, et al.** *Retinoids in the treatment of skin aging: an overview of clinical efficacy and safety.* Clin Interv Aging. 2006.
- **Tang SC, Yang JH.** *Dual Effects of Alpha-Hydroxy Acids on the Skin.* Molecules. 2018.
- **Arif T.** *Salicylic acid as a peeling agent: a comprehensive review.* Clin Cosmet Investig Dermatol. 2015.
- **Draelos ZD, et al.** *Niacinamide-containing facial moisturizer improves skin barrier and benefits subjects with rosacea.* Cutis. 2005.
