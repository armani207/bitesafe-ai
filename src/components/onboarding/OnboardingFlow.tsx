import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { WelcomeStep } from './steps/WelcomeStep';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { ConditionsStep } from './steps/ConditionsStep';
import { GoalsStep } from './steps/GoalsStep';
import { BodyMetricsStep } from './steps/BodyMetricsStep';
import { AllergiesStep } from './steps/AllergiesStep';
import { ProviderStep } from './steps/ProviderStep';
import { CompleteStep } from './steps/CompleteStep';
import { HealthProfile, UserProfile } from '@/types/health';

type OnboardingStep = 
  | 'welcome'
  | 'basic'
  | 'conditions'
  | 'goals'
  | 'metrics'
  | 'allergies'
  | 'provider'
  | 'complete';

const stepOrder: OnboardingStep[] = [
  'welcome',
  'basic',
  'conditions',
  'goals',
  'metrics',
  'allergies',
  'provider',
  'complete',
];

export function OnboardingFlow() {
  const navigate = useNavigate();
  const { setOnboarded, setUserProfile, setHealthProfile } = useAppStore();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [userData, setUserData] = useState<Partial<UserProfile>>({});
  const [healthData, setHealthData] = useState<Partial<HealthProfile>>({
    conditions: [],
    goals: [],
    allergies: [],
    dietaryRestrictions: [],
  });

  const currentIndex = stepOrder.indexOf(currentStep);
  const progress = ((currentIndex + 1) / stepOrder.length) * 100;

  const goNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < stepOrder.length) {
      setCurrentStep(stepOrder[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(stepOrder[prevIndex]);
    }
  };

  const handleComplete = () => {
    // Save all data
    const userProfile: UserProfile = {
      id: crypto.randomUUID(),
      name: userData.name || 'User',
      email: userData.email || '',
      createdAt: new Date(),
    };

    const healthProfile: HealthProfile = {
      diabetesType: healthData.diabetesType || 'none',
      usesInsulin: healthData.usesInsulin || false,
      conditions: healthData.conditions || [],
      goals: healthData.goals || [],
      allergies: healthData.allergies || [],
      dietaryRestrictions: healthData.dietaryRestrictions || [],
      age: healthData.age || 30,
      weight: healthData.weight || 70,
      height: healthData.height || 170,
      bodyFatPercentage: healthData.bodyFatPercentage,
      gender: healthData.gender || 'other',
      activityLevel: healthData.activityLevel || 'moderate',
      medications: healthData.medications,
      healthcareProvider: healthData.healthcareProvider,
    };

    setUserProfile(userProfile);
    setHealthProfile(healthProfile);
    setOnboarded(true);
    navigate('/scan');
  };

  const updateUserData = (data: Partial<UserProfile>) => {
    setUserData((prev) => ({ ...prev, ...data }));
  };

  const updateHealthData = (data: Partial<HealthProfile>) => {
    setHealthData((prev) => ({ ...prev, ...data }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      {currentStep !== 'welcome' && currentStep !== 'complete' && (
        <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          {currentStep === 'welcome' && (
            <WelcomeStep onNext={goNext} />
          )}
          {currentStep === 'basic' && (
            <BasicInfoStep
              data={{ ...userData, ...healthData }}
              onUpdate={(data) => {
                if ('name' in data || 'email' in data) {
                  updateUserData(data as Partial<UserProfile>);
                } else {
                  updateHealthData(data as Partial<HealthProfile>);
                }
              }}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 'conditions' && (
            <ConditionsStep
              data={healthData}
              onUpdate={updateHealthData}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 'goals' && (
            <GoalsStep
              data={healthData}
              onUpdate={updateHealthData}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 'metrics' && (
            <BodyMetricsStep
              data={healthData}
              onUpdate={updateHealthData}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 'allergies' && (
            <AllergiesStep
              data={healthData}
              onUpdate={updateHealthData}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 'provider' && (
            <ProviderStep
              data={healthData}
              onUpdate={updateHealthData}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 'complete' && (
            <CompleteStep onComplete={handleComplete} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
