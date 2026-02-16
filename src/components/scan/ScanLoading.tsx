import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

interface ScanLoadingProps {
  imagePreview: string | null;
}

export function ScanLoading({ imagePreview }: ScanLoadingProps) {
  return (
    <motion.div
      {...fadeIn}
      className="flex flex-col items-center py-12"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="relative mb-6"
      >
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Meal"
            className="h-48 w-48 rounded-2xl object-cover shadow-lg"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/20 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="mt-2 h-6 w-6 text-primary" />
            </motion.div>
          </div>
        </div>
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-2 text-lg font-semibold"
      >
        AI Analyzing Your Meal...
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="text-center text-sm text-muted-foreground"
      >
        Identifying foods and calculating nutrition
      </motion.p>
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="mt-4 flex flex-wrap justify-center gap-2"
      >
        {['🍽️ Detecting foods', '📊 Estimating carbs', '⚠️ Calculating risk'].map((label, i) => (
          <motion.span
            key={label}
            variants={staggerItem}
            className="animate-pulse rounded-full bg-secondary px-3 py-1 text-xs"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            {label}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}
