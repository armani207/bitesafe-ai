import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, X, Check } from 'lucide-react';
import { HealthProfile, COMMON_ALLERGIES, DIETARY_RESTRICTIONS } from '@/types/health';

interface AllergiesStepProps {
  data: Partial<HealthProfile>;
  onUpdate: (data: Partial<HealthProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function AllergiesStep({ data, onUpdate, onNext, onBack }: AllergiesStepProps) {
  const [allergies, setAllergies] = useState<string[]>(data.allergies || []);
  const [dietary, setDietary] = useState<string[]>(data.dietaryRestrictions || []);
  const [customAllergy, setCustomAllergy] = useState('');

  const toggleAllergy = (allergy: string) => {
    setAllergies((prev) =>
      prev.includes(allergy)
        ? prev.filter((a) => a !== allergy)
        : [...prev, allergy]
    );
  };

  const toggleDietary = (restriction: string) => {
    setDietary((prev) =>
      prev.includes(restriction)
        ? prev.filter((r) => r !== restriction)
        : [...prev, restriction]
    );
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies((prev) => [...prev, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const handleContinue = () => {
    onUpdate({ allergies, dietaryRestrictions: dietary });
    onNext();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-4 pt-8">
        <button onClick={onBack} className="rounded-lg p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-muted-foreground">Step 5 of 7</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <h2 className="mb-2 text-2xl font-bold">Food allergies & diet</h2>
        <p className="mb-6 text-muted-foreground">
          We'll avoid suggesting foods that don't work for you
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="mb-3 font-semibold">Allergies</h3>
            <div className="flex flex-wrap gap-2">
              {COMMON_ALLERGIES.map((allergy) => {
                const isSelected = allergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    onClick={() => toggleAllergy(allergy)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {allergy}
                    {isSelected && <X className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                placeholder="Add other allergy..."
                onKeyDown={(e) => e.key === 'Enter' && addCustomAllergy()}
              />
              <Button onClick={addCustomAllergy} variant="outline" size="icon">
                <Check className="h-4 w-4" />
              </Button>
            </div>

            {allergies.filter((a) => !COMMON_ALLERGIES.includes(a)).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {allergies
                  .filter((a) => !COMMON_ALLERGIES.includes(a))
                  .map((allergy) => (
                    <button
                      key={allergy}
                      onClick={() => toggleAllergy(allergy)}
                      className="flex items-center gap-1 rounded-full bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground"
                    >
                      {allergy}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-3 font-semibold">Dietary Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {DIETARY_RESTRICTIONS.map((restriction) => {
                const isSelected = dietary.includes(restriction);
                return (
                  <button
                    key={restriction}
                    onClick={() => toggleDietary(restriction)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {restriction}
                    {isSelected && <Check className="ml-1 h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card p-6">
        <Button onClick={handleContinue} size="lg" className="w-full">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
