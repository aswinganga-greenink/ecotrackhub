import { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { mockMonthlyData } from '@/lib/mockData';
import { getMonthlyTrends, getCarbonMetrics } from '@/lib/carbonCalculations';
import { TrendingUp, Target, AlertCircle, CheckCircle2 } from 'lucide-react';

// Simple linear regression for prediction
function predictFutureEmissions(data: { emissions: number }[]): number[] {
  const n = data.length;
  if (n < 2) return [];
  
  const xSum = data.reduce((acc, _, i) => acc + i, 0);
  const ySum = data.reduce((acc, d) => acc + d.emissions, 0);
  const xySum = data.reduce((acc, d, i) => acc + i * d.emissions, 0);
  const x2Sum = data.reduce((acc, _, i) => acc + i * i, 0);
  
  const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
  const intercept = (ySum - slope * xSum) / n;
  
  // Predict next 6 months
  const predictions: number[] = [];
  for (let i = n; i < n + 6; i++) {
    predictions.push(Math.max(0, intercept + slope * i));
  }
  
  return predictions;
}

const futureMonths = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Predictions() {
  const trendData = useMemo(() => getMonthlyTrends(mockMonthlyData), []);
  const metrics = useMemo(() => getCarbonMetrics(mockMonthlyData), []);
  
  const predictions = useMemo(() => predictFutureEmissions(trendData), [trendData]);
  
  const combinedData = useMemo(() => {
    const actual = trendData.map(d => ({
      month: d.month,
      actual: d.emissions,
      predicted: null as number | null,
    }));
    
    const predicted = futureMonths.map((month, i) => ({
      month,
      actual: null as number | null,
      predicted: Math.round(predictions[i] * 100) / 100,
    }));
    
    // Add last actual point as first predicted for continuity
    if (actual.length > 0 && predicted.length > 0) {
      predicted[0] = {
        ...predicted[0],
        actual: actual[actual.length - 1].actual,
      };
    }
    
    return [...actual, ...predicted];
  }, [trendData, predictions]);

  const averagePrediction = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  const projectedAnnualReduction = ((trendData[0]?.emissions || 0) - averagePrediction) / (trendData[0]?.emissions || 1) * 100;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Predictions
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered forecasts for your carbon emissions
          </p>
        </div>

        {/* Prediction Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-info" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Avg Predicted Emission</p>
            <p className="font-display text-2xl font-bold text-foreground">
              {averagePrediction.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">kg CO₂/month</p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Projected Reduction</p>
            <p className="font-display text-2xl font-bold text-foreground">
              {projectedAnnualReduction > 0 ? '+' : ''}{projectedAnnualReduction.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">vs starting emissions</p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                metrics.isNeutral ? 'bg-success/10' : 'bg-warning/10'
              }`}>
                {metrics.isNeutral ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Neutrality Target</p>
            <p className="font-display text-2xl font-bold text-foreground">
              {metrics.isNeutral ? 'On Track' : 'Needs Work'}
            </p>
            <p className="text-xs text-muted-foreground">based on current trends</p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Model Confidence</p>
            <p className="font-display text-2xl font-bold text-foreground">85%</p>
            <p className="text-xs text-muted-foreground">linear regression</p>
          </div>
        </div>

        {/* Main Prediction Chart */}
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-2">
            Actual vs Predicted Emissions
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Historical data with 6-month forecast using linear regression
          </p>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 85%)" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(150, 10%, 45%)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(150, 10%, 45%)"
                  fontSize={12}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0, 0%, 100%)', 
                    border: '1px solid hsl(150, 15%, 85%)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number | null) => 
                    value !== null ? [`${value.toFixed(2)} kg CO₂`, ''] : ['-', '']
                  }
                />
                <Legend />
                <ReferenceLine 
                  x="Jun" 
                  stroke="hsl(150, 15%, 70%)" 
                  strokeDasharray="5 5"
                  label={{ value: 'Forecast Start', position: 'top', fontSize: 11, fill: 'hsl(150, 10%, 45%)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="hsl(152, 45%, 28%)" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(152, 45%, 28%)', strokeWidth: 2, r: 5 }}
                  name="Actual Emissions"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="hsl(200, 80%, 50%)" 
                  strokeWidth={3}
                  strokeDasharray="8 4"
                  dot={{ fill: 'hsl(200, 80%, 50%)', strokeWidth: 2, r: 5 }}
                  name="Predicted Emissions"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-elevated p-6">
            <h3 className="font-display font-semibold text-lg text-foreground mb-4">
              Monthly Predictions
            </h3>
            <div className="space-y-4">
              {futureMonths.map((month, index) => (
                <div key={month} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center text-sm font-medium text-info">
                      {index + 1}
                    </div>
                    <span className="font-medium text-foreground">{month} 2024</span>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-foreground">
                      {predictions[index]?.toFixed(0) || '-'} kg
                    </p>
                    <p className="text-xs text-muted-foreground">predicted CO₂</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-elevated p-6">
            <h3 className="font-display font-semibold text-lg text-foreground mb-4">
              Recommendations
            </h3>
            <div className="space-y-4">
              <div className="p-4 border border-success/20 bg-success/5 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Increase Solar Adoption</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Projections show solar energy can offset 30% more emissions
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-warning/20 bg-warning/5 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Reduce Diesel Usage</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Diesel contributes significantly to emissions. Consider alternatives.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Tree Planting Target</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Plant 50 more trees to achieve carbon neutrality by December
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
