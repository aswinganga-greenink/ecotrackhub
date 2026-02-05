import { useState, useEffect, useMemo } from 'react';
import { Cloud, TreePine, Leaf, TrendingDown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { CarbonStatusBadge } from '@/components/dashboard/CarbonStatusBadge';
import { EmissionChart } from '@/components/dashboard/EmissionChart';
import { SectorPieChart } from '@/components/dashboard/SectorPieChart';
import { api, CarbonMetricsResponse, SectorEmission, MonthlyTrend } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for API data
  const [metrics, setMetrics] = useState<CarbonMetricsResponse | null>(null);
  const [sectorData, setSectorData] = useState<SectorEmission[]>([]);
  const [trendData, setTrendData] = useState<MonthlyTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch all dashboard data in parallel
        const [metricsData, sectorsData, trendsData] = await Promise.all([
          api.getAnalyticsMetrics(),
          api.getAnalyticsSectors(),
          api.getAnalyticsTrends()
        ]);
        
        setMetrics(metricsData);
        setSectorData(sectorsData);
        setTrendData(trendsData);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
        
        toast({
          title: "Error Loading Dashboard",
          description: "Could not load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, toast]);

  // Show loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error state
  if (error || !metrics) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Cloud className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-muted-foreground mb-4">{error || 'No data available'}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.username}. Here's your carbon overview.
            </p>
          </div>
          <CarbonStatusBadge isNeutral={metrics.isNeutral} />
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total CO₂ Emissions"
            value={metrics.totalEmissions}
            unit="kg CO₂e"
            icon={<Cloud className="w-6 h-6" />}
            trend={{ value: 12, isPositive: true }}
            variant="danger"
          />
          <MetricCard
            title="Total Carbon Offsets"
            value={metrics.totalOffsets}
            unit="kg CO₂e"
            icon={<TreePine className="w-6 h-6" />}
            trend={{ value: 8, isPositive: true }}
            variant="success"
          />
          <MetricCard
            title="Net Carbon Footprint"
            value={Math.abs(metrics.netFootprint)}
            unit="kg CO₂e"
            icon={<TrendingDown className="w-6 h-6" />}
            variant={metrics.isNeutral ? 'success' : 'warning'}
          />
          <MetricCard
            title="Carbon Status"
            value={metrics.isNeutral ? 'Neutral' : 'Not Neutral'}
            icon={<Leaf className="w-6 h-6" />}
            variant={metrics.isNeutral ? 'success' : 'warning'}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmissionChart data={trendData} />
          <SectorPieChart data={sectorData} />
        </div>

        {/* Quick Stats */}
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-4">
            Monthly Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {trendData.map((month) => (
              <div 
                key={month.month}
                className="text-center p-4 rounded-lg bg-secondary/50"
              >
                <p className="text-sm text-muted-foreground mb-1">{month.month}</p>
                <p className={`font-display font-bold text-lg ${month.net <= 0 ? 'text-success' : 'text-destructive'}`}>
                  {month.net > 0 ? '+' : ''}{month.net.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">kg CO₂</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
