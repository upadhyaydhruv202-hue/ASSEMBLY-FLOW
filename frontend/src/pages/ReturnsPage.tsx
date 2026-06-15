import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { returnApi, storageApi } from '@/services/modules';
import { PageHeader, SearchFilters } from '@/components/shared/PageHeader';
import { DataTable, TableHeader, TableHead, TableBody, TableRow, TableCell, EmptyState, Pagination } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import type { Return, ReturnReason, Assembly } from '@/types';

export default function ReturnsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDoors, setSelectedDoors] = useState<string[]>([]);
  const [form, setForm] = useState({ returnedFrom: 'Site', returnReasonCode: '', notes: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['returns', search, page],
    queryFn: () => returnApi.list({ search, page: String(page) }).then((r) => r.data),
  });

  const { data: reasons } = useQuery({
    queryKey: ['return-reasons'],
    queryFn: () => returnApi.listReasons().then((r) => r.data.data),
  });

  const { data: storageDoors } = useQuery({
    queryKey: ['all-storage-doors'],
    queryFn: async () => {
      const codes = ['CAMDEN', 'CONTAINER', 'SITE', 'STUDY'];
      const results = await Promise.all(codes.map((c) => storageApi.listByLocation(c, { limit: '50' })));
      return results.flatMap((r) => (r.data.data as Assembly[]) || []);
    },
    enabled: showCreate,
  });

  const items = (data?.data as Return[]) || [];
  const pagination = data?.pagination;

  const processMutation = useMutation({
    mutationFn: () => returnApi.process({ ...form, assemblyIds: selectedDoors }),
    onSuccess: () => {
      toast.success('Returns processed - doors moved to BH Storage');
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowCreate(false);
      setSelectedDoors([]);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div>
      <PageHeader
        title="Returns Management"
        description="Return doors from site or storage to BH"
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Process Return</Button>}
      />

      <SearchFilters search={search} onSearchChange={setSearch} onSearch={() => setPage(1)} placeholder="Search returns..." />

      {isLoading ? <TableSkeleton /> : (
        <DataTable>
          <TableHeader>
            <TableHead>Job Number</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Returned From</TableHead>
            <TableHead>Return Date</TableHead>
            <TableHead>Return Reason</TableHead>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <tr><td colSpan={5}><EmptyState message="No returns found" /></td></tr>
            ) : items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.jobNumber}</TableCell>
                <TableCell>{item.serialNumber}</TableCell>
                <TableCell>{item.returnedFrom}</TableCell>
                <TableCell>{formatDate(item.returnDate)}</TableCell>
                <TableCell>{item.returnReason?.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      {pagination && <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Process Return</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Returned From</Label>
                <Select value={form.returnedFrom} onValueChange={(v) => setForm({ ...form, returnedFrom: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Site">Site</SelectItem>
                    <SelectItem value="Camden">Camden</SelectItem>
                    <SelectItem value="Container">Container</SelectItem>
                    <SelectItem value="Study">Study</SelectItem>
                    <SelectItem value="Other Storage">Other Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Return Reason</Label>
                <Select value={form.returnReasonCode} onValueChange={(v) => setForm({ ...form, returnReasonCode: v })}>
                  <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    {(reasons as ReturnReason[])?.map((r) => <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Select Doors ({selectedDoors.length})</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 mt-1 space-y-1">
                {(storageDoors || []).map((door) => (
                  <label key={door.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded">
                    <Checkbox
                      checked={selectedDoors.includes(door.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedDoors([...selectedDoors, door.id]);
                        else setSelectedDoors(selectedDoors.filter((id) => id !== door.id));
                      }}
                    />
                    {door.jobNumber} / {door.serialNumber} - {door.currentLocation?.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => processMutation.mutate()}
              disabled={!form.returnReasonCode || selectedDoors.length === 0 || processMutation.isPending}
            >
              Return to BH Storage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
