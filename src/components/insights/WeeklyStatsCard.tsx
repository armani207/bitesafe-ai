import { motion } from 'framer-motion';
import { MealAnalysis } from '@/types/health';
import { Wheat, Flame, Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

interface WeeklyStatsCardProps {
  meals: MealAnalysis[];
  previousWeekMeals?: MealAnalysis[];
}

export function WeeklyStatsCard({ meals, previousWeekMeals = [] }: WeeklyStatsCardProps) {
  const stats = calculateStats(meals);
  const prevStats = calculateStats(previousWeekMeals);

  const carbsTrend = getTrend(stats.avgCarbs, prevStats.avgCarbs);
  const caloriesTrend = getTrend(stats.avgCalories, prevStats.avgCalories);
  const riskTrend = getTrend(stats.avgRisk, prevStats.avgRisk);

  // Determine risk status
  const riskStatus = stats.avgRisk > 60 ? 'elevated' : stats.avgRisk > 35 ? 'moderate' : 'controlled';
  const riskMessage = riskStatus === 'elevated' 
    ? 'Risk level is elevated. Dietary modifications recommended.'
    : riskStatus === 'moderate'
    ? 'Risk is within moderate range. Minor adjustments may help.'
    : 'Risk level is well-controlled. Maintain current approach.';

  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="col-span-2 rounded-xl border border-border bg-card p-4"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              riskStatus === 'elevated' ? 'bg-risk-high/10' : 
              riskStatus === 'moderate' ? 'bg-risk-medium/10' : 'bg-success/10'
            }`}>
              {riskStatus === 'controlled' ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <AlertTriangle className={`h-4 w-4 ${
                  riskStatus === 'elevated' ? 'text-risk-high' : 'text-risk-medium'
                }`} />
              )}
            </div>
            <span className="text-sm font-medium text-muted-foreground">Projected Weekly Risk</span>
          </div>
          <TrendIndicator trend={riskTrend} inverse />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{stats.avgRisk}</span>
          <span className="text-lg text-muted-foreground">%</span>
          <span className={`text-sm font-medium ml-2 ${
            riskStatus === 'elevated' ? 'text-risk-high' : 
            riskStatus === 'moderate' ? 'text-risk-medium' : 'text-success'
          }`}>
            {riskStatus === 'elevated' ? 'Elevated' : riskStatus === 'moderate' ? 'Moderate' : 'Controlled'}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.avgRisk}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              stats.avgRisk > 60
                ? 'bg-risk-high'
                : stats.avgRisk > 35
                ? 'bg-risk-medium'
                : 'bg-risk-low'
            }`}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{riskMessage}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Wheat className="h-4 w-4 text-primary" />
          </div>
          <TrendIndicator trend={carbsTrend} inverse />
        </div>
        <span className="text-sm text-muted-foreground">Avg Carbs/Meal</span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{stats.avgCarbs}</span>
          <span className="text-sm text-muted-foreground">g</span>
        </div>
        {prevStats.avgCarbs > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {carbsTrend === 'down' ? '↓' : carbsTrend === 'up' ? '↑' : '→'} vs last week
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
            <Flame className="h-4 w-4 text-warning" />
          </div>
          <TrendIndicator trend={caloriesTrend} inverse />
        </div>
        <span className="text-sm text-muted-foreground">Avg Calories</span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{stats.avgCalories}</span>
          <span className="text-sm text-muted-foreground">kcal</span>
        </div>
        {prevStats.avgCalories > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {caloriesTrend === 'down' ? '↓' : caloriesTrend === 'up' ? '↑' : '→'} vs last week
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="col-span-2 rounded-xl border border-border bg-card p-4"
      >
        <h4 className="text-xs font-medium text-muted-foreground mb-3">Week at a Glance</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <span className="text-2xl font-bold">{stats.mealCount}</span>
            <p className="text-xs text-muted-foreground">Meals Logged</p>
          </div>
          <div className="text-center border-l border-border">
            <span className="text-2xl font-bold">{stats.avgProtein}</span>
            <p className="text-xs text-muted-foreground">Avg Protein (g)</p>
          </div>
          <div className="text-center border-l border-border">
            <span className="text-2xl font-bold">{stats.avgFiber}</span>
            <p className="text-xs text-muted-foreground">Avg Fiber (g)</p>
          </div>
          <div className="text-center border-l border-border">
            <span className="text-2xl font-bold">{stats.highRiskPct}%</span>
            <p className="text-xs text-muted-foreground">High Risk</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TrendIndicator({ trend, inverse = false }: { trend: 'up' | 'down' | 'stable'; inverse?: boolean }) {
  const isPositive = inverse ? trend === 'down' : trend === 'up';
  const isNegative = inverse ? trend === 'up' : trend === 'down';

  if (trend === 'stable') {
    return (
      <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>Stable</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isPositive
          ? 'bg-success/10 text-success'
          : isNegative
          ? 'bg-risk-high/10 text-risk-high'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {trend === 'up' ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>{isPositive ? 'Improved' : 'Elevated'}</span>
    </div>
  );
}

function calculateStats(meals: MealAnalysis[]) {
  if (meals.length === 0) {
    return {
      avgCarbs: 0,
      avgCalories: 0,
      avgProtein: 0,
      avgFiber: 0,
      avgRisk: 0,
      mealCount: 0,
      highRiskPct: 0,
    };
  }

  const highRiskCount = meals.filter(m => m.riskLevel === 'high').length;
  const totals = meals.reduce(
    (acc, meal) => ({
      carbs: acc.carbs + (meal.totalCarbs.min + meal.totalCarbs.max) / 2,
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProtein,
      fiber: acc.fiber + meal.totalFiber,
      risk: acc.risk + meal.riskScore,
    }),
    { carbs: 0, calories: 0, protein: 0, fiber: 0, risk: 0 }
  );

  return {
    avgCarbs: Math.round(totals.carbs / meals.length),
    avgCalories: Math.round(totals.calories / meals.length),
    avgProtein: Math.round(totals.protein / meals.length),
    avgFiber: Math.round(totals.fiber / meals.length),
    avgRisk: Math.round(totals.risk / meals.length),
    mealCount: meals.length,
    highRiskPct: Math.round((highRiskCount / meals.length) * 100),
  };
}

function getTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  if (previous === 0) return 'stable';
  const change = ((current - previous) / previous) * 100;
  if (change > 10) return 'up';
  if (change < -10) return 'down';
  return 'stable';
}
