import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Shield, Activity } from 'lucide-react';
import { HealthProfile } from '@/types/health';

interface ScanUploaderProps {
  healthProfile: HealthProfile | null;
  onFileSelect: (file: File) => void;
  onDemoScan: () => void;
}

export function ScanUploader({ healthProfile, onFileSelect, onDemoScan }: ScanUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Camera/Upload area */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/50 transition-colors hover:border-primary/50 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Capture or upload a meal photo for analysis"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Camera className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">Capture meal for analysis</h3>
        <p className="text-sm text-muted-foreground">
          Photograph or upload to receive glucose risk assessment
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          AI-powered nutritional analysis with personalized risk scoring
        </p>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
          size="lg"
        >
          <Camera className="mr-2 h-5 w-5" />
          Analyze Meal
        </Button>
        <Button
          type="button"
          onClick={onDemoScan}
          variant="outline"
          className="flex-1"
          size="lg"
        >
          <Upload className="mr-2 h-5 w-5" />
          Demo Analysis
        </Button>
      </div>

      {healthProfile && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Active Health Profile</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Your risk assessments are personalized based on your health data
          </p>
          <div className="flex flex-wrap gap-2">
            {healthProfile.diabetesType !== 'none' && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {healthProfile.diabetesType === 'type1' ? 'Type 1 Diabetes' : 
                 healthProfile.diabetesType === 'type2' ? 'Type 2 Diabetes' : 
                 healthProfile.diabetesType === 'prediabetes' ? 'Prediabetes' : 'Gestational Diabetes'}
              </span>
            )}
            {healthProfile.goals.slice(0, 2).map((goal) => (
              <span
                key={goal.id}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium"
              >
                {goal.icon} {goal.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Clinical note */}
      <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-4 py-3">
        <Activity className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Results are for informational purposes only and should not replace clinical guidance. 
          Consult your healthcare provider for treatment decisions.
        </p>
      </div>
    </div>
  );
}
