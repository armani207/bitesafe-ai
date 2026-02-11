import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useSupabase';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { Activity, Utensils, Shield, Zap, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { springGentle } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const DEV_BYPASS_AUTH = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

function WelcomeLanding({ onGetStarted, isLoading }: { onGetStarted: () => void; isLoading: boolean }) {
  const features = [
    { icon: Utensils, text: 'Scan any meal instantly' },
    { icon: Shield, text: 'Personalized risk scores' },
    { icon: Zap, text: 'Actionable suggestions' },
    { icon: BarChart3, text: 'Track your progress' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12">
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springGentle}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10"
        >
          <Activity className="h-10 w-10 text-primary" />
        </motion.div>
        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-2 text-2xl font-semibold"
        >
          BiteSafe
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-8 text-center text-sm text-muted-foreground"
        >
          Food safety scanner for better blood sugar control
        </motion.p>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.14, duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-sm space-y-2.5"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.text}
              initial={{ x: -8, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.18 + i * 0.04, duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="border-t border-border bg-card p-6">
        <Button
          type="button"
          onClick={onGetStarted}
          size="lg"
          className="mb-4 w-full py-6 text-sm font-medium"
          disabled={isLoading}
        >
          {isLoading ? 'Starting...' : 'Get Started'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, retryAnonymousSession, continueOffline } = useAuth();
  const [isGettingStarted, setIsGettingStarted] = useState(false);

  const handleGetStarted = async () => {
    setIsGettingStarted(true);
    try {
      const { error } = await retryAnonymousSession();
      if (error) {
        toast.error(error.message || 'Failed to start');
        return;
      }
    } finally {
      setIsGettingStarted(false);
    }
  };
  const { data: profile, isLoading: profileLoading } = useProfile();

  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      navigate('/scan');
      return;
    }
    if (!loading && !profileLoading) {
      if (user && profile?.is_onboarded) {
        navigate('/scan');
      }
    }
  }, [user, profile, loading, profileLoading, navigate]);

  if (DEV_BYPASS_AUTH) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Activity className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h1 className="text-xl font-bold mb-2">BiteSafe</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Initializing your health intelligence system...
          </p>
          <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent mb-6" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => continueOffline()}
          >
            Continue offline
          </Button>
        </div>
      </div>
    );
  }

  if (user && !profile?.is_onboarded) {
    return <OnboardingFlow />;
  }

  if (!user) {
    return (
      <WelcomeLanding onGetStarted={handleGetStarted} isLoading={isGettingStarted} />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
};

export default Index;
