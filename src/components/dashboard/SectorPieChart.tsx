import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { SectorEmission } from '@/lib/api';

interface SectorPieChartProps {
  data: SectorEmission[];
}

export function SectorPieChart({ data }: SectorPieChartProps) {
  // Use colors from backend response, fallback to default colors if not provided
  const defaultColors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
  ];

  return (
    <div className="card-elevated p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-6">
        Sector-wise Emissions
      </h3>
      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No sector data available</p>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="emission"
                nameKey="sector"
                label={({ sector, percentage }) => `${sector}: ${percentage.toFixed(1)}%`}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || defaultColors[index % defaultColors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(0, 0%, 100%)', 
                  border: '1px solid hsl(150, 15%, 85%)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [`${value.toFixed(2)} kg CO₂`, '']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
