import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Zap,
  Fuel,
  Car,
  Trash2,
  Droplets,
  Sun,
  TreePine,
  Save,
  RotateCcw
} from 'lucide-react';

interface FormData {
  month: string;
  year: number;
  electricityKwh: string;
  dieselLiters: string;
  petrolLiters: string;
  wasteKg: string;
  waterLiters: string;
  solarUnits: string;
  treesPlanted: string;
}

const initialFormData: FormData = {
  month: 'Jan',
  year: 2024,
  electricityKwh: '',
  dieselLiters: '',
  petrolLiters: '',
  wasteKg: '',
  waterLiters: '',
  solarUnits: '',
  treesPlanted: '',
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formFields = [
  { key: 'electricityKwh', label: 'Electricity Usage', unit: 'kWh', icon: Zap, color: 'text-warning' },
  { key: 'dieselLiters', label: 'Diesel Consumption', unit: 'Liters', icon: Fuel, color: 'text-warning' },
  { key: 'petrolLiters', label: 'Petrol Consumption', unit: 'Liters', icon: Car, color: 'text-destructive' },
  { key: 'wasteKg', label: 'Waste Generated', unit: 'kg', icon: Trash2, color: 'text-muted-foreground' },
  { key: 'waterLiters', label: 'Water Usage', unit: 'Liters', icon: Droplets, color: 'text-info' },
  { key: 'solarUnits', label: 'Solar Energy Generated', unit: 'Units', icon: Sun, color: 'text-warning' },
  { key: 'treesPlanted', label: 'Trees Planted', unit: 'Count', icon: TreePine, color: 'text-success' },
];

export default function DataEntry() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = (): boolean => {
    const numericFields = ['electricityKwh', 'dieselLiters', 'petrolLiters', 'wasteKg', 'waterLiters', 'solarUnits', 'treesPlanted'];

    for (const field of numericFields) {
      const value = formData[field as keyof FormData];
      if (value && (isNaN(Number(value)) || Number(value) < 0)) {
        toast({
          title: "Validation Error",
          description: `${formFields.find(f => f.key === field)?.label} must be a positive number`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit data.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        month: formData.month,
        year: Number(formData.year),
        electricity_kwh: Number(formData.electricityKwh),
        diesel_liters: Number(formData.dieselLiters),
        petrol_liters: Number(formData.petrolLiters),
        waste_kg: Number(formData.wasteKg),
        water_liters: Number(formData.waterLiters),
        solar_units: Number(formData.solarUnits),
        trees_planted: Number(formData.treesPlanted),
        user_id: user.id,
        panchayat_id: user.panchayatId // Add this if available in user object
      };

      await api.createMonthlyData(payload as any); // Type assertion needed due to userId requirement in backend types vs usage

      toast({
        title: "Data Submitted",
        description: `Monthly data for ${formData.month} ${formData.year} has been saved successfully.`,
      });

      setFormData(initialFormData);
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to save data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    toast({
      title: "Form Reset",
      description: "All fields have been cleared.",
    });
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Monthly Data Entry
          </h1>
          <p className="text-muted-foreground mt-1">
            Enter your monthly consumption and offset data
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Period Selection */}
          <div className="card-elevated p-6">
            <h3 className="font-display font-semibold text-lg text-foreground mb-4">
              Reporting Period
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <select
                  id="month"
                  value={formData.month}
                  onChange={(e) => handleInputChange('month', e.target.value)}
                  className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <select
                  id="year"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {[2023, 2024, 2025].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Emission Sources */}
          <div className="card-elevated p-6">
            <h3 className="font-display font-semibold text-lg text-foreground mb-4">
              Emission Sources
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {formFields.slice(0, 5).map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key} className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${field.color}`} />
                      {field.label}
                    </Label>
                    <div className="relative">
                      <Input
                        id={field.key}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        value={formData[field.key as keyof FormData]}
                        onChange={(e) => handleInputChange(field.key as keyof FormData, e.target.value)}
                        className="h-12 pr-16"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Offset Sources */}
          <div className="card-elevated p-6">
            <h3 className="font-display font-semibold text-lg text-foreground mb-4">
              Carbon Offsets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {formFields.slice(5).map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key} className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${field.color}`} />
                      {field.label}
                    </Label>
                    <div className="relative">
                      <Input
                        id={field.key}
                        type="number"
                        min="0"
                        step="1"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        value={formData[field.key as keyof FormData]}
                        onChange={(e) => handleInputChange(field.key as keyof FormData, e.target.value)}
                        className="h-12 pr-16"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="flex-1"
              disabled={isSubmitting}
            >
              <Save className="w-5 h-5 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Data'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleReset}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset Form
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
