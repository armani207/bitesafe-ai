import { useState, useMemo } from 'react';
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
import { validateImageFile, prepareImageForAnalysis, shrinkBase64Image } from '@/lib/imageUtils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function ScanPage() {
  const { user, session } = useAuth();
  const { data: dbProfile } = useProfile();
  const healthProfile = useMemo(() => dbProfileToHealthProfile(dbProfile ?? null), [dbProfile]);
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
      const accessToken = session?.access_token ?? null;
      const analysis = await analyzeFoodImage(input, healthProfile, accessToken);
      analysis.imageUrl = imageUrl || imageBase64;
      setCurrentMeal(analysis);
      setPendingRetryBase64(null);
      toast.success('Meal analyzed successfully!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'AI analysis failed';
      setAnalysisError(msg);
      setPendingRetryBase64(imageBase64);
      toast.error('Analysis failed — see details below');
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

    const isHeicFile = /\.(heic|heif)$/i.test(file.name) || 
      ['image/heic', 'image/heif'].includes(file.type);

    try {
      if (isHeicFile) {
        // Show loading immediately for HEIC — conversion can take a few seconds
        setIsScanning(true);
        setAnalysisError(null);
        toast.info('Converting iPhone photo...');
      }
      const compressed = await prepareImageForAnalysis(file);
      setImagePreview(compressed);
      if (isHeicFile) setIsScanning(false); // Reset before analyzeWithAI sets it again
      await analyzeWithAI(compressed);
    } catch (error) {
      setIsScanning(false);
      if (import.meta.env.DEV) {
        console.error('Error processing image:', error);
      }
      const msg = error instanceof Error ? error.message : 'Failed to process image';
      setAnalysisError(msg);
      toast.error(msg);
    }
  };

  const handleSaveMeal = async () => {
    if (!currentMeal || !user || currentMeal.saved || addMeal.isPending) return;
    try {
      // Try to upload image to storage; if it fails (e.g. bucket missing), save without image
      let imageUrlToSave = currentMeal.imageUrl;
      if (imageUrlToSave.startsWith('data:')) {
        try {
          imageUrlToSave = await uploadMealImageFromBase64(user.id, imageUrlToSave);
        } catch (imgErr) {
          if (import.meta.env.DEV) {
            console.warn('Image upload failed, saving meal without image:', imgErr);
          }
          imageUrlToSave = ''; // Save without image — meal data is what matters
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
      if (import.meta.env.DEV) {
        console.error('Failed to save meal:', error);
      }
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

  const handleRetryWithSmallerImage = async () => {
    if (!pendingRetryBase64) return;
    try {
      const smaller = await shrinkBase64Image(pendingRetryBase64);
      setImagePreview(smaller);
      await analyzeWithAI(smaller);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error shrinking image:', error);
      }
      toast.error('Could not process image');
    }
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
                onRetryWithSmaller={pendingRetryBase64 ? handleRetryWithSmallerImage : undefined}
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
