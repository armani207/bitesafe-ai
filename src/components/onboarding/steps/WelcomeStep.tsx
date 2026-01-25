import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Utensils, Shield, Zap, BarChart3 } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    { icon: Utensils, text: 'Scan any meal instantly' },
    { icon: Shield, text: 'Get personalized risk scores' },
    { icon: Zap, text: 'Smart suggestions to stay safe' },
    { icon: BarChart3, text: 'Track your progress' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero section */}
      <div className="gradient-primary flex flex-1 flex-col items-center justify-center px-6 py-12 text-primary-foreground">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/20"
        >
          <Utensils className="h-10 w-10" />
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-2 text-3xl font-bold tracking-tight"
        >
          BITESAFE
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center text-lg text-primary-foreground/80"
        >
          Your personal food safety scanner for better blood sugar control
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm space-y-3"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 px-4 py-3"
            >
              <feature.icon className="h-5 w-5 text-primary-foreground/80" />
              <span className="font-medium">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom section */}
      <div className="bg-card p-6">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full bg-success text-success-foreground hover:bg-success/90"
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
