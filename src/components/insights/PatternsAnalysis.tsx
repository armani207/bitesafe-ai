import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MealAnalysis, HealthProfile } from '@/types/health';
import { 
  Clock, 
  Utensils, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Sparkles,
  Lightbulb,
  Heart,
  Activity
} from 'lucide-react';

interface Pattern {
  id: string;
  icon: typeof Clock;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success';
}

interface PatternsAnalysisProps {
  meals: MealAnalysis[];
  healthProfile: HealthProfile | null;
}

export function PatternsAnalysis({ meals, healthProfile }: PatternsAnalysisProps) {
  const patterns = useMemo<Pattern[]>(() => {
    if (meals.length < 3) return [];

    const detected: Pattern[] = [];

    // Analyze meal timing patterns
    const mealHours = meals.map((m) => new Date(m.timestamp).getHours());
    const avgHour = mealHours.reduce((a, b) => a + b, 0) / mealHours.length;
    
    const lateNightMeals = meals.filter((m) => {
      const hour = new Date(m.timestamp).getHours();
      return hour >= 21 || hour < 5;
    });
    
    if (lateNightMeals.length > meals.length * 0.3) {
      detected.push({
        id: 'late-eating',
        icon: Clock,
        title: 'Late night eating detected',
        description: `${Math.round((lateNightMeals.length / meals.length) * 100)}% of your meals are after 9 PM. Late meals may impact glucose control.`,
        type: 'warning',
      });
    }

    // Analyze high-risk meal patterns
    const highRiskMeals = meals.filter((m) => m.riskLevel === 'high');
    const highRiskRatio = highRiskMeals.length / meals.length;
    
    if (highRiskRatio > 0.4) {
      detected.push({
        id: 'high-risk-pattern',
        icon: AlertTriangle,
        title: 'Frequent high-risk meals',
        description: `${Math.round(highRiskRatio * 100)}% of your meals are high-risk. Consider more low-carb options.`,
        type: 'warning',
      });
    } else if (highRiskRatio < 0.2 && meals.length >= 5) {
      detected.push({
        id: 'low-risk-pattern',
        icon: Heart,
        title: 'Great meal choices!',
        description: 'Most of your meals are low-risk. Keep up the excellent work!',
        type: 'success',
      });
    }

    // Analyze carb trends
    const recentMeals = meals.slice(0, Math.min(5, meals.length));
    const olderMeals = meals.slice(Math.min(5, meals.length));
    
    if (olderMeals.length >= 3) {
      const recentAvgCarbs = recentMeals.reduce(
        (acc, m) => acc + (m.totalCarbs.min + m.totalCarbs.max) / 2,
        0
      ) / recentMeals.length;
      
      const olderAvgCarbs = olderMeals.reduce(
        (acc, m) => acc + (m.totalCarbs.min + m.totalCarbs.max) / 2,
        0
      ) / olderMeals.length;
      
      const carbChange = ((recentAvgCarbs - olderAvgCarbs) / olderAvgCarbs) * 100;
      
      if (carbChange < -15) {
        detected.push({
          id: 'carb-decrease',
          icon: TrendingDown,
          title: 'Carb intake trending down',
          description: `Your recent carb intake is ${Math.abs(Math.round(carbChange))}% lower than before. Great progress!`,
          type: 'success',
        });
      } else if (carbChange > 20) {
        detected.push({
          id: 'carb-increase',
          icon: TrendingUp,
          title: 'Carb intake increasing',
          description: `Your recent carb intake is ${Math.round(carbChange)}% higher than usual.`,
          type: 'info',
        });
      }
    }

    // Analyze meal frequency
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekMeals = meals.filter((m) => new Date(m.timestamp) >= weekAgo);
    
    if (weekMeals.length >= 14) {
      detected.push({
        id: 'consistent-tracking',
        icon: Activity,
        title: 'Consistent tracker',
        description: `You're logging an average of ${Math.round(weekMeals.length / 7)} meals per day. Consistency helps predict glucose better.`,
        type: 'success',
      });
    }

    return detected;
  }, [meals]);

  if (patterns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <Activity className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Log more meals to discover patterns in your eating habits
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {patterns.map((pattern, index) => (
        <motion.div
          key={pattern.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-start gap-3 rounded-xl p-4 ${
            pattern.type === 'warning'
              ? 'bg-warning/10'
              : pattern.type === 'success'
              ? 'bg-success/10'
              : 'bg-secondary'
          }`}
        >
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
              pattern.type === 'warning'
                ? 'bg-warning text-warning-foreground'
                : pattern.type === 'success'
                ? 'bg-success text-success-foreground'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            <pattern.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold">{pattern.title}</h4>
            <p className="text-sm text-muted-foreground">{pattern.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

interface RecommendationsProps {
  meals: MealAnalysis[];
  healthProfile: HealthProfile | null;
}

export function PersonalizedRecommendations({ meals, healthProfile }: RecommendationsProps) {
  const recommendations = useMemo(() => {
    const recs: { icon: typeof Lightbulb; text: string; priority: number }[] = [];

    if (meals.length === 0) return recs;

    // Calculate averages
    const avgCarbs = meals.reduce(
      (acc, m) => acc + (m.totalCarbs.min + m.totalCarbs.max) / 2,
      0
    ) / meals.length;

    const avgFiber = meals.reduce((acc, m) => acc + m.totalFiber, 0) / meals.length;
    const avgProtein = meals.reduce((acc, m) => acc + m.totalProtein, 0) / meals.length;
    const highRiskCount = meals.filter((m) => m.riskLevel === 'high').length;

    // Fiber recommendation
    if (avgFiber < 5) {
      recs.push({
        icon: Sparkles,
        text: 'Add more fiber-rich foods like vegetables, legumes, or whole grains to help slow glucose absorption.',
        priority: 1,
      });
    }

    // Protein recommendation
    if (avgProtein < 20 && avgCarbs > 40) {
      recs.push({
        icon: Utensils,
        text: 'Consider adding lean protein to your meals. Protein helps stabilize blood sugar after eating.',
        priority: 2,
      });
    }

    // High-risk meal patterns
    if (highRiskCount > meals.length * 0.3) {
      recs.push({
        icon: AlertTriangle,
        text: 'Many of your meals are high-risk. Try swapping refined carbs for whole grain alternatives.',
        priority: 1,
      });
    }

    // Portion control
    if (avgCarbs > 60) {
      recs.push({
        icon: Utensils,
        text: 'Your average carb intake is high. Consider reducing portion sizes of starchy foods.',
        priority: 2,
      });
    }

    // Activity recommendation
    recs.push({
      icon: Activity,
      text: 'A 10-15 minute walk after meals can help reduce post-meal glucose spikes by up to 30%.',
      priority: 3,
    });

    // Profile-based recommendations
    if (healthProfile) {
      if (healthProfile.diabetesType === 'type2' || healthProfile.diabetesType === 'prediabetes') {
        recs.push({
          icon: Clock,
          text: 'Try to eat your largest meal earlier in the day. Glucose tolerance tends to be better in the morning.',
          priority: 2,
        });
      }

      if (healthProfile.goals.some((g) => g.id === 'weight_loss')) {
        recs.push({
          icon: Heart,
          text: 'For weight loss, focus on high-volume, low-calorie foods like vegetables and lean proteins.',
          priority: 2,
        });
      }
    }

    return recs.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [meals, healthProfile]);

  if (recommendations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <Lightbulb className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Scan more meals to get personalized recommendations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start gap-3 rounded-xl bg-primary/5 p-4"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <rec.icon className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm">{rec.text}</p>
        </motion.div>
      ))}
    </div>
  );
}
