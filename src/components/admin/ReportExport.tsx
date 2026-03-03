import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api';
import { MonthlyData } from '@/types/carbon';
import { FileText, FileSpreadsheet, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// GHG Protocol emission factors (matching backend)
const EF = {
  electricity: 0.716,
  diesel: 2.68,
  petrol: 2.32,
  waste: 0.586,
  water: 0.000344,
  tree_per_year: 21.77,
  solar_per_unit: 0.716,
};

function calcEmissions(d: MonthlyData) {
  return (
    d.electricityKwh * EF.electricity +
    d.dieselLiters * EF.diesel +
    d.petrolLiters * EF.petrol +
    d.wasteKg * EF.waste +
    d.waterLiters * EF.water
  );
}
function calcOffsets(d: MonthlyData) {
  return d.treesPlanted * (EF.tree_per_year / 12) + d.solarUnits * EF.solar_per_unit;
}

const MONTH_ORDER: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

export function ReportExport() {
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [includeEmissions, setIncludeEmissions] = useState(true);
  const [includeOffsets, setIncludeOffsets] = useState(true);
  const [includeMonthlyBreakdown, setIncludeMonthlyBreakdown] = useState(true);
  const [includeSectorAnalysis, setIncludeSectorAnalysis] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api.getMonthlyData().then(r => setMonthlyData(r.items || [])).catch(console.error);
  }, []);

  // Filter + sort chronologically
  const filteredData = monthlyData
    .filter(d => d.year.toString() === selectedYear)
    .sort((a, b) => (MONTH_ORDER[a.month] ?? 0) - (MONTH_ORDER[b.month] ?? 0));

  const totalEmissions = filteredData.reduce((s, d) => s + calcEmissions(d), 0);
  const totalOffsets = filteredData.reduce((s, d) => s + calcOffsets(d), 0);
  const netFootprint = totalEmissions - totalOffsets;

  // ─── CSV Export ─────────────────────────────────────────────────────────────
  const generateCSV = () => {
    if (filteredData.length === 0) {
      toast({ title: 'No Data', description: `No entries found for ${selectedYear}.`, variant: 'destructive' });
      return;
    }

    const headers = [
      'Month', 'Year', 'User', 'Organization Type', 'Organization Name',
      'Electricity (kWh)', 'Diesel (L)', 'Petrol (L)', 'Waste (kg)', 'Water (L)',
      'Solar Units', 'Trees Planted',
      ...(includeEmissions ? ['Total Emissions (kg CO₂)', 'Net Footprint (kg CO₂)'] : []),
      ...(includeOffsets ? ['Total Offsets (kg CO₂)'] : []),
    ];

    const rows = filteredData.map(d => {
      const emissions = calcEmissions(d);
      const offsets = calcOffsets(d);
      return [
        d.month, d.year,
        d.username || 'Unknown',
        d.firmType || '–', d.firmName || '–',
        d.electricityKwh, d.dieselLiters, d.petrolLiters,
        d.wasteKg, d.waterLiters, d.solarUnits, d.treesPlanted,
        ...(includeEmissions ? [emissions.toFixed(2), (emissions - offsets).toFixed(2)] : []),
        ...(includeOffsets ? [offsets.toFixed(2)] : []),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    triggerDownload(csv, `carbon_report_anjarakandi_${selectedYear}.csv`, 'text/csv');
    toast({ title: 'CSV Downloaded', description: `${filteredData.length} records exported.` });
  };

  // ─── PDF Export (HTML print) ─────────────────────────────────────────────────
  const generatePDF = () => {
    if (filteredData.length === 0) {
      toast({ title: 'No Data', description: `No entries found for ${selectedYear}.`, variant: 'destructive' });
      return;
    }

    setIsExporting(true);

    const sectorEmissions = {
      Electricity: filteredData.reduce((s, d) => s + d.electricityKwh * EF.electricity, 0),
      Diesel: filteredData.reduce((s, d) => s + d.dieselLiters * EF.diesel, 0),
      Petrol: filteredData.reduce((s, d) => s + d.petrolLiters * EF.petrol, 0),
      Waste: filteredData.reduce((s, d) => s + d.wasteKg * EF.waste, 0),
      Water: filteredData.reduce((s, d) => s + d.waterLiters * EF.water, 0),
    };

    const monthRows = filteredData.map(d => {
      const em = calcEmissions(d);
      const of = calcOffsets(d);
      return `
        <tr>
          <td>${d.month} ${d.year}</td>
          <td>${d.username || '–'}</td>
          <td>${d.firmType ? `${d.firmType}${d.firmName ? ` – ${d.firmName}` : ''}` : '–'}</td>
          <td>${d.electricityKwh}</td>
          <td>${d.dieselLiters}</td>
          <td>${d.petrolLiters}</td>
          <td>${d.wasteKg}</td>
          <td>${d.waterLiters.toLocaleString()}</td>
          <td>${d.solarUnits}</td>
          <td>${d.treesPlanted}</td>
          ${includeEmissions ? `<td>${em.toFixed(2)}</td>` : ''}
          ${includeOffsets ? `<td>${of.toFixed(2)}</td>` : ''}
        </tr>`;
    }).join('');

    const sectorRows = Object.entries(sectorEmissions).map(([name, val]) =>
      `<tr><td>${name}</td><td>${val.toFixed(2)} kg CO₂</td><td>${totalEmissions > 0 ? ((val / totalEmissions) * 100).toFixed(1) : '0.0'}%</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Carbon Report – Anjarakandi ${selectedYear}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 24px; font-size: 11px; }
  h1 { font-size: 22px; color: #166534; margin-bottom: 4px; }
  .subtitle { color: #555; margin-bottom: 20px; font-size: 12px; }
  .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; }
  .card h3 { font-size: 10px; text-transform: uppercase; color: #555; margin-bottom: 4px; }
  .card p { font-size: 18px; font-weight: 700; color: #166534; }
  .card small { font-size: 10px; color: #888; }
  h2 { font-size: 14px; color: #166534; border-bottom: 2px solid #bbf7d0; padding-bottom: 4px; margin: 20px 0 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #166534; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .status { font-weight: 700; color: ${netFootprint <= 0 ? '#166534' : '#dc2626'}; }
  .footer { margin-top: 32px; text-align: center; color: #aaa; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  @media print { @page { margin: 10mm; } }
</style>
</head>
<body>
<h1>🌿 Carbon Footprint Report</h1>
<p class="subtitle">Gram Panchayat Anjarakandi &nbsp;|&nbsp; Year: ${selectedYear} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

<div class="summary-grid">
  <div class="card"><h3>Total Emissions</h3><p>${totalEmissions.toFixed(0)}</p><small>kg CO₂e</small></div>
  <div class="card"><h3>Total Offsets</h3><p>${totalOffsets.toFixed(0)}</p><small>kg CO₂e</small></div>
  <div class="card"><h3>Net Footprint</h3><p class="status">${netFootprint.toFixed(0)}</p><small>${netFootprint <= 0 ? '✓ Carbon Neutral' : 'Still Emitting'}</small></div>
</div>

${includeMonthlyBreakdown || includeEmissions ? `
<h2>Monthly Data Breakdown</h2>
<table>
  <thead><tr>
    <th>Month</th><th>User</th><th>Organization</th>
    <th>Electricity</th><th>Diesel</th><th>Petrol</th><th>Waste</th><th>Water</th><th>Solar</th><th>Trees</th>
    ${includeEmissions ? '<th>Emissions (kg)</th>' : ''}
    ${includeOffsets ? '<th>Offsets (kg)</th>' : ''}
  </tr></thead>
  <tbody>${monthRows}</tbody>
</table>` : ''}

${includeSectorAnalysis ? `
<h2>Sector-wise Emissions</h2>
<table>
  <thead><tr><th>Sector</th><th>Emissions</th><th>Share</th></tr></thead>
  <tbody>${sectorRows}</tbody>
</table>` : ''}

<div class="footer">Report generated by CarbonTrackHub &nbsp;|&nbsp; Powered by GHG Protocol Standards</div>
</body>
</html>`;

    // Open in a new tab and trigger print dialog (saves as PDF)
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 500);
    }

    setIsExporting(false);
    toast({ title: 'PDF Ready', description: 'Print dialog opened. Choose "Save as PDF" to download.' });
  };

  function triggerDownload(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

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
              <Calendar className="w-4 h-4" />
              Select Year
            </Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Include in Report</Label>
            <div className="space-y-3">
              {[
                { id: 'emissions', label: 'Emissions Analysis', checked: includeEmissions, set: setIncludeEmissions },
                { id: 'offsets', label: 'Offset Analysis', checked: includeOffsets, set: setIncludeOffsets },
                { id: 'monthly', label: 'Monthly Breakdown', checked: includeMonthlyBreakdown, set: setIncludeMonthlyBreakdown },
                { id: 'sector', label: 'Sector-wise Analysis', checked: includeSectorAnalysis, set: setIncludeSectorAnalysis },
              ].map(({ id, label, checked, set }) => (
                <div key={id} className="flex items-center space-x-2">
                  <Checkbox id={id} checked={checked} onCheckedChange={(v) => set(!!v)} />
                  <label htmlFor={id} className="text-sm cursor-pointer">{label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="pt-4 border-t space-y-1 text-sm">
            <p><span className="font-medium">Region:</span> Anjarakandi</p>
            <p><span className="font-medium">Year:</span> {selectedYear}</p>
            <p><span className="font-medium">Records:</span> {filteredData.length}</p>
            <p><span className="font-medium">Total Emissions:</span> {totalEmissions.toFixed(0)} kg CO₂</p>
            <p><span className="font-medium">Net Footprint:</span> <span className={netFootprint <= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{netFootprint.toFixed(0)} kg CO₂</span></p>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>Download your report in the preferred format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={generateCSV} className="w-full justify-start gap-3 h-16" variant="outline">
            <div className="p-2 rounded-lg bg-green-500/10">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">Export as CSV</p>
              <p className="text-xs text-muted-foreground">Spreadsheet with all user & emission data</p>
            </div>
            <Download className="w-4 h-4 ml-auto" />
          </Button>

          <Button onClick={generatePDF} disabled={isExporting} className="w-full justify-start gap-3 h-16" variant="outline">
            <div className="p-2 rounded-lg bg-red-500/10">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">Export as PDF</p>
              <p className="text-xs text-muted-foreground">Formatted report — save as PDF from print dialog</p>
            </div>
            <Download className="w-4 h-4 ml-auto" />
          </Button>

          {filteredData.length === 0 && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              No data for {selectedYear}. Submit monthly data first.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
