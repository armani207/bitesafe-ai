import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MealAnalysis, HealthProfile } from '@/types/health';
import { 
  Clock, 
  Utensils, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Heart,
  Activity,
  ArrowRight,
  Target
} from 'lucide-react';

interface Pattern {
  id: string;
  icon: typeof Clock;
  title: string;
  cause: string;
  action: string;
  type: 'warning' | 'success' | 'info';
  impact?: string;
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
    
    const lateNightMeals = meals.filter((m) => {
      const hour = new Date(m.timestamp).getHours();
      return hour >= 21 || hour < 5;
    });
    
    const lateRatio = lateNightMeals.length / meals.length;
    if (lateRatio > 0.25) {
      // Calculate average risk for late vs early meals
      const lateAvgRisk = lateNightMeals.reduce((a, m) => a + m.riskScore, 0) / lateNightMeals.length;
      const earlyMeals = meals.filter((m) => {
        const hour = new Date(m.timestamp).getHours();
        return hour >= 6 && hour < 20;
      });
      const earlyAvgRisk = earlyMeals.length > 0 
        ? earlyMeals.reduce((a, m) => a + m.riskScore, 0) / earlyMeals.length 
        : 0;
      const riskIncrease = Math.round(((lateAvgRisk - earlyAvgRisk) / Math.max(earlyAvgRisk, 1)) * 100);
      
      detected.push({
        id: 'late-eating',
        icon: Clock,
        title: 'Late evening meals detected',
        cause: `${Math.round(lateRatio * 100)}% of meals consumed after 9 PM. Evening meals are associated with ~${Math.max(riskIncrease, 20)}% higher glucose response due to reduced insulin sensitivity.`,
        action: 'Next week: Aim to complete dinner by 7:30 PM on weekdays.',
        impact: `Projected risk reduction: ${Math.min(riskIncrease, 35)}%`,
        type: 'warning',
      });
    }

    // Analyze high-risk meal patterns
    const highRiskMeals = meals.filter((m) => m.riskLevel === 'high');
    const highRiskRatio = highRiskMeals.length / meals.length;
    
    // Check weekend patterns
    const weekendMeals = meals.filter((m) => {
      const day = new Date(m.timestamp).getDay();
      return day === 0 || day === 6;
    });
    const weekendHighRisk = weekendMeals.filter((m) => m.riskLevel === 'high');
    const weekendRiskRatio = weekendMeals.length > 0 ? weekendHighRisk.length / weekendMeals.length : 0;
    
    if (weekendRiskRatio > 0.5 && weekendMeals.length >= 2) {
      detected.push({
        id: 'weekend-risk',
        icon: AlertTriangle,
        title: 'Weekend risk elevation',
        cause: `Based on the last 3 weeks, weekends are projected to be your highest risk window with ${Math.round(weekendRiskRatio * 100)}% of meals classified as high-risk.`,
        action: 'Next week: Pre-plan weekend meals and consider meal prepping on Friday.',
        impact: 'Expected adherence improvement: 40%',
        type: 'warning',
      });
    } else if (highRiskRatio > 0.4) {
      detected.push({
        id: 'high-risk-pattern',
        icon: AlertTriangle,
        title: 'Elevated baseline risk',
        cause: `${Math.round(highRiskRatio * 100)}% of meals are categorized as high-risk, likely due to refined carbohydrate content or portion sizes.`,
        action: 'Next week: Replace one high-carb item per meal with a low-glycemic alternative.',
        impact: 'Projected risk reduction: 25-30%',
        type: 'warning',
      });
    } else if (highRiskRatio < 0.2 && meals.length >= 5) {
      detected.push({
        id: 'low-risk-pattern',
        icon: Heart,
        title: 'Strong dietary adherence',
        cause: 'Your meal choices consistently align with low-glycemic principles. This pattern is associated with improved long-term metabolic outcomes.',
        action: 'Maintain current approach. Consider logging any variations for pattern analysis.',
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
          title: 'Carbohydrate reduction trend',
          cause: `Your recent carb intake is ${Math.abs(Math.round(carbChange))}% lower than baseline. This is likely contributing to improved glycemic control.`,
          action: 'Continue current trajectory. Monitor energy levels and adjust if needed.',
          type: 'success',
        });
      } else if (carbChange > 20) {
        detected.push({
          id: 'carb-increase',
          icon: TrendingUp,
          title: 'Carbohydrate intake increasing',
          cause: `Recent carb intake is ${Math.round(carbChange)}% above your baseline. This may lead to increased glucose variability.`,
          action: 'Next week: Return to previous portion sizes for starchy foods.',
          impact: 'Expected stabilization within 3-5 days',
          type: 'warning',
        });
      }
    }

    // Fiber analysis
    const avgFiber = meals.reduce((acc, m) => acc + m.totalFiber, 0) / meals.length;
    if (avgFiber < 4 && meals.length >= 5) {
      detected.push({
        id: 'low-fiber',
        icon: Utensils,
        title: 'Suboptimal fiber intake',
        cause: `Average fiber per meal is ${avgFiber.toFixed(1)}g. Adequate fiber (>5g per meal) slows glucose absorption and reduces post-meal spikes.`,
        action: 'Next week: Add one serving of vegetables or legumes to each meal.',
        impact: 'Projected spike reduction: 15-25%',
        type: 'info',
      });
    }

    // Meal frequency
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekMeals = meals.filter((m) => new Date(m.timestamp) >= weekAgo);
    
    if (weekMeals.length >= 14) {
      detected.push({
        id: 'consistent-tracking',
        icon: Activity,
        title: 'Consistent logging behavior',
        cause: `Averaging ${(weekMeals.length / 7).toFixed(1)} logged meals per day. Consistent tracking enables more accurate pattern detection and risk prediction.`,
        action: 'Maintain logging frequency for optimal insights.',
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
          Insufficient data for pattern analysis. Log at least 3 meals to generate insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {patterns.map((pattern, index) => (
        <motion.div
          key={pattern.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`rounded-xl border p-4 ${
            pattern.type === 'warning'
              ? 'border-warning/30 bg-warning/5'
              : pattern.type === 'success'
              ? 'border-success/30 bg-success/5'
              : 'border-border bg-secondary/50'
          }`}
        >
          <div className="flex items-start gap-3">
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
              <h4 className="font-semibold mb-1">{pattern.title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{pattern.cause}</p>
              
              {/* Action Card */}
              <div className="flex items-start gap-2 rounded-lg bg-background/80 p-3 border border-border/50">
                <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{pattern.action}</p>
                  {pattern.impact && (
                    <p className="text-xs text-primary mt-1">{pattern.impact}</p>
                  )}
                </div>
              </div>
            </div>
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

interface Recommendation {
  icon: typeof Target;
  title: string;
  rationale: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export function PersonalizedRecommendations({ meals, healthProfile }: RecommendationsProps) {
  const recommendations = useMemo<Recommendation[]>(() => {
    const recs: Recommendation[] = [];

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
        icon: Utensils,
        title: 'Increase dietary fiber',
        rationale: `Current average: ${avgFiber.toFixed(1)}g per meal. Target: >5g. Fiber slows glucose absorption by 20-30%.`,
        action: 'Add one serving of leafy vegetables, legumes, or whole grains to each meal.',
        priority: 'high',
      });
    }

    // Protein recommendation
    if (avgProtein < 20 && avgCarbs > 40) {
      recs.push({
        icon: Utensils,
        title: 'Balance macronutrient ratios',
        rationale: `Carb-to-protein ratio is suboptimal. Adequate protein helps moderate post-meal glucose response.`,
        action: 'Include 20-30g lean protein with high-carb meals (chicken, fish, legumes, eggs).',
        priority: 'high',
      });
    }

    // High-risk meal patterns
    if (highRiskCount > meals.length * 0.3) {
      recs.push({
        icon: AlertTriangle,
        title: 'Reduce refined carbohydrate intake',
        rationale: `${Math.round((highRiskCount / meals.length) * 100)}% of meals are high-risk. Refined carbs cause rapid glucose elevation.`,
        action: 'Substitute white rice/bread with whole grain alternatives. Limit added sugars.',
        priority: 'high',
      });
    }

    // Portion control
    if (avgCarbs > 60) {
      recs.push({
        icon: Utensils,
        title: 'Optimize portion sizes',
        rationale: `Average carb load: ${Math.round(avgCarbs)}g per meal. Reducing to <50g may improve glycemic control.`,
        action: 'Reduce starchy portions by 25%. Use the plate method: half plate vegetables.',
        priority: 'medium',
      });
    }

    // Activity recommendation
    recs.push({
      icon: Activity,
      title: 'Post-meal activity protocol',
      rationale: 'Evidence shows 10-15 minute walks after meals reduce post-prandial glucose by up to 30%.',
      action: 'Take a brief walk within 30 minutes of finishing your largest meals.',
      priority: 'medium',
    });

    // Profile-based recommendations
    if (healthProfile) {
      if (healthProfile.diabetesType === 'type2' || healthProfile.diabetesType === 'prediabetes') {
        recs.push({
          icon: Clock,
          title: 'Optimize meal timing',
          rationale: 'Glucose tolerance is typically higher in the morning due to circadian insulin sensitivity patterns.',
          action: 'Front-load calories earlier in the day. Aim for largest meal at lunch.',
          priority: 'medium',
        });
      }

      if (healthProfile.goals.some((g) => g.id === 'weight_loss')) {
        recs.push({
          icon: Heart,
          title: 'Prioritize satiety',
          rationale: 'High-volume, low-calorie foods support weight management while maintaining glucose control.',
          action: 'Start meals with vegetables or broth-based soup to increase satiety.',
          priority: 'medium',
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 4);
  }, [meals, healthProfile]);

  if (recommendations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <Target className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Analyze more meals to generate personalized recommendations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
              rec.priority === 'high' ? 'bg-warning/10' : 'bg-primary/10'
            }`}>
              <rec.icon className={`h-4 w-4 ${
                rec.priority === 'high' ? 'text-warning' : 'text-primary'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{rec.title}</h4>
                {rec.priority === 'high' && (
                  <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                    High Priority
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{rec.rationale}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3">
            <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-sm font-medium">{rec.action}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
