import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const DEFAULT_ALLOWED_ORIGINS = [
  'https://bitesafe.ai',
  'https://www.bitesafe.ai',
  'http://localhost:5173',
  'http://localhost:8080',
];

const ALLOWED_ORIGINS = ((Deno.env.get('CORS_ALLOWED_ORIGINS') || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean));
const EFFECTIVE_ALLOWED_ORIGINS = ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : DEFAULT_ALLOWED_ORIGINS;
const SCANS_PER_HOUR = 30;
const NON_FOOD_SUGGESTIONS = [
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
] as const;

function buildNonFoodPayload() {
  return {
    isFood: false,
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
    suggestions: [...NON_FOOD_SUGGESTIONS],
    tips: [],
  };
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function isLikelyNonFood(analysis: unknown): boolean {
  if (!analysis || typeof analysis !== 'object') return false;
  const row = analysis as {
    isFood?: boolean;
    foods?: unknown[];
    totalCalories?: number;
    totalProtein?: number;
    totalFat?: number;
    totalFiber?: number;
    totalSugar?: number;
    totalCarbs?: { min?: number; max?: number };
    riskScore?: number;
    riskExplanation?: string;
    suggestions?: Array<{ text?: string }>;
    tips?: string[];
  };

  if (row.isFood === false) return true;

  const foods = Array.isArray(row.foods) ? row.foods : [];
  const hasAnyFoods = foods.length > 0;
  if (hasAnyFoods) return false;

  const riskText = typeof row.riskExplanation === 'string' ? row.riskExplanation : '';
  const suggestionText = Array.isArray(row.suggestions)
    ? row.suggestions.map((s) => (typeof s?.text === 'string' ? s.text : '')).join(' ')
    : '';
  const tipsText = Array.isArray(row.tips) ? row.tips.join(' ') : '';
  const combinedText = `${riskText} ${suggestionText} ${tipsText}`.toLowerCase();

  const explicitNonFoodText =
    /no food|non[-\s]?food|not food|does not contain food|doesn't contain food|no edible food/.test(combinedText) ||
    /upload.*food|image.*food/.test(combinedText);

  const carbsMin = toNumber(row.totalCarbs?.min);
  const carbsMax = toNumber(row.totalCarbs?.max);
  const riskScore = toNumber(row.riskScore);
  const allZeroMetrics =
    toNumber(row.totalCalories) <= 0 &&
    toNumber(row.totalProtein) <= 0 &&
    toNumber(row.totalFat) <= 0 &&
    toNumber(row.totalFiber) <= 0 &&
    toNumber(row.totalSugar) <= 0 &&
    carbsMin <= 0 &&
    carbsMax <= 0 &&
    riskScore <= 0;

  return explicitNonFoodText || allZeroMetrics;
}

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && EFFECTIVE_ALLOWED_ORIGINS.includes(origin)
      ? origin
      : EFFECTIVE_ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

interface HealthProfile {
  diabetesType: string;
  usesInsulin: boolean;
  conditions: { id: string; name: string }[];
  goals: { id: string; name: string }[];
  allergies: string[];
  dietaryRestrictions: string[];
  age: number;
  weight: number;
  height: number;
  bodyFatPercentage?: number;
  gender: string;
  activityLevel: string;
}

interface FoodAnalysisRequest {
  imageBase64: string;
  healthProfile?: HealthProfile;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');

  // Reject unauthorized origins before generating any CORS headers
  if (origin && !EFFECTIVE_ALLOWED_ORIGINS.includes(origin)) {
    return new Response(
      JSON.stringify({ error: 'Origin not allowed' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const corsHeaders = getCorsHeaders(origin);
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing authentication' }),
        { status: 401, headers: jsonHeaders }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: jsonHeaders }
      );
    }

    const userId = user.id;

    // Rate limiting: atomic check-and-increment to prevent race conditions
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const endpoint = 'analyze-food';
    if (serviceRoleKey) {
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        serviceRoleKey
      );
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Step 1: Reset expired windows (older than 1 hour)
      await adminClient
        .from('api_rate_limits')
        .update({ request_count: 0, window_start: now.toISOString() })
        .eq('user_id', userId)
        .eq('endpoint', endpoint)
        .lt('window_start', oneHourAgo.toISOString());

      // Step 2: Insert row for first-time users only; skip if row already exists
      await adminClient.from('api_rate_limits').upsert({
        user_id: userId,
        endpoint,
        request_count: 0,
        window_start: now.toISOString(),
      }, { onConflict: 'user_id,endpoint', ignoreDuplicates: true });

      // Step 3: Read current count, then check limit BEFORE incrementing
      const { data: rateRow } = await adminClient
        .from('api_rate_limits')
        .select('request_count')
        .eq('user_id', userId)
        .eq('endpoint', endpoint)
        .single();

      if (rateRow && rateRow.request_count >= SCANS_PER_HOUR) {
        return new Response(
          JSON.stringify({ error: `Rate limit exceeded. Maximum ${SCANS_PER_HOUR} scans per hour. Please try again later.` }),
          { status: 429, headers: jsonHeaders }
        );
      }

      // Step 4: Increment count (only reached if under the limit)
      await adminClient
        .from('api_rate_limits')
        .update({ request_count: (rateRow?.request_count ?? 0) + 1 })
        .eq('user_id', userId)
        .eq('endpoint', endpoint);
    }

    const requestBody = await req.json() as FoodAnalysisRequest & { imageUrl?: string };
    const { imageBase64, imageUrl, healthProfile } = requestBody;

    // ========== INPUT VALIDATION ==========
    
    // Validate image size limit (10MB max for base64)
    const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    if (imageBase64) {
      // Calculate approximate size from base64 string
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const sizeInBytes = (base64Data.length * 3) / 4;
      if (sizeInBytes > MAX_IMAGE_SIZE_BYTES) {
        console.error('Image size exceeds limit:', sizeInBytes, 'bytes');
        return new Response(
          JSON.stringify({ error: 'Image size exceeds 10MB limit' }),
          { status: 400, headers: jsonHeaders }
        );
      }
    }

    // Validate base64 image format
    if (imageBase64 && !imageBase64.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i)) {
      console.error('Invalid image format');
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Supported formats: JPEG, PNG, WebP, GIF' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Validate healthProfile structure if provided
    if (healthProfile !== undefined && healthProfile !== null) {
      if (typeof healthProfile !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Invalid healthProfile: must be an object' }),
          { status: 400, headers: jsonHeaders }
        );
      }
    }

    // ========== END INPUT VALIDATION ==========

    // Support both base64 and URL inputs
    let imageData = imageBase64;
    if (!imageData && imageUrl) {
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch image from URL: server returned ' + imageResponse.status }),
            { status: 400, headers: jsonHeaders }
          );
        }
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        if (!contentType.startsWith('image/')) {
          return new Response(
            JSON.stringify({ error: 'Invalid image URL: URL does not point to an image' }),
            { status: 400, headers: jsonHeaders }
          );
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        if (imageBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
          return new Response(
            JSON.stringify({ error: 'Image from URL exceeds 10MB limit' }),
            { status: 400, headers: jsonHeaders }
          );
        }
        const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
        imageData = `data:${contentType};base64,${base64}`;
      } catch (fetchError) {
        console.error('Failed to fetch image from URL:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch image from URL' }),
          { status: 400, headers: jsonHeaders }
        );
      }
    }

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'Image data is required (imageBase64 or imageUrl)' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // ========== GOOGLE GEMINI API CALL ==========

    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_KEY');
    if (!GOOGLE_AI_KEY) {
      console.error('GOOGLE_AI_KEY is not configured. Set it with: supabase secrets set GOOGLE_AI_KEY=your_key');
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Admin must set GOOGLE_AI_KEY secret.' }),
        { status: 500, headers: jsonHeaders }
      );
    }

    // Build personalized context from health profile (defensive -- fields may be missing)
    let profileContext = '';
    if (healthProfile && typeof healthProfile === 'object') {
      const conditions = Array.isArray(healthProfile.conditions)
        ? healthProfile.conditions.map(c => c?.name).filter(Boolean).join(', ')
        : '';
      const goals = Array.isArray(healthProfile.goals)
        ? healthProfile.goals.map(g => g?.name).filter(Boolean).join(', ')
        : '';
      const allergies = Array.isArray(healthProfile.allergies)
        ? healthProfile.allergies.filter(Boolean).join(', ')
        : '';

      const lines: string[] = [];
      if (healthProfile.diabetesType) lines.push(`- Diabetes Type: ${healthProfile.diabetesType}`);
      lines.push(`- Uses Insulin: ${healthProfile.usesInsulin ? 'Yes' : 'No'}`);
      if (conditions) lines.push(`- Conditions: ${conditions}`);
      if (goals) lines.push(`- Health Goals: ${goals}`);
      if (allergies) lines.push(`- Allergies: ${allergies}`);
      if (healthProfile.age) lines.push(`- Age: ${healthProfile.age}`);
      if (healthProfile.weight) lines.push(`- Weight: ${healthProfile.weight}kg`);
      if (healthProfile.activityLevel) lines.push(`- Activity Level: ${healthProfile.activityLevel}`);

      if (lines.length > 0) {
        profileContext = `\nUser Health Profile:\n${lines.join('\n')}`;
      }
    }

    const systemPrompt = `You are an expert nutritionist AI for BiteSafe, a diabetes-focused food scanner.

CRITICAL INSTRUCTIONS:
1. First decide if the image contains edible food.
2. If image does NOT contain food (e.g. person, pet, landscape, object, document), set "isFood" to false and return ONLY the non-food response format below.
3. If image contains food, set "isFood" to true and perform full meal analysis.
4. Do NOT guess or hallucinate foods that are not visible. Only list what you can clearly see.
5. Use USDA nutritional data for accurate macronutrient values.

IMPORTANT: This is decision support, NOT medical advice.
${profileContext}

Respond ONLY with a valid JSON object (no markdown fences, no explanation text). Use this exact schema:
{
  "isFood": boolean,
  "foods": [
    {
      "name": "Specific food name as seen in image",
      "portion": "estimated portion with weight (e.g., '1 cup (~180g)', '1 medium piece (~120g)')",
      "carbsGrams": number,
      "proteinGrams": number,
      "fatGrams": number,
      "fiberGrams": number,
      "caloriesKcal": number,
      "sugarGrams": number,
      "glycemicIndex": number or null
    }
  ],
  "totalCarbs": { "min": number, "max": number },
  "totalProtein": number,
  "totalFat": number,
  "totalCalories": number,
  "totalFiber": number,
  "totalSugar": number,
  "riskLevel": "low" | "medium" | "high",
  "riskScore": number (0-100),
  "riskExplanation": "Brief explanation referencing the specific foods identified",
  "suggestions": [
    { "id": "1", "icon": "emoji", "text": "Actionable suggestion specific to this meal", "type": "portion" | "swap" | "add" | "activity" | "timing" }
  ],
  "tips": ["Tip 1", "Tip 2"]
}

When isFood is false, return this exact minimal structure:
{
  "isFood": false,
  "foods": [],
  "totalCarbs": { "min": 0, "max": 0 },
  "totalProtein": 0,
  "totalFat": 0,
  "totalCalories": 0,
  "totalFiber": 0,
  "totalSugar": 0,
  "riskLevel": "low",
  "riskScore": 0,
  "riskExplanation": "No food detected in the image.",
  "suggestions": [
    { "id": "non-food-1", "icon": "🍽️", "text": "To get a nutritional analysis, please upload an image that clearly shows food items.", "type": "add" },
    { "id": "non-food-2", "icon": "📷", "text": "Ensure your food is well-lit and centered in the frame for the best analysis.", "type": "add" }
  ],
  "tips": []
}

Risk scoring guide:
- HIGH (70-100): Refined carbs, white bread/rice/pasta, sugary items, fried starchy foods, low fiber
- MEDIUM (40-69): Mixed meal with moderate carbs, some protein/fiber to offset
- LOW (0-39): High protein/fat, low carb, high fiber, non-starchy vegetables

Provide 2-4 actionable suggestions tailored to the specific foods seen.`;

    const userPrompt = 'Carefully examine this food image. Identify EVERY food item you can see, estimate portions accurately, and provide complete nutritional analysis with blood sugar risk assessment. Be precise — only list foods that are actually visible in the photo.';

    // Strip the data URL prefix to get raw base64 for Gemini
    const base64ForGemini = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    const mimeMatch = imageData.match(/^data:(image\/[a-zA-Z+]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`;

    console.log('Calling Google Gemini API for food analysis...');

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemPrompt + '\n\n' + userPrompt },
            { inlineData: { mimeType, data: base64ForGemini } },
          ],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: jsonHeaders }
        );
      }
      if (response.status === 400) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key. Admin must update GOOGLE_AI_KEY secret.' }),
          { status: 500, headers: jsonHeaders }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Failed to analyze food image' }),
        { status: 500, headers: jsonHeaders }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geminiData: any = await response.json();
    const parts = geminiData.candidates?.[0]?.content?.parts;

    if (!parts || parts.length === 0) {
      console.error('No parts in Gemini response:', JSON.stringify(geminiData).slice(0, 500));
      return new Response(
        JSON.stringify({ error: 'No analysis returned from AI' }),
        { status: 500, headers: jsonHeaders }
      );
    }

    // Collect all text from all parts
    let fullText = '';
    for (const part of parts) {
      if (part.text) fullText += part.text;
    }

    if (!fullText) {
      console.error('No text in parts');
      return new Response(
        JSON.stringify({ error: 'No analysis returned from AI' }),
        { status: 500, headers: jsonHeaders }
      );
    }

    // Parse the JSON — robust extraction
    let analysisData;
    try {
      let jsonStr = fullText.trim();
      // Strip markdown fences if present
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonStr = fenceMatch[1].trim();
      // Find first { to last }
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
      }
      analysisData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw text:', fullText.slice(0, 1000));
      return new Response(
        JSON.stringify({ error: 'Failed to parse food analysis. Try again.' }),
        { status: 500, headers: jsonHeaders }
      );
    }

    if (isLikelyNonFood(analysisData)) {
      console.log('Non-food image detected');
      analysisData = buildNonFoodPayload();
    }

    console.log('Food analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: analysisData,
        disclaimer: 'This is for informational purposes only and should not be used for insulin dosing or medical decisions.'
      }),
      { headers: jsonHeaders }
    );

  } catch (error) {
    console.error('Error in analyze-food function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...getCorsHeaders(null), 'Content-Type': 'application/json' } }
    );
  }
});
