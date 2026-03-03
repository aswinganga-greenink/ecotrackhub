import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { calculateEmissions, calculateOffsets, calculateNetFootprint } from '@/lib/carbonCalculations';
import { api, Panchayat } from '@/lib/api';
import { MonthlyData } from '@/types/carbon';
import { Building2, Users, Leaf, Factory, TrendingDown, TrendingUp } from 'lucide-react';

export function PanchayatData() {
  const [selectedPanchayat, setSelectedPanchayat] = useState<string>('all');
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [panchayatsData, dataResponse] = await Promise.all([
          api.getPanchayats(),
          api.getMonthlyData()
        ]);
        setPanchayats(panchayatsData);
        setMonthlyData(dataResponse.items || []);
      } catch (error) {
        console.error("Failed to load panchayat data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const panchayatMetrics = useMemo(() => {
    return panchayats.map(panchayat => {
      const data = monthlyData.filter(d => d.panchayatId === panchayat.id);

      let totalEmissions = 0;
      let totalOffsets = 0;

      data.forEach(entry => {
        totalEmissions += calculateEmissions(entry);
        totalOffsets += calculateOffsets(entry);
      });

      const netFootprint = calculateNetFootprint(totalEmissions, totalOffsets);
      const isNeutral = netFootprint <= 0;

      return {
        ...panchayat,
        totalEmissions,
        totalOffsets,
        netFootprint,
        isNeutral,
        dataEntries: data.length,
        emissionPerCapita: totalEmissions / panchayat.totalPopulation,
      };
    });
  }, [panchayats, monthlyData]);

  const filteredMetrics = selectedPanchayat === 'all'
    ? panchayatMetrics
    : panchayatMetrics.filter(p => p.id === selectedPanchayat);

  const totals = useMemo(() => {
    return panchayatMetrics.reduce((acc, p) => ({
      emissions: acc.emissions + p.totalEmissions,
      offsets: acc.offsets + p.totalOffsets,
      population: acc.population + p.totalPopulation,
    }), { emissions: 0, offsets: 0, population: 0 });
  }, [panchayatMetrics]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Panchayats</p>
                <p className="text-2xl font-bold">{panchayats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Population</p>
                <p className="text-2xl font-bold">{totals.population.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10">
                <Factory className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Emissions</p>
                <p className="text-2xl font-bold">{(totals.emissions / 1000).toFixed(1)}t</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Leaf className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Offsets</p>
                <p className="text-2xl font-bold">{(totals.offsets / 1000).toFixed(1)}t</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Panchayat Carbon Data</CardTitle>
            <CardDescription>View emissions and offsets across all regions</CardDescription>
          </div>

        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Panchayat</TableHead>
                <TableHead>District</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Population</TableHead>
                <TableHead className="text-right">Emissions (kg CO₂)</TableHead>
                <TableHead className="text-right">Offsets (kg CO₂)</TableHead>
                <TableHead className="text-right">Net Footprint</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMetrics.map(panchayat => (
                <TableRow key={panchayat.id}>
                  <TableCell className="font-medium">{panchayat.name}</TableCell>
                  <TableCell>{panchayat.district}</TableCell>
                  <TableCell>{panchayat.state}</TableCell>
                  <TableCell className="text-right">{panchayat.totalPopulation.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-destructive font-medium">
                    {panchayat.totalEmissions.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {panchayat.totalOffsets.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    <span className={panchayat.netFootprint <= 0 ? 'text-green-600' : 'text-destructive'}>
                      {panchayat.netFootprint.toFixed(0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={panchayat.isNeutral ? 'default' : 'destructive'}
                      className="gap-1"
                    >
                      {panchayat.isNeutral ? (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          Neutral
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          Emitting
                        </>
                      )}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Monthly Data */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Data Entries</CardTitle>
          <CardDescription>
            Detailed monthly records for Anjarakandi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Firm Type</TableHead>
                <TableHead className="text-right">Electricity (kWh)</TableHead>
                <TableHead className="text-right">Diesel (L)</TableHead>
                <TableHead className="text-right">Petrol (L)</TableHead>
                <TableHead className="text-right">Waste (kg)</TableHead>
                <TableHead className="text-right">Water (L)</TableHead>
                <TableHead className="text-right">Solar Units</TableHead>
                <TableHead className="text-right">Trees Planted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center">Loading...</TableCell></TableRow>
              ) : monthlyData.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center">No data found</TableCell></TableRow>
              ) : (
                monthlyData.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.month} {entry.year}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.username || 'Unknown'}</TableCell>
                    <TableCell>
                      {entry.firmType ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary capitalize">
                            {entry.firmType}
                          </span>
                          {entry.firmName && (
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={entry.firmName}>
                              {entry.firmName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{entry.electricityKwh}</TableCell>
                    <TableCell className="text-right">{entry.dieselLiters}</TableCell>
                    <TableCell className="text-right">{entry.petrolLiters}</TableCell>
                    <TableCell className="text-right">{entry.wasteKg}</TableCell>
                    <TableCell className="text-right">{entry.waterLiters.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{entry.solarUnits}</TableCell>
                    <TableCell className="text-right">{entry.treesPlanted}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
