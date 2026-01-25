import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  children: ReactNode;
  headerProps?: {
    title?: string;
    subtitle?: string;
    showGreeting?: boolean;
    children?: ReactNode;
  };
  hideNav?: boolean;
  hideHeader?: boolean;
}

export function AppLayout({ 
  children, 
  headerProps, 
  hideNav = false,
  hideHeader = false 
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!hideHeader && <Header {...headerProps} />}
      
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex-1 ${!hideNav ? 'pb-24' : ''}`}
      >
        {children}
      </motion.main>

      {!hideNav && <BottomNav />}
    </div>
  );
}
