# Quality Evidence Report — Mirror Moment Local Verdict Engine

**Evaluation Date:** 2026-10-29T15:43:55.278Z  
**Test-set Version:** 1.0.0  
**Target Met:** ✅ YES (Zero Unsafe BUYs)  

## Metric Summary

| Metric | Target | Measured Result | Status |
| :--- | :--- | :--- | :--- |
| **Unsafe BUY Results** | **0** | **0** | ✅ PASS |
| **Expert Label Agreement** | >= 85.0% | **86.7%** (26/30) | ✅ PASS |
| **Formula Conflicts Caught** | All active conflicts | **4 caught** | ✅ PASS |

## Test Case Results

| ID | Test Scenario | Profile | Expected | Actual | Unsafe BUY? | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| tc_01 | Ceramide Barrier Cream on Dry Skin | `profile_dry` | `BUY` | `BUY` | None | ✅ |
| tc_02 | Ceramide Barrier Cream on Sensitive Skin | `profile_sensitive` | `BUY` | `BUY` | None | ✅ |
| tc_03 | Alcohol Astringent on Sensitive Skin | `profile_sensitive` | `SKIP` | `SKIP` | None | ✅ |
| tc_04 | Alcohol Astringent on Dry Skin | `profile_dry` | `SKIP` | `PATCH-TEST FIRST` | None | ⚠️ Disagreement |
| tc_05 | Retinoid + AHA Conflict Peel on Sensitive | `profile_sensitive` | `SKIP` | `SKIP` | None | ✅ |
| tc_06 | Retinoid + AHA Conflict Peel on Aging | `profile_aging_spots` | `SKIP` | `SKIP` | None | ✅ |
| tc_07 | Retinoid + Benzoyl Peroxide on Acne | `profile_acne` | `SKIP` | `SKIP` | None | ✅ |
| tc_08 | Salicylic Acid 2% on Acne Skin | `profile_acne` | `BUY` | `BUY` | None | ✅ |
| tc_09 | Salicylic Acid on Sensitive Skin | `profile_sensitive` | `PATCH-TEST FIRST` | `SKIP` | None | ⚠️ Disagreement |
| tc_10 | Pure Vitamin C 15% on Aging/Spots | `profile_aging_spots` | `BUY` | `BUY` | None | ✅ |
| tc_11 | Pure Vitamin C on Sensitive Skin | `profile_sensitive` | `PATCH-TEST FIRST` | `SKIP` | None | ⚠️ Disagreement |
| tc_12 | Uncataloged Herb Elixir on Dry Skin | `profile_dry` | `PATCH-TEST FIRST` | `PATCH-TEST FIRST` | None | ✅ |
| tc_13 | Uncataloged Herb Elixir on Acne Skin | `profile_acne` | `PATCH-TEST FIRST` | `PATCH-TEST FIRST` | None | ✅ |
| tc_14 | Uncataloged Herb Elixir on Sensitive Skin | `profile_sensitive` | `PATCH-TEST FIRST` | `PATCH-TEST FIRST` | None | ✅ |
| tc_15 | Uncataloged Herb Elixir on Aging Skin | `profile_aging_spots` | `PATCH-TEST FIRST` | `PATCH-TEST FIRST` | None | ✅ |
| tc_16 | Niacinamide 10% + Zinc on Acne Skin | `profile_acne` | `BUY` | `BUY` | None | ✅ |
| tc_17 | Niacinamide on Sensitive Skin | `profile_sensitive` | `BUY` | `BUY` | None | ✅ |
| tc_18 | Fragrance Heavy Cream on Sensitive Skin | `profile_sensitive` | `SKIP` | `SKIP` | None | ✅ |
| tc_19 | Fragrance Heavy Cream on Acne Skin | `profile_acne` | `PATCH-TEST FIRST` | `PATCH-TEST FIRST` | None | ✅ |
| tc_20 | Retinol Serum on Aging/Spots Skin | `profile_aging_spots` | `BUY` | `BUY` | None | ✅ |
| tc_21 | Retinol Serum on Sensitive Skin | `profile_sensitive` | `PATCH-TEST FIRST` | `PATCH-TEST FIRST` | None | ✅ |
| tc_22 | Benzoyl Peroxide on Sensitive Skin | `profile_sensitive` | `PATCH-TEST FIRST` | `SKIP` | None | ⚠️ Disagreement |
| tc_23 | Benzoyl Peroxide on Acne Skin | `profile_acne` | `BUY` | `BUY` | None | ✅ |
| tc_24 | Centella Asiatica Soother on Sensitive | `profile_sensitive` | `BUY` | `BUY` | None | ✅ |
| tc_25 | Glycolic Acid 10% on Aging Skin | `profile_aging_spots` | `BUY` | `BUY` | None | ✅ |
| tc_26 | Glycolic Acid 10% on Sensitive Skin | `profile_sensitive` | `PATCH-TEST FIRST` | `PATCH-TEST FIRST` | None | ✅ |
| tc_27 | Multi-Ceramide Cream on Aging Skin | `profile_aging_spots` | `PATCH-TEST FIRST` | `PATCH-TEST FIRST` | None | ✅ |
| tc_28 | Retinoid + BHA Conflict on Acne Skin | `profile_acne` | `SKIP` | `SKIP` | None | ✅ |
| tc_29 | Mineral Zinc Oxide Sunscreen on Sensitive | `profile_sensitive` | `BUY` | `BUY` | None | ✅ |
| tc_30 | Alpha-Arbutin + Tranexamic on Spots | `profile_aging_spots` | `BUY` | `BUY` | None | ✅ |

*Methodology: Grounded in EU CosIng regulations, FDA OTC monographs, and peer-reviewed dermatology literature cited in `data/rules.json`.*
