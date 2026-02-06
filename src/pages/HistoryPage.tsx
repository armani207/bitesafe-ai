import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMeals, dbMealToMealAnalysis } from '@/hooks/useSupabase';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { format, isToday, isYesterday, formatDistanceToNow, startOfWeek } from 'date-fns';
import { Utensils, ChevronRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { data: dbMeals = [], isLoading } = useMeals();
  const meals = useMemo(() => dbMeals.map(dbMealToMealAnalysis), [dbMeals]);

  const { weekSummary, groupedMeals, dateKeys } = useMemo(() => {
    const groups: Record<string, typeof meals> = {};
    
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekMeals = meals.filter(m => new Date(m.timestamp) >= weekStart);
    
    const highRiskCount = weekMeals.filter(m => m.riskLevel === 'high').length;
    const avgRisk = weekMeals.length > 0 
      ? Math.round(weekMeals.reduce((a, m) => a + m.riskScore, 0) / weekMeals.length)
      : 0;

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
    
    return { 
      weekSummary: { 
        count: weekMeals.length, 
        highRisk: highRiskCount,
        avgRisk 
      },
      groupedMeals: groups, 
      dateKeys: Object.keys(groups) 
    };
  }, [meals]);

  return (
    <AppLayout
      headerProps={{
        title: 'Meal Log',
        subtitle: `${meals.length} meals analyzed`,
      }}
    >
      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : meals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <Utensils className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No meals logged</h3>
            <p className="text-muted-foreground">
              Begin analyzing meals to build your log and generate insights
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Week Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">This Week's Activity</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-2xl font-bold">{weekSummary.count}</span>
                  <p className="text-xs text-muted-foreground">Meals Logged</p>
                </div>
                <div className="border-x border-border">
                  <span className="text-2xl font-bold">{weekSummary.avgRisk}%</span>
                  <p className="text-xs text-muted-foreground">Avg Risk</p>
                </div>
                <div>
                  <span className={`text-2xl font-bold ${weekSummary.highRisk > 2 ? 'text-risk-high' : 'text-foreground'}`}>
                    {weekSummary.highRisk}
                  </span>
                  <p className="text-xs text-muted-foreground">High Risk</p>
                </div>
              </div>
            </motion.div>

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
                    <motion.button
                      key={meal.id}
                      type="button"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: groupIndex * 0.1 + mealIndex * 0.05 }}
                      onClick={() => navigate(`/history/${meal.id}`)}
                      className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-3 text-left transition-all card-hover"
                    >
                      {meal.imageUrl ? (
                        <img
                          src={meal.imageUrl || '/placeholder.svg'}
                          alt="Meal"
                          loading="lazy"
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
                    </motion.button>
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
