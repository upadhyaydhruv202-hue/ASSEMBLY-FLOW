import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';
import { siteApi, returnApi } from '@/services/modules';
import { PageHeader, SearchFilters } from '@/components/shared/PageHeader';
import { DataTable, TableHeader, TableHead, TableBody, TableRow, TableCell, EmptyState, Pagination } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatDate, SITE_DOOR_STATUS } from '@/lib/utils';
import type { SiteDoor, ReturnReason } from '@/types';

export default function SiteManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [showReturn, setShowReturn] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['site-doors', search, statusFilter, page],
    queryFn: () => siteApi.listDoors({ search, status: statusFilter === 'ALL' ? '' : statusFilter, page: String(page) }).then((r) => r.data),
  });

  const { data: reasons } = useQuery({
    queryKey: ['return-reasons'],
    queryFn: () => returnApi.listReasons().then((r) => r.data.data),
  });

  const items = (data?.data as SiteDoor[]) || [];
  const pagination = data?.pagination;

  const returnMutation = useMutation({
    mutationFn: () => returnApi.process({
      assemblyIds: selected,
      returnedFrom: 'Site',
      returnReasonCode: returnReason,
    }),
    onSuccess: () => {
      toast.success('Doors returned to BH Storage');
      queryClient.invalidateQueries({ queryKey: ['site-doors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      setSelected([]);
      setShowReturn(false);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => siteApi.updateDoorStatus(selected, status),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['site-doors'] });
      setSelected([]);
    },
  });

  return (
    <div>
      <PageHeader
        title="Site Management"
        description="Track doors at customer sites"
        actions={
          selected.length > 0 && (
            <>
              <Button variant="outline" onClick={() => statusMutation.mutate('INSTALLED')}>Mark Installed</Button>
              <Button onClick={() => setShowReturn(true)}><RotateCcw className="h-4 w-4 mr-1" /> Return ({selected.length})</Button>
            </>
          )
        }
      />

      <SearchFilters search={search} onSearchChange={setSearch} onSearch={() => setPage(1)}>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.entries(SITE_DOOR_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </SearchFilters>

      {isLoading ? <TableSkeleton /> : (
        <DataTable>
          <TableHeader>
            <TableHead><Checkbox checked={selected.length === items.length && items.length > 0} onCheckedChange={() => {
              if (selected.length === items.length) setSelected([]);
              else setSelected(items.map((i) => i.assembly?.id || '').filter(Boolean));
            }} /></TableHead>
            <TableHead>Job Number</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Site Name</TableHead>
            <TableHead>Delivered Date</TableHead>
            <TableHead>Status</TableHead>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <tr><td colSpan={6}><EmptyState message="No doors at sites" /></td></tr>
            ) : items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.assembly && (
                    <Checkbox
                      checked={selected.includes(item.assembly.id)}
                      onCheckedChange={() => setSelected((prev) =>
                        prev.includes(item.assembly!.id) ? prev.filter((x) => x !== item.assembly!.id) : [...prev, item.assembly!.id]
                      )}
                      disabled={item.status === 'RETURNED'}
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.jobNumber}</TableCell>
                <TableCell>{item.serialNumber}</TableCell>
                <TableCell>{item.site?.name}</TableCell>
                <TableCell>{formatDate(item.deliveredDate)}</TableCell>
                <TableCell><StatusBadge status={item.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      {pagination && <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />}

      <Dialog open={showReturn} onOpenChange={setShowReturn}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Return to BH Storage</DialogTitle></DialogHeader>
          <Select value={returnReason} onValueChange={setReturnReason}>
            <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
            <SelectContent>
              {(reasons as ReturnReason[])?.map((r) => <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturn(false)}>Cancel</Button>
            <Button onClick={() => returnMutation.mutate()} disabled={!returnReason || returnMutation.isPending}>Return to BH</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
