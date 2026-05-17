import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile, useMeals, dbProfileToHealthProfile } from '@/hooks/useSupabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  User, 
  Heart, 
  Target, 
  Utensils, 
  Stethoscope, 
  Scale,
  LogOut,
  SquarePen,
  ShieldAlert,
  Trash2,
  Clock,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ProfileContent() {
  const { signOut, user, deleteAccount } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const { data: dbProfile } = useProfile();
  const { data: dbMeals = [] } = useMeals();
  const navigate = useNavigate();

  const healthProfile = useMemo(() => {
    try {
      return dbProfileToHealthProfile(dbProfile ?? null);
    } catch {
      return null;
    }
  }, [dbProfile]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Logout error:', error);
      }
      toast.error('Failed to log out');
    }
  };

  const handleResetAccount = async () => {
    setIsResetting(true);
    try {
      const { error } = await deleteAccount();
      if (error) {
        toast.error(error.message || 'Failed to delete account');
        return;
      }
      toast.success('Account deleted.');
      navigate('/');
      window.location.reload();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Delete account error:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsResetting(false);
    }
  };

  const bmi = healthProfile && typeof healthProfile.height === 'number' && healthProfile.height > 0
    ? (healthProfile.weight / Math.pow(healthProfile.height / 100, 2)).toFixed(1)
    : null;

  const getBmiCategory = (bmiValue: number) => {
    if (bmiValue < 18.5) return 'Underweight';
    if (bmiValue < 25) return 'Normal';
    if (bmiValue < 30) return 'Overweight';
    return 'Obese';
  };

  const conditions = Array.isArray(healthProfile?.conditions) ? healthProfile.conditions : [];
  const goals = Array.isArray(healthProfile?.goals) ? healthProfile.goals : [];
  const dietaryRestrictions = Array.isArray(healthProfile?.dietaryRestrictions) ? healthProfile.dietaryRestrictions : [];

  const displayInitial =
    (typeof dbProfile?.name === 'string' && dbProfile.name ? dbProfile.name.charAt(0) : null) ||
    (typeof dbProfile?.email === 'string' && dbProfile.email ? dbProfile.email.charAt(0) : null) ||
    (user?.email ? user.email.charAt(0) : 'U');

  const profileSections = [
    {
      icon: Heart,
      title: 'Health Conditions',
      value: conditions.length ? conditions.map((c) => (c && typeof c === 'object' && 'name' in c ? c.name : String(c))).join(', ') : 'None specified',
    },
    {
      icon: Target,
      title: 'Health Goals',
      value: goals.length ? goals.map((g) => (g && typeof g === 'object' && 'name' in g ? g.name : String(g))).join(', ') : 'None specified',
    },
    {
      icon: Utensils,
      title: 'Dietary Restrictions',
      value: dietaryRestrictions.length ? dietaryRestrictions.join(', ') : 'None',
    },
    {
      icon: Stethoscope,
      title: 'Healthcare Provider',
      value: (healthProfile?.healthcareProvider && typeof healthProfile.healthcareProvider === 'object' && 'name' in healthProfile.healthcareProvider
        ? (healthProfile.healthcareProvider as { name?: string }).name
        : null) || 'Not specified',
    },
  ];

  return (
    <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-2 ring-background">
              {displayInitial.toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{typeof dbProfile?.name === 'string' ? dbProfile.name : 'User'}</h2>
              <p className="text-sm text-muted-foreground">
                {healthProfile?.diabetesType !== 'none' 
                  ? `${healthProfile?.diabetesType === 'type1' ? 'Type 1' : 
                     healthProfile?.diabetesType === 'type2' ? 'Type 2' : 
                     healthProfile?.diabetesType === 'prediabetes' ? 'Prediabetes' : 'Gestational'} Diabetes`
                  : 'Health conscious user'}
              </p>
              {user?.email && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{user.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{dbMeals.length}</p>
              <p className="text-xs text-muted-foreground">Meals Tracked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{healthProfile?.age || '-'}</p>
              <p className="text-xs text-muted-foreground">Age</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{bmi || '-'}</p>
              <p className="text-xs text-muted-foreground">BMI</p>
            </div>
          </div>
        </motion.div>

        {/* Body Metrics */}
        {healthProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Body Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <Scale className="mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Weight</p>
                <p className="text-lg font-semibold">{healthProfile.weight} kg</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <User className="mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Height</p>
                <p className="text-lg font-semibold">{healthProfile.height} cm</p>
              </div>
              {healthProfile.bodyFatPercentage && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Body Fat</p>
                  <p className="text-lg font-semibold">{healthProfile.bodyFatPercentage}%</p>
                </div>
              )}
              {bmi && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">BMI Status</p>
                  <p className="text-lg font-semibold">{getBmiCategory(parseFloat(bmi))}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Profile Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            Health Information
          </h3>
          <div className="space-y-2">
            {profileSections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <section.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{section.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {section.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Medications */}
        {Array.isArray(healthProfile?.medications) && healthProfile.medications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Medications
            </h3>
            <div className="flex flex-wrap gap-2">
              {healthProfile.medications.map((med) => (
                <span
                  key={med}
                  className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium"
                >
                  {med}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* 30-day retention note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-6 flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4"
        >
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Meal logs are kept for 30 days, then automatically cleared to keep your account tidy.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 pb-6"
        >
          <Button
            variant="outline"
            className="w-full justify-start"
            size="lg"
            onClick={() => navigate('/profile/edit')}
          >
            <SquarePen className="mr-3 h-5 w-5" />
            Edit Health Profile
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            size="lg"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                size="lg"
                disabled={isResetting}
              >
                <Trash2 className="mr-3 h-5 w-5" />
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Permanently delete account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes your account, profile, meal history, and glucose readings. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleResetAccount();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isResetting}
                >
                  {isResetting ? 'Deleting…' : 'Delete account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
    </div>
  );
}

const ProfileErrorFallback = ({ error }: { error?: Error }) => (
  <div className="-mt-4 flex min-h-[40vh] flex-col items-center justify-center rounded-t-3xl bg-background px-6">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
      <ShieldAlert className="h-8 w-8 text-destructive" />
    </div>
    <h2 className="mt-4 text-lg font-semibold">Profile error</h2>
    <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
      {error?.message ?? 'Could not load profile.'}
    </p>
    {import.meta.env.DEV && error?.stack && (
      <pre className="mt-3 max-h-24 overflow-auto rounded bg-muted p-2 text-[10px] text-left">
        {error.stack}
      </pre>
    )}
    <Button onClick={() => window.location.reload()} className="mt-6">
      Try again
    </Button>
  </div>
);

export default function ProfilePage() {
  return (
    <AppLayout
      headerProps={{
        title: 'Profile',
        subtitle: 'Manage your health profile',
      }}
    >
      <ErrorBoundary fallback={(err) => <ProfileErrorFallback error={err} />}>
        <ProfileContent />
      </ErrorBoundary>
    </AppLayout>
  );
}
