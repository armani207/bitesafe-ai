import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

const Index = () => {
  const navigate = useNavigate();
  const isOnboarded = useAppStore((state) => state.isOnboarded);

  useEffect(() => {
    if (isOnboarded) {
      navigate('/scan');
    }
  }, [isOnboarded, navigate]);

  if (isOnboarded) {
    return null;
  }

  return <OnboardingFlow />;
};

export default Index;
