import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Scan, Clock, BarChart3, User, Droplet, Camera } from 'lucide-react';

const navItems = [
  { path: '/scan', label: 'Analyze', icon: Camera, isMain: true },
  { path: '/history', label: 'Log', icon: Clock },
  { path: '/glucose', label: 'Glucose', icon: Droplet },
  { path: '/insights', label: 'Brief', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const location = useLocation();

  // Reorder to put main item in center
  const orderedItems = [
    navItems.find(i => i.path === '/history'),
    navItems.find(i => i.path === '/glucose'),
    navItems.find(i => i.isMain),
    navItems.find(i => i.path === '/insights'),
    navItems.find(i => i.path === '/profile'),
  ].filter(Boolean);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-xl safe-bottom">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-around py-2">
          {orderedItems.map((item) => {
            if (!item) return null;
            const isActive = location.pathname === item.path || 
              (item.path === '/scan' && location.pathname === '/');
            const Icon = item.icon;

            if (item.isMain) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative -mt-6 flex flex-col items-center"
                >
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 shadow-xl shadow-primary/30 ring-4 ring-card"
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </motion.div>
                  <span className="mt-1 text-[10px] font-semibold text-primary">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className="group relative flex flex-col items-center gap-1 px-3 py-2"
              >
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -inset-2.5 rounded-xl bg-primary/10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`relative h-5 w-5 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                </motion.div>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-0.5 h-0.5 w-5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
