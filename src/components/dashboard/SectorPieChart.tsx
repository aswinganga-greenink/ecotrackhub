import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { SectorEmission } from '@/types/carbon';

interface SectorPieChartProps {
  data: SectorEmission[];
}

const COLORS = [
  'hsl(152, 45%, 28%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 65%, 50%)',
  'hsl(270, 50%, 50%)',
  'hsl(200, 80%, 50%)',
];

export function SectorPieChart({ data }: SectorPieChartProps) {
  return (
    <div className="card-elevated p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-6">
        Sector-wise Emissions
      </h3>
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
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
    </div>
  );
}
