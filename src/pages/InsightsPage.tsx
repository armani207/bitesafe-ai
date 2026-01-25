import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/appStore';
import { WeeklyRiskChart, CarbsBreakdownChart } from '@/components/insights/WeeklyCharts';
import { WeeklyStatsCard } from '@/components/insights/WeeklyStatsCard';
import { PatternsAnalysis, PersonalizedRecommendations } from '@/components/insights/PatternsAnalysis';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Utensils, 
  BarChart3,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InsightsPage() {
  const { meals, healthProfile } = useAppStore();

  // Get this week's and last week's meals
  const { weekMeals, prevWeekMeals } = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const week = meals.filter((m) => new Date(m.timestamp) >= weekAgo);
    const prevWeek = meals.filter((m) => {
      const date = new Date(m.timestamp);
      return date >= twoWeeksAgo && date < weekAgo;
    });

    return { weekMeals: week, prevWeekMeals: prevWeek };
  }, [meals]);

  return (
    <AppLayout
      headerProps={{
        title: 'Weekly Insights',
        subtitle: 'Your health patterns at a glance',
      }}
    >
      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-6 pb-6">
        {meals.length === 0 ? (
          <EmptyState />
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                <BarChart3 className="mr-1.5 h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="patterns" className="text-xs sm:text-sm">
                <TrendingUp className="mr-1.5 h-4 w-4" />
                Patterns
              </TabsTrigger>
              <TabsTrigger value="tips" className="text-xs sm:text-sm">
                <Lightbulb className="mr-1.5 h-4 w-4" />
                Tips
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <WeeklyStatsCard meals={weekMeals} previousWeekMeals={prevWeekMeals} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                  Risk Score Trend
                </h3>
                <div className="rounded-xl border border-border bg-card p-4">
                  <WeeklyRiskChart meals={meals} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                  Daily Carbs (Color = Risk Level)
                </h3>
                <div className="rounded-xl border border-border bg-card p-4">
                  <CarbsBreakdownChart meals={meals} />
                </div>
                <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-risk-low" />
                    <span>Low</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-risk-medium" />
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-risk-high" />
                    <span>High</span>
                  </div>
                </div>
              </motion.div>

              {/* Goals */}
              {healthProfile && healthProfile.goals.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
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
            </TabsContent>

            <TabsContent value="patterns" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Detected Patterns</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Based on your meal history, we've identified these patterns:
                </p>
                <PatternsAnalysis meals={meals} healthProfile={healthProfile} />
              </motion.div>
            </TabsContent>

            <TabsContent value="tips" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Personalized Recommendations</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Tailored suggestions based on your health profile and eating habits:
                </p>
                <PersonalizedRecommendations meals={meals} healthProfile={healthProfile} />
              </motion.div>

              {/* Disclaimer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border bg-muted/50 p-4"
              >
                <p className="text-xs text-muted-foreground">
                  <strong>Disclaimer:</strong> These recommendations are for informational purposes only 
                  and should not replace advice from your healthcare provider. Always consult your 
                  doctor or dietitian before making significant changes to your diet.
                </p>
              </motion.div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-dashed border-border p-8 text-center"
    >
      <Utensils className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold">No data yet</h3>
      <p className="text-sm text-muted-foreground">
        Scan your first meal to start seeing insights and patterns
      </p>
    </motion.div>
  );
}
