import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Scan, Clock, BarChart3, User, Droplet, Camera } from 'lucide-react';
import { layoutGlide, springMicro, tapScaleLight } from '@/lib/animations';

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
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-xl safe-bottom transition-smooth"
    >
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
                    whileTap={tapScaleLight}
                    whileHover={{ scale: 1.03 }}
                    transition={springMicro}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-medium ring-4 ring-card transition-smooth"
                  >
                    <Icon className="h-6 w-6 text-white" />
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
                  whileTap={tapScaleLight}
                  className="relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -inset-2.5 rounded-xl bg-primary/10"
                      transition={layoutGlide}
                    />
                  )}
                  <Icon
                    className={`relative h-5 w-5 transition-smooth-fast ${
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
                    transition={layoutGlide}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
