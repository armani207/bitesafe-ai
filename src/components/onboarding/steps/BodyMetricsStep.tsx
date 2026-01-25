import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Calculator } from 'lucide-react';
import { HealthProfile } from '@/types/health';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BodyMetricsStepProps {
  data: Partial<HealthProfile>;
  onUpdate: (data: Partial<HealthProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

type Gender = HealthProfile['gender'];
type ActivityLevel = HealthProfile['activityLevel'];

const activityOptions: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary (little exercise)' },
  { value: 'light', label: 'Light (1-3 days/week)' },
  { value: 'moderate', label: 'Moderate (3-5 days/week)' },
  { value: 'active', label: 'Active (6-7 days/week)' },
  { value: 'very_active', label: 'Very Active (intense daily)' },
];

export function BodyMetricsStep({ data, onUpdate, onNext, onBack }: BodyMetricsStepProps) {
  const [age, setAge] = useState(data.age?.toString() || '');
  const [weight, setWeight] = useState(data.weight?.toString() || '');
  const [height, setHeight] = useState(data.height?.toString() || '');
  const [gender, setGender] = useState<Gender>(data.gender || 'other');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    data.activityLevel || 'moderate'
  );
  const [bodyFat, setBodyFat] = useState(data.bodyFatPercentage?.toString() || '');
  const [showCalculator, setShowCalculator] = useState(false);

  // Body fat calculator inputs
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [hip, setHip] = useState('');

  const calculateBodyFat = () => {
    const h = parseFloat(height);
    const w = parseFloat(waist);
    const n = parseFloat(neck);
    const hips = parseFloat(hip);

    if (!h || !w || !n) return;

    let bf: number;
    if (gender === 'male') {
      // US Navy method for men
      bf = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
    } else {
      // US Navy method for women
      if (!hips) return;
      bf = 495 / (1.29579 - 0.35004 * Math.log10(w + hips - n) + 0.22100 * Math.log10(h)) - 450;
    }

    if (bf > 0 && bf < 60) {
      setBodyFat(bf.toFixed(1));
      setShowCalculator(false);
    }
  };

  const handleContinue = () => {
    onUpdate({
      age: parseInt(age) || 30,
      weight: parseFloat(weight) || 70,
      height: parseFloat(height) || 170,
      gender,
      activityLevel,
      bodyFatPercentage: bodyFat ? parseFloat(bodyFat) : undefined,
    });
    onNext();
  };

  const isValid = age && weight && height;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-4 pt-8">
        <button onClick={onBack} className="rounded-lg p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-muted-foreground">Step 4 of 7</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <h2 className="mb-2 text-2xl font-bold">Body metrics</h2>
        <p className="mb-6 text-muted-foreground">
          Used for personalized nutrition estimates
        </p>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="30"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <div className="mt-2 flex gap-2">
                {(['male', 'female', 'other'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium capitalize transition-all ${
                      gender === g
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label>Activity Level</Label>
            <div className="mt-2 space-y-2">
              {activityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setActivityLevel(option.value)}
                  className={`w-full rounded-lg border-2 p-3 text-left text-sm transition-all ${
                    activityLevel === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="bodyfat">Body Fat % (optional)</Label>
              <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                    <Calculator className="h-4 w-4" />
                    Calculate
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Body Fat Calculator</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Using the US Navy method. Measure in cm.
                    </p>
                    <div>
                      <Label>Waist (at navel)</Label>
                      <Input
                        type="number"
                        value={waist}
                        onChange={(e) => setWaist(e.target.value)}
                        placeholder="85"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Neck</Label>
                      <Input
                        type="number"
                        value={neck}
                        onChange={(e) => setNeck(e.target.value)}
                        placeholder="38"
                        className="mt-1"
                      />
                    </div>
                    {gender === 'female' && (
                      <div>
                        <Label>Hip (widest)</Label>
                        <Input
                          type="number"
                          value={hip}
                          onChange={(e) => setHip(e.target.value)}
                          placeholder="100"
                          className="mt-1"
                        />
                      </div>
                    )}
                    <Button onClick={calculateBodyFat} className="w-full">
                      Calculate
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Input
              id="bodyfat"
              type="number"
              step="0.1"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              placeholder="e.g., 22"
              className="mt-2"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card p-6">
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
