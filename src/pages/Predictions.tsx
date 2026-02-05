import { useState, useEffect } from 'react';
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
import { api, ForecastItem } from '@/lib/api';
import { TrendingUp, Target, AlertCircle, CheckCircle2, CloudLightning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Predictions() {
  const { toast } = useToast();
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setIsLoading(true);
        const data = await api.getPredictions();
        setForecast(data.forecast);
        setRecommendations(data.recommendations);
      } catch (err) {
        console.error("Failed to fetch predictions:", err);
        setError("Could not generate predictions. Ensure API key is configured.");
        toast({
          title: "Prediction Error",
          description: "Failed to load AI predictions. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();
  }, [toast]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Generating AI predictions...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || forecast.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center max-w-md">
            <CloudLightning className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Prediction Unavailable</h2>
            <p className="text-muted-foreground mb-4">{error || "No sufficient data to generate predictions."}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calculate some summary stats from forecast
  const averagePrediction = forecast.reduce((acc, item) => acc + item.predicted_emission, 0) / forecast.length;
  // Simple trend analysis
  const firstPred = forecast[0].predicted_emission;
  const lastPred = forecast[forecast.length - 1].predicted_emission;
  const trendPercent = ((lastPred - firstPred) / firstPred) * 100;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            AI Predictions
          </h1>
          <p className="text-muted-foreground mt-1">
            Gemini AI powered forecasts for your carbon emissions
          </p>
        </div>

        {/* Prediction Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-info" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Avg Predicted Emission</p>
            <p className="font-display text-2xl font-bold text-foreground">
              {averagePrediction.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">kg CO₂/month</p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">6-Month Trend</p>
            <p className="font-display text-2xl font-bold text-foreground">
              {trendPercent > 0 ? '+' : ''}{trendPercent.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">forecasted change</p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CloudLightning className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Model</p>
            <p className="font-display text-2xl font-bold text-foreground">Gemini Pro</p>
            <p className="text-xs text-muted-foreground">Google AI</p>
          </div>
        </div>

        {/* Main Prediction Chart */}
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-2">
            Emission Forecast
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            6-month forecast generated by AI based on historical patterns
          </p>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                  formatter={(value: number) => [`${value.toFixed(2)} kg CO₂`, 'Predicted']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="predicted_emission"
                  stroke="hsl(200, 80%, 50%)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(200, 80%, 50%)', strokeWidth: 2, r: 5 }}
                  name="Predicted Emissions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Details & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-elevated p-6">
            <h3 className="font-display font-semibold text-lg text-foreground mb-4">
              Monthly Breakdown
            </h3>
            <div className="space-y-4">
              {forecast.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center text-sm font-medium text-info">
                      {index + 1}
                    </div>
                    <span className="font-medium text-foreground">{item.month} {item.year}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-foreground">
                      {item.predicted_emission.toFixed(1)} kg
                    </p>
                    <p className="text-xs text-muted-foreground">predicted</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-elevated p-6">
            <h3 className="font-display font-semibold text-lg text-foreground mb-4">
              AI Recommendations
            </h3>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="text-foreground">{rec}</p>
                    </div>
                  </div>
                </div>
              ))}
              {recommendations.length === 0 && (
                <p className="text-muted-foreground">No recommendations available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
