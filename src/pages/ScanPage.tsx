import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScanUploader } from '@/components/scan/ScanUploader';
import { ScanLoading } from '@/components/scan/ScanLoading';
import { ScanResults } from '@/components/scan/ScanResults';
import { useAddMeal, useProfile, dbProfileToHealthProfile } from '@/hooks/useSupabase';
import { MealAnalysis, RiskLevel, MealSuggestion } from '@/types/health';
import { analyzeFoodImage, imageToBase64 } from '@/lib/api/foodAnalysis';
import { toast } from 'sonner';

// Demo meal analysis data (fallback if AI fails)
const generateDemoAnalysis = (): MealAnalysis => {
  const riskLevels: RiskLevel[] = ['low', 'medium', 'high'];
  const riskLevel = riskLevels[Math.floor(Math.random() * 3)];
  
  const suggestions: MealSuggestion[] = [
    { id: '1', icon: '🍽️', text: 'Halve the Portion', type: 'portion' },
    { id: '2', icon: '🥦', text: 'Add Veggies', type: 'add' },
    { id: '3', icon: '🔄', text: 'Swap Fries for Salad', type: 'swap' },
    { id: '4', icon: '🏃', text: 'Walk 10 Min After', type: 'activity' },
  ];

  const tips = [
    'Try adding some lean protein',
    'Opt for more fiber-rich foods',
    'Consider eating this earlier in the day',
  ];

  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    imageUrl: '',
    foods: [
      { name: 'Chicken', portion: '150g', carbsGrams: 0, proteinGrams: 35, fatGrams: 8, fiberGrams: 0, caloriesKcal: 220, sugarGrams: 0 },
      { name: 'Rice', portion: '1 cup', carbsGrams: 45, proteinGrams: 4, fatGrams: 0, fiberGrams: 1, caloriesKcal: 200, sugarGrams: 0 },
      { name: 'French Fries', portion: 'medium', carbsGrams: 35, proteinGrams: 4, fatGrams: 17, fiberGrams: 3, caloriesKcal: 320, sugarGrams: 0 },
    ],
    totalCarbs: { min: 60, max: 75 },
    totalProtein: 43,
    totalFat: 25,
    totalCalories: 740,
    totalFiber: 4,
    totalSugar: 2,
    riskLevel,
    riskScore: riskLevel === 'high' ? 75 : riskLevel === 'medium' ? 50 : 25,
    riskExplanation: riskLevel === 'high' 
      ? 'Likely to spike your blood sugar'
      : riskLevel === 'medium'
      ? 'May cause moderate glucose increase'
      : 'Should have minimal impact on glucose',
    suggestions: suggestions.slice(0, riskLevel === 'high' ? 4 : riskLevel === 'medium' ? 3 : 2),
    tips: tips.slice(0, 2),
    saved: false,
  };
};

export default function ScanPage() {
  const { data: dbProfile } = useProfile();
  const healthProfile = dbProfileToHealthProfile(dbProfile ?? null);
  const addMeal = useAddMeal();
  
  const [isScanning, setIsScanning] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentMeal, setCurrentMeal] = useState<MealAnalysis | null>(null);

  const handleFileSelect = async (file: File) => {
    try {
      const base64 = await imageToBase64(file);
      setImagePreview(base64);
      await analyzeWithAI(base64);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
    }
  };

  const analyzeWithAI = async (imageBase64: string) => {
    setIsScanning(true);
    try {
      const analysis = await analyzeFoodImage(imageBase64, healthProfile);
      analysis.imageUrl = imageBase64;
      setCurrentMeal(analysis);
      toast.success('Meal analyzed successfully!');
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast.error('AI analysis failed. Using demo data instead.');
      // Fallback to demo analysis
      const demoAnalysis = generateDemoAnalysis();
      demoAnalysis.imageUrl = imageBase64;
      setCurrentMeal(demoAnalysis);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveMeal = async () => {
    if (currentMeal) {
      try {
        await addMeal.mutateAsync({
          imageUrl: currentMeal.imageUrl,
          foods: currentMeal.foods,
          totalCarbs: currentMeal.totalCarbs,
          totalProtein: currentMeal.totalProtein,
          totalFat: currentMeal.totalFat,
          totalCalories: currentMeal.totalCalories,
          totalFiber: currentMeal.totalFiber,
          totalSugar: currentMeal.totalSugar,
          riskLevel: currentMeal.riskLevel,
          riskScore: currentMeal.riskScore,
          riskExplanation: currentMeal.riskExplanation,
          suggestions: currentMeal.suggestions,
          tips: currentMeal.tips,
        });
        toast.success('Meal saved to history!');
        setCurrentMeal({ ...currentMeal, saved: true });
      } catch (error) {
        console.error('Failed to save meal:', error);
        toast.error('Failed to save meal');
      }
    }
  };

  const handleReset = () => {
    setCurrentMeal(null);
    setImagePreview(null);
  };

  const handleDemoScan = () => {
    setImagePreview('/placeholder.svg');
    setIsScanning(true);
    setTimeout(() => {
      const analysis = generateDemoAnalysis();
      setCurrentMeal(analysis);
      setIsScanning(false);
    }, 2000);
  };

  return (
    <AppLayout
      headerProps={{
        showGreeting: true,
      }}
    >
      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-6">
        <AnimatePresence mode="wait">
          {!currentMeal && !isScanning && (
            <ScanUploader
              healthProfile={healthProfile}
              onFileSelect={handleFileSelect}
              onDemoScan={handleDemoScan}
            />
          )}

          {isScanning && (
            <ScanLoading imagePreview={imagePreview} />
          )}

          {currentMeal && !isScanning && (
            <ScanResults
              meal={currentMeal}
              onSave={handleSaveMeal}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
