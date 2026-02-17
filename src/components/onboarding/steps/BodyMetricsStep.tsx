import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { HealthProfile } from '@/types/health';
import { easeOut, tapScaleLight } from '@/lib/animations';

interface BodyMetricsStepProps {
  data: Partial<HealthProfile>;
  onUpdate: (data: Partial<HealthProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

type Gender = HealthProfile['gender'];
type ActivityLevel = HealthProfile['activityLevel'];
type UnitSystem = 'metric' | 'imperial';

const activityOptions: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  { value: 'light', label: 'Lightly Active', description: '1-3 days/week' },
  { value: 'moderate', label: 'Moderately Active', description: '3-5 days/week' },
  { value: 'active', label: 'Active', description: '6-7 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Intense daily exercise' },
];

function kgToLbs(kg: number): number { return Math.round(kg * 2.20462 * 10) / 10; }
function lbsToKg(lbs: number): number { return Math.round(lbs / 2.20462 * 10) / 10; }
function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { ft, inches };
}
function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * 2.54 * 10) / 10;
}

export function BodyMetricsStep({ data, onUpdate, onNext, onBack }: BodyMetricsStepProps) {
  const [units, setUnits] = useState<UnitSystem>('metric');
  const [age, setAge] = useState(data.age?.toString() || '');

  // Metric state (source of truth)
  const [weightKg, setWeightKg] = useState(data.weight?.toString() || '');
  const [heightCm, setHeightCm] = useState(data.height?.toString() || '');

  // Imperial display state
  const initLbs = data.weight ? kgToLbs(data.weight).toString() : '';
  const initFtIn = data.height ? cmToFtIn(data.height) : { ft: 5, inches: 7 };
  const [weightLbs, setWeightLbs] = useState(initLbs);
  const [heightFt, setHeightFt] = useState(initFtIn.ft.toString());
  const [heightIn, setHeightIn] = useState(initFtIn.inches.toString());

  const [gender, setGender] = useState<Gender>(data.gender || 'other');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    data.activityLevel || 'moderate'
  );
  const [bodyFat, setBodyFat] = useState(data.bodyFatPercentage?.toString() || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const switchUnits = (target: UnitSystem) => {
    if (target === units) return;
    if (target === 'imperial') {
      const kg = parseFloat(weightKg);
      if (Number.isFinite(kg)) setWeightLbs(kgToLbs(kg).toString());
      const cm = parseFloat(heightCm);
      if (Number.isFinite(cm)) {
        const { ft, inches } = cmToFtIn(cm);
        setHeightFt(ft.toString());
        setHeightIn(inches.toString());
      }
    } else {
      const lbs = parseFloat(weightLbs);
      if (Number.isFinite(lbs)) setWeightKg(lbsToKg(lbs).toString());
      const ft = parseInt(heightFt);
      const inches = parseInt(heightIn) || 0;
      if (Number.isFinite(ft)) setHeightCm(ftInToCm(ft, inches).toString());
    }
    setUnits(target);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const ageNum = Number(age);
    const bodyFatNum = bodyFat ? Number(bodyFat) : null;

    let finalKg: number;
    let finalCm: number;

    if (units === 'imperial') {
      const lbs = parseFloat(weightLbs);
      const ft = parseInt(heightFt);
      const inches = parseInt(heightIn) || 0;
      finalKg = lbsToKg(lbs);
      finalCm = ftInToCm(ft, inches);
      if (!Number.isFinite(lbs) || lbs < 55 || lbs > 880) {
        nextErrors.weight = 'Weight must be 55-880 lbs';
      }
      if (!Number.isFinite(ft) || finalCm < 100 || finalCm > 250) {
        nextErrors.height = 'Height must be ~3\'3" - 8\'2"';
      }
    } else {
      finalKg = Number(weightKg);
      finalCm = Number(heightCm);
      if (!Number.isFinite(finalKg) || finalKg < 25 || finalKg > 400) {
        nextErrors.weight = 'Weight must be 25-400 kg';
      }
      if (!Number.isFinite(finalCm) || finalCm < 100 || finalCm > 250) {
        nextErrors.height = 'Height must be 100-250 cm';
      }
    }

    if (!Number.isFinite(ageNum) || ageNum < 13 || ageNum > 120) {
      nextErrors.age = 'Age must be 13-120';
    }
    if (bodyFat && (!Number.isFinite(bodyFatNum) || (bodyFatNum !== null && (bodyFatNum < 2 || bodyFatNum > 70)))) {
      nextErrors.bodyFat = 'Body fat must be 2-70%';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    let finalKg: number;
    let finalCm: number;

    if (units === 'imperial') {
      finalKg = lbsToKg(parseFloat(weightLbs));
      finalCm = ftInToCm(parseInt(heightFt), parseInt(heightIn) || 0);
    } else {
      finalKg = parseFloat(weightKg) || 70;
      finalCm = parseFloat(heightCm) || 170;
    }

    onUpdate({
      age: parseInt(age) || 30,
      weight: finalKg,
      height: finalCm,
      gender,
      activityLevel,
      bodyFatPercentage: bodyFat ? parseFloat(bodyFat) : undefined,
    });
    onNext();
  };

  const hasRequiredFields = units === 'imperial'
    ? age && weightLbs && heightFt
    : age && weightKg && heightCm;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-4 pt-8">
        <motion.button
          whileTap={tapScaleLight}
          onClick={onBack}
          className="rounded-lg p-2 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
        <span className="text-sm text-muted-foreground">Step 4 of 7</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="mb-2 text-2xl font-bold"
        >
          Body Metrics
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut, delay: 0.04 }}
          className="mb-6 text-muted-foreground"
        >
          Used for personalized metabolic risk calculations
        </motion.p>

        <div className="space-y-5">
          {/* Unit toggle */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: easeOut, delay: 0.06 }}
            className="flex items-center gap-1 rounded-lg border border-border p-1 w-fit"
          >
            <button
              type="button"
              onClick={() => switchUnits('metric')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                units === 'metric'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Metric (kg/cm)
            </button>
            <button
              type="button"
              onClick={() => switchUnits('imperial')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                units === 'imperial'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              US (lbs/ft)
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: easeOut, delay: 0.08 }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (errors.age) setErrors((prev) => ({ ...prev, age: '' }));
                }}
                placeholder="30"
                className="mt-2"
              />
              {errors.age && <p className="mt-1 text-xs text-destructive">{errors.age}</p>}
            </div>
            <div>
              <Label>Gender</Label>
              <div className="mt-2 flex gap-2">
                {(['male', 'female', 'other'] as Gender[]).map((g) => (
                  <motion.button
                    key={g}
                    whileTap={tapScaleLight}
                    onClick={() => setGender(g)}
                    className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium capitalize transition-colors ${
                      gender === g
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {g}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Weight & Height — adapts to unit system */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: easeOut, delay: 0.12 }}
            className="grid grid-cols-2 gap-4"
          >
            {units === 'metric' ? (
              <>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => {
                      setWeightKg(e.target.value);
                      if (errors.weight) setErrors((prev) => ({ ...prev, weight: '' }));
                    }}
                    placeholder="70"
                    className="mt-2"
                  />
                  {errors.weight && <p className="mt-1 text-xs text-destructive">{errors.weight}</p>}
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={heightCm}
                    onChange={(e) => {
                      setHeightCm(e.target.value);
                      if (errors.height) setErrors((prev) => ({ ...prev, height: '' }));
                    }}
                    placeholder="170"
                    className="mt-2"
                  />
                  {errors.height && <p className="mt-1 text-xs text-destructive">{errors.height}</p>}
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="weight-lbs">Weight (lbs)</Label>
                  <Input
                    id="weight-lbs"
                    type="number"
                    step="0.1"
                    value={weightLbs}
                    onChange={(e) => {
                      setWeightLbs(e.target.value);
                      if (errors.weight) setErrors((prev) => ({ ...prev, weight: '' }));
                    }}
                    placeholder="154"
                    className="mt-2"
                  />
                  {errors.weight && <p className="mt-1 text-xs text-destructive">{errors.weight}</p>}
                </div>
                <div>
                  <Label>Height (ft & in)</Label>
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="height-ft"
                        type="number"
                        value={heightFt}
                        onChange={(e) => {
                          setHeightFt(e.target.value);
                          if (errors.height) setErrors((prev) => ({ ...prev, height: '' }));
                        }}
                        placeholder="5"
                        className="pr-7"
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ft</span>
                    </div>
                    <div className="relative flex-1">
                      <Input
                        id="height-in"
                        type="number"
                        value={heightIn}
                        onChange={(e) => {
                          setHeightIn(e.target.value);
                          if (errors.height) setErrors((prev) => ({ ...prev, height: '' }));
                        }}
                        placeholder="7"
                        className="pr-7"
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">in</span>
                    </div>
                  </div>
                  {errors.height && <p className="mt-1 text-xs text-destructive">{errors.height}</p>}
                </div>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: easeOut, delay: 0.16 }}
          >
            <Label>Activity Level</Label>
            <div className="mt-2 space-y-2">
              {activityOptions.map((option, i) => (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: easeOut, delay: 0.2 + i * 0.04 }}
                  whileTap={tapScaleLight}
                  onClick={() => setActivityLevel(option.value)}
                  className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
                    activityLevel === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="ml-2 text-sm text-muted-foreground">({option.description})</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: easeOut, delay: 0.4 }}
          >
            <Label htmlFor="bodyfat">Body Fat % (optional)</Label>
            <Input
              id="bodyfat"
              type="number"
              step="0.1"
              value={bodyFat}
              onChange={(e) => {
                setBodyFat(e.target.value);
                if (errors.bodyFat) setErrors((prev) => ({ ...prev, bodyFat: '' }));
              }}
              placeholder="e.g., 22"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Body fat percentage improves metabolic risk accuracy
            </p>
            {errors.bodyFat && <p className="mt-1 text-xs text-destructive">{errors.bodyFat}</p>}
          </motion.div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card p-6">
        <Button
          onClick={handleContinue}
          disabled={!hasRequiredFields}
          size="lg"
          className="w-full"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
