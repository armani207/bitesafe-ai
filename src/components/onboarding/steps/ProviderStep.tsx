import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Stethoscope } from 'lucide-react';
import { HealthProfile, HealthcareProvider } from '@/types/health';

interface ProviderStepProps {
  data: Partial<HealthProfile>;
  onUpdate: (data: Partial<HealthProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ProviderStep({ data, onUpdate, onNext, onBack }: ProviderStepProps) {
  const [provider, setProvider] = useState<HealthcareProvider>(
    data.healthcareProvider || { name: '', specialty: '' }
  );
  const [medications, setMedications] = useState(
    data.medications?.join(', ') || ''
  );

  const handleContinue = () => {
    const meds = medications
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    
    onUpdate({
      healthcareProvider: provider.name ? provider : undefined,
      medications: meds.length > 0 ? meds : undefined,
    });
    onNext();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-4 pt-8">
        <button onClick={onBack} className="rounded-lg p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-muted-foreground">Step 6 of 7</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Healthcare info</h2>
            <p className="text-muted-foreground">Optional but helpful</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-4 font-semibold">Your Healthcare Provider</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="providerName">Doctor/Provider Name</Label>
                <Input
                  id="providerName"
                  value={provider.name}
                  onChange={(e) =>
                    setProvider((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Dr. Smith"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  value={provider.specialty}
                  onChange={(e) =>
                    setProvider((p) => ({ ...p, specialty: e.target.value }))
                  }
                  placeholder="Endocrinologist, PCP, etc."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="providerPhone">Phone (optional)</Label>
                <Input
                  id="providerPhone"
                  type="tel"
                  value={provider.phone || ''}
                  onChange={(e) =>
                    setProvider((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="providerNotes">Notes</Label>
                <Textarea
                  id="providerNotes"
                  value={provider.notes || ''}
                  onChange={(e) =>
                    setProvider((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Any special instructions or notes..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-4 font-semibold">Current Medications</h3>
            <div>
              <Label htmlFor="medications">
                List your medications (comma-separated)
              </Label>
              <Textarea
                id="medications"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="Metformin, Lisinopril, etc."
                className="mt-1"
                rows={3}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                This helps us understand potential interactions with foods
              </p>
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
