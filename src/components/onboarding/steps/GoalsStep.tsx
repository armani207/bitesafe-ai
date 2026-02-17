import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { HealthProfile, HEALTH_GOALS, HealthGoal } from '@/types/health';
import { easeOut, tapScaleLight } from '@/lib/animations';

interface GoalsStepProps {
  data: Partial<HealthProfile>;
  onUpdate: (data: Partial<HealthProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function GoalsStep({ data, onUpdate, onNext, onBack }: GoalsStepProps) {
  const [selected, setSelected] = useState<HealthGoal[]>(data.goals || []);

  const toggleGoal = (goal: HealthGoal) => {
    setSelected((prev) => {
      const exists = prev.find((g) => g.id === goal.id);
      if (exists) {
        return prev.filter((g) => g.id !== goal.id);
      }
      return [...prev, goal];
    });
  };

  const handleContinue = () => {
    onUpdate({ goals: selected });
    onNext();
  };

  const isValid = selected.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-4 pt-8">
        <motion.button
          whileTap={tapScaleLight}
          onClick={onBack}
          className="rounded-lg p-2 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
        <span className="text-sm text-muted-foreground">Step 3 of 7</span>
      </div>

      <div className="flex-1 px-6">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="mb-2 text-2xl font-bold"
        >
          What are your goals?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut, delay: 0.04 }}
          className="mb-6 text-muted-foreground"
        >
          Select at least one goal to help us guide you
        </motion.p>

        <div className="space-y-3">
          {HEALTH_GOALS.map((goal, i) => {
            const isSelected = selected.some((g) => g.id === goal.id);
            return (
              <motion.button
                key={goal.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: easeOut, delay: 0.08 + i * 0.04 }}
                whileTap={tapScaleLight}
                onClick={() => toggleGoal(goal)}
                className={`relative flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-2xl">{goal.icon}</div>
                <div className="flex-1 font-semibold">{goal.name}</div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="rounded-full bg-primary p-1"
                  >
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut, delay: 0.4 }}
        className="p-6"
      >
        <Button
          onClick={handleContinue}
          disabled={!isValid}
          size="lg"
          className="w-full"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}
