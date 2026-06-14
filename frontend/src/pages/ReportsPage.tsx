import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { reportApi } from '@/services/modules';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const reports = [
  { type: 'assembly', title: 'Assembly Report', description: 'Completed assemblies by date range' },
  { type: 'qc', title: 'QC Report', description: 'Quality check results and status' },
  { type: 'storage', title: 'Storage Report', description: 'Doors by storage location' },
  { type: 'delivery', title: 'Delivery Report', description: 'Deliveries and collections' },
  { type: 'returns', title: 'Return Report', description: 'Return history with reasons' },
  { type: 'movement', title: 'Movement History Report', description: 'Complete movement audit trail' },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getParams = () => {
    const params: Record<string, string> = { period };
    if (period === 'custom' && startDate) params.startDate = new Date(startDate).toISOString();
    if (period === 'custom' && endDate) params.endDate = new Date(endDate).toISOString();
    return params;
  };

  const handleExport = async (type: string, format: string) => {
    try {
      const res = await reportApi.export(type, format, getParams());
      const ext = format === 'excel' ? 'xlsx' : format;
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.${ext}`;
      a.click();
      toast.success(`${format.toUpperCase()} exported`);
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div>
      <PageHeader title="Reports" description="Generate and export business reports" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Date Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <Label>Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === 'custom' && (
              <>
                <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                <div><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.type}>
            <CardHeader>
              <CardTitle className="text-lg">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleExport(report.type, 'excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport(report.type, 'csv')}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport(report.type, 'pdf')}>
                <FileText className="h-4 w-4 mr-1" /> PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
