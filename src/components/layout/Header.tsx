import { ReactNode } from 'react';
import { useAppStore } from '@/store/appStore';
import { Utensils, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showGreeting?: boolean;
  children?: ReactNode;
}

export function Header({ title, subtitle, showGreeting, children }: HeaderProps) {
  const userProfile = useAppStore((state) => state.userProfile);

  return (
    <header className="gradient-hero relative overflow-hidden px-4 pb-8 pt-12 text-primary-foreground">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-lg">
        <div className="mb-5 flex items-center justify-between">
          <motion.div 
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 shadow-lg backdrop-blur-sm">
              <Utensils className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">BITESAFE</span>
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
          </motion.div>
          {userProfile?.avatar ? (
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={userProfile.avatar}
              alt="Profile"
              className="h-11 w-11 rounded-full border-2 border-white/30 object-cover shadow-lg ring-2 ring-white/10"
            />
          ) : (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-sm font-semibold shadow-lg backdrop-blur-sm"
            >
              {userProfile?.name?.charAt(0) || 'U'}
            </motion.div>
          )}
        </div>

        {showGreeting && userProfile && (
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-2"
          >
            <h1 className="text-2xl font-bold">
              Welcome back, {userProfile.name.split(' ')[0]} 👋
            </h1>
            <p className="text-primary-foreground/80">Ready to analyze your next meal?</p>
          </motion.div>
        )}

        {title && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-primary-foreground/80">{subtitle}</p>
            )}
          </motion.div>
        )}

        {children}
      </div>
    </header>
  );
}
