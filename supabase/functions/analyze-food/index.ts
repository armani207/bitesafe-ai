import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT validation failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    const { imageBase64, imageUrl, healthProfile } = await req.json() as FoodAnalysisRequest & { imageUrl?: string };

    // Support both base64 and URL inputs
    let imageData = imageBase64;
    if (!imageData && imageUrl) {
      try {
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        imageData = `data:${contentType};base64,${base64}`;
      } catch (fetchError) {
        console.error('Failed to fetch image from URL:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch image from URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'Image data is required (imageBase64 or imageUrl)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build personalized context from health profile
    let profileContext = '';
    if (healthProfile) {
      const conditions = healthProfile.conditions.map(c => c.name).join(', ');
      const goals = healthProfile.goals.map(g => g.name).join(', ');
      const allergies = healthProfile.allergies.join(', ');
      
      profileContext = `
User Health Profile:
- Diabetes Type: ${healthProfile.diabetesType}
- Uses Insulin: ${healthProfile.usesInsulin ? 'Yes' : 'No'}
- Conditions: ${conditions || 'None specified'}
- Health Goals: ${goals || 'None specified'}
- Allergies: ${allergies || 'None'}
- Age: ${healthProfile.age}
- Weight: ${healthProfile.weight}kg
- Activity Level: ${healthProfile.activityLevel}
`;
    }

    const systemPrompt = `You are a nutrition analysis AI for BiteSafe, a diabetes-focused meal scanner app. 
Your role is to analyze food images and provide:
1. Identification of all visible foods
2. Estimated portion sizes
3. Nutritional estimates (especially carbs, which are critical for diabetics)
4. A blood sugar spike risk assessment
5. Actionable suggestions to make the meal safer

IMPORTANT DISCLAIMERS:
- This is decision support, NOT medical advice
- Estimates are approximate and should not be used for insulin dosing
- Always recommend consulting healthcare providers for medical decisions

${profileContext}

Respond with a JSON object in this exact format:
{
  "foods": [
    {
      "name": "Food name",
      "portion": "estimated portion (e.g., '1 cup', '150g')",
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
  "riskExplanation": "Brief explanation of why this risk level",
  "suggestions": [
    {
      "id": "unique-id",
      "icon": "emoji",
      "text": "Actionable suggestion",
      "type": "portion" | "swap" | "add" | "activity" | "timing"
    }
  ],
  "tips": ["Personalized tip 1", "Personalized tip 2"]
}

Risk scoring guidelines:
- HIGH (70-100): High glycemic foods, large portions of refined carbs, high sugar
- MEDIUM (40-69): Moderate carbs, some fiber/protein present, mixed meal
- LOW (0-39): Low carb, high fiber/protein, low glycemic index foods

Always provide at least 2-4 suggestions based on the risk level.`;

    console.log('Calling Lovable AI Gateway for food analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: 'Analyze this meal image and provide nutritional information with blood sugar spike risk assessment.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze food image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'No analysis returned from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON from the AI response
    let analysisData;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      analysisData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw content:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse food analysis', rawContent: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Food analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: analysisData,
        disclaimer: 'This is for informational purposes only and should not be used for insulin dosing or medical decisions.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-food function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
