import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HealthProfile, MealAnalysis, DailySummary, Insight, UserProfile } from '@/types/health';

interface AppState {
  // User & Auth
  isOnboarded: boolean;
  userProfile: UserProfile | null;
  healthProfile: HealthProfile | null;
  
  // Meal Data
  meals: MealAnalysis[];
  currentMeal: MealAnalysis | null;
  
  // Insights
  insights: Insight[];
  
  // Actions
  setOnboarded: (value: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setHealthProfile: (profile: HealthProfile | null) => void;
  addMeal: (meal: MealAnalysis) => void;
  updateMeal: (id: string, updates: Partial<MealAnalysis>) => void;
  setCurrentMeal: (meal: MealAnalysis | null) => void;
  addInsight: (insight: Insight) => void;
  clearData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOnboarded: false,
      userProfile: null,
      healthProfile: null,
      meals: [],
      currentMeal: null,
      insights: [],
      
      setOnboarded: (value) => set({ isOnboarded: value }),
      setUserProfile: (profile) => set({ userProfile: profile }),
      setHealthProfile: (profile) => set({ healthProfile: profile }),
      
      addMeal: (meal) => set((state) => ({ 
        meals: [meal, ...state.meals].slice(0, 100) // Keep last 100 meals
      })),
      
      updateMeal: (id, updates) => set((state) => ({
        meals: state.meals.map((m) => 
          m.id === id ? { ...m, ...updates } : m
        )
      })),
      
      setCurrentMeal: (meal) => set({ currentMeal: meal }),
      
      addInsight: (insight) => set((state) => ({
        insights: [insight, ...state.insights].slice(0, 50)
      })),
      
      clearData: () => set({
        isOnboarded: false,
        userProfile: null,
        healthProfile: null,
        meals: [],
        currentMeal: null,
        insights: [],
      }),
    }),
    {
      name: 'bitesafe-storage',
    }
  )
);

// Helper selectors
export const useTodayMeals = () => {
  const meals = useAppStore((state) => state.meals);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return meals.filter((meal) => {
    const mealDate = new Date(meal.timestamp);
    mealDate.setHours(0, 0, 0, 0);
    return mealDate.getTime() === today.getTime();
  });
};

export const useWeekStats = () => {
  const meals = useAppStore((state) => state.meals);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const weekMeals = meals.filter((meal) => 
    new Date(meal.timestamp) >= weekAgo
  );
  
  if (weekMeals.length === 0) {
    return {
      avgCarbs: 0,
      avgCalories: 0,
      avgRiskScore: 0,
      mealCount: 0,
    };
  }
  
  const totals = weekMeals.reduce(
    (acc, meal) => ({
      carbs: acc.carbs + (meal.totalCarbs.min + meal.totalCarbs.max) / 2,
      calories: acc.calories + meal.totalCalories,
      risk: acc.risk + meal.riskScore,
    }),
    { carbs: 0, calories: 0, risk: 0 }
  );
  
  return {
    avgCarbs: Math.round(totals.carbs / weekMeals.length),
    avgCalories: Math.round(totals.calories / weekMeals.length),
    avgRiskScore: Math.round(totals.risk / weekMeals.length),
    mealCount: weekMeals.length,
  };
};
