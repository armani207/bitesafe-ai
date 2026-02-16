import { cn } from '@/lib/utils';
import { MealSuggestion } from '@/types/health';
import { 
  Utensils, 
  Salad, 
  Footprints, 
  Clock, 
  ArrowLeftRight,
  Leaf,
  Dumbbell
} from 'lucide-react';

interface SuggestionCardProps {
  suggestion: MealSuggestion;
  onClick?: () => void;
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  '🥗': <Salad className="h-4 w-4" />,
  '🏃': <Footprints className="h-4 w-4" />,
  '⏰': <Clock className="h-4 w-4" />,
  '🔄': <ArrowLeftRight className="h-4 w-4" />,
  '🥦': <Leaf className="h-4 w-4" />,
  '🍽️': <Utensils className="h-4 w-4" />,
  '💪': <Dumbbell className="h-4 w-4" />,
};

export function SuggestionCard({ suggestion, onClick, className }: SuggestionCardProps) {
  const icon = iconMap[suggestion.icon] || <Utensils className="h-4 w-4" />;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl bg-suggestion px-4 py-3 text-left',
        'transition-smooth card-enter card-hover',
        'hover:bg-suggestion/80',
        className
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-smooth group-hover:scale-110">
        {icon}
      </div>
      <span className="text-sm font-medium text-suggestion-foreground">
        {suggestion.text}
      </span>
    </button>
  );
}

interface SuggestionGridProps {
  suggestions: MealSuggestion[];
  onSelect?: (suggestion: MealSuggestion) => void;
  className?: string;
}

export function SuggestionGrid({ suggestions, onSelect, className }: SuggestionGridProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onClick={() => onSelect?.(suggestion)}
        />
      ))}
    </div>
  );
}

interface TipCardProps {
  icon: string;
  text: string;
  className?: string;
}

export function TipCard({ icon, text, className }: TipCardProps) {
  const renderedIcon = iconMap[icon] || <span>{icon}</span>;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-smooth',
        className
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {renderedIcon}
      </div>
      <span className="text-sm text-card-foreground">{text}</span>
    </div>
  );
}
