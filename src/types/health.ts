export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

export interface HealthProfile {
  diabetesType: 'type1' | 'type2' | 'prediabetes' | 'gestational' | 'none';
  usesInsulin: boolean;
  conditions: HealthCondition[];
  goals: HealthGoal[];
  allergies: string[];
  dietaryRestrictions: string[];
  age: number;
  weight: number; // in kg
  height: number; // in cm
  bodyFatPercentage?: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  targetGlucoseMin?: number;
  targetGlucoseMax?: number;
  medications?: string[];
  healthcareProvider?: HealthcareProvider;
}

export interface HealthCondition {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface HealthGoal {
  id: string;
  name: string;
  icon: string;
}

export interface HealthcareProvider {
  name: string;
  specialty: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface FoodItem {
  name: string;
  portion: string;
  carbsGrams: number;
  proteinGrams: number;
  fatGrams: number;
  fiberGrams: number;
  caloriesKcal: number;
  sugarGrams: number;
  glycemicIndex?: number;
}

export interface MealAnalysis {
  id: string;
  timestamp: Date;
  imageUrl: string;
  foods: FoodItem[];
  totalCarbs: { min: number; max: number };
  totalProtein: number;
  totalFat: number;
  totalCalories: number;
  totalFiber: number;
  totalSugar: number;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  riskExplanation: string;
  suggestions: MealSuggestion[];
  tips: string[];
  saved: boolean;
}

export interface MealSuggestion {
  id: string;
  icon: string;
  text: string;
  type: 'portion' | 'swap' | 'add' | 'activity' | 'timing';
}

export interface DailySummary {
  date: Date;
  meals: MealAnalysis[];
  totalCarbs: number;
  totalProtein: number;
  totalCalories: number;
  averageRiskScore: number;
  glucoseReadings?: GlucoseReading[];
}

export interface GlucoseReading {
  timestamp: Date;
  value: number;
  source: 'manual' | 'cgm';
}

export interface Insight {
  id: string;
  type: 'pattern' | 'achievement' | 'warning' | 'tip';
  title: string;
  description: string;
  date: Date;
  icon: string;
}

export const HEALTH_CONDITIONS: HealthCondition[] = [
  { id: 'type1', name: 'Type 1 Diabetes', icon: '💉', description: 'Autoimmune condition requiring insulin' },
  { id: 'type2', name: 'Type 2 Diabetes', icon: '📊', description: 'Insulin resistance condition' },
  { id: 'prediabetes', name: 'Prediabetes', icon: '⚠️', description: 'Higher than normal blood sugar' },
  { id: 'gestational', name: 'Gestational Diabetes', icon: '🤰', description: 'Diabetes during pregnancy' },
  { id: 'hypertension', name: 'Hypertension', icon: '❤️', description: 'High blood pressure' },
  { id: 'kidney', name: 'Kidney Disease', icon: '🫘', description: 'Chronic kidney condition' },
  { id: 'heart', name: 'Heart Disease', icon: '🫀', description: 'Cardiovascular condition' },
  { id: 'obesity', name: 'Obesity', icon: '⚖️', description: 'BMI over 30' },
  { id: 'pcos', name: 'PCOS', icon: '🔬', description: 'Polycystic ovary syndrome' },
  { id: 'ibs', name: 'IBS/GERD', icon: '🫃', description: 'Digestive conditions' },
];

export const HEALTH_GOALS: HealthGoal[] = [
  { id: 'stable_glucose', name: 'Stable Blood Sugar', icon: '📈' },
  { id: 'weight_loss', name: 'Weight Loss', icon: '⚖️' },
  { id: 'more_energy', name: 'More Energy', icon: '⚡' },
  { id: 'reduce_meds', name: 'Reduce Medications', icon: '💊' },
  { id: 'better_sleep', name: 'Better Sleep', icon: '😴' },
  { id: 'heart_health', name: 'Heart Health', icon: '❤️' },
];

export const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Low-Sodium',
  'Halal',
  'Kosher',
];

export const COMMON_ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Shellfish',
  'Fish',
  'Eggs',
  'Milk',
  'Wheat',
  'Soy',
  'Sesame',
];
