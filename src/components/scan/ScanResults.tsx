import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RiskBadge, RiskAlert } from '@/components/ui/RiskBadge';
import { SuggestionGrid, TipCard } from '@/components/ui/SuggestionCard';
import { StatRow } from '@/components/ui/StatCard';
import { MealAnalysis } from '@/types/health';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ScanResultsProps {
  meal: MealAnalysis;
  onSave: () => void;
  onReset: () => void;
}

export function ScanResults({ meal, onSave, onReset }: ScanResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Meal image */}
      {meal.imageUrl && (
        <div className="overflow-hidden rounded-2xl">
          <img
            src={meal.imageUrl || '/placeholder.svg'}
            alt="Your meal"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      )}

      {/* Detected Foods */}
      {meal.foods.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Detected Foods</h3>
          <div className="space-y-2">
            {meal.foods.map((food, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                <div>
                  <span className="font-medium">{food.name}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{food.portion}</span>
                </div>
                <span className="text-sm font-semibold text-primary">{food.carbsGrams}g carbs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carbs & Risk Score */}
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-secondary px-4 py-2">
          <span className="text-sm text-muted-foreground">Carbs: </span>
          <span className="font-semibold">
            ~{meal.totalCarbs.min}-{meal.totalCarbs.max}g
          </span>
        </div>
        <RiskBadge level={meal.riskLevel} score={meal.riskScore} pulse={meal.riskLevel === 'high'} />
      </div>

      {/* Risk Alert */}
      <RiskAlert level={meal.riskLevel} message={meal.riskExplanation} />

      {/* Medical Disclaimer */}
      <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-xs">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
        <p className="text-muted-foreground">
          This is for informational purposes only. Do not use for insulin dosing. 
          Always consult your healthcare provider for medical decisions.
        </p>
      </div>

      {/* Suggestions */}
      {meal.suggestions.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            Make It Safer
          </h3>
          <SuggestionGrid
            suggestions={meal.suggestions}
            onSelect={(s) => toast.info(`Tip: ${s.text}`)}
          />
        </div>
      )}

      {/* Tips */}
      {meal.tips.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            Tips for You
          </h3>
          <div className="space-y-2">
            {meal.tips.map((tip, i) => (
              <TipCard key={i} icon={i === 0 ? '💡' : '🎯'} text={tip} />
            ))}
          </div>
        </div>
      )}

      {/* Nutrient summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Nutrition Estimate</h3>
        <StatRow
          items={[
            { label: 'Calories', value: meal.totalCalories, unit: 'kcal' },
            { label: 'Protein', value: meal.totalProtein, unit: 'g' },
            { label: 'Fat', value: meal.totalFat, unit: 'g' },
            { label: 'Fiber', value: meal.totalFiber, unit: 'g' },
          ]}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pb-4">
        <Button
          onClick={onSave}
          className="flex-1 bg-success text-success-foreground hover:bg-success/90"
          size="lg"
        >
          <Save className="mr-2 h-5 w-5" />
          Save This Meal
        </Button>
        <Button onClick={onReset} variant="outline" size="lg">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
}
