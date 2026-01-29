import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useSupabase';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  useEffect(() => {
    if (!loading && !profileLoading) {
      if (!user) {
        navigate('/auth');
      } else if (profile?.is_onboarded) {
        navigate('/scan');
      }
    }
  }, [user, profile, loading, profileLoading, navigate]);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Show onboarding for logged-in users who haven't completed it
  if (user && !profile?.is_onboarded) {
    return <OnboardingFlow />;
  }

  return null;
};

export default Index;
