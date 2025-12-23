export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export interface MonthlyData {
  id: string;
  userId: string;
  month: string;
  year: number;
  electricityKwh: number;
  dieselLiters: number;
  petrolLiters: number;
  wasteKg: number;
  waterLiters: number;
  solarUnits: number;
  treesPlanted: number;
  createdAt: Date;
}

export interface EmissionFactors {
  electricity: number; // kg CO₂ per kWh
  diesel: number; // kg CO₂ per liter
  petrol: number; // kg CO₂ per liter
  waste: number; // kg CO₂ per kg
  water: number; // kg CO₂ per liter
}

export interface OffsetFactors {
  treePerYear: number; // kg CO₂ absorbed per tree per year
  solarPerUnit: number; // kg CO₂ offset per unit
}

export interface CarbonMetrics {
  totalEmissions: number;
  totalOffsets: number;
  netFootprint: number;
  isNeutral: boolean;
}

export interface SectorEmission {
  sector: string;
  emission: number;
  percentage: number;
  color: string;
}

export interface MonthlyTrend {
  month: string;
  emissions: number;
  offsets: number;
  net: number;
}
