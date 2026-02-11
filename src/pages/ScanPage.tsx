import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { slideTransition } from '@/lib/animations';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScanUploader } from '@/components/scan/ScanUploader';
import { ScanLoading } from '@/components/scan/ScanLoading';
import { ScanResults } from '@/components/scan/ScanResults';
import { ScanErrorState } from '@/components/scan/ScanErrorState';
import { useAddMeal, useProfile, dbProfileToHealthProfile } from '@/hooks/useSupabase';
import { MealAnalysis } from '@/types/health';
import { analyzeFoodImage } from '@/lib/api/foodAnalysis';
import { uploadMealImageFromBase64 } from '@/lib/mealImageStorage';
import { validateImageFile, compressImage } from '@/lib/imageUtils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Demo meal analysis - only used for explicit "Demo Analysis" button
function generateDemoAnalysis(): MealAnalysis {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    imageUrl: '/placeholder.svg',
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
    riskLevel: 'medium',
    riskScore: 50,
    riskExplanation: 'May cause moderate glucose increase',
    suggestions: [
      { id: '1', icon: '🍽️', text: 'Halve the Portion', type: 'portion' },
      { id: '2', icon: '🥦', text: 'Add Veggies', type: 'add' },
    ],
    tips: ['Try adding some lean protein', 'Opt for more fiber-rich foods'],
    saved: false,
  };
}

export default function ScanPage() {
  const { user } = useAuth();
  const { data: dbProfile } = useProfile();
  const healthProfile = dbProfileToHealthProfile(dbProfile ?? null);
  const addMeal = useAddMeal();

  const [isScanning, setIsScanning] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentMeal, setCurrentMeal] = useState<MealAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [pendingRetryBase64, setPendingRetryBase64] = useState<string | null>(null);

  const analyzeWithAI = async (imageBase64: string, imageUrl?: string) => {
    setIsScanning(true);
    setAnalysisError(null);
    try {
      const input = imageUrl ? { url: imageUrl } : { base64: imageBase64 };
      const analysis = await analyzeFoodImage(input, healthProfile);
      analysis.imageUrl = imageUrl || imageBase64;
      setCurrentMeal(analysis);
      setPendingRetryBase64(null);
      toast.success('Meal analyzed successfully!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'AI analysis failed';
      const isNetworkError = /fetch|network|Failed to fetch/i.test(msg);
      if (isNetworkError && user?.id?.startsWith('demo-')) {
        const demo = generateDemoAnalysis();
        demo.imageUrl = imageUrl || imageBase64;
        setCurrentMeal(demo);
        setPendingRetryBase64(null);
        toast.info('Offline mode: showing sample analysis');
      } else {
        setAnalysisError(msg);
        setPendingRetryBase64(imageBase64);
        toast.error(msg);
        if (msg.includes('Rate limit')) {
          toast.info('Please wait an hour before scanning again.');
        }
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed);
      await analyzeWithAI(compressed);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
    }
  };

  const handleSaveMeal = async () => {
    if (!currentMeal || !user || currentMeal.saved || addMeal.isPending) return;
    try {
      let imageUrlToSave = currentMeal.imageUrl;
      if (imageUrlToSave.startsWith('data:')) {
        if (user.id.startsWith('demo-')) {
          imageUrlToSave = '/placeholder.svg';
        } else {
          imageUrlToSave = await uploadMealImageFromBase64(user.id, imageUrlToSave);
        }
      }

      await addMeal.mutateAsync({
        imageUrl: imageUrlToSave,
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
  };

  const handleReset = () => {
    setCurrentMeal(null);
    setImagePreview(null);
    setAnalysisError(null);
    setPendingRetryBase64(null);
  };

  const handleRetry = () => {
    if (pendingRetryBase64) {
      analyzeWithAI(pendingRetryBase64);
    } else {
      setAnalysisError(null);
    }
  };

  const handleDemoScan = () => {
    if (isScanning) return;
    setImagePreview('/placeholder.svg');
    setIsScanning(true);
    setAnalysisError(null);
    setTimeout(() => {
      setCurrentMeal(generateDemoAnalysis());
      setIsScanning(false);
    }, 2000);
  };

  return (
    <AppLayout headerProps={{ showGreeting: true }}>
      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-6">
        <AnimatePresence mode="wait" initial={false}>
          {!currentMeal && !isScanning && !analysisError && (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={slideTransition}
            >
              <ScanUploader
                healthProfile={healthProfile}
                onFileSelect={handleFileSelect}
                onDemoScan={handleDemoScan}
              />
            </motion.div>
          )}

          {isScanning && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ScanLoading imagePreview={imagePreview} />
            </motion.div>
          )}

          {analysisError && !isScanning && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={slideTransition}
            >
              <ScanErrorState
                message={analysisError}
                onRetry={handleRetry}
                onReset={handleReset}
              />
            </motion.div>
          )}

          {currentMeal && !isScanning && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={slideTransition}
            >
              <ScanResults
                meal={currentMeal}
                onSave={handleSaveMeal}
                onReset={handleReset}
                isSaving={addMeal.isPending}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
