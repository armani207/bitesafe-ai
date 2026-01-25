import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Camera/Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/50 transition-colors hover:border-primary/50 hover:bg-secondary"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Camera className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">Take a photo of your meal</h3>
        <p className="text-sm text-muted-foreground">
          or tap to upload from gallery
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          AI-powered analysis with real nutritional data
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex gap-3">
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
          size="lg"
        >
          <Camera className="mr-2 h-5 w-5" />
          Camera
        </Button>
        <Button
          onClick={onDemoScan}
          variant="outline"
          className="flex-1"
          size="lg"
        >
          <Upload className="mr-2 h-5 w-5" />
          Demo Scan
        </Button>
      </div>

      {healthProfile && (
        <div className="rounded-xl bg-secondary p-4">
          <h4 className="mb-2 text-sm font-semibold">Your Profile</h4>
          <div className="flex flex-wrap gap-2">
            {healthProfile.diabetesType !== 'none' && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {healthProfile.diabetesType === 'type1' ? 'Type 1' : 
                 healthProfile.diabetesType === 'type2' ? 'Type 2' : 
                 healthProfile.diabetesType === 'prediabetes' ? 'Prediabetes' : 'Gestational'}
              </span>
            )}
            {healthProfile.goals.slice(0, 2).map((goal) => (
              <span
                key={goal.id}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
              >
                {goal.icon} {goal.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
