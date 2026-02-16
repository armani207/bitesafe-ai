import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Mail, Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { springGentle } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect
  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || password.length < 6) {
      toast.error('Please enter a valid email and password (min 6 characters)');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password);
        if (error) {
          const msg = error instanceof Error ? error.message : String(error);
          if (msg.includes('already been registered')) {
            toast.error('This email is already registered. Try signing in instead.');
            setMode('signin');
          } else {
            toast.error(msg);
          }
          return;
        }
        toast.success('Account created! Setting up your profile...');
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          const msg = error instanceof Error ? error.message : String(error);
          if (msg.includes('Invalid login credentials')) {
            toast.error('Incorrect email or password. Try again or create a new account.');
          } else {
            toast.error(msg);
          }
          return;
        }
        toast.success('Welcome back!');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      if (msg.includes('Failed to fetch') || msg.includes('Load failed')) {
        toast.error('Cannot reach the server. Check your internet connection.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[hsl(210,40%,96%)] via-background to-background dark:from-[hsl(218,32%,10%)] dark:via-background dark:to-background">
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />

        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springGentle}
          className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20"
        >
          <Activity className="h-8 w-8 text-white" />
        </motion.div>

        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-1 text-2xl font-bold tracking-tight"
        >
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.14 }}
          className="mb-8 text-center text-sm text-muted-foreground"
        >
          {mode === 'signup'
            ? 'Sign up to start tracking your meals'
            : 'Sign in to access your meal history'}
        </motion.p>

        <motion.form
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18 }}
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-4"
        >
          <div>
            <Label htmlFor="auth-email" className="text-xs font-medium">
              Email
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div>
            <Label htmlFor="auth-password" className="text-xs font-medium">
              Password
            </Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="auth-password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full py-6 text-sm font-semibold bg-gradient-to-r from-primary to-primary/85 hover:from-primary/90 hover:to-primary shadow-md shadow-primary/15"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (mode === 'signup' ? 'Creating account...' : 'Signing in...')
              : (mode === 'signup' ? 'Create account' : 'Sign in')}
          </Button>

          <button
            type="button"
            onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
            className="w-full text-center text-xs text-primary hover:underline"
          >
            {mode === 'signup'
              ? 'Already have an account? Sign in'
              : "Don't have an account? Create one"}
          </button>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 max-w-xs text-center text-[11px] text-muted-foreground/70"
        >
          Your food logs are kept for 30 days, then automatically cleared.
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </motion.p>
      </div>

      {/* Back to landing */}
      <div className="border-t border-border/50 bg-card/80 backdrop-blur-sm p-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>
    </div>
  );
}
