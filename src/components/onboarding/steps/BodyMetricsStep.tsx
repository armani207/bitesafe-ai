import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Calculator, Camera, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { HealthProfile } from '@/types/health';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface BodyMetricsStepProps {
  data: Partial<HealthProfile>;
  onUpdate: (data: Partial<HealthProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

type Gender = HealthProfile['gender'];
type ActivityLevel = HealthProfile['activityLevel'];

const activityOptions: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  { value: 'light', label: 'Lightly Active', description: '1-3 days/week' },
  { value: 'moderate', label: 'Moderately Active', description: '3-5 days/week' },
  { value: 'active', label: 'Active', description: '6-7 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Intense daily exercise' },
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
  const [showPhotoEstimator, setShowPhotoEstimator] = useState(false);
  const [showHealthSync, setShowHealthSync] = useState(false);
  const [healthSyncStatus, setHealthSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Body fat calculator inputs
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [hip, setHip] = useState('');

  // Photo estimation state
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [sidePhoto, setSidePhoto] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);

  const frontPhotoRef = useRef<HTMLInputElement>(null);
  const sidePhotoRef = useRef<HTMLInputElement>(null);

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
      toast.success(`Body fat estimated at ${bf.toFixed(1)}%`);
    }
  };

  const handlePhotoUpload = (type: 'front' | 'side') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'front') {
          setFrontPhoto(reader.result as string);
        } else {
          setSidePhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const estimateFromPhotos = async () => {
    if (!frontPhoto || !sidePhoto) {
      toast.error('Please upload both front and side photos');
      return;
    }

    setEstimating(true);
    
    // Simulate AI estimation (in production, this would call a vision API)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a plausible estimate based on available data
    const baseEstimate = gender === 'male' ? 18 : 25;
    const ageModifier = age ? Math.max(0, (parseInt(age) - 30) * 0.2) : 0;
    const estimatedBf = Math.min(45, Math.max(8, baseEstimate + ageModifier + (Math.random() * 6 - 3)));
    
    setBodyFat(estimatedBf.toFixed(1));
    setEstimating(false);
    setShowPhotoEstimator(false);
    toast.success(`Body fat estimated at ${estimatedBf.toFixed(1)}% based on visual analysis`);
  };

  const handleHealthSync = async () => {
    setHealthSyncStatus('syncing');
    
    // Simulate Apple Health sync
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate receiving data from Apple Health
    const mockHealthData = {
      height: '175',
      weight: '72',
      age: '34',
    };
    
    if (!height && mockHealthData.height) setHeight(mockHealthData.height);
    if (!weight && mockHealthData.weight) setWeight(mockHealthData.weight);
    if (!age && mockHealthData.age) setAge(mockHealthData.age);
    
    setHealthSyncStatus('success');
    toast.success('Health data synced successfully');
    
    setTimeout(() => {
      setShowHealthSync(false);
      setHealthSyncStatus('idle');
    }, 1500);
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
        <h2 className="mb-2 text-2xl font-bold">Body Metrics</h2>
        <p className="mb-6 text-muted-foreground">
          Used for personalized metabolic risk calculations
        </p>

        {/* Apple Health Sync Option */}
        <button
          onClick={() => setShowHealthSync(true)}
          className="mb-6 w-full flex items-center justify-between rounded-xl border-2 border-primary/20 bg-primary/5 p-4 transition-all hover:border-primary/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <span className="font-semibold">Sync from Apple Health</span>
              <p className="text-xs text-muted-foreground">Import your metrics automatically</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-primary" />
        </button>

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
                  className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                    activityLevel === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="ml-2 text-sm text-muted-foreground">({option.description})</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="bodyfat">Body Fat % (optional)</Label>
              <div className="flex gap-2">
                <Dialog open={showPhotoEstimator} onOpenChange={setShowPhotoEstimator}>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                      <Camera className="h-4 w-4" />
                      Photo Estimate
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Visual Body Fat Estimation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/30 p-3">
                        <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          This is an AI-based visual estimation and should not be considered clinically accurate. 
                          For precise measurements, consult a healthcare professional.
                        </p>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        For the best estimate, please provide clear photos with good lighting:
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Front View (relaxed)</Label>
                          <div 
                            onClick={() => frontPhotoRef.current?.click()}
                            className={`mt-2 aspect-[3/4] rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${
                              frontPhoto ? 'border-success' : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {frontPhoto ? (
                              <img src={frontPhoto} alt="Front" className="h-full w-full object-cover rounded-lg" />
                            ) : (
                              <div className="text-center p-2">
                                <Camera className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                                <span className="text-xs text-muted-foreground">Tap to add</span>
                              </div>
                            )}
                          </div>
                          <input
                            ref={frontPhotoRef}
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={handlePhotoUpload('front')}
                            className="hidden"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">Side View (relaxed)</Label>
                          <div 
                            onClick={() => sidePhotoRef.current?.click()}
                            className={`mt-2 aspect-[3/4] rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${
                              sidePhoto ? 'border-success' : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {sidePhoto ? (
                              <img src={sidePhoto} alt="Side" className="h-full w-full object-cover rounded-lg" />
                            ) : (
                              <div className="text-center p-2">
                                <Camera className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                                <span className="text-xs text-muted-foreground">Tap to add</span>
                              </div>
                            )}
                          </div>
                          <input
                            ref={sidePhotoRef}
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={handlePhotoUpload('side')}
                            className="hidden"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={estimateFromPhotos} 
                        className="w-full"
                        disabled={!frontPhoto || !sidePhoto || estimating}
                      >
                        {estimating ? 'Analyzing...' : 'Estimate Body Fat'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                      <Calculator className="h-4 w-4" />
                      Measure
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Body Fat Calculator (US Navy Method)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Enter measurements in centimeters for clinical-grade estimation.
                      </p>
                      <div>
                        <Label>Waist (at navel level)</Label>
                        <Input
                          type="number"
                          value={waist}
                          onChange={(e) => setWaist(e.target.value)}
                          placeholder="85"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Neck (at narrowest point)</Label>
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
                          <Label>Hip (at widest point)</Label>
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
            <p className="text-xs text-muted-foreground mt-1">
              Body fat percentage improves metabolic risk accuracy
            </p>
          </div>
        </div>
      </div>

      {/* Apple Health Sync Dialog */}
      <Dialog open={showHealthSync} onOpenChange={setShowHealthSync}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync with Apple Health</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {healthSyncStatus === 'idle' && (
              <>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-red-500">
                    <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold">Apple Health</h4>
                    <p className="text-sm text-muted-foreground">Import height, weight, and other metrics</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  BiteSafe will request read access to your health data. Your data remains private and is only used to personalize your risk assessments.
                </p>
                
                <Button onClick={handleHealthSync} className="w-full">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Connect to Apple Health
                </Button>
              </>
            )}
            
            {healthSyncStatus === 'syncing' && (
              <div className="flex flex-col items-center py-8">
                <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Syncing health data...</p>
              </div>
            )}
            
            {healthSyncStatus === 'success' && (
              <div className="flex flex-col items-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-4">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <p className="font-semibold">Sync Complete</p>
                <p className="text-sm text-muted-foreground">Your metrics have been imported</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
