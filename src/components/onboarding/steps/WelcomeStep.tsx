import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Utensils, Shield, Zap, BarChart3, Sparkles } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    { icon: Utensils, text: 'Scan any meal instantly', color: 'from-primary to-primary/70' },
    { icon: Shield, text: 'Get personalized risk scores', color: 'from-destructive to-warning' },
    { icon: Zap, text: 'Smart suggestions to stay safe', color: 'from-accent to-accent/70' },
    { icon: BarChart3, text: 'Track your progress', color: 'from-success to-success/70' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero section */}
      <div className="gradient-hero relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12 text-primary-foreground">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute left-1/2 top-1/4 h-32 w-32 -translate-x-1/2 rounded-full bg-accent/10 blur-2xl" />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="relative mb-8"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 shadow-2xl backdrop-blur-sm">
            <Utensils className="h-12 w-12" />
          </div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-lg"
          >
            <Sparkles className="h-4 w-4" />
          </motion.div>
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-3 text-4xl font-bold tracking-tight"
        >
          BITESAFE
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-10 max-w-xs text-center text-lg leading-relaxed text-primary-foreground/85"
        >
          Your personal food safety scanner for better blood sugar control
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="w-full max-w-sm space-y-3"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.45 + i * 0.1, type: "spring", stiffness: 100 }}
              className="group flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm transition-all hover:bg-white/15"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <span className="font-medium text-white/95">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom section */}
      <div className="bg-card p-6 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)]">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full bg-gradient-to-r from-accent to-accent/80 py-6 text-base font-semibold text-white shadow-lg shadow-accent/30 transition-all hover:shadow-xl hover:shadow-accent/40"
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
