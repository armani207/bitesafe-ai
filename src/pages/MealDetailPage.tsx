import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMeals, dbMealToMealAnalysis, useDeleteMeal } from '@/hooks/useSupabase';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { format } from 'date-fns';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { easeOut } from '@/lib/animations';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function MealDetailPage() {
  const { mealId } = useParams<{ mealId: string }>();
  const navigate = useNavigate();
  const { data: dbMeals = [], isLoading } = useMeals();
  const deleteMeal = useDeleteMeal();
  const meal = dbMeals
    .map(dbMealToMealAnalysis)
    .find((m) => m.id === mealId);

  if (isLoading) {
    return (
      <AppLayout headerProps={{ title: 'Meal Details' }}>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!meal) {
    return (
      <AppLayout headerProps={{ title: 'Meal Details' }}>
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-6">
          <p className="mb-4 text-muted-foreground">Meal not found</p>
          <Button variant="outline" onClick={() => navigate('/history')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Log
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      headerProps={{
        title: 'Meal Details',
        subtitle: format(new Date(meal.timestamp), 'EEEE, MMM d, h:mm a'),
      }}
    >
      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-6 pb-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-4"
          onClick={() => navigate('/history')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Log
        </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="mb-4 ml-2 text-destructive hover:text-destructive"
                disabled={deleteMeal.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Meal
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this meal?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone and will remove this meal from your history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async (event) => {
                    event.preventDefault();
                    if (!mealId) return;
                    try {
                      await deleteMeal.mutateAsync(mealId);
                      toast.success('Meal deleted');
                      navigate('/history');
                    } catch (error) {
                      const msg = error instanceof Error ? error.message : 'Failed to delete meal';
                      toast.error(msg);
                    }
                  }}
                >
                  {deleteMeal.isPending ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        <div className="space-y-4">
          {meal.imageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: easeOut }}
              className="overflow-hidden rounded-2xl"
            >
              <img
                src={meal.imageUrl || '/placeholder.svg'}
                alt="Meal"
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easeOut, delay: 0.05 }}
            className={`rounded-xl p-4 ${
              meal.riskLevel === 'high'
                ? 'bg-risk-high/10 border border-risk-high/30'
                : meal.riskLevel === 'medium'
                ? 'bg-risk-medium/10 border border-risk-medium/30'
                : 'bg-success/10 border border-success/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Risk Level</span>
              <RiskBadge level={meal.riskLevel} score={meal.riskScore} />
            </div>
            {meal.riskExplanation && (
              <p className="mt-2 text-sm text-muted-foreground">{meal.riskExplanation}</p>
            )}
          </motion.div>

          {meal.foods.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: easeOut, delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <h3 className="mb-3 text-sm font-semibold">Identified Foods</h3>
              <div className="space-y-2">
                {meal.foods.map((food, i) => (
                  <motion.div
                    key={food.name + i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, ease: easeOut, delay: 0.15 + i * 0.04 }}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                  >
                    <div>
                      <span className="font-medium">{food.name}</span>
                      <span className="ml-2 text-sm text-muted-foreground">{food.portion}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{food.carbsGrams}g carbs</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easeOut, delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <h3 className="mb-3 text-sm font-semibold">Nutrition Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground">Carbs</span>
                <p className="text-lg font-semibold">
                  ~{meal.totalCarbs.min}-{meal.totalCarbs.max}g
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Protein</span>
                <p className="text-lg font-semibold">{meal.totalProtein}g</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Fat</span>
                <p className="text-lg font-semibold">{meal.totalFat}g</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Calories</span>
                <p className="text-lg font-semibold">{meal.totalCalories} kcal</p>
              </div>
            </div>
          </motion.div>

          {meal.suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: easeOut, delay: 0.25 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <h3 className="mb-3 text-sm font-semibold">Suggestions</h3>
              <div className="space-y-2">
                {meal.suggestions.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, ease: easeOut, delay: 0.3 + i * 0.04 }}
                    className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2"
                  >
                    <span>{s.icon}</span>
                    <span className="text-sm">{s.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
