import { HealthProfile, MealAnalysis, FoodItem, MealSuggestion, RiskLevel } from '@/types/health';

const GOOGLE_AI_KEY = import.meta.env.VITE_GOOGLE_AI_KEY;
const SUPABASE_URL_RAW = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// In dev, use the Vite proxy to bypass Cursor's browser sandbox
const _origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
const SUPABASE_URL = import.meta.env.DEV ? `${_origin}/supabase-proxy` : SUPABASE_URL_RAW;

/** Check if a real API key is configured (either backend Edge Function or local dev key) */
export function hasApiKey(): boolean {
  // In production, the Edge Function has the key server-side.
  // We consider the API "available" if Supabase is configured OR a local dev key exists.
  return Boolean(
    (SUPABASE_URL && SUPABASE_ANON_KEY) ||
    (GOOGLE_AI_KEY && GOOGLE_AI_KEY.trim().length > 0)
  );
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
    console.error('[EdgeFn] fetch error:', fetchErr);
    throw new Error('Network error — could not reach the server. Check your internet connection.');
  }

  if (!res.ok) {
    const errBody = await res.text();
    console.error('[EdgeFn] error:', res.status, errBody);
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

// ========== Direct Gemini (dev-only fallback) ==========
// Used when VITE_GOOGLE_AI_KEY is set locally (dev mode) and no Supabase session exists.
async function callGeminiDirect(imageBase64: string, healthProfile?: HealthProfile | null): Promise<Record<string, unknown>> {
  if (!GOOGLE_AI_KEY) {
    throw new Error('No AI API key configured. Please contact support.');
  }

  const profileContext = healthProfile
    ? `\nUser: ${healthProfile.diabetesType} diabetes, ${healthProfile.usesInsulin ? 'uses insulin' : 'no insulin'}, age ${healthProfile.age}, ${healthProfile.weight}kg, ${healthProfile.activityLevel} activity. Goals: ${healthProfile.goals.map(g => g.name).join(', ') || 'none'}. Allergies: ${healthProfile.allergies.join(', ') || 'none'}.`
    : '';

  const systemPrompt = `You are an expert nutritionist AI for BiteSafe, a diabetes-focused food scanner.

CRITICAL INSTRUCTIONS:
1. Look VERY carefully at the actual food in the image. Identify each distinct food item you can see.
2. Do NOT guess or hallucinate foods that are not visible. Only list what you can clearly see.
3. Estimate portions based on visual cues (plate size, food proportions, depth).
4. Use USDA nutritional data for accurate macronutrient values.
5. Be specific with food names.

Respond ONLY with a valid JSON object (no markdown fences). Use this schema:
{
  "foods": [{"name":"string","portion":"string","carbsGrams":0,"proteinGrams":0,"fatGrams":0,"fiberGrams":0,"caloriesKcal":0,"sugarGrams":0,"glycemicIndex":null}],
  "totalCarbs":{"min":0,"max":0},"totalProtein":0,"totalFat":0,"totalCalories":0,"totalFiber":0,"totalSugar":0,
  "riskLevel":"low|medium|high","riskScore":0,"riskExplanation":"string",
  "suggestions":[{"id":"1","icon":"emoji","text":"string","type":"portion|swap|add|activity|timing"}],
  "tips":["string"]
}
This is decision support, NOT medical advice.`;

  const userPrompt = `${profileContext}\n\nCarefully examine this food image and provide complete nutritional analysis with blood sugar risk assessment.`;

  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: systemPrompt + '\n\n' + userPrompt },
          { inlineData: { mimeType, data: base64Data } },
        ]}],
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
      }),
    });
  } catch (fetchErr) {
    console.error('[Gemini] fetch error:', fetchErr);
    throw new Error('Network error — could not reach Google AI.');
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error('[Gemini] error:', res.status, errText);
    let googleMsg = '';
    try { googleMsg = JSON.parse(errText)?.error?.message || ''; } catch { /* */ }

    if (res.status === 400 && errText.includes('API_KEY')) throw new Error('Invalid Google AI key.');
    if (res.status === 403) throw new Error('API not enabled. Enable the Generative Language API.');
    if (res.status === 429) throw new Error(googleMsg.includes('limit: 0') ? 'No free quota. Get a key from aistudio.google.com/apikey.' : 'Rate limited — try again shortly.');
    throw new Error(`AI error (${res.status}): ${googleMsg || 'Unknown'}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts?.length) throw new Error('No analysis returned from AI.');

  let fullText = '';
  for (const part of parts) { if (part.text) fullText += part.text; }
  if (!fullText) throw new Error('No analysis returned from AI.');

  let jsonStr = fullText.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);

  try { return JSON.parse(jsonStr); }
  catch { throw new Error('AI returned invalid data. Try a clearer photo.'); }
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

  let analysis: Record<string, unknown>;
  let usedEdgeFunction = false;

  // Prefer Edge Function (production path) — API key is server-side, never in the browser
  if (accessToken && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      analysis = await callEdgeFunction(imageBase64, accessToken, healthProfile);
      usedEdgeFunction = true;
    } catch (edgeErr) {
      console.warn('[BiteSafe] Edge Function failed, falling back to direct:', edgeErr);
      analysis = await callGeminiDirect(imageBase64, healthProfile);
    }
  } else {
    analysis = await callGeminiDirect(imageBase64, healthProfile);
  }

  const typed = analysis as {
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
    isDemo: false,
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
