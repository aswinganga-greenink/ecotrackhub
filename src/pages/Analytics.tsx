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
    if (format === 'csv') {
      if (trendData.length === 0) {
        toast({ title: 'No Data', description: 'No trend data available to export.', variant: 'destructive' });
        return;
      }
      const headers = ['Month', 'Emissions (kg CO₂)', 'Offsets (kg CO₂)', 'Net (kg CO₂)'];
      const rows = trendData.map(t => `${t.month},${t.emissions.toFixed(2)},${t.offsets.toFixed(2)},${t.net.toFixed(2)}`);
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `analytics_export_${new Date().getFullYear()}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'CSV Downloaded', description: 'Analytics data exported successfully.' });
      return;
    }

    // PDF — open styled print window
    if (!metrics) return;
    const sectorRows = sectorData.map(s =>
      `<tr><td>${s.sector}</td><td>${s.emission.toFixed(2)}</td><td>${s.percentage.toFixed(1)}%</td></tr>`
    ).join('');
    const trendRows = trendData.map(t =>
      `<tr><td>${t.month}</td><td>${t.emissions.toFixed(2)}</td><td>${t.offsets.toFixed(2)}</td><td style="color:${t.net <= 0 ? '#166534' : '#dc2626'}">${t.net.toFixed(2)}</td></tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Analytics Report</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;padding:24px;font-size:11px}
h1{font-size:22px;color:#166534;margin-bottom:4px}.sub{color:#555;margin-bottom:20px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.card{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px}
.card h3{font-size:10px;text-transform:uppercase;color:#555;margin-bottom:4px}
.card p{font-size:18px;font-weight:700;color:#166534}
h2{font-size:14px;color:#166534;border-bottom:2px solid #bbf7d0;padding-bottom:4px;margin:20px 0 10px}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th{background:#166534;color:white;padding:6px 8px;text-align:left;font-size:10px}
td{padding:5px 8px;border-bottom:1px solid #e5e7eb}
tr:nth-child(even) td{background:#f9fafb}
.footer{margin-top:32px;text-align:center;color:#aaa;font-size:10px;border-top:1px solid #e5e7eb;padding-top:12px}
@media print{@page{margin:10mm}}
</style></head><body>
<h1>🌿 Analytics Report</h1>
<p class="sub">Gram Panchayat Anjarakandi &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
<div class="grid">
<div class="card"><h3>Total Emissions</h3><p>${metrics.total_emissions?.toFixed(0) ?? '–'}</p><small>kg CO₂e</small></div>
<div class="card"><h3>Total Offsets</h3><p>${metrics.total_offsets?.toFixed(0) ?? '–'}</p><small>kg CO₂e</small></div>
<div class="card"><h3>Net Footprint</h3><p>${metrics.net_footprint?.toFixed(0) ?? '–'}</p><small>${metrics.is_neutral ? '✓ Neutral' : 'Emitting'}</small></div>
</div>
<h2>Sector-wise Emissions</h2>
<table><thead><tr><th>Sector</th><th>Emissions (kg CO₂)</th><th>Share</th></tr></thead><tbody>${sectorRows}</tbody></table>
<h2>Monthly Trends</h2>
<table><thead><tr><th>Month</th><th>Emissions (kg)</th><th>Offsets (kg)</th><th>Net (kg)</th></tr></thead><tbody>${trendRows}</tbody></table>
<div class="footer">CarbonTrackHub &nbsp;|&nbsp; GHG Protocol Standards</div>
</body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 400); }
    toast({ title: 'PDF Ready', description: 'Use "Save as PDF" in the print dialog.' });
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
                    label={({ sector, percentage }) => `${sector}: ${percentage > 0 && percentage < 0.1 ? '<0.1' : percentage.toFixed(1)}%`}
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
