import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Camera } from 'lucide-react';
import { HealthProfile, UserProfile } from '@/types/health';

interface BasicInfoStepProps {
  data: Partial<UserProfile & HealthProfile>;
  onUpdate: (data: Partial<UserProfile | HealthProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

type DiabetesType = HealthProfile['diabetesType'];

const diabetesOptions: { value: DiabetesType; label: string; description: string }[] = [
  { value: 'type1', label: 'Type 1', description: 'Autoimmune, insulin-dependent' },
  { value: 'type2', label: 'Type 2', description: 'Insulin resistance' },
  { value: 'prediabetes', label: 'Prediabetes', description: 'Higher than normal levels' },
  { value: 'gestational', label: 'Gestational', description: 'During pregnancy' },
  { value: 'none', label: 'None', description: 'No diabetes diagnosis' },
];

export function BasicInfoStep({ data, onUpdate, onNext, onBack }: BasicInfoStepProps) {
  const [name, setName] = useState(data.name || '');
  const [diabetesType, setDiabetesType] = useState<DiabetesType>(data.diabetesType || 'none');
  const [usesInsulin, setUsesInsulin] = useState(data.usesInsulin || false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>((data as { avatar_url?: string }).avatar_url || null);
  const avatarFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) return;
    if (file.size > 2 * 1024 * 1024) return; // 2MB max
    avatarFileRef.current = file;
    setAvatarPreview(URL.createObjectURL(file));
    onUpdate({ avatarFile: file } as unknown as Partial<UserProfile>);
  };

  const handleContinue = () => {
    onUpdate({ name });
    onUpdate({ diabetesType, usesInsulin });
    onNext();
  };

  const isValid = name.trim().length >= 2;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-4 pt-8">
        <button onClick={onBack} className="rounded-lg p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-muted-foreground">Step 1 of 7</span>
      </div>

      <div className="flex-1 px-6">
        <h2 className="mb-2 text-2xl font-bold">Let's get to know you</h2>
        <p className="mb-8 text-muted-foreground">
          This helps us personalize your experience
        </p>

        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <Label className="mb-2">Profile Picture</Label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary/30 bg-secondary/50 transition-colors hover:border-primary/50 hover:bg-secondary"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-10 w-10 text-muted-foreground" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="mt-2 text-xs text-muted-foreground">JPG, PNG or WebP (max 2MB)</p>
          </div>

          <div>
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your first name"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="mb-3 block">Diabetes Status</Label>
            <div className="space-y-2">
              {diabetesOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDiabetesType(option.value)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    diabetesType === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {(diabetesType === 'type1' || diabetesType === 'type2') && (
            <div>
              <Label className="mb-3 block">Do you use insulin?</Label>
              <div className="flex gap-3">
                <button
                  onClick={() => setUsesInsulin(true)}
                  className={`flex-1 rounded-xl border-2 py-3 font-medium transition-all ${
                    usesInsulin
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setUsesInsulin(false)}
                  className={`flex-1 rounded-xl border-2 py-3 font-medium transition-all ${
                    !usesInsulin
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          )}
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
