import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Utensils, Shield, Zap, BarChart3 } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    { icon: Utensils, text: 'Scan any meal instantly' },
    { icon: Shield, text: 'Personalized risk scores' },
    { icon: Zap, text: 'Actionable suggestions' },
    { icon: BarChart3, text: 'Track your progress' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <div className="gradient-hero relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12 text-primary-foreground">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10"
        >
          <Utensils className="h-10 w-10" />
        </motion.div>
        
        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-3 text-2xl font-semibold tracking-tight"
        >
          BiteSafe
        </motion.h1>
        
        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10 max-w-xs text-center text-sm leading-relaxed text-primary-foreground/80"
        >
          Food safety scanner for better blood sugar control
        </motion.p>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm space-y-2.5"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                <feature.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-white/90">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="bg-card p-6">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full py-6 text-sm font-medium"
        >
          Get Started
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
