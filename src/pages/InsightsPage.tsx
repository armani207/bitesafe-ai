import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore, useWeekStats, useTodayMeals } from '@/store/appStore';
import { StatCard } from '@/components/ui/StatCard';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Utensils, 
  Flame,
  Beef,
  Wheat,
  Target,
  Award,
  AlertTriangle
} from 'lucide-react';

export default function InsightsPage() {
  const { meals, healthProfile } = useAppStore();
  const weekStats = useWeekStats();
  const todayMeals = useTodayMeals();

  const todayCarbs = todayMeals.reduce(
    (acc, meal) => acc + (meal.totalCarbs.min + meal.totalCarbs.max) / 2,
    0
  );
  const todayCalories = todayMeals.reduce(
    (acc, meal) => acc + meal.totalCalories,
    0
  );
  const todayProtein = todayMeals.reduce(
    (acc, meal) => acc + meal.totalProtein,
    0
  );

  const avgRisk = weekStats.mealCount > 0 ? weekStats.avgRiskScore : 0;
  const riskTrend = avgRisk > 50 ? 'up' : avgRisk < 30 ? 'down' : 'stable';

  // Generate insights based on data
  const insights = [
    ...(avgRisk > 60 ? [{
      type: 'warning' as const,
      icon: AlertTriangle,
      title: 'High spike risk detected',
      description: 'Your recent meals have been high in refined carbs. Consider adding more protein and fiber.',
    }] : []),
    ...(weekStats.mealCount >= 7 ? [{
      type: 'achievement' as const,
      icon: Award,
      title: 'Consistent tracker!',
      description: `You've logged ${weekStats.mealCount} meals this week. Keep it up!`,
    }] : []),
    ...(avgRisk < 35 && weekStats.mealCount > 3 ? [{
      type: 'achievement' as const,
      icon: Target,
      title: 'Great food choices',
      description: 'Your average risk score is low. Your glucose should be stable.',
    }] : []),
  ];

  return (
    <AppLayout
      headerProps={{
        title: 'Insights',
        subtitle: 'Your health at a glance',
      }}
    >
      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-6">
        {/* Today's Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            Today
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Carbs"
              value={Math.round(todayCarbs)}
              unit="g"
              variant="carbs"
              icon={Wheat}
            />
            <StatCard
              label="Calories"
              value={Math.round(todayCalories)}
              unit="kcal"
              variant="calories"
              icon={Flame}
            />
            <StatCard
              label="Protein"
              value={Math.round(todayProtein)}
              unit="g"
              variant="protein"
              icon={Beef}
            />
            <StatCard
              label="Meals"
              value={todayMeals.length}
              variant="default"
              icon={Utensils}
            />
          </div>
        </motion.div>

        {/* Weekly Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            This Week
          </h3>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Risk Score</p>
                <p className="text-3xl font-bold">
                  {avgRisk}
                  <span className="ml-1 text-lg font-normal text-muted-foreground">%</span>
                </p>
              </div>
              <div
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                  riskTrend === 'up'
                    ? 'bg-risk-high/10 text-risk-high'
                    : riskTrend === 'down'
                    ? 'bg-success/10 text-success'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {riskTrend === 'up' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : riskTrend === 'down' ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
                {riskTrend === 'up' ? 'Higher' : riskTrend === 'down' ? 'Lower' : 'Stable'}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Meals</p>
                <p className="text-lg font-semibold">{weekStats.mealCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Avg Carbs</p>
                <p className="text-lg font-semibold">{weekStats.avgCarbs}g</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Avg Cal</p>
                <p className="text-lg font-semibold">{weekStats.avgCalories}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Insights */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Insights
            </h3>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className={`flex items-start gap-3 rounded-xl p-4 ${
                    insight.type === 'warning'
                      ? 'bg-warning/10'
                      : insight.type === 'achievement'
                      ? 'bg-success/10'
                      : 'bg-secondary'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      insight.type === 'warning'
                        ? 'bg-warning text-warning-foreground'
                        : insight.type === 'achievement'
                        ? 'bg-success text-success-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <insight.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Profile summary */}
        {healthProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Your Goals
            </h3>
            <div className="flex flex-wrap gap-2">
              {healthProfile.goals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2"
                >
                  <span>{goal.icon}</span>
                  <span className="text-sm font-medium">{goal.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {meals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border border-dashed border-border p-8 text-center"
          >
            <Utensils className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="mb-1 font-semibold">No data yet</h3>
            <p className="text-sm text-muted-foreground">
              Scan your first meal to start seeing insights
            </p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
