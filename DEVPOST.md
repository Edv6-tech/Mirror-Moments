# Devpost Submission Form — Mirror Moment

### Project Title
**Mirror Moment — Skin & Style Intelligence**

### Elevator Pitch (One-line)
Mirror Moment tells you whether a skincare product is right for your unique skin before you buy it, then shows you how color-matched outfits look on you with YouCam Apparel Virtual Try-On.

### Tracks
- **Skin AI**
- **eCommerce VTO**

---

### Project Description

#### 💡 Inspiration
Today, fashion e-commerce suffers from return rates between 25% to 40% (compared to 8%–10% for non-fashion), while generic cosmetic scanner apps judge products in complete isolation from the buyer's skin barrier. A product labeled "95/100 safe" on a generic scanner may contain essential oils that trigger violent flare-ups in rosacea-prone skin, or clash with an existing retinol routine. Furthermore, skin tone and apparel decisions are treated as separate worlds in retail. 

We built **Mirror Moment** to answer two daily questions standing before a store shelf or checkout cart:
1. *Is this formulation safe and effective for MY current skin condition?*
2. *Will this color scheme flatter my face and complexion in real life?*

#### ⚙️ What it does
- **Instant YouCam Skin AI Diagnostic:** Reads 10 clinical metrics from a selfie via secure server proxy, deriving a clean, plain-language Top-3 Skin Priorities profile (e.g. Moisture Dehydration, Dark Circles, Enlarged Pores) and biological skin age.
- **Deterministic Personalized Verdicts:** Computes **BUY**, **PATCH-TEST FIRST**, or **SKIP** verdicts where every single reason links one specific ingredient to one identified concern with medical journal citations. 
- **Zero Unsafe BUY Guarantee:** Known irritants or cautions targeting a user's primary concern are strictly barred from BUY verdicts. Uncataloged ingredients cap formulas at PATCH-TEST FIRST.
- **Routine Stacking Conflict Engine:** Analyzes products across your concurrent skincare regimen to detect chemical clashes (e.g. Retinoids + AHAs, Retinoids + Benzoyl Peroxide).
- **Harmonized Apparel VTO:** Recommends curated color families (Navy, Earthy Olive, Minimal White) based on your skin profile and renders realistic high-resolution garments on your body using the **YouCam Apparel VTO API**.
- **Progressive Skin Health Tracking:** Visualizes weekly progress trends as your barrier recovers.

#### 🛠️ How we built it
- **Frontend:** React 19, TypeScript, and Vite built as an accessible mobile-first PWA adhering to WCAG AA contrast (>17:1) and minimum 44px tap targets.
- **Backend Proxy:** Node.js 20/24 Express server managing authenticated S2S Bearer token sessions with Perfect Corp's YouCam APIs (`/s2s/v2.0/file`, `/s2s/v2.0/task/skin-analysis`, `/s2s/v2.0/task/cloth`).
- **Unit Economics & Performance:** Multi-tiered cache architecture saving full fixture reports and try-on assets in `data/fixtures/` and logging usage in `evidence/api-log/` to protect API quota.
- **Local Rule Engine:** Hand-curated knowledge base of 81 cosmetic ingredients and deterministic matching rules grounded in European CosIng guidelines and FDA OTC monographs.

#### 📊 Challenges we ran into & Quality Evidence
- Precision in API integration: Tuning face framing requirements (>60% width) and handling image dimension constraints gracefully with user-facing guidance.
- Safety assurance: We authored a 30-case benchmark test suite crossing realistic formulations against four distinct skin archetypes. We achieved **86.7% expert label agreement** and **0 unsafe BUY recommendations**, proving the engine's reliability.

#### 🚀 What's next for Mirror Moment
- Expanding the garment catalog to partner fashion retail APIs.
- Real-time barcode scanning for in-store shelf scanning.
- Continuous multi-week skin simulation forecasting.

---

### Built With
- YouCam Skin AI API (Perfect Corp.)
- YouCam Apparel Virtual Try-On API (Perfect Corp.)
- React 19
- TypeScript
- Express
- Vite
- Vitest
