import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { MonthlyTrend } from '@/lib/api';

interface EmissionChartProps {
  data: MonthlyTrend[];
}

export function EmissionChart({ data }: EmissionChartProps) {
  return (
    <div className="card-elevated p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-6">
        Emission vs Offset Trends
      </h3>
      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No trend data available</p>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="emissionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 65%, 50%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(0, 65%, 50%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="offsetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 55%, 40%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(142, 55%, 40%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 85%)" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(150, 10%, 45%)"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(150, 10%, 45%)"
                fontSize={12}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(0, 0%, 100%)', 
                  border: '1px solid hsl(150, 15%, 85%)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [`${value.toFixed(2)} kg CO₂`, '']}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="emissions" 
                stroke="hsl(0, 65%, 50%)" 
                fillOpacity={1}
                fill="url(#emissionGradient)"
                strokeWidth={2}
                name="Emissions"
              />
              <Area 
                type="monotone" 
                dataKey="offsets" 
                stroke="hsl(142, 55%, 40%)" 
                fillOpacity={1}
                fill="url(#offsetGradient)"
                strokeWidth={2}
                name="Offsets"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
