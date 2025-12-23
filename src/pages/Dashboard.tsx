import { useMemo } from 'react';
import { Cloud, TreePine, Leaf, TrendingDown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { CarbonStatusBadge } from '@/components/dashboard/CarbonStatusBadge';
import { EmissionChart } from '@/components/dashboard/EmissionChart';
import { SectorPieChart } from '@/components/dashboard/SectorPieChart';
import { mockMonthlyData } from '@/lib/mockData';
import { getCarbonMetrics, getSectorEmissions, getMonthlyTrends } from '@/lib/carbonCalculations';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  
  const metrics = useMemo(() => getCarbonMetrics(mockMonthlyData), []);
  const sectorData = useMemo(() => getSectorEmissions(mockMonthlyData), []);
  const trendData = useMemo(() => getMonthlyTrends(mockMonthlyData), []);

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
