import { RiskLevel } from '@/types/health';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulse?: boolean;
  className?: string;
}

const riskConfig = {
  low: {
    label: 'LOW',
    icon: CheckCircle,
    className: 'bg-risk-low text-risk-low-foreground',
    gradient: 'gradient-risk-low',
  },
  medium: {
    label: 'MEDIUM',
    icon: AlertCircle,
    className: 'bg-risk-medium text-risk-medium-foreground',
    gradient: 'gradient-risk-medium',
  },
  high: {
    label: 'HIGH',
    icon: AlertTriangle,
    className: 'bg-risk-high text-risk-high-foreground',
    gradient: 'gradient-risk-high',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1.5 text-sm gap-1.5',
  lg: 'px-4 py-2 text-base gap-2',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function RiskBadge({ 
  level, 
  score, 
  size = 'md', 
  showIcon = true,
  pulse = false,
  className 
}: RiskBadgeProps) {
  const config = riskConfig[level];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        config.gradient,
        sizeConfig[size],
        pulse && 'risk-pulse',
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>Spike Risk: {config.label}</span>
      {score !== undefined && (
        <span className="ml-1 opacity-80">({score}%)</span>
      )}
    </div>
  );
}

interface RiskAlertProps {
  level: RiskLevel;
  message: string;
  className?: string;
}

export function RiskAlert({ level, message, className }: RiskAlertProps) {
  const config = riskConfig[level];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium',
        config.gradient,
        className
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
