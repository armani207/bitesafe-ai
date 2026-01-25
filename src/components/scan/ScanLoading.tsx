import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

interface ScanLoadingProps {
  imagePreview: string | null;
}

export function ScanLoading({ imagePreview }: ScanLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center py-12"
    >
      <div className="relative mb-6">
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Meal"
            className="h-48 w-48 rounded-2xl object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/20 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Sparkles className="mt-2 h-6 w-6 animate-pulse text-primary" />
          </div>
        </div>
      </div>
      <h3 className="mb-2 text-lg font-semibold">AI Analyzing Your Meal...</h3>
      <p className="text-center text-sm text-muted-foreground">
        Identifying foods and calculating nutrition
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <span className="animate-pulse rounded-full bg-secondary px-3 py-1 text-xs">
          🍽️ Detecting foods
        </span>
        <span className="animate-pulse rounded-full bg-secondary px-3 py-1 text-xs" style={{ animationDelay: '0.2s' }}>
          📊 Estimating carbs
        </span>
        <span className="animate-pulse rounded-full bg-secondary px-3 py-1 text-xs" style={{ animationDelay: '0.4s' }}>
          ⚠️ Calculating risk
        </span>
      </div>
    </motion.div>
  );
}
