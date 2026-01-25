import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/appStore';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { Utensils, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HistoryPage() {
  const meals = useAppStore((state) => state.meals);

  const groupMealsByDate = () => {
    const groups: Record<string, typeof meals> = {};
    
    meals.forEach((meal) => {
      const date = new Date(meal.timestamp);
      let key: string;
      
      if (isToday(date)) {
        key = 'Today';
      } else if (isYesterday(date)) {
        key = 'Yesterday';
      } else {
        key = format(date, 'EEEE, MMM d');
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(meal);
    });
    
    return groups;
  };

  const groupedMeals = groupMealsByDate();
  const dateKeys = Object.keys(groupedMeals);

  return (
    <AppLayout
      headerProps={{
        title: 'Meal History',
        subtitle: `${meals.length} meals tracked`,
      }}
    >
      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-6">
        {meals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <Utensils className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No meals yet</h3>
            <p className="text-muted-foreground">
              Start scanning your meals to build your history
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {dateKeys.map((dateKey, groupIndex) => (
              <motion.div
                key={dateKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
              >
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {dateKey}
                </h3>
                <div className="space-y-3">
                  {groupedMeals[dateKey].map((meal, mealIndex) => (
                    <motion.div
                      key={meal.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: groupIndex * 0.1 + mealIndex * 0.05 }}
                      className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-all card-hover"
                    >
                      {meal.imageUrl ? (
                        <img
                          src={meal.imageUrl || '/placeholder.svg'}
                          alt="Meal"
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary">
                          <Utensils className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {format(new Date(meal.timestamp), 'h:mm a')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(meal.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <p className="mb-2 text-xs text-muted-foreground">
                          {meal.foods.map((f) => f.name).join(', ')}
                        </p>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium">
                            ~{meal.totalCarbs.min}-{meal.totalCarbs.max}g carbs
                          </span>
                          <RiskBadge level={meal.riskLevel} size="sm" showIcon={false} />
                        </div>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
