import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { HealthProfile, HEALTH_CONDITIONS, HealthCondition } from '@/types/health';

interface ConditionsStepProps {
  data: Partial<HealthProfile>;
  onUpdate: (data: Partial<HealthProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ConditionsStep({ data, onUpdate, onNext, onBack }: ConditionsStepProps) {
  const [selected, setSelected] = useState<HealthCondition[]>(data.conditions || []);

  const toggleCondition = (condition: HealthCondition) => {
    setSelected((prev) => {
      const exists = prev.find((c) => c.id === condition.id);
      if (exists) {
        return prev.filter((c) => c.id !== condition.id);
      }
      return [...prev, condition];
    });
  };

  const handleContinue = () => {
    onUpdate({ conditions: selected });
    onNext();
  };

  // Filter out diabetes-related conditions since we asked about that already
  const otherConditions = HEALTH_CONDITIONS.filter(
    (c) => !['type1', 'type2', 'prediabetes', 'gestational'].includes(c.id)
  );

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-4 pt-8">
        <button onClick={onBack} className="rounded-lg p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-muted-foreground">Step 2 of 7</span>
      </div>

      <div className="flex-1 px-6">
        <h2 className="mb-2 text-2xl font-bold">Other health conditions</h2>
        <p className="mb-6 text-muted-foreground">
          Select any that apply — we'll personalize recommendations
        </p>

        <div className="grid grid-cols-2 gap-3">
          {otherConditions.map((condition) => {
            const isSelected = selected.some((c) => c.id === condition.id);
            return (
              <button
                key={condition.id}
                onClick={() => toggleCondition(condition)}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div className="mb-1 text-2xl">{condition.icon}</div>
                <div className="text-sm font-semibold">{condition.name}</div>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          You can skip this step if none apply
        </p>
      </div>

      <div className="p-6">
        <Button onClick={handleContinue} size="lg" className="w-full">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
