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
  ChevronRight,
  LogOut,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMemo } from 'react';

export default function ProfilePage() {
  const { signOut } = useAuth();
  const { data: dbProfile } = useProfile();
  const { data: dbMeals = [] } = useMeals();
  const navigate = useNavigate();

  const healthProfile = useMemo(() => dbProfileToHealthProfile(dbProfile ?? null), [dbProfile]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const bmi = healthProfile 
    ? (healthProfile.weight / Math.pow(healthProfile.height / 100, 2)).toFixed(1)
    : null;

  const getBmiCategory = (bmiValue: number) => {
    if (bmiValue < 18.5) return 'Underweight';
    if (bmiValue < 25) return 'Normal';
    if (bmiValue < 30) return 'Overweight';
    return 'Obese';
  };

  const profileSections = [
    {
      icon: Heart,
      title: 'Health Conditions',
      value: healthProfile?.conditions.length 
        ? healthProfile.conditions.map(c => c.name).join(', ')
        : 'None specified',
    },
    {
      icon: Target,
      title: 'Health Goals',
      value: healthProfile?.goals.length
        ? healthProfile.goals.map(g => g.name).join(', ')
        : 'None specified',
    },
    {
      icon: Utensils,
      title: 'Dietary Restrictions',
      value: healthProfile?.dietaryRestrictions.length
        ? healthProfile.dietaryRestrictions.join(', ')
        : 'None',
    },
    {
      icon: Stethoscope,
      title: 'Healthcare Provider',
      value: healthProfile?.healthcareProvider?.name || 'Not specified',
    },
  ];

  return (
    <AppLayout
      headerProps={{
        title: 'Profile',
        subtitle: 'Manage your health profile',
      }}
    >
      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {dbProfile?.name?.charAt(0) || dbProfile?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{dbProfile?.name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">
                {healthProfile?.diabetesType !== 'none' 
                  ? `${healthProfile?.diabetesType === 'type1' ? 'Type 1' : 
                     healthProfile?.diabetesType === 'type2' ? 'Type 2' : 
                     healthProfile?.diabetesType === 'prediabetes' ? 'Prediabetes' : 'Gestational'} Diabetes`
                  : 'Health conscious user'}
              </p>
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
              <motion.button
                key={section.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all card-hover"
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
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Medications */}
        {healthProfile?.medications && healthProfile.medications.length > 0 && (
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

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 pb-6"
        >
          <Button variant="outline" className="w-full justify-start" size="lg">
            <Settings className="mr-3 h-5 w-5" />
            Edit Profile
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
        </motion.div>
      </div>
    </AppLayout>
  );
}
