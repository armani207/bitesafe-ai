import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  variant?: 'carbs' | 'protein' | 'calories' | 'glucose' | 'default';
  size?: 'sm' | 'md' | 'lg';
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

const variantClasses = {
  carbs: 'stat-carbs',
  protein: 'stat-protein',
  calories: 'stat-calories',
  glucose: 'stat-glucose',
  default: 'bg-secondary text-secondary-foreground',
};

const sizeClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  variant = 'default',
  size = 'md',
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl transition-all card-hover',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-70">{label}</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold">{value}</span>
            {unit && <span className="text-sm font-medium opacity-70">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className="rounded-lg bg-foreground/10 p-2">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          <span
            className={cn(
              'font-medium',
              trend === 'up' && 'text-risk-high',
              trend === 'down' && 'text-success',
              trend === 'stable' && 'opacity-70'
            )}
          >
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'stable' && '→'}
            {trend === 'up' && ' Higher than usual'}
            {trend === 'down' && ' Lower than usual'}
            {trend === 'stable' && ' On track'}
          </span>
        </div>
      )}
    </div>
  );
}

interface StatRowProps {
  items: {
    label: string;
    value: string | number;
    unit?: string;
  }[];
  className?: string;
}

export function StatRow({ items, className }: StatRowProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {items.map((item, i) => (
        <div key={i} className="text-center">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-lg font-semibold">
            {item.value}
            {item.unit && (
              <span className="ml-0.5 text-xs text-muted-foreground">{item.unit}</span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
