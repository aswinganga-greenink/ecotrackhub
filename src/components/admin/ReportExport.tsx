import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { mockPanchayats, mockMonthlyData } from '@/lib/mockData';
import { calculateEmissions, calculateOffsets } from '@/lib/carbonCalculations';
import { FileText, FileSpreadsheet, Download, Calendar, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ReportExport() {
  const [selectedPanchayat, setSelectedPanchayat] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [includeEmissions, setIncludeEmissions] = useState(true);
  const [includeOffsets, setIncludeOffsets] = useState(true);
  const [includeMonthlyBreakdown, setIncludeMonthlyBreakdown] = useState(true);
  const [includeSectorAnalysis, setIncludeSectorAnalysis] = useState(true);
  const { toast } = useToast();

  const generateCSV = () => {
    const data = mockMonthlyData.filter(d => {
      const matchesPanchayat = selectedPanchayat === 'all' || d.panchayatId === selectedPanchayat;
      const matchesYear = d.year.toString() === selectedYear;
      return matchesPanchayat && matchesYear;
    });

    let csvContent = 'Panchayat,Month,Year,Electricity (kWh),Diesel (L),Petrol (L),Waste (kg),Water (L),Solar Units,Trees Planted';
    
    if (includeEmissions) csvContent += ',Total Emissions (kg CO₂)';
    if (includeOffsets) csvContent += ',Total Offsets (kg CO₂)';
    csvContent += '\n';

    data.forEach(entry => {
      const panchayat = mockPanchayats.find(p => p.id === entry.panchayatId);
      let row = `${panchayat?.name || 'Unknown'},${entry.month},${entry.year},${entry.electricityKwh},${entry.dieselLiters},${entry.petrolLiters},${entry.wasteKg},${entry.waterLiters},${entry.solarUnits},${entry.treesPlanted}`;
      
      if (includeEmissions) row += `,${calculateEmissions(entry).toFixed(2)}`;
      if (includeOffsets) row += `,${calculateOffsets(entry).toFixed(2)}`;
      csvContent += row + '\n';
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbon_report_${selectedPanchayat}_${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Export Successful', description: 'CSV report has been downloaded' });
  };

  const generatePDFReport = () => {
    // Generate a text-based report for now (in production, use a PDF library)
    const data = mockMonthlyData.filter(d => {
      const matchesPanchayat = selectedPanchayat === 'all' || d.panchayatId === selectedPanchayat;
      const matchesYear = d.year.toString() === selectedYear;
      return matchesPanchayat && matchesYear;
    });

    let totalEmissions = 0;
    let totalOffsets = 0;
    data.forEach(entry => {
      totalEmissions += calculateEmissions(entry);
      totalOffsets += calculateOffsets(entry);
    });

    let reportContent = `
CARBON FOOTPRINT REPORT
========================
Generated: ${new Date().toLocaleDateString()}

SUMMARY
-------
Region: ${selectedPanchayat === 'all' ? 'All Panchayats' : mockPanchayats.find(p => p.id === selectedPanchayat)?.name}
Year: ${selectedYear}
Total Data Entries: ${data.length}

`;

    if (includeEmissions) {
      reportContent += `EMISSIONS ANALYSIS
------------------
Total CO₂ Emissions: ${totalEmissions.toFixed(2)} kg CO₂
Average Monthly Emissions: ${(totalEmissions / Math.max(data.length, 1)).toFixed(2)} kg CO₂

`;
    }

    if (includeOffsets) {
      reportContent += `OFFSET ANALYSIS
---------------
Total CO₂ Offsets: ${totalOffsets.toFixed(2)} kg CO₂
Net Carbon Footprint: ${(totalEmissions - totalOffsets).toFixed(2)} kg CO₂
Carbon Status: ${totalEmissions <= totalOffsets ? 'CARBON NEUTRAL ✓' : 'EMITTING'}

`;
    }

    if (includeMonthlyBreakdown) {
      reportContent += `MONTHLY BREAKDOWN
-----------------
`;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach(month => {
        const monthData = data.filter(d => d.month === month);
        if (monthData.length > 0) {
          const monthEmissions = monthData.reduce((sum, d) => sum + calculateEmissions(d), 0);
          const monthOffsets = monthData.reduce((sum, d) => sum + calculateOffsets(d), 0);
          reportContent += `${month}: Emissions: ${monthEmissions.toFixed(0)} kg | Offsets: ${monthOffsets.toFixed(0)} kg\n`;
        }
      });
      reportContent += '\n';
    }

    if (includeSectorAnalysis) {
      const sectorEmissions = {
        electricity: data.reduce((sum, d) => sum + d.electricityKwh * 0.82, 0),
        diesel: data.reduce((sum, d) => sum + d.dieselLiters * 2.68, 0),
        petrol: data.reduce((sum, d) => sum + d.petrolLiters * 2.31, 0),
        waste: data.reduce((sum, d) => sum + d.wasteKg * 0.5, 0),
        water: data.reduce((sum, d) => sum + d.waterLiters * 0.0003, 0),
      };

      reportContent += `SECTOR-WISE EMISSIONS
---------------------
Electricity: ${sectorEmissions.electricity.toFixed(0)} kg CO₂
Diesel: ${sectorEmissions.diesel.toFixed(0)} kg CO₂
Petrol: ${sectorEmissions.petrol.toFixed(0)} kg CO₂
Waste: ${sectorEmissions.waste.toFixed(0)} kg CO₂
Water: ${sectorEmissions.water.toFixed(0)} kg CO₂

`;
    }

    reportContent += `
---
Report generated by CarbonTrack Carbon Footprint Tracker
`;

    // Download as text file (simulate PDF)
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbon_report_${selectedPanchayat}_${selectedYear}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Export Successful', description: 'Report has been downloaded' });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Configure your export settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Select Region
            </Label>
            <Select value={selectedPanchayat} onValueChange={setSelectedPanchayat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Panchayats</SelectItem>
                {mockPanchayats.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select Year
            </Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Include in Report</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="emissions" 
                  checked={includeEmissions}
                  onCheckedChange={(checked) => setIncludeEmissions(!!checked)}
                />
                <label htmlFor="emissions" className="text-sm cursor-pointer">
                  Emissions Analysis
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="offsets" 
                  checked={includeOffsets}
                  onCheckedChange={(checked) => setIncludeOffsets(!!checked)}
                />
                <label htmlFor="offsets" className="text-sm cursor-pointer">
                  Offset Analysis
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="monthly" 
                  checked={includeMonthlyBreakdown}
                  onCheckedChange={(checked) => setIncludeMonthlyBreakdown(!!checked)}
                />
                <label htmlFor="monthly" className="text-sm cursor-pointer">
                  Monthly Breakdown
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="sector" 
                  checked={includeSectorAnalysis}
                  onCheckedChange={(checked) => setIncludeSectorAnalysis(!!checked)}
                />
                <label htmlFor="sector" className="text-sm cursor-pointer">
                  Sector-wise Analysis
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>Choose your preferred format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={generateCSV} className="w-full justify-start gap-3 h-16" variant="outline">
            <div className="p-2 rounded-lg bg-green-500/10">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">Export as CSV</p>
              <p className="text-xs text-muted-foreground">Spreadsheet format for data analysis</p>
            </div>
            <Download className="w-4 h-4 ml-auto" />
          </Button>

          <Button onClick={generatePDFReport} className="w-full justify-start gap-3 h-16" variant="outline">
            <div className="p-2 rounded-lg bg-red-500/10">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">Export as Report</p>
              <p className="text-xs text-muted-foreground">Comprehensive text report</p>
            </div>
            <Download className="w-4 h-4 ml-auto" />
          </Button>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Preview</h4>
            <div className="p-4 bg-muted rounded-lg text-sm">
              <p><strong>Region:</strong> {selectedPanchayat === 'all' ? 'All Panchayats' : mockPanchayats.find(p => p.id === selectedPanchayat)?.name}</p>
              <p><strong>Year:</strong> {selectedYear}</p>
              <p><strong>Sections:</strong> {[
                includeEmissions && 'Emissions',
                includeOffsets && 'Offsets',
                includeMonthlyBreakdown && 'Monthly',
                includeSectorAnalysis && 'Sectors'
              ].filter(Boolean).join(', ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
