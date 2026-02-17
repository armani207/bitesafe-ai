import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { HealthProfile, HEALTH_CONDITIONS, HealthCondition } from '@/types/health';
import { easeOut, tapScaleLight } from '@/lib/animations';

interface ConditionsStepProps {
  data: Partial<HealthProfile>;
  onUpdate: (data: Partial<HealthProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ConditionsStep({ data, onUpdate, onNext, onBack }: ConditionsStepProps) {
  const [selected, setSelected] = useState<HealthCondition[]>(data.conditions || []);

  const toggleCondition = (condition: HealthCondition) => {
    setSelected((prev) => {
      const exists = prev.find((c) => c.id === condition.id);
      if (exists) {
        return prev.filter((c) => c.id !== condition.id);
      }
      return [...prev, condition];
    });
  };

  const handleContinue = () => {
    onUpdate({ conditions: selected });
    onNext();
  };

  const otherConditions = HEALTH_CONDITIONS.filter(
    (c) => !['type1', 'type2', 'prediabetes', 'gestational'].includes(c.id)
  );

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
        <span className="text-sm text-muted-foreground">Step 2 of 7</span>
      </div>

      <div className="flex-1 px-6">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="mb-2 text-2xl font-bold"
        >
          Other health conditions
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut, delay: 0.04 }}
          className="mb-6 text-muted-foreground"
        >
          Select any that apply — we'll personalize recommendations
        </motion.p>

        <div className="grid grid-cols-2 gap-3">
          {otherConditions.map((condition, i) => {
            const isSelected = selected.some((c) => c.id === condition.id);
            return (
              <motion.button
                key={condition.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: easeOut, delay: 0.08 + i * 0.035 }}
                whileTap={tapScaleLight}
                onClick={() => toggleCondition(condition)}
                className={`relative rounded-xl border-2 p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute right-2 top-2 rounded-full bg-primary p-0.5"
                  >
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </motion.div>
                )}
                <div className="mb-1 text-2xl">{condition.icon}</div>
                <div className="text-sm font-semibold">{condition.name}</div>
              </motion.button>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: easeOut, delay: 0.4 }}
          className="mt-4 text-center text-sm text-muted-foreground"
        >
          You can skip this step if none apply
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut, delay: 0.45 }}
        className="p-6"
      >
        <Button onClick={handleContinue} size="lg" className="w-full">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}
