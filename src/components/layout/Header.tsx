import { ReactNode } from 'react';
import { useAppStore } from '@/store/appStore';
import { Utensils } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showGreeting?: boolean;
  children?: ReactNode;
}

export function Header({ title, subtitle, showGreeting, children }: HeaderProps) {
  const userProfile = useAppStore((state) => state.userProfile);

  return (
    <header className="gradient-primary px-4 pb-6 pt-12 text-primary-foreground">
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/20">
              <Utensils className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">BITESAFE</span>
          </div>
          {userProfile?.avatar ? (
            <img
              src={userProfile.avatar}
              alt="Profile"
              className="h-10 w-10 rounded-full border-2 border-primary-foreground/30 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-semibold">
              {userProfile?.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>

        {showGreeting && userProfile && (
          <div className="mb-2">
            <h1 className="text-xl font-semibold">
              Hi, {userProfile.name.split(' ')[0]}!
            </h1>
            <p className="text-primary-foreground/80">Let's check your meal...</p>
          </div>
        )}

        {title && (
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-primary-foreground/80">{subtitle}</p>
            )}
          </div>
        )}

        {children}
      </div>
    </header>
  );
}
