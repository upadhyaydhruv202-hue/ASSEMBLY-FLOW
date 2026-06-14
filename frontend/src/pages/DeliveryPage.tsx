import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Printer } from 'lucide-react';
import { deliveryApi, siteApi, storageApi } from '@/services/modules';
import { PageHeader, SearchFilters } from '@/components/shared/PageHeader';
import { DataTable, TableHeader, TableHead, TableBody, TableRow, TableCell, EmptyState, Pagination } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatDate, DELIVERY_TYPES } from '@/lib/utils';
import type { Delivery, Assembly, Site } from '@/types';

export default function DeliveryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDoors, setSelectedDoors] = useState<string[]>([]);
  const [form, setForm] = useState({
    siteId: '', driver: '', vehicleNumber: '', type: 'DELIVERY', notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['deliveries', search, page],
    queryFn: () => deliveryApi.list({ search, page: String(page) }).then((r) => r.data),
  });

  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => siteApi.list().then((r) => r.data.data),
  });

  const { data: bhDoors } = useQuery({
    queryKey: ['storage-BH-doors'],
    queryFn: () => storageApi.listByLocation('BH', { limit: '100' }).then((r) => r.data),
    enabled: showCreate,
  });

  const items = (data?.data as Delivery[]) || [];
  const pagination = data?.pagination;
  const availableDoors = ((bhDoors?.data as Assembly[]) || []).filter(
    (d) => d.qualityCheck?.status === 'CHECKED',
  );

  const createMutation = useMutation({
    mutationFn: () => deliveryApi.create({ ...form, assemblyIds: selectedDoors }),
    onSuccess: () => {
      toast.success('Delivery created');
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowCreate(false);
      setSelectedDoors([]);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handlePrintNote = async (id: string) => {
    try {
      const res = await deliveryApi.getNote(id);
      const note = res.data.data;
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html><body style="font-family:sans-serif;padding:40px">
            <h1>Delivery Note</h1>
            <p><b>Delivery #:</b> ${note.deliveryNumber}</p>
            <p><b>Date:</b> ${new Date(note.deliveryDate).toLocaleDateString()}</p>
            <p><b>Site:</b> ${note.site?.name}</p>
            <p><b>Driver:</b> ${note.driver || 'N/A'}</p>
            <p><b>Vehicle:</b> ${note.vehicleNumber || 'N/A'}</p>
            <hr/>
            <h3>Items</h3>
            ${note.items.map((i: { jobNumber: string; serialNumber: string }) =>
              `<p>Job: ${i.jobNumber} | Serial: ${i.serialNumber}</p>`
            ).join('')}
          </body></html>
        `);
        win.print();
      }
    } catch {
      toast.error('Failed to print');
    }
  };

  return (
    <div>
      <PageHeader
        title="Delivery / Collection"
        description="Manage deliveries and customer collections"
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> New Delivery</Button>}
      />

      <SearchFilters search={search} onSearchChange={setSearch} onSearch={() => setPage(1)} placeholder="Search delivery..." />

      {isLoading ? <TableSkeleton /> : (
        <DataTable>
          <TableHeader>
            <TableHead>Delivery #</TableHead>
            <TableHead>Job Number</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Delivery Date</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Actions</TableHead>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <tr><td colSpan={9}><EmptyState message="No deliveries found" /></td></tr>
            ) : items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.deliveryNumber}</TableCell>
                <TableCell>{item.jobNumber}</TableCell>
                <TableCell>{item.serialNumber}</TableCell>
                <TableCell>{formatDate(item.deliveryDate)}</TableCell>
                <TableCell>{item.site?.name}</TableCell>
                <TableCell>{item.driver || '-'}</TableCell>
                <TableCell>{item.vehicleNumber || '-'}</TableCell>
                <TableCell>{DELIVERY_TYPES[item.type as keyof typeof DELIVERY_TYPES]}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => handlePrintNote(item.id)}>
                    <Printer className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      {pagination && <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create Delivery</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Site</Label>
                <Select value={form.siteId} onValueChange={(v) => setForm({ ...form, siteId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                  <SelectContent>
                    {(sites as Site[])?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DELIVERY">Delivery</SelectItem>
                    <SelectItem value="CUSTOMER_COLLECTION">Customer Collection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Driver</Label><Input value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} /></div>
              <div><Label>Vehicle Number</Label><Input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} /></div>
            </div>
            <div>
              <Label>Select Doors ({selectedDoors.length})</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 mt-1 space-y-1">
                {availableDoors.map((door) => (
                  <label key={door.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded">
                    <Checkbox
                      checked={selectedDoors.includes(door.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedDoors([...selectedDoors, door.id]);
                        else setSelectedDoors(selectedDoors.filter((id) => id !== door.id));
                      }}
                    />
                    {door.jobNumber} / {door.serialNumber}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.siteId || selectedDoors.length === 0 || createMutation.isPending}>
              Create Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
