-- Update RLS policies to support anonymous users
-- First drop existing restrictive policies and recreate with anonymous support

-- Profiles table: Allow anonymous users to create and manage their own profile
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Meals table: Allow anonymous users to manage their own meals
DROP POLICY IF EXISTS "Users can create their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can delete their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can update their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can view their own meals" ON public.meals;

CREATE POLICY "Users can view their own meals" 
ON public.meals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meals" 
ON public.meals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals" 
ON public.meals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals" 
ON public.meals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Glucose readings table: Allow anonymous users to manage their readings
DROP POLICY IF EXISTS "Users can create their own glucose readings" ON public.glucose_readings;
DROP POLICY IF EXISTS "Users can delete their own glucose readings" ON public.glucose_readings;
DROP POLICY IF EXISTS "Users can update their own glucose readings" ON public.glucose_readings;
DROP POLICY IF EXISTS "Users can view their own glucose readings" ON public.glucose_readings;

CREATE POLICY "Users can view their own glucose readings" 
ON public.glucose_readings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own glucose readings" 
ON public.glucose_readings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own glucose readings" 
ON public.glucose_readings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own glucose readings" 
ON public.glucose_readings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for sync notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.meals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.glucose_readings;