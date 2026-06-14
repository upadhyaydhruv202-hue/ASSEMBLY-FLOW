import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, Printer } from 'lucide-react';
import { qcApi } from '@/services/modules';
import { PageHeader, SearchFilters } from '@/components/shared/PageHeader';
import { DataTable, TableHeader, TableHead, TableBody, TableRow, TableCell, EmptyState, Pagination } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import type { QualityCheck } from '@/types';

export default function QualityCheckPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['quality-checks', search, statusFilter, page],
    queryFn: () => qcApi.list({ search, status: statusFilter === 'ALL' ? '' : statusFilter, page: String(page) }).then((r) => r.data),
  });

  const items = (data?.data as QualityCheck[]) || [];
  const pagination = data?.pagination;

  const updateMutation = useMutation({
    mutationFn: ({ id, status, remarks: r }: { id: string; status: string; remarks?: string }) =>
      qcApi.update(id, { status, remarks: r }),
    onSuccess: () => {
      toast.success('QC updated');
      queryClient.invalidateQueries({ queryKey: ['quality-checks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      setRejectId(null);
      setRemarks('');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handlePrintLabel = async (id: string) => {
    try {
      const res = await qcApi.getLabel(id);
      const data = res.data.data;
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html><body style="font-family:sans-serif;padding:20px">
            <h2>QC Label</h2>
            <p><b>Job:</b> ${data.jobNumber}</p>
            <p><b>Serial:</b> ${data.serialNumber}</p>
            <p><b>Status:</b> ${data.status}</p>
            <p><b>Date:</b> ${data.qcDate ? new Date(data.qcDate).toLocaleDateString() : 'N/A'}</p>
            <p><b>Barcode:</b> ${data.barcode || 'N/A'}</p>
          </body></html>
        `);
        win.print();
      }
    } catch {
      toast.error('Failed to print label');
    }
  };

  return (
    <div>
      <PageHeader title="Quality Check" description="QC approval required before storage" />

      <SearchFilters search={search} onSearchChange={setSearch} onSearch={() => setPage(1)}>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CHECKED">Checked</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </SearchFilters>

      {isLoading ? <TableSkeleton /> : (
        <DataTable>
          <TableHeader>
            <TableHead>Job Number</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>QC Status</TableHead>
            <TableHead>QC Date</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead>Actions</TableHead>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <tr><td colSpan={6}><EmptyState message="No QC records found" /></td></tr>
            ) : items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.jobNumber}</TableCell>
                <TableCell>{item.serialNumber}</TableCell>
                <TableCell><StatusBadge status={item.status} /></TableCell>
                <TableCell>{formatDate(item.qcDate)}</TableCell>
                <TableCell className="max-w-[200px] truncate">{item.remarks || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {item.status === 'PENDING' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: item.id, status: 'CHECKED' })}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectId(item.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {item.status === 'CHECKED' && (
                      <Button size="sm" variant="outline" onClick={() => handlePrintLabel(item.id)}>
                        <Printer className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      {pagination && <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />}

      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject QC</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectId && updateMutation.mutate({ id: rejectId, status: 'REJECTED', remarks })}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
