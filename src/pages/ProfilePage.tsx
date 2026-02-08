import { useState, useRef, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile, useMeals, useUpdateProfile, dbProfileToHealthProfile } from '@/hooks/useSupabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { 
  User, 
  Heart, 
  Target, 
  Utensils, 
  Stethoscope, 
  Scale,
  LogOut,
  Settings,
  ShieldAlert,
  Camera,
  Chrome
} from 'lucide-react';
import { uploadAvatar, validateAvatarFile } from '@/lib/avatarStorage';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { lovable } from '@/integrations/lovable';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { signOut, isAnonymous, linkAnonymousAccount, user } = useAuth();
  const updateProfile = useUpdateProfile();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { data: dbProfile } = useProfile();
  const { data: dbMeals = [] } = useMeals();
  const navigate = useNavigate();

  const healthProfile = useMemo(() => dbProfileToHealthProfile(dbProfile ?? null), [dbProfile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !dbProfile) return;
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const url = await uploadAvatar(user.id, file);
      await updateProfile.mutateAsync({ avatar_url: url });
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error('Failed to update picture');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const handleUpgradeAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeEmail || !upgradePassword || upgradePassword.length < 6) {
      toast.error('Please enter a valid email and password (min 6 characters)');
      return;
    }
    setIsUpgrading(true);
    try {
      const { error } = await linkAnonymousAccount(upgradeEmail, upgradePassword);
      if (error) throw error;
      toast.success('Account upgraded! Your data is now saved securely.');
      setUpgradeEmail('');
      setUpgradePassword('');
      if (dbProfile) {
        await updateProfile.mutateAsync({ email: upgradeEmail });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upgrade account');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error(error.message || 'Failed to sign in with Google');
      }
    } catch (error) {
      toast.error('Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
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
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-2xl font-bold text-primary ring-2 ring-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {dbProfile?.avatar_url ? (
                  <img src={dbProfile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  dbProfile?.name?.charAt(0) || dbProfile?.email?.charAt(0) || 'U'
                )}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="h-8 text-xs"
              >
                <Camera className="mr-1.5 h-3.5 w-3.5" />
                {isUploadingAvatar ? 'Uploading…' : 'Change photo'}
              </Button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
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

        {/* Anonymous user upgrade CTA */}
        {isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">Save your data</h3>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Create an account to keep your meal history and insights across devices.
            </p>
            
            {/* Google Sign-In */}
            <Button
              type="button"
              variant="outline"
              className="mb-4 w-full"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <div className="relative mb-4">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary/5 px-2 text-xs text-muted-foreground">
                or
              </span>
            </div>

            <form onSubmit={handleUpgradeAccount} className="space-y-3">
              <div>
                <Label htmlFor="upgrade-email" className="text-xs">Email</Label>
                <Input
                  id="upgrade-email"
                  type="email"
                  placeholder="you@example.com"
                  value={upgradeEmail}
                  onChange={(e) => setUpgradeEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="upgrade-password" className="text-xs">Password (min 6 characters)</Label>
                <Input
                  id="upgrade-password"
                  type="password"
                  placeholder="••••••••"
                  value={upgradePassword}
                  onChange={(e) => setUpgradePassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isUpgrading}>
                {isUpgrading ? 'Upgrading...' : 'Create account & save data'}
              </Button>
            </form>
          </motion.div>
        )}

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
            onClick={() => avatarInputRef.current?.click()}
          >
            <Settings className="mr-3 h-5 w-5" />
            Edit Profile Picture
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
