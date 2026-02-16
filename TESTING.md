# BiteSafe Pre-Deploy Testing Plan

Run this before deploying. The AI calorie/nutrition analysis is the core feature — validate it works, then stress-test the app.

---

## 1. AI Calorie Tracking — Does It Actually Work?

The real analysis runs when you **upload or capture a photo** (not the "Demo Analysis" button, which returns fake data). The flow: [ScanUploader](src/components/scan/ScanUploader.tsx) → [analyzeFoodImage](src/lib/api/foodAnalysis.ts) → Supabase Edge Function [analyze-food](supabase/functions/analyze-food/index.ts) → AI service (LOVABLE_API_KEY).

### Manual Test Checklist

**Prerequisites:** App running locally (`npm run dev`), Supabase project with `analyze-food` Edge Function deployed and secrets set (`LOVABLE_API_KEY`, `CORS_ALLOWED_ORIGINS`, `SUPABASE_SERVICE_ROLE_KEY`). Must be online (not demo/offline mode).

| Test | What to do | Pass criteria |
|------|------------|---------------|
| Simple meal | Photo of a single plate (e.g. chicken + rice) | Foods detected, calories/carbs in reasonable range for the meal |
| Complex meal | Photo of mixed dish (e.g. salad with protein, sauce) | Multiple items identified, totals add up sensibly |
| Common carbs | Photo of pasta, bread, fries | Carbs highlighted, risk level reflects glycemic impact |
| Small portion | Photo of a small snack | Portion estimated, numbers scaled down |
| Large portion | Photo of a big meal | Portion and totals scale up |
| Bad photo | Blurry, dark, or non-food image | Graceful error or "could not identify" — no crash |
| Health profile | Onboard with diabetes type, allergies, goals | Suggestions and risk take profile into account |

**Sanity check for calories:** For a typical lunch (e.g. sandwich, chips, drink), total calories should roughly sit in the 400–800 kcal range. Carbs for 1 cup of rice ≈ 40–50g. Use these as ballpark checks.

---

## 2. Stress & Edge-Case Testing

### Rate limiting

- **Limit:** 30 scans per hour per user ([analyze-food](supabase/functions/analyze-food/index.ts) line 5).
- **Test:** Run 31 scans in an hour (or trigger the limit another way). Expect a clear rate-limit error (429) and no crash.

### Large images

- **Limit:** 10MB for base64, enforced in the Edge Function.
- **Test:** Upload a large image. Expect either rejection or success after compression. No timeouts or silent failures.

### Network failures

- **Test:** Disconnect network during a scan. Expect an error message and, for demo users, fallback to sample analysis (see [ScanPage](src/pages/ScanPage.tsx) `analyzeWithAI`).
- **Test:** With Supabase unreachable, app should still load (e.g. demo mode) and not hang.

### Invalid input

- **Test:** Try uploading a non-image (PDF, text). Expect validation error from [validateImageFile](src/lib/imageUtils.ts).
- **Test:** Try a corrupted or unsupported image format. Expect a clear error, no crash.

---

## 3. Automated Tests (Optional but Recommended)

Vitest is already set up. You can add tests for:

- **`foodAnalysis.ts`:** Mock `supabase.functions.invoke` and assert the response is correctly transformed into `MealAnalysis`.
- **`imageUtils.ts`:** Test `validateImageFile` (allowed formats, size limits) and `compressImage` (output size, format).
- **`ScanPage` error handling:** Mock `analyzeFoodImage` to reject and assert error state and retry behavior.

Run with: `npm run test`.

---

## 4. Quick Smoke Test Before Deploy

1. `npm run build` — succeeds
2. `npm run test` — passes (if tests exist)
3. Go through onboarding once — saves profile
4. Upload one real meal photo — get analysis (not demo)
5. Save the meal — appears in History
6. View meal detail — PDF export works (if used)
7. Profile page — loads and shows data
8. Bottom nav — all routes work, refresh doesn’t 404

---

## 5. Things to Watch

- **Demo vs real analysis:** "Demo Analysis" uses `generateDemoAnalysis()` — fake data. Real analysis requires Supabase + Edge Function + `LOVABLE_API_KEY`.
- **Offline mode:** Demo users get fallback sample analysis on network errors. Logged-in users get an error.
- **Rate limits:** 30 scans/hour; suggest users wait if they hit the limit.
- **AI quality:** Nutrition estimates are approximate. Add disclaimers in UI and avoid using for insulin dosing.
