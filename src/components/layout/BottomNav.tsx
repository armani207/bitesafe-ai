import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Scan, Clock, BarChart3, User } from 'lucide-react';

const navItems = [
  { path: '/scan', label: 'Scan', icon: Scan },
  { path: '/history', label: 'History', icon: Clock },
  { path: '/insights', label: 'Insights', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/scan' && location.pathname === '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center gap-1 px-4 py-2"
              >
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -inset-2 rounded-xl bg-primary/10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`relative h-6 w-6 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
