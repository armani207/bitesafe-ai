import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useSupabase';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { Activity, Utensils, Shield, Zap, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { springGentle } from '@/lib/animations';
import { Button } from '@/components/ui/button';

const DEV_BYPASS_AUTH = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

function WelcomeLanding({ onGetStarted }: { onGetStarted: () => void }) {
  const features = [
    { icon: Utensils, text: 'Scan any meal instantly' },
    { icon: Shield, text: 'Personalized risk scores' },
    { icon: Zap, text: 'Actionable suggestions' },
    { icon: BarChart3, text: 'Track your progress' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[hsl(210,40%,96%)] via-background to-background dark:from-[hsl(218,32%,10%)] dark:via-background dark:to-background">
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />

        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springGentle}
          className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20"
        >
          <Activity className="h-12 w-12 text-white" />
        </motion.div>
        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-1 text-3xl font-bold tracking-tight"
        >
          BiteSafe
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-8 text-center text-sm text-muted-foreground"
        >
          AI-powered food scanner for smarter blood sugar control
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
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm px-4 py-3.5 shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-accent/10">
                <feature.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-sm font-medium">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="border-t border-border/50 bg-card/80 backdrop-blur-sm p-6">
        <Button
          type="button"
          onClick={onGetStarted}
          size="lg"
          className="mb-4 w-full py-6 text-sm font-semibold bg-gradient-to-r from-primary to-primary/85 hover:from-primary/90 hover:to-primary shadow-md shadow-primary/15"
        >
          Get Started
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
  const { user, loading } = useAuth();
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
            Loading...
          </p>
          <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent mb-6" />
        </div>
      </div>
    );
  }

  // Authenticated user who hasn't finished onboarding
  if (user && !profile?.is_onboarded) {
    return <OnboardingFlow />;
  }

  // No user → show welcome landing (Get Started → /auth)
  if (!user) {
    return <WelcomeLanding onGetStarted={() => navigate('/auth')} />;
  }

  // Fallback spinner (should redirect via useEffect above)
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
};

export default Index;
