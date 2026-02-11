import { useMemo } from 'react';
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

const DEMO_PROFILE_KEY = 'bitesafe-demo-profile';

function isDemoUser(userId: string | undefined): boolean {
  return !!userId?.startsWith('demo-');
}

function getDefaultDbProfile(userId: string): DbProfile {
  const now = new Date().toISOString();
  return {
    id: userId,
    user_id: userId,
    name: null,
    email: null,
    avatar_url: null,
    diabetes_type: null,
    uses_insulin: false,
    conditions: null,
    goals: null,
    allergies: null,
    dietary_restrictions: null,
    age: null,
    weight: null,
    height: null,
    body_fat_percentage: null,
    gender: null,
    activity_level: null,
    target_glucose_min: null,
    target_glucose_max: null,
    medications: null,
    healthcare_provider: null,
    is_onboarded: false,
    created_at: now,
    updated_at: now,
  };
}

function getDemoProfile(userId: string): DbProfile {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_PROFILE_KEY) : null;
  let stored: Partial<DbProfile> | null = null;
  if (raw) {
    try {
      stored = JSON.parse(raw) as Partial<DbProfile>;
    } catch {
      stored = null;
    }
  }
  const base = getDefaultDbProfile(userId);
  return { ...base, ...stored, user_id: userId } as DbProfile;
}

// Profile hooks
export function useProfile() {
  const { user } = useAuth();

  const demoInitialData = useMemo(() => {
    if (user && isDemoUser(user.id)) return getDemoProfile(user.id);
    return undefined;
  }, [user?.id]);

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      if (isDemoUser(user.id)) return getDemoProfile(user.id);
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
        );
        const result = await Promise.race([
          supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
          timeout,
        ]);
        const { data, error } = result as { data: DbProfile | null; error: { message: string } | null };
        if (error) throw new Error(error.message);
        return data;
      } catch (e) {
        console.error('Profile fetch error:', e);
        return getDefaultDbProfile(user.id);
      }
    },
    enabled: !!user,
    initialData: demoInitialData ?? undefined,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!user) throw new Error('Not authenticated');
      if (isDemoUser(user.id)) {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_PROFILE_KEY) : null;
        let stored: Partial<DbProfile> | null = null;
        if (raw) {
          try {
            stored = JSON.parse(raw) as Partial<DbProfile>;
          } catch {
            stored = null;
          }
        }
        const base = getDefaultDbProfile(user.id);
        const merged = { ...base, ...stored, ...updates, user_id: user.id } as DbProfile;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(merged));
        }
        return merged;
      }
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

const DEMO_MEALS_KEY = 'bitesafe-demo-meals';

const MEALS_PAGE_SIZE = 50;

// Meals hooks
export function useMeals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['meals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      if (isDemoUser(user.id)) {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_MEALS_KEY) : null;
        let list: DbMeal[] = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            list = Array.isArray(parsed) ? parsed : [];
          } catch {
            list = [];
          }
        }
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      try {
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) throw error;
        return (data ?? []) as DbMeal[];
      } catch (e) {
        console.error('Meals fetch error:', e);
        return [];
      }
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
      if (isDemoUser(user.id)) {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_MEALS_KEY) : null;
        let list: DbMeal[] = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            list = Array.isArray(parsed) ? parsed : [];
          } catch {
            list = [];
          }
        }
        const sorted = list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const from = pageParam * MEALS_PAGE_SIZE;
        const slice = sorted.slice(from, from + MEALS_PAGE_SIZE);
        return { data: slice, hasMore: slice.length === MEALS_PAGE_SIZE };
      }
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
        saved: false,
      };

      if (isDemoUser(user.id)) {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_MEALS_KEY) : null;
        let list: DbMeal[] = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            list = Array.isArray(parsed) ? parsed : [];
          } catch {
            list = [];
          }
        }
        const now = new Date().toISOString();
        const newMeal: DbMeal = {
          id: 'demo-meal-' + crypto.randomUUID(),
          ...mealData,
          created_at: now,
        } as DbMeal;
        list.unshift(newMeal);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(DEMO_MEALS_KEY, JSON.stringify(list));
        }
        return newMeal;
      }

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

const DEMO_GLUCOSE_KEY = 'bitesafe-demo-glucose';

const GLUCOSE_PAGE_SIZE = 50;

// Glucose readings hooks
export function useGlucoseReadings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['glucose_readings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      if (isDemoUser(user.id)) {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_GLUCOSE_KEY) : null;
        let list: DbGlucoseReading[] = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            list = Array.isArray(parsed) ? parsed : [];
          } catch {
            list = [];
          }
        }
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
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
      if (isDemoUser(user.id)) {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_GLUCOSE_KEY) : null;
        let list: DbGlucoseReading[] = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            list = Array.isArray(parsed) ? parsed : [];
          } catch {
            list = [];
          }
        }
        const sorted = list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const from = pageParam * GLUCOSE_PAGE_SIZE;
        const slice = sorted.slice(from, from + GLUCOSE_PAGE_SIZE);
        return { data: slice, hasMore: slice.length === GLUCOSE_PAGE_SIZE };
      }
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

      if (isDemoUser(user.id)) {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_GLUCOSE_KEY) : null;
        let list: DbGlucoseReading[] = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            list = Array.isArray(parsed) ? parsed : [];
          } catch {
            list = [];
          }
        }
        const now = new Date().toISOString();
        const newReading: DbGlucoseReading = {
          id: 'demo-glucose-' + crypto.randomUUID(),
          user_id: user.id,
          value: reading.value,
          unit: 'mg/dL',
          source: 'manual',
          meal_id: reading.meal_id ?? null,
          reading_type: reading.reading_type ?? null,
          notes: reading.notes ?? null,
          created_at: now,
        };
        list.unshift(newReading);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(DEMO_GLUCOSE_KEY, JSON.stringify(list));
        }
        return newReading;
      }

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

  const rawConditions = dbProfile.conditions as HealthProfile['conditions'] | unknown;
  const rawGoals = dbProfile.goals as HealthProfile['goals'] | unknown;

  return {
    diabetesType: (dbProfile.diabetes_type as HealthProfile['diabetesType']) || 'none',
    usesInsulin: dbProfile.uses_insulin ?? false,
    conditions: Array.isArray(rawConditions) ? rawConditions : [],
    goals: Array.isArray(rawGoals) ? rawGoals : [],
    allergies: Array.isArray(dbProfile.allergies) ? dbProfile.allergies : [],
    dietaryRestrictions: Array.isArray(dbProfile.dietary_restrictions) ? dbProfile.dietary_restrictions : [],
    age: dbProfile.age || 30,
    weight: dbProfile.weight || 70,
    height: dbProfile.height || 170,
    bodyFatPercentage: dbProfile.body_fat_percentage || undefined,
    gender: (dbProfile.gender as HealthProfile['gender']) || 'other',
    activityLevel: (dbProfile.activity_level as HealthProfile['activityLevel']) || 'moderate',
    targetGlucoseMin: dbProfile.target_glucose_min || undefined,
    targetGlucoseMax: dbProfile.target_glucose_max || undefined,
    medications: Array.isArray(dbProfile.medications) ? dbProfile.medications : undefined,
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
