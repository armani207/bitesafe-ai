import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, Camera, TrendingUp, Shield } from 'lucide-react';

interface CompleteStepProps {
  onComplete: () => void;
}

export function CompleteStep({ onComplete }: CompleteStepProps) {
  const features = [
    { icon: Camera, text: 'Scan your meals for instant analysis' },
    { icon: Shield, text: 'Get personalized safety scores' },
    { icon: TrendingUp, text: 'Track your health journey' },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success/10"
      >
        <CheckCircle className="h-12 w-12 text-success" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-2 text-center text-3xl font-bold"
      >
        You're all set!
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-8 text-center text-muted-foreground"
      >
        Your profile is ready. Let's start making safer food choices.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-8 w-full max-w-sm space-y-3"
      >
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <feature.icon className="h-5 w-5" />
            </div>
            <span className="font-medium">{feature.text}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-sm"
      >
        <Button
          onClick={onComplete}
          size="lg"
          className="w-full bg-success text-success-foreground hover:bg-success/90"
        >
          Start Scanning
        </Button>
      </motion.div>
    </div>
  );
}
