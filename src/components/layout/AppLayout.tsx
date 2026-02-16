import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

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
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!hideHeader && <Header {...headerProps} />}
      
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, x: 6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        className={`flex-1 ${!hideNav ? 'pb-24' : ''}`}
      >
        {children}
      </motion.main>

      {!hideNav && <BottomNav />}
    </div>
  );
}
