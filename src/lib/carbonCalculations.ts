import { 
  EmissionFactors, 
  OffsetFactors, 
  MonthlyData, 
  CarbonMetrics, 
  SectorEmission,
  MonthlyTrend 
} from '@/types/carbon';

// Standard emission factors (kg CO₂ per unit)
export const EMISSION_FACTORS: EmissionFactors = {
  electricity: 0.82, // kg CO₂ per kWh
  diesel: 2.68, // kg CO₂ per liter
  petrol: 2.31, // kg CO₂ per liter
  waste: 0.5, // kg CO₂ per kg (estimated)
  water: 0.0003, // kg CO₂ per liter
};

// Offset factors
export const OFFSET_FACTORS: OffsetFactors = {
  treePerYear: 21, // kg CO₂ absorbed per tree per year
  solarPerUnit: 0.82, // kg CO₂ offset per unit (equivalent to grid electricity)
};

export function calculateEmissions(data: MonthlyData): number {
  const electricityEmission = data.electricityKwh * EMISSION_FACTORS.electricity;
  const dieselEmission = data.dieselLiters * EMISSION_FACTORS.diesel;
  const petrolEmission = data.petrolLiters * EMISSION_FACTORS.petrol;
  const wasteEmission = data.wasteKg * EMISSION_FACTORS.waste;
  const waterEmission = data.waterLiters * EMISSION_FACTORS.water;

  return electricityEmission + dieselEmission + petrolEmission + wasteEmission + waterEmission;
}

export function calculateOffsets(data: MonthlyData): number {
  // Trees absorb CO₂ throughout the year, so divide annual absorption by 12 for monthly
  const treeOffset = (data.treesPlanted * OFFSET_FACTORS.treePerYear) / 12;
  const solarOffset = data.solarUnits * OFFSET_FACTORS.solarPerUnit;

  return treeOffset + solarOffset;
}

export function calculateNetFootprint(emissions: number, offsets: number): number {
  return emissions - offsets;
}

export function getCarbonMetrics(data: MonthlyData[]): CarbonMetrics {
  let totalEmissions = 0;
  let totalOffsets = 0;

  data.forEach((entry) => {
    totalEmissions += calculateEmissions(entry);
    totalOffsets += calculateOffsets(entry);
  });

  const netFootprint = calculateNetFootprint(totalEmissions, totalOffsets);
  const isNeutral = netFootprint <= 0;

  return {
    totalEmissions: Math.round(totalEmissions * 100) / 100,
    totalOffsets: Math.round(totalOffsets * 100) / 100,
    netFootprint: Math.round(netFootprint * 100) / 100,
    isNeutral,
  };
}

export function getSectorEmissions(data: MonthlyData[]): SectorEmission[] {
  let electricity = 0;
  let diesel = 0;
  let petrol = 0;
  let waste = 0;
  let water = 0;

  data.forEach((entry) => {
    electricity += entry.electricityKwh * EMISSION_FACTORS.electricity;
    diesel += entry.dieselLiters * EMISSION_FACTORS.diesel;
    petrol += entry.petrolLiters * EMISSION_FACTORS.petrol;
    waste += entry.wasteKg * EMISSION_FACTORS.waste;
    water += entry.waterLiters * EMISSION_FACTORS.water;
  });

  const total = electricity + diesel + petrol + waste + water;

  const sectors: SectorEmission[] = [
    { sector: 'Electricity', emission: electricity, percentage: (electricity / total) * 100, color: 'hsl(152, 45%, 28%)' },
    { sector: 'Diesel', emission: diesel, percentage: (diesel / total) * 100, color: 'hsl(38, 92%, 50%)' },
    { sector: 'Petrol', emission: petrol, percentage: (petrol / total) * 100, color: 'hsl(0, 65%, 50%)' },
    { sector: 'Waste', emission: waste, percentage: (waste / total) * 100, color: 'hsl(270, 50%, 50%)' },
    { sector: 'Water', emission: water, percentage: (water / total) * 100, color: 'hsl(200, 80%, 50%)' },
  ];

  return sectors.map(s => ({
    ...s,
    emission: Math.round(s.emission * 100) / 100,
    percentage: Math.round(s.percentage * 100) / 100,
  }));
}

export function getMonthlyTrends(data: MonthlyData[]): MonthlyTrend[] {
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const trendMap = new Map<string, MonthlyTrend>();

  data.forEach((entry) => {
    const key = `${entry.month}-${entry.year}`;
    const emissions = calculateEmissions(entry);
    const offsets = calculateOffsets(entry);

    if (trendMap.has(key)) {
      const existing = trendMap.get(key)!;
      existing.emissions += emissions;
      existing.offsets += offsets;
      existing.net = existing.emissions - existing.offsets;
    } else {
      trendMap.set(key, {
        month: entry.month,
        emissions: emissions,
        offsets: offsets,
        net: emissions - offsets,
      });
    }
  });

  return Array.from(trendMap.values())
    .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month))
    .map(t => ({
      ...t,
      emissions: Math.round(t.emissions * 100) / 100,
      offsets: Math.round(t.offsets * 100) / 100,
      net: Math.round(t.net * 100) / 100,
    }));
}
