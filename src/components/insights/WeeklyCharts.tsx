import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { MealAnalysis } from '@/types/health';

interface WeeklyRiskChartProps {
  meals: MealAnalysis[];
}

export function WeeklyRiskChart({ meals }: WeeklyRiskChartProps) {
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData: { day: string; risk: number; meals: number }[] = [];
    
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayMeals = meals.filter((meal) => {
        const mealDate = new Date(meal.timestamp);
        return mealDate >= date && mealDate < nextDay;
      });
      
      const avgRisk = dayMeals.length > 0
        ? Math.round(dayMeals.reduce((acc, m) => acc + m.riskScore, 0) / dayMeals.length)
        : 0;
      
      weekData.push({
        day: days[date.getDay()],
        risk: avgRisk,
        meals: dayMeals.length,
      });
    }
    
    return weekData;
  }, [meals]);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--risk-medium))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--risk-medium))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [`${value}%`, 'Risk Score']}
          />
          <Area
            type="monotone"
            dataKey="risk"
            stroke="hsl(var(--risk-medium))"
            strokeWidth={2}
            fill="url(#riskGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CarbsBreakdownChartProps {
  meals: MealAnalysis[];
}

export function CarbsBreakdownChart({ meals }: CarbsBreakdownChartProps) {
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData: { day: string; carbs: number; risk: 'low' | 'medium' | 'high' }[] = [];
    
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayMeals = meals.filter((meal) => {
        const mealDate = new Date(meal.timestamp);
        return mealDate >= date && mealDate < nextDay;
      });
      
      const totalCarbs = dayMeals.reduce(
        (acc, m) => acc + (m.totalCarbs.min + m.totalCarbs.max) / 2,
        0
      );
      
      const avgRisk = dayMeals.length > 0
        ? dayMeals.reduce((acc, m) => acc + m.riskScore, 0) / dayMeals.length
        : 0;
      
      weekData.push({
        day: days[date.getDay()],
        carbs: Math.round(totalCarbs),
        risk: avgRisk > 60 ? 'high' : avgRisk > 35 ? 'medium' : 'low',
      });
    }
    
    return weekData;
  }, [meals]);

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return 'hsl(var(--risk-high))';
      case 'medium': return 'hsl(var(--risk-medium))';
      case 'low': return 'hsl(var(--risk-low))';
    }
  };

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [`${value}g`, 'Carbs']}
          />
          <Bar dataKey="carbs" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
