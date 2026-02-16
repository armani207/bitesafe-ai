import { ReactNode } from 'react';
import { useAppStore } from '@/store/appStore';
import { Utensils } from 'lucide-react';
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
    <header className="header-banner relative overflow-hidden px-4 pb-8 pt-12 text-white">
      <div className="relative mx-auto max-w-lg">
        <div className="mb-5 flex items-center justify-between">
          <motion.div 
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-semibold tracking-tight">BiteSafe</span>
            </div>
          </motion.div>
          {typeof userProfile?.avatar === 'string' && userProfile.avatar ? (
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={userProfile.avatar}
              alt="Profile"
              className="h-10 w-10 rounded-full border border-white/20 object-cover"
            />
          ) : (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-medium"
            >
              {typeof userProfile?.name === 'string' ? userProfile.name.charAt(0).toUpperCase() : 'U'}
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
            <h1 className="text-xl font-semibold">
              Welcome back, {typeof userProfile.name === 'string' ? userProfile.name.split(' ')[0] : 'User'}
            </h1>
            <p className="text-sm text-white/80">Ready to analyze your next meal?</p>
          </motion.div>
        )}

        {title && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-white/75">{subtitle}</p>
            )}
          </motion.div>
        )}

        {children}
      </div>
    </header>
  );
}
