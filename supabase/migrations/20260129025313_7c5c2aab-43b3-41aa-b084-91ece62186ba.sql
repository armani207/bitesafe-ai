-- Create profiles table for user health data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  diabetes_type TEXT CHECK (diabetes_type IN ('type1', 'type2', 'prediabetes', 'gestational', 'none')),
  uses_insulin BOOLEAN DEFAULT false,
  conditions JSONB DEFAULT '[]'::jsonb,
  goals JSONB DEFAULT '[]'::jsonb,
  allergies TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  age INTEGER,
  weight NUMERIC,
  height NUMERIC,
  body_fat_percentage NUMERIC,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  target_glucose_min NUMERIC,
  target_glucose_max NUMERIC,
  medications TEXT[] DEFAULT '{}',
  healthcare_provider JSONB,
  is_onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meals table for meal history
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT,
  foods JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_carbs_min NUMERIC NOT NULL DEFAULT 0,
  total_carbs_max NUMERIC NOT NULL DEFAULT 0,
  total_protein NUMERIC NOT NULL DEFAULT 0,
  total_fat NUMERIC NOT NULL DEFAULT 0,
  total_calories NUMERIC NOT NULL DEFAULT 0,
  total_fiber NUMERIC NOT NULL DEFAULT 0,
  total_sugar NUMERIC NOT NULL DEFAULT 0,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) NOT NULL DEFAULT 'low',
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_explanation TEXT,
  suggestions JSONB DEFAULT '[]'::jsonb,
  tips TEXT[] DEFAULT '{}',
  saved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create glucose readings table
CREATE TABLE public.glucose_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT DEFAULT 'mg/dL' CHECK (unit IN ('mg/dL', 'mmol/L')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'cgm', 'apple_health')),
  meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  reading_type TEXT CHECK (reading_type IN ('fasting', 'pre_meal', 'post_meal', 'bedtime', 'random')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_readings ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Meals RLS policies
CREATE POLICY "Users can view their own meals"
  ON public.meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meals"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
  ON public.meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
  ON public.meals FOR DELETE
  USING (auth.uid() = user_id);

-- Glucose readings RLS policies
CREATE POLICY "Users can view their own glucose readings"
  ON public.glucose_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own glucose readings"
  ON public.glucose_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own glucose readings"
  ON public.glucose_readings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own glucose readings"
  ON public.glucose_readings FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_meals_user_id ON public.meals(user_id);
CREATE INDEX idx_meals_created_at ON public.meals(created_at DESC);
CREATE INDEX idx_glucose_readings_user_id ON public.glucose_readings(user_id);
CREATE INDEX idx_glucose_readings_created_at ON public.glucose_readings(created_at DESC);
CREATE INDEX idx_glucose_readings_meal_id ON public.glucose_readings(meal_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();