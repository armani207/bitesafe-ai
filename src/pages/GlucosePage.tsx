import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGlucoseReadings, useAddGlucoseReading, useMeals } from '@/hooks/useSupabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Droplet, TrendingUp, TrendingDown, Minus, Clock, Utensils, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, subDays, isWithinInterval } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type ReadingType = 'fasting' | 'pre_meal' | 'post_meal' | 'bedtime' | 'random';

const readingTypeLabels: Record<ReadingType, string> = {
  fasting: 'Fasting',
  pre_meal: 'Before Meal',
  post_meal: 'After Meal',
  bedtime: 'Bedtime',
  random: 'Random',
};

export default function GlucosePage() {
  const { data: readings = [], isLoading } = useGlucoseReadings();
  const { data: meals = [] } = useMeals();
  const addReading = useAddGlucoseReading();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [value, setValue] = useState('');
  const [readingType, setReadingType] = useState<ReadingType>('random');
  const [notes, setNotes] = useState('');

  // Calculate stats
  const stats = useMemo(() => {
    const weekAgo = subDays(new Date(), 7);
    const weekReadings = readings.filter(r => 
      isWithinInterval(new Date(r.created_at), { start: weekAgo, end: new Date() })
    );

    if (weekReadings.length === 0) {
      return { avg: 0, high: 0, low: 0, inRange: 0, trend: 'stable' as const };
    }

    const values = weekReadings.map(r => Number(r.value));
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const high = Math.max(...values);
    const low = Math.min(...values);
    const inRangeCount = values.filter(v => v >= 70 && v <= 180).length;
    const inRange = Math.round((inRangeCount / values.length) * 100);

    // Calculate trend (comparing first half to second half of week)
    const midPoint = Math.floor(weekReadings.length / 2);
    const firstHalf = values.slice(0, midPoint);
    const secondHalf = values.slice(midPoint);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
    const trend = secondAvg > firstAvg + 10 ? 'up' : secondAvg < firstAvg - 10 ? 'down' : 'stable';

    return { avg, high, low, inRange, trend };
  }, [readings]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const weekAgo = subDays(new Date(), 7);
    return readings
      .filter(r => isWithinInterval(new Date(r.created_at), { start: weekAgo, end: new Date() }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(r => ({
        time: format(new Date(r.created_at), 'MMM d, HH:mm'),
        value: Number(r.value),
        type: r.reading_type,
      }));
  }, [readings]);

  // Find meal correlations
  const correlations = useMemo(() => {
    const weekAgo = subDays(new Date(), 7);
    const recentReadings = readings.filter(r => 
      isWithinInterval(new Date(r.created_at), { start: weekAgo, end: new Date() }) &&
      r.reading_type === 'post_meal'
    );

    const recentMeals = meals.filter(m => 
      isWithinInterval(new Date(m.created_at), { start: weekAgo, end: new Date() })
    );

    // Match post-meal readings to meals within 2 hours
    return recentReadings.map(reading => {
      const readingTime = new Date(reading.created_at);
      const matchedMeal = recentMeals.find(meal => {
        const mealTime = new Date(meal.created_at);
        const diffHours = (readingTime.getTime() - mealTime.getTime()) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours < 2;
      });

      return {
        reading,
        meal: matchedMeal,
        spike: Number(reading.value) > 180,
      };
    }).filter(c => c.meal);
  }, [readings, meals]);

  const handleAddReading = async () => {
    if (!value) {
      toast.error('Please enter a glucose value');
      return;
    }

    const numValue = parseFloat(value);
    if (numValue < 20 || numValue > 600) {
      toast.error('Please enter a valid glucose value (20-600 mg/dL)');
      return;
    }

    try {
      await addReading.mutateAsync({
        value: numValue,
        reading_type: readingType,
        notes: notes || undefined,
      });
      toast.success('Reading logged successfully');
      setShowAddDialog(false);
      setValue('');
      setNotes('');
      setReadingType('random');
    } catch (error) {
      toast.error('Failed to log reading');
    }
  };

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-risk-high" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-risk-low" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout
      headerProps={{
        title: 'Glucose Tracking',
        subtitle: 'Monitor your blood sugar patterns',
      }}
    >
      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-6 pb-6">
        {/* Add Reading Button */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Log Glucose Reading
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Glucose Reading</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Glucose Level (mg/dL)</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="120"
                  className="mt-2 text-2xl font-bold text-center"
                />
              </div>
              <div>
                <Label>Reading Type</Label>
                <Select value={readingType} onValueChange={(v) => setReadingType(v as ReadingType)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(readingTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., After lunch"
                  className="mt-2"
                />
              </div>
              <Button 
                onClick={handleAddReading} 
                className="w-full"
                disabled={addReading.isPending}
              >
                {addReading.isPending ? 'Saving...' : 'Save Reading'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : readings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {/* Weekly Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">7-Day Average</span>
                  {getTrendIcon()}
                </div>
                <span className="text-2xl font-bold">{stats.avg}</span>
                <span className="text-sm text-muted-foreground ml-1">mg/dL</span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <span className="text-xs text-muted-foreground">Time in Range</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-2xl font-bold ${stats.inRange >= 70 ? 'text-risk-low' : stats.inRange >= 50 ? 'text-risk-medium' : 'text-risk-high'}`}>
                    {stats.inRange}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">70-180 mg/dL</span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <span className="text-xs text-muted-foreground">Lowest</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-2xl font-bold ${stats.low < 70 ? 'text-risk-high' : 'text-risk-low'}`}>
                    {stats.low}
                  </span>
                  <span className="text-sm text-muted-foreground">mg/dL</span>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <span className="text-xs text-muted-foreground">Highest</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-2xl font-bold ${stats.high > 180 ? 'text-risk-high' : 'text-risk-low'}`}>
                    {stats.high}
                  </span>
                  <span className="text-sm text-muted-foreground">mg/dL</span>
                </div>
              </div>
            </motion.div>

            {/* Chart */}
            {chartData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">7-Day Glucose Trend</h3>
                <div className="rounded-xl border border-border bg-card p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 10 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        domain={[50, 250]}
                        tick={{ fontSize: 10 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <ReferenceArea y1={70} y2={180} fill="hsl(var(--risk-low))" fillOpacity={0.1} />
                      <ReferenceLine y={70} stroke="hsl(var(--risk-medium))" strokeDasharray="3 3" />
                      <ReferenceLine y={180} stroke="hsl(var(--risk-medium))" strokeDasharray="3 3" />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="mt-2 text-xs text-muted-foreground text-center">
                    Target range: 70-180 mg/dL (green shaded area)
                  </p>
                </div>
              </motion.div>
            )}

            {/* Meal Correlations */}
            {correlations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Meal-Glucose Correlations</h3>
                <div className="space-y-3">
                  {correlations.slice(0, 5).map((correlation, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-4 ${
                        correlation.spike 
                          ? 'border-risk-high/30 bg-risk-high/5' 
                          : 'border-risk-low/30 bg-risk-low/5'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {correlation.spike ? (
                            <AlertTriangle className="h-4 w-4 text-risk-high" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-risk-low" />
                          )}
                          <span className="font-medium text-sm">
                            {correlation.spike ? 'Elevated Response' : 'Good Response'}
                          </span>
                        </div>
                        <span className={`text-lg font-bold ${
                          correlation.spike ? 'text-risk-high' : 'text-risk-low'
                        }`}>
                          {Number(correlation.reading.value)} mg/dL
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Utensils className="h-3 w-3" />
                          <span>{correlation.meal?.total_carbs_max}g carbs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(correlation.reading.created_at), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent Readings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Recent Readings</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {readings.slice(0, 10).map((reading) => {
                    const value = Number(reading.value);
                    const isHigh = value > 180;
                    const isLow = value < 70;
                    
                    return (
                      <motion.div
                        key={reading.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            isHigh ? 'bg-risk-high/10' : isLow ? 'bg-risk-high/10' : 'bg-risk-low/10'
                          }`}>
                            <Droplet className={`h-5 w-5 ${
                              isHigh ? 'text-risk-high' : isLow ? 'text-risk-high' : 'text-risk-low'
                            }`} />
                          </div>
                          <div>
                            <span className={`text-lg font-bold ${
                              isHigh ? 'text-risk-high' : isLow ? 'text-risk-high' : 'text-foreground'
                            }`}>
                              {value} mg/dL
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {reading.reading_type ? readingTypeLabels[reading.reading_type as ReadingType] : 'Reading'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(reading.created_at), 'MMM d, h:mm a')}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
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
      <Droplet className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold">No Readings Yet</h3>
      <p className="text-sm text-muted-foreground">
        Log your first glucose reading to start tracking patterns and correlations with your meals.
      </p>
    </motion.div>
  );
}
