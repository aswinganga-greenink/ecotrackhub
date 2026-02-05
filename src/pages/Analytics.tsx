import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { api, SectorEmission, MonthlyTrend, CarbonMetricsResponse } from '@/lib/api';
import { Download, FileText, TrendingUp, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const COLORS = [
  'hsl(152, 45%, 28%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 65%, 50%)',
  'hsl(270, 50%, 50%)',
  'hsl(200, 80%, 50%)',
];

export default function Analytics() {
  const { toast } = useToast();

  // State for API data
  const [sectorData, setSectorData] = useState<SectorEmission[]>([]);
  const [trendData, setTrendData] = useState<MonthlyTrend[]>([]);
  const [metrics, setMetrics] = useState<CarbonMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data from backend
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all analytics data in parallel
        const [sectorsData, trendsData, metricsData] = await Promise.all([
          api.getAnalyticsSectors(),
          api.getAnalyticsTrends(),
          api.getAnalyticsMetrics()
        ]);

        setSectorData(sectorsData);
        setTrendData(trendsData);
        setMetrics(metricsData);

      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load analytics data');

        toast({
          title: "Error Loading Analytics",
          description: "Could not load analytics data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [toast]);

  const handleExport = (format: 'csv' | 'pdf') => {
    toast({
      title: `Exporting ${format.toUpperCase()}`,
      description: "Your report is being generated...",
    });

    // Simulate export
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Your ${format.toUpperCase()} report has been downloaded.`,
      });
    }, 1500);
  };

  // Show loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error state or empty state
  if (error || !metrics) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-muted-foreground mb-4">{error || 'No analytics data available'}</p>
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

  const topEmitter = sectorData.length > 0 ? sectorData.reduce((max, sector) =>
    sector.emission > max.emission ? sector : max
    , sectorData[0]) : { sector: 'N/A', percentage: 0 };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Detailed analysis of your carbon emissions
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-destructive" />
              </div>
              <span className="text-muted-foreground">Highest Emitter</span>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{topEmitter.sector}</p>
            <p className="text-sm text-muted-foreground">{topEmitter.percentage.toFixed(1)}% of total emissions</p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <span className="text-muted-foreground">Total Emissions</span>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{metrics.totalEmissions.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">kg CO₂e this period</p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-success" />
              </div>
              <span className="text-muted-foreground">Offset Rate</span>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">
              {((metrics.totalOffsets / metrics.totalEmissions) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">of emissions offset</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sector Bar Chart */}
          <div className="card-elevated p-6">
            <h3 className="font-display font-semibold text-lg text-foreground mb-6">
              Sector-wise CO₂ Emissions
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 85%)" />
                  <XAxis
                    dataKey="sector"
                    stroke="hsl(150, 10%, 45%)"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="hsl(150, 10%, 45%)"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(150, 15%, 85%)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} kg CO₂`, 'Emission']}
                  />
                  <Bar
                    dataKey="emission"
                    radius={[4, 4, 0, 0]}
                  >
                    {sectorData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sector Pie Chart */}
          <div className="card-elevated p-6">
            <h3 className="font-display font-semibold text-lg text-foreground mb-6">
              Emission Distribution
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="emission"
                    nameKey="sector"
                    label={({ sector, percentage }) => `${sector}: ${percentage.toFixed(1)}%`}
                    labelLine={false}
                  >
                    {sectorData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(150, 15%, 85%)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} kg CO₂`, '']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Monthly Emission Comparison
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 85%)" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(150, 10%, 45%)"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(150, 10%, 45%)"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(150, 15%, 85%)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} kg CO₂`, '']}
                />
                <Legend />
                <Bar dataKey="emissions" name="Emissions" fill="hsl(0, 65%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="offsets" name="Offsets" fill="hsl(142, 55%, 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Sector Details
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Sector</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Emission (kg CO₂)</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Percentage</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Distribution</th>
                </tr>
              </thead>
              <tbody>
                {sectorData.map((sector, index) => (
                  <tr key={sector.sector} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{sector.sector}</td>
                    <td className="py-3 px-4 text-right text-foreground">{sector.emission.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-foreground">{sector.percentage.toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${sector.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
