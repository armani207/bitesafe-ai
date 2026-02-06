import { supabase } from '@/integrations/supabase/client';
import { HealthProfile, MealAnalysis, FoodItem, MealSuggestion, RiskLevel } from '@/types/health';

interface AnalysisResponse {
  success: boolean;
  error?: string;
  analysis?: {
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
  disclaimer?: string;
}

export async function analyzeFoodImage(
  imageInput: { base64?: string; url?: string },
  healthProfile?: HealthProfile | null
): Promise<MealAnalysis> {
  try {
    const body: Record<string, unknown> = {
      healthProfile: healthProfile || undefined,
    };
    if (imageInput.base64) body.imageBase64 = imageInput.base64;
    if (imageInput.url) body.imageUrl = imageInput.url;

    const { data, error } = await supabase.functions.invoke<AnalysisResponse>('analyze-food', {
      body,
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to analyze food');
    }

    if (!data?.success || !data.analysis) {
      throw new Error(data?.error || 'No analysis data returned');
    }

    const analysis = data.analysis;

    // Transform to MealAnalysis format
    const mealAnalysis: MealAnalysis = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      imageUrl: imageInput.url || imageInput.base64 || '',
      foods: analysis.foods.map(food => ({
        name: food.name,
        portion: food.portion,
        carbsGrams: food.carbsGrams,
        proteinGrams: food.proteinGrams,
        fatGrams: food.fatGrams,
        fiberGrams: food.fiberGrams,
        caloriesKcal: food.caloriesKcal,
        sugarGrams: food.sugarGrams,
        glycemicIndex: food.glycemicIndex,
      })),
      totalCarbs: analysis.totalCarbs,
      totalProtein: analysis.totalProtein,
      totalFat: analysis.totalFat,
      totalCalories: analysis.totalCalories,
      totalFiber: analysis.totalFiber,
      totalSugar: analysis.totalSugar,
      riskLevel: analysis.riskLevel,
      riskScore: analysis.riskScore,
      riskExplanation: analysis.riskExplanation,
      suggestions: analysis.suggestions,
      tips: analysis.tips,
      saved: false,
    };

    return mealAnalysis;
  } catch (error) {
    console.error('Food analysis failed:', error);
    throw error;
  }
}

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
