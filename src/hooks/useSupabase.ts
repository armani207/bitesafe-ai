import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MealAnalysis, HealthProfile } from '@/types/health';
import type { Json } from '@/integrations/supabase/types';

// Types for database records
interface DbProfile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  diabetes_type: string | null;
  uses_insulin: boolean;
  conditions: unknown;
  goals: unknown;
  allergies: string[] | null;
  dietary_restrictions: string[] | null;
  age: number | null;
  weight: number | null;
  height: number | null;
  body_fat_percentage: number | null;
  gender: string | null;
  activity_level: string | null;
  target_glucose_min: number | null;
  target_glucose_max: number | null;
  medications: string[] | null;
  healthcare_provider: unknown;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

interface DbMeal {
  id: string;
  user_id: string;
  image_url: string | null;
  foods: unknown;
  total_carbs_min: number;
  total_carbs_max: number;
  total_protein: number;
  total_fat: number;
  total_calories: number;
  total_fiber: number;
  total_sugar: number;
  risk_level: string;
  risk_score: number;
  risk_explanation: string | null;
  suggestions: unknown;
  tips: string[] | null;
  saved: boolean;
  created_at: string;
}

interface DbGlucoseReading {
  id: string;
  user_id: string;
  value: number;
  unit: string;
  source: string;
  meal_id: string | null;
  reading_type: string | null;
  notes: string | null;
  created_at: string;
}

// Profile hooks
export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as DbProfile | null;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

const MEALS_PAGE_SIZE = 50;

// Meals hooks
export function useMeals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['meals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as DbMeal[];
    },
    enabled: !!user,
  });
}

export function useMealsInfinite() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['meals', 'infinite', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user) return { data: [], hasMore: false };
      const from = pageParam * MEALS_PAGE_SIZE;
      const to = from + MEALS_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: data as DbMeal[], hasMore: (data?.length ?? 0) === MEALS_PAGE_SIZE };
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length : undefined,
    initialPageParam: 0,
    enabled: !!user,
  });
}

export function useAddMeal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meal: Omit<MealAnalysis, 'id' | 'timestamp' | 'saved'>) => {
      if (!user) throw new Error('Not authenticated');

      const mealData = {
        user_id: user.id,
        image_url: meal.imageUrl,
        foods: JSON.parse(JSON.stringify(meal.foods)) as Json,
        total_carbs_min: meal.totalCarbs.min,
        total_carbs_max: meal.totalCarbs.max,
        total_protein: meal.totalProtein,
        total_fat: meal.totalFat,
        total_calories: meal.totalCalories,
        total_fiber: meal.totalFiber,
        total_sugar: meal.totalSugar,
        risk_level: meal.riskLevel,
        risk_score: meal.riskScore,
        risk_explanation: meal.riskExplanation,
        suggestions: JSON.parse(JSON.stringify(meal.suggestions)) as Json,
        tips: meal.tips,
      };

      const { data, error } = await supabase
        .from('meals')
        .insert([mealData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

const GLUCOSE_PAGE_SIZE = 50;

// Glucose readings hooks
export function useGlucoseReadings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['glucose_readings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('glucose_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as DbGlucoseReading[];
    },
    enabled: !!user,
  });
}

export function useGlucoseReadingsInfinite() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['glucose_readings', 'infinite', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user) return { data: [], hasMore: false };
      const from = pageParam * GLUCOSE_PAGE_SIZE;
      const to = from + GLUCOSE_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('glucose_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: data as DbGlucoseReading[], hasMore: (data?.length ?? 0) === GLUCOSE_PAGE_SIZE };
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length : undefined,
    initialPageParam: 0,
    enabled: !!user,
  });
}

export function useAddGlucoseReading() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reading: {
      value: number;
      reading_type?: string;
      notes?: string;
      meal_id?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('glucose_readings')
        .insert([{
          user_id: user.id,
          value: reading.value,
          reading_type: reading.reading_type,
          notes: reading.notes,
          meal_id: reading.meal_id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glucose_readings'] });
    },
  });
}

// Helper to convert DB profile to app HealthProfile
export function dbProfileToHealthProfile(dbProfile: DbProfile | null): HealthProfile | null {
  if (!dbProfile) return null;

  return {
    diabetesType: (dbProfile.diabetes_type as HealthProfile['diabetesType']) || 'none',
    usesInsulin: dbProfile.uses_insulin,
    conditions: (dbProfile.conditions as HealthProfile['conditions']) || [],
    goals: (dbProfile.goals as HealthProfile['goals']) || [],
    allergies: dbProfile.allergies || [],
    dietaryRestrictions: dbProfile.dietary_restrictions || [],
    age: dbProfile.age || 30,
    weight: dbProfile.weight || 70,
    height: dbProfile.height || 170,
    bodyFatPercentage: dbProfile.body_fat_percentage || undefined,
    gender: (dbProfile.gender as HealthProfile['gender']) || 'other',
    activityLevel: (dbProfile.activity_level as HealthProfile['activityLevel']) || 'moderate',
    targetGlucoseMin: dbProfile.target_glucose_min || undefined,
    targetGlucoseMax: dbProfile.target_glucose_max || undefined,
    medications: dbProfile.medications || undefined,
    healthcareProvider: dbProfile.healthcare_provider as HealthProfile['healthcareProvider'],
  };
}

// Helper to convert DB meal to app MealAnalysis
export function dbMealToMealAnalysis(dbMeal: DbMeal): MealAnalysis {
  return {
    id: dbMeal.id,
    timestamp: new Date(dbMeal.created_at),
    imageUrl: dbMeal.image_url || '',
    foods: (dbMeal.foods as MealAnalysis['foods']) || [],
    totalCarbs: { min: dbMeal.total_carbs_min, max: dbMeal.total_carbs_max },
    totalProtein: dbMeal.total_protein,
    totalFat: dbMeal.total_fat,
    totalCalories: dbMeal.total_calories,
    totalFiber: dbMeal.total_fiber,
    totalSugar: dbMeal.total_sugar,
    riskLevel: dbMeal.risk_level as MealAnalysis['riskLevel'],
    riskScore: dbMeal.risk_score,
    riskExplanation: dbMeal.risk_explanation || '',
    suggestions: (dbMeal.suggestions as MealAnalysis['suggestions']) || [],
    tips: dbMeal.tips || [],
    saved: dbMeal.saved,
  };
}
