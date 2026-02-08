import { useMemo, lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMeals, useGlucoseReadings, useProfile, dbMealToMealAnalysis, dbProfileToHealthProfile } from '@/hooks/useSupabase';
import { WeeklyStatsCard } from '@/components/insights/WeeklyStatsCard';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  generateWeeklyReport,
  getWeekDateRange,
} from '@/lib/pdfExport';

// Lazy-load chart components (recharts) to reduce initial Insights bundle
const WeeklyRiskChart = lazy(() =>
  import('@/components/insights/WeeklyCharts').then((m) => ({ default: m.WeeklyRiskChart }))
);
const CarbsBreakdownChart = lazy(() =>
  import('@/components/insights/WeeklyCharts').then((m) => ({ default: m.CarbsBreakdownChart }))
);
const PatternsAnalysis = lazy(() =>
  import('@/components/insights/PatternsAnalysis').then((m) => ({ default: m.PatternsAnalysis }))
);
const PersonalizedRecommendations = lazy(() =>
  import('@/components/insights/PatternsAnalysis').then((m) => ({
    default: m.PersonalizedRecommendations,
  }))
);
import {
  TrendingUp, 
  Utensils, 
  BarChart3,
  Target,
  AlertTriangle,
  Calendar,
  FileText
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';

export default function InsightsPage() {
  const { data: dbMeals = [] } = useMeals();
  const { data: glucoseReadings = [] } = useGlucoseReadings();
  const { data: dbProfile } = useProfile();

  // Convert DB data to app types
  const meals = useMemo(() => dbMeals.map(dbMealToMealAnalysis), [dbMeals]);
  const healthProfile = useMemo(() => dbProfileToHealthProfile(dbProfile ?? null), [dbProfile]);

  // Get this week's and last week's meals
  const { weekMeals, prevWeekMeals, weekStart, weekEnd } = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const week = meals.filter((m) => new Date(m.timestamp) >= weekAgo);
    const prevWeek = meals.filter((m) => {
      const date = new Date(m.timestamp);
      return date >= twoWeeksAgo && date < weekAgo;
    });

    return { weekMeals: week, prevWeekMeals: prevWeek, weekStart: start, weekEnd: end };
  }, [meals]);

  const weekDateRange = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;

  const handleExportPDF = () => {
    try {
      generateWeeklyReport({
        meals,
        glucoseReadings: glucoseReadings.map(r => ({
          id: r.id,
          value: Number(r.value),
          reading_type: r.reading_type,
          created_at: r.created_at,
        })),
        healthProfile,
        dateRange: getWeekDateRange(),
      });
      toast.success('Weekly report downloaded successfully');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate report');
    }
  };

  return (
    <AppLayout
      headerProps={{
        title: 'Weekly Health Brief',
        subtitle: weekDateRange,
      }}
    >
      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-6 pb-6">
        {/* Export Button */}
        {meals.length > 0 && (
          <Button 
            onClick={handleExportPDF}
            variant="outline" 
            className="w-full mb-6"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export Weekly Report (PDF)
          </Button>
        )}

        {meals.length === 0 ? (
          <EmptyState />
        ) : (
          <Tabs defaultValue="changes" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="changes" className="text-xs sm:text-sm">
                <BarChart3 className="mr-1.5 h-4 w-4" />
                What Changed
              </TabsTrigger>
              <TabsTrigger value="patterns" className="text-xs sm:text-sm">
                <AlertTriangle className="mr-1.5 h-4 w-4" />
                Risk Patterns
              </TabsTrigger>
              <TabsTrigger value="focus" className="text-xs sm:text-sm">
                <Target className="mr-1.5 h-4 w-4" />
                Next Week
              </TabsTrigger>
            </TabsList>

            <TabsContent value="changes" className="space-y-6">
              {/* Week Summary Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-primary/5 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">This Week's Summary</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on {weekMeals.length} logged meals, here is your metabolic risk assessment for the week.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <WeeklyStatsCard meals={weekMeals} previousWeekMeals={prevWeekMeals} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                  7-Day Risk Trend
                </h3>
                <div className="rounded-xl border border-border bg-card p-4">
                  <Suspense fallback={<div className="h-[200px] animate-pulse rounded bg-muted" />}>
                    <WeeklyRiskChart meals={meals} />
                  </Suspense>
                </div>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Lower scores indicate reduced likelihood of glucose spikes
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                  Daily Carbohydrate Load (Color = Projected Risk)
                </h3>
                <div className="rounded-xl border border-border bg-card p-4">
                  <Suspense fallback={<div className="h-[200px] animate-pulse rounded bg-muted" />}>
                    <CarbsBreakdownChart meals={meals} />
                  </Suspense>
                </div>
                <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-risk-low" />
                    <span>Low Risk</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-risk-medium" />
                    <span>Moderate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-risk-high" />
                    <span>Elevated</span>
                  </div>
                </div>
              </motion.div>

              {/* Goals Adherence */}
              {healthProfile && healthProfile.goals.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Treatment Goals
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
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold">Identified Risk Patterns</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Based on your meal data, these behavioral patterns are likely contributing to glucose variability:
                </p>
                <Suspense fallback={<div className="h-24 animate-pulse rounded bg-muted" />}>
                  <PatternsAnalysis meals={meals} healthProfile={healthProfile} />
                </Suspense>
              </motion.div>
            </TabsContent>

            <TabsContent value="focus" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Next Week Focus Areas</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Evidence-based recommendations to improve your metabolic outcomes:
                </p>
                <Suspense fallback={<div className="h-24 animate-pulse rounded bg-muted" />}>
                  <PersonalizedRecommendations meals={meals} healthProfile={healthProfile} />
                </Suspense>
              </motion.div>

              {/* Clinical Disclaimer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border bg-muted/50 p-4"
              >
                <p className="text-xs text-muted-foreground">
                  <strong>Clinical Note:</strong> These recommendations are for decision support only 
                  and do not constitute medical advice. Always consult your healthcare provider 
                  before modifying your treatment plan or making significant dietary changes.
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
      <h3 className="mb-2 text-lg font-semibold">Insufficient Data</h3>
      <p className="text-sm text-muted-foreground">
        Analyze your first meal to begin generating your Weekly Health Brief
      </p>
    </motion.div>
  );
}
