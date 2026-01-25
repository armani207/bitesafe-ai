import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { HealthProfile, HEALTH_GOALS, HealthGoal } from '@/types/health';

interface GoalsStepProps {
  data: Partial<HealthProfile>;
  onUpdate: (data: Partial<HealthProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function GoalsStep({ data, onUpdate, onNext, onBack }: GoalsStepProps) {
  const [selected, setSelected] = useState<HealthGoal[]>(data.goals || []);

  const toggleGoal = (goal: HealthGoal) => {
    setSelected((prev) => {
      const exists = prev.find((g) => g.id === goal.id);
      if (exists) {
        return prev.filter((g) => g.id !== goal.id);
      }
      return [...prev, goal];
    });
  };

  const handleContinue = () => {
    onUpdate({ goals: selected });
    onNext();
  };

  const isValid = selected.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-4 pt-8">
        <button onClick={onBack} className="rounded-lg p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-muted-foreground">Step 3 of 7</span>
      </div>

      <div className="flex-1 px-6">
        <h2 className="mb-2 text-2xl font-bold">What are your goals?</h2>
        <p className="mb-6 text-muted-foreground">
          Select at least one goal to help us guide you
        </p>

        <div className="space-y-3">
          {HEALTH_GOALS.map((goal) => {
            const isSelected = selected.some((g) => g.id === goal.id);
            return (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal)}
                className={`relative flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-2xl">{goal.icon}</div>
                <div className="flex-1 font-semibold">{goal.name}</div>
                {isSelected && (
                  <div className="rounded-full bg-primary p-1">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        <Button
          onClick={handleContinue}
          disabled={!isValid}
          size="lg"
          className="w-full"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
