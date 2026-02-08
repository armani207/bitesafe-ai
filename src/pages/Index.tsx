import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useSupabase';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { Activity } from 'lucide-react';

const DEV_BYPASS_AUTH = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Activity className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h1 className="text-xl font-bold mb-2">BiteSafe</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Initializing your health intelligence system...
          </p>
          <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  // Show onboarding for users who haven't completed it
  if (user && !profile?.is_onboarded) {
    return <OnboardingFlow />;
  }

  // No user after loading - session lost or auth failed (e.g. from onboarding handleComplete)
  // Show recovery UI instead of infinite spinner
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <h1 className="mb-2 text-xl font-semibold">Session unavailable</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Your session could not be loaded. Please refresh the page to try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Refresh page
        </button>
      </div>
    );
  }

  // Fallback loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
};

export default Index;
