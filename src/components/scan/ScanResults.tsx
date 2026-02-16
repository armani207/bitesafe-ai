import { Button } from '@/components/ui/button';
import { RiskBadge, RiskAlert } from '@/components/ui/RiskBadge';
import { SuggestionGrid, TipCard } from '@/components/ui/SuggestionCard';
import { StatRow } from '@/components/ui/StatCard';
import { MealAnalysis } from '@/types/health';
import { Save, RefreshCw, AlertCircle, Target, ArrowRight, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';

interface ScanResultsProps {
  meal: MealAnalysis;
  onSave: () => void;
  onReset: () => void;
  isSaving?: boolean;
}

export function ScanResults({ meal, onSave, onReset, isSaving }: ScanResultsProps) {
  // Determine predictive framing
  const riskFraming = meal.riskLevel === 'high' 
    ? 'This meal is likely to cause significant glucose elevation'
    : meal.riskLevel === 'medium'
    ? 'This meal may cause moderate glucose increase'
    : 'This meal is expected to have minimal glucose impact';

  const expectedImpact = meal.riskLevel === 'high'
    ? 'Elevated spike risk within 30-60 minutes'
    : meal.riskLevel === 'medium'
    ? 'Moderate glucose response expected'
    : 'Glucose likely to remain stable';

  return (
    <div
      className="space-y-4"
    >
      {/* Meal image */}
      {meal.imageUrl && (
        <div className="overflow-hidden rounded-2xl">
          <img
            src={meal.imageUrl || '/placeholder.svg'}
            alt="Your meal"
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      )}

      {/* Demo Mode Banner */}
      {meal.isDemo && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
          <FlaskConical className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-primary">Demo Mode — Not Real Analysis</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              These results are sample data, not based on your actual photo. To enable real AI food analysis, 
              add a free Google AI API key to your <code className="rounded bg-secondary px-1">.env</code> file.
              Get one at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80">aistudio.google.com/apikey</a>
            </p>
          </div>
        </div>
      )}

      {/* Predictive Risk Assessment */}
      <div className={`rounded-xl p-4 ${
        meal.riskLevel === 'high' ? 'bg-risk-high/10 border border-risk-high/30' :
        meal.riskLevel === 'medium' ? 'bg-risk-medium/10 border border-risk-medium/30' :
        'bg-success/10 border border-success/30'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Projected Glucose Impact</span>
          <RiskBadge level={meal.riskLevel} score={meal.riskScore} pulse={meal.riskLevel === 'high'} />
        </div>
        <p className={`font-semibold ${
          meal.riskLevel === 'high' ? 'text-risk-high' :
          meal.riskLevel === 'medium' ? 'text-risk-medium' :
          'text-success'
        }`}>
          {riskFraming}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{expectedImpact}</p>
      </div>

      {/* Detected Foods */}
      {meal.foods.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Identified Items</h3>
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

      {/* Carbs Summary */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <span className="text-sm text-muted-foreground">Total Carbohydrate Load</span>
          <div className="text-2xl font-bold">
            ~{meal.totalCarbs.min}-{meal.totalCarbs.max}g
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm text-muted-foreground">Risk Score</span>
          <div className={`text-2xl font-bold ${
            meal.riskLevel === 'high' ? 'text-risk-high' :
            meal.riskLevel === 'medium' ? 'text-risk-medium' :
            'text-success'
          }`}>
            {meal.riskScore}%
          </div>
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-xs">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
        <p className="text-muted-foreground">
          <strong>Clinical Note:</strong> This assessment is for decision support only. Do not use for insulin dosing. 
          Always consult your healthcare provider for treatment decisions.
        </p>
      </div>

      {/* Risk Mitigation Actions */}
      {meal.suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Risk Mitigation Actions</h3>
          </div>
          <SuggestionGrid
            suggestions={meal.suggestions}
            onSelect={(s) => toast.info(`Recommended: ${s.text}`)}
          />
        </div>
      )}

      {/* Evidence-Based Tips */}
      {meal.tips.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            Evidence-Based Adjustments
          </h3>
          <div className="space-y-2">
            {meal.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-primary/5 p-3">
                <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutrient summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Nutritional Composition</h3>
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
          type="button"
          onClick={onSave}
          className="flex-1 bg-success text-success-foreground hover:bg-success/90"
          size="lg"
          disabled={isSaving || meal.saved}
        >
          <Save className="mr-2 h-5 w-5" />
          {isSaving ? 'Saving...' : meal.saved ? 'Saved' : 'Log This Meal'}
        </Button>
        <Button type="button" onClick={onReset} variant="outline" size="lg" disabled={isSaving}>
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
