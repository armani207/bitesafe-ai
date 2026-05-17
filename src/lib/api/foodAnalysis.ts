import { HealthProfile, MealAnalysis, FoodItem, MealSuggestion, RiskLevel } from '@/types/health';

const SUPABASE_URL_RAW = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// In dev, use the Vite proxy to bypass Cursor's browser sandbox
const _origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
const SUPABASE_URL = import.meta.env.DEV ? `${_origin}/supabase-proxy` : SUPABASE_URL_RAW;

function logDevError(...args: unknown[]) {
  if (import.meta.env.DEV) console.error(...args);
}

function buildNonFoodMeal(imageBase64: string, suggestions: MealSuggestion[]): MealAnalysis {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    imageUrl: imageBase64,
    isNonFood: true,
    foods: [],
    totalCarbs: { min: 0, max: 0 },
    totalProtein: 0,
    totalFat: 0,
    totalCalories: 0,
    totalFiber: 0,
    totalSugar: 0,
    riskLevel: 'low',
    riskScore: 0,
    riskExplanation: 'No food detected in the image.',
    suggestions,
    tips: [],
    saved: false,
  };
}

/** Check if a real API key is configured (either backend Edge Function or local dev key) */
export function hasApiKey(): boolean {
  // In all environments, analysis must go through the Edge Function.
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// ========== Edge Function (production) ==========
// API key lives server-side — never exposed in the browser.
async function callEdgeFunction(
  imageBase64: string,
  accessToken: string,
  healthProfile?: HealthProfile | null
): Promise<Record<string, unknown>> {
  const url = `${SUPABASE_URL}/functions/v1/analyze-food`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        imageBase64,
        healthProfile: healthProfile ?? undefined,
      }),
    });
  } catch (fetchErr) {
    logDevError('[EdgeFn] fetch error:', fetchErr);
    throw new Error('Network error — could not reach the server. Check your internet connection.');
  }

  if (!res.ok) {
    const errBody = await res.text();
    logDevError('[EdgeFn] error:', res.status, errBody);
    let msg = 'Analysis failed';
    try {
      const parsed = JSON.parse(errBody);
      msg = parsed.error || msg;
    } catch { /* not JSON */ }

    if (res.status === 401) throw new Error('Session expired. Please refresh and try again.');
    if (res.status === 429) throw new Error(msg);
    throw new Error(msg);
  }

  const body = await res.json();
  if (!body.success || !body.analysis) {
    throw new Error(body.error || 'No analysis returned from server.');
  }
  return body.analysis;
}

// ========== Main entry point ==========

export async function analyzeFoodImage(
  imageInput: { base64?: string; url?: string },
  healthProfile?: HealthProfile | null,
  /** Pass the Supabase access_token so we can call the Edge Function securely */
  accessToken?: string | null
): Promise<MealAnalysis> {
  const imageBase64 = imageInput.base64 || imageInput.url || '';
  if (!imageBase64) throw new Error('No image provided');

  if (!accessToken || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Session missing. Please sign in again and retry.');
  }
  const analysis: Record<string, unknown> = await callEdgeFunction(imageBase64, accessToken, healthProfile);

  const nonFoodSuggestions: MealSuggestion[] = [
    {
      id: 'non-food-1',
      icon: '🍽️',
      text: 'To get a nutritional analysis, please upload an image that clearly shows food items.',
      type: 'add',
    },
    {
      id: 'non-food-2',
      icon: '📷',
      text: 'Ensure your food is well-lit and centered in the frame for the best analysis.',
      type: 'add',
    },
  ];

  const typed = analysis as {
    isFood?: boolean;
    foods: FoodItem[];
    totalCarbs: { min: number; max: number };
    totalProtein: number;
    totalFat: number;
    totalCalories: number;
    totalFiber: number;
    totalSugar: number;
    riskLevel: RiskLevel;
    riskScore: number;
    riskExplanation: string;
    suggestions: MealSuggestion[];
    tips: string[];
  };

  const foods = Array.isArray(typed.foods) ? typed.foods : [];
  const noFoods = foods.length === 0;
  const textBlob = `${typed.riskExplanation ?? ''} ${
    Array.isArray(typed.suggestions) ? typed.suggestions.map((s) => s?.text ?? '').join(' ') : ''
  } ${Array.isArray(typed.tips) ? typed.tips.join(' ') : ''}`.toLowerCase();

  const explicitNonFoodText =
    /no food|non[-\s]?food|not food|does not contain food|doesn't contain food|no edible food/.test(textBlob) ||
    /upload.*food|image.*food/.test(textBlob);

  const allZeroMetrics =
    (typed.totalCarbs?.min ?? 0) <= 0 &&
    (typed.totalCarbs?.max ?? 0) <= 0 &&
    (typed.totalProtein ?? 0) <= 0 &&
    (typed.totalFat ?? 0) <= 0 &&
    (typed.totalCalories ?? 0) <= 0 &&
    (typed.totalFiber ?? 0) <= 0 &&
    (typed.totalSugar ?? 0) <= 0 &&
    (typed.riskScore ?? 0) <= 0;

  const inferNonFood = typed.isFood === false || (noFoods && (explicitNonFoodText || allZeroMetrics));
  if (inferNonFood) {
    return buildNonFoodMeal(imageBase64, nonFoodSuggestions);
  }

  if (!typed.foods || !Array.isArray(typed.foods)) {
    throw new Error('AI could not identify foods. Try a clearer photo.');
  }

  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    imageUrl: imageBase64,
    foods: typed.foods.map(food => ({
      name: food.name,
      portion: food.portion,
      carbsGrams: food.carbsGrams ?? 0,
      proteinGrams: food.proteinGrams ?? 0,
      fatGrams: food.fatGrams ?? 0,
      fiberGrams: food.fiberGrams ?? 0,
      caloriesKcal: food.caloriesKcal ?? 0,
      sugarGrams: food.sugarGrams ?? 0,
      glycemicIndex: food.glycemicIndex,
    })),
    totalCarbs: typed.totalCarbs ?? { min: 0, max: 0 },
    totalProtein: typed.totalProtein ?? 0,
    totalFat: typed.totalFat ?? 0,
    totalCalories: typed.totalCalories ?? 0,
    totalFiber: typed.totalFiber ?? 0,
    totalSugar: typed.totalSugar ?? 0,
    riskLevel: typed.riskLevel ?? 'medium',
    riskScore: typed.riskScore ?? 50,
    riskExplanation: typed.riskExplanation ?? '',
    suggestions: typed.suggestions ?? [],
    tips: typed.tips ?? [],
    saved: false,
  };
}

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
