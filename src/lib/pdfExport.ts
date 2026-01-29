import jsPDF from 'jspdf';
import { MealAnalysis, HealthProfile } from '@/types/health';
import { format, startOfWeek, endOfWeek, subDays, isWithinInterval } from 'date-fns';

interface GlucoseReading {
  id: string;
  value: number;
  reading_type: string | null;
  created_at: string;
}

interface WeeklyReportData {
  meals: MealAnalysis[];
  glucoseReadings: GlucoseReading[];
  healthProfile: HealthProfile | null;
  dateRange: { start: Date; end: Date };
}

export function generateWeeklyReport(data: WeeklyReportData): void {
  const { meals, glucoseReadings, healthProfile, dateRange } = data;
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper functions
  const addTitle = (text: string, size: number = 16) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, yPosition);
    yPosition += size * 0.5;
  };

  const addText = (text: string, size: number = 10, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * size * 0.5;
  };

  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  const checkPageBreak = (needed: number = 30) => {
    if (yPosition > doc.internal.pageSize.getHeight() - needed) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Header
  doc.setFillColor(15, 23, 42); // Navy blue
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Health Brief', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${format(dateRange.start, 'MMMM d')} – ${format(dateRange.end, 'MMMM d, yyyy')}`, margin, 35);
  
  yPosition = 55;
  doc.setTextColor(0, 0, 0);

  // Patient Information
  if (healthProfile) {
    addTitle('Patient Information', 14);
    yPosition += 5;
    
    const patientInfo = [
      `Age: ${healthProfile.age} years`,
      `Gender: ${healthProfile.gender}`,
      `Diabetes Type: ${healthProfile.diabetesType === 'none' ? 'Not specified' : healthProfile.diabetesType}`,
      `Activity Level: ${healthProfile.activityLevel}`,
      healthProfile.usesInsulin ? 'Uses Insulin: Yes' : '',
    ].filter(Boolean);

    patientInfo.forEach(info => addText(info));
    yPosition += 10;
    addLine();
  }

  // Weekly Summary Statistics
  checkPageBreak(60);
  addTitle('Weekly Summary', 14);
  yPosition += 5;

  // Calculate meal statistics
  const weekMeals = meals.filter(m => 
    isWithinInterval(new Date(m.timestamp), { start: dateRange.start, end: dateRange.end })
  );

  if (weekMeals.length > 0) {
    const avgRiskScore = Math.round(
      weekMeals.reduce((sum, m) => sum + m.riskScore, 0) / weekMeals.length
    );
    const avgCarbs = Math.round(
      weekMeals.reduce((sum, m) => sum + (m.totalCarbs.min + m.totalCarbs.max) / 2, 0) / weekMeals.length
    );
    const avgCalories = Math.round(
      weekMeals.reduce((sum, m) => sum + m.totalCalories, 0) / weekMeals.length
    );
    const highRiskMeals = weekMeals.filter(m => m.riskLevel === 'high').length;

    addText(`Meals Logged: ${weekMeals.length}`, 11, 'bold');
    addText(`Average Risk Score: ${avgRiskScore}/100 (${avgRiskScore < 40 ? 'Low' : avgRiskScore < 70 ? 'Moderate' : 'Elevated'})`);
    addText(`Average Carbohydrates: ${avgCarbs}g per meal`);
    addText(`Average Calories: ${avgCalories} kcal per meal`);
    addText(`High-Risk Meals: ${highRiskMeals} (${Math.round((highRiskMeals / weekMeals.length) * 100)}%)`);
  } else {
    addText('No meals logged during this period.');
  }

  yPosition += 10;
  addLine();

  // Glucose Statistics
  checkPageBreak(60);
  addTitle('Glucose Readings', 14);
  yPosition += 5;

  const weekReadings = glucoseReadings.filter(r =>
    isWithinInterval(new Date(r.created_at), { start: dateRange.start, end: dateRange.end })
  );

  if (weekReadings.length > 0) {
    const values = weekReadings.map(r => Number(r.value));
    const avgGlucose = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const maxGlucose = Math.max(...values);
    const minGlucose = Math.min(...values);
    const inRange = values.filter(v => v >= 70 && v <= 180).length;
    const inRangePct = Math.round((inRange / values.length) * 100);

    addText(`Readings Recorded: ${weekReadings.length}`, 11, 'bold');
    addText(`Average Glucose: ${avgGlucose} mg/dL`);
    addText(`Range: ${minGlucose} – ${maxGlucose} mg/dL`);
    addText(`Time in Target Range (70-180 mg/dL): ${inRangePct}%`);
    
    // Add interpretation
    yPosition += 5;
    if (inRangePct >= 70) {
      addText('✓ Good glycemic control - majority of readings within target range.');
    } else if (inRangePct >= 50) {
      addText('! Moderate glycemic variability - consider dietary adjustments.');
    } else {
      addText('⚠ Significant glycemic variability - recommend provider consultation.');
    }
  } else {
    addText('No glucose readings recorded during this period.');
  }

  yPosition += 10;
  addLine();

  // Risk Patterns
  checkPageBreak(60);
  addTitle('Identified Risk Patterns', 14);
  yPosition += 5;

  const patterns: string[] = [];

  // Late eating pattern
  const lateNightMeals = weekMeals.filter(m => {
    const hour = new Date(m.timestamp).getHours();
    return hour >= 21 || hour < 5;
  });
  if (lateNightMeals.length >= 2) {
    patterns.push(`Late Evening Eating: ${lateNightMeals.length} meals consumed after 9 PM. Late eating may impair overnight glucose regulation and reduce sleep quality.`);
  }

  // High carb pattern
  const highCarbMeals = weekMeals.filter(m => (m.totalCarbs.min + m.totalCarbs.max) / 2 > 60);
  if (highCarbMeals.length >= 3) {
    patterns.push(`High Carbohydrate Meals: ${highCarbMeals.length} meals exceeded 60g carbohydrates. Consider portion control or adding fiber/protein to moderate glucose response.`);
  }

  // Weekend pattern
  const weekendMeals = weekMeals.filter(m => {
    const day = new Date(m.timestamp).getDay();
    return day === 0 || day === 6;
  });
  const weekdayMeals = weekMeals.filter(m => {
    const day = new Date(m.timestamp).getDay();
    return day >= 1 && day <= 5;
  });
  
  if (weekendMeals.length > 0 && weekdayMeals.length > 0) {
    const weekendAvgRisk = weekendMeals.reduce((sum, m) => sum + m.riskScore, 0) / weekendMeals.length;
    const weekdayAvgRisk = weekdayMeals.reduce((sum, m) => sum + m.riskScore, 0) / weekdayMeals.length;
    
    if (weekendAvgRisk > weekdayAvgRisk + 15) {
      patterns.push(`Weekend Risk Elevation: Weekend meals showed ${Math.round(weekendAvgRisk - weekdayAvgRisk)} points higher average risk score compared to weekdays.`);
    }
  }

  if (patterns.length > 0) {
    patterns.forEach((pattern, i) => {
      checkPageBreak(20);
      addText(`${i + 1}. ${pattern}`);
      yPosition += 3;
    });
  } else {
    addText('No significant risk patterns identified during this period.');
  }

  yPosition += 10;
  addLine();

  // Recommendations
  checkPageBreak(60);
  addTitle('Clinical Recommendations', 14);
  yPosition += 5;

  const recommendations = [
    'Continue logging meals consistently for better pattern recognition.',
    'Consider adding protein or fiber to high-carbohydrate meals to moderate glycemic response.',
    'Aim to complete evening meals before 8 PM when possible.',
    'Track glucose readings before and 2 hours after meals to identify personal trigger foods.',
  ];

  if (weekMeals.length < 7) {
    recommendations.unshift('Increase meal logging frequency for more comprehensive analysis.');
  }

  recommendations.forEach((rec, i) => {
    checkPageBreak(15);
    addText(`${i + 1}. ${rec}`);
    yPosition += 2;
  });

  // Meal Details Table
  if (weekMeals.length > 0) {
    doc.addPage();
    yPosition = margin;
    
    addTitle('Meal Log Details', 14);
    yPosition += 10;

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Date/Time', margin + 2, yPosition);
    doc.text('Carbs (g)', margin + 45, yPosition);
    doc.text('Calories', margin + 75, yPosition);
    doc.text('Risk', margin + 105, yPosition);
    doc.text('Score', margin + 130, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    weekMeals.slice(0, 20).forEach(meal => {
      checkPageBreak(15);
      
      doc.text(format(new Date(meal.timestamp), 'MMM d, h:mm a'), margin + 2, yPosition);
      doc.text(`${meal.totalCarbs.min}-${meal.totalCarbs.max}`, margin + 45, yPosition);
      doc.text(meal.totalCalories.toString(), margin + 75, yPosition);
      doc.text(meal.riskLevel.toUpperCase(), margin + 105, yPosition);
      doc.text(`${meal.riskScore}/100`, margin + 130, yPosition);
      yPosition += 8;
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      'This report is for decision support only and does not constitute medical advice. Consult your healthcare provider.',
      margin,
      doc.internal.pageSize.getHeight() - 15
    );
    doc.text(
      `Generated by BiteSafe | Page ${i} of ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // Save the PDF
  const fileName = `BiteSafe_Weekly_Report_${format(dateRange.start, 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

export function getWeekDateRange(): { start: Date; end: Date } {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });
  return { start, end };
}
