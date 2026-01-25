import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { RiskBadge, RiskAlert } from '@/components/ui/RiskBadge';
import { SuggestionGrid, TipCard } from '@/components/ui/SuggestionCard';
import { StatRow } from '@/components/ui/StatCard';
import { useAppStore } from '@/store/appStore';
import { MealAnalysis, MealSuggestion, RiskLevel } from '@/types/health';
import { Camera, Upload, Loader2, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Demo meal analysis data
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
  const { addMeal, currentMeal, setCurrentMeal, healthProfile } = useAppStore();
  const [isScanning, setIsScanning] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
        analyzeMeal();
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeMeal = () => {
    setIsScanning(true);
    // Simulate AI analysis
    setTimeout(() => {
      const analysis = generateDemoAnalysis();
      analysis.imageUrl = imagePreview || '';
      setCurrentMeal(analysis);
      setIsScanning(false);
    }, 2000);
  };

  const handleSaveMeal = () => {
    if (currentMeal) {
      addMeal({ ...currentMeal, saved: true });
      toast.success('Meal saved to history!');
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Camera/Upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/50 transition-colors hover:border-primary/50 hover:bg-secondary"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">Take a photo of your meal</h3>
                <p className="text-sm text-muted-foreground">
                  or tap to upload from gallery
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                  size="lg"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Camera
                </Button>
                <Button
                  onClick={handleDemoScan}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Demo Scan
                </Button>
              </div>

              {healthProfile && (
                <div className="rounded-xl bg-secondary p-4">
                  <h4 className="mb-2 text-sm font-semibold">Your Profile</h4>
                  <div className="flex flex-wrap gap-2">
                    {healthProfile.diabetesType !== 'none' && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {healthProfile.diabetesType === 'type1' ? 'Type 1' : 
                         healthProfile.diabetesType === 'type2' ? 'Type 2' : 
                         healthProfile.diabetesType === 'prediabetes' ? 'Prediabetes' : 'Gestational'}
                      </span>
                    )}
                    {healthProfile.goals.slice(0, 2).map((goal) => (
                      <span
                        key={goal.id}
                        className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                      >
                        {goal.icon} {goal.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-12"
            >
              <div className="relative mb-6">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Meal"
                    className="h-48 w-48 rounded-2xl object-cover"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/20 backdrop-blur-sm">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Analyzing your meal...</h3>
              <p className="text-sm text-muted-foreground">
                Identifying foods and calculating nutrients
              </p>
            </motion.div>
          )}

          {currentMeal && !isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Meal image */}
              {currentMeal.imageUrl && (
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src={currentMeal.imageUrl || '/placeholder.svg'}
                    alt="Your meal"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
              )}

              {/* Carbs & Risk Score */}
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-secondary px-4 py-2">
                  <span className="text-sm text-muted-foreground">Carbs: </span>
                  <span className="font-semibold">
                    ~{currentMeal.totalCarbs.min}-{currentMeal.totalCarbs.max}g
                  </span>
                </div>
                <RiskBadge level={currentMeal.riskLevel} pulse={currentMeal.riskLevel === 'high'} />
              </div>

              {/* Risk Alert */}
              <RiskAlert level={currentMeal.riskLevel} message={currentMeal.riskExplanation} />

              {/* Suggestions */}
              {currentMeal.suggestions.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Make It Safer
                  </h3>
                  <SuggestionGrid
                    suggestions={currentMeal.suggestions}
                    onSelect={(s) => toast.info(`Tip: ${s.text}`)}
                  />
                </div>
              )}

              {/* Tips */}
              {currentMeal.tips.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Tips for You
                  </h3>
                  <div className="space-y-2">
                    {currentMeal.tips.map((tip, i) => (
                      <TipCard key={i} icon={i === 0 ? '🍖' : '🌾'} text={tip} />
                    ))}
                  </div>
                </div>
              )}

              {/* Nutrient summary */}
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Nutrition Estimate</h3>
                <StatRow
                  items={[
                    { label: 'Calories', value: currentMeal.totalCalories, unit: 'kcal' },
                    { label: 'Protein', value: currentMeal.totalProtein, unit: 'g' },
                    { label: 'Fat', value: currentMeal.totalFat, unit: 'g' },
                    { label: 'Fiber', value: currentMeal.totalFiber, unit: 'g' },
                  ]}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pb-4">
                <Button
                  onClick={handleSaveMeal}
                  className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                  size="lg"
                >
                  <Save className="mr-2 h-5 w-5" />
                  Save This Meal
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg">
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
