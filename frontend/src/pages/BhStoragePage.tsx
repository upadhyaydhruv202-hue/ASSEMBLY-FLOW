import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { storageApi } from '@/services/modules';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, TableHeader, TableHead, TableBody, TableRow, TableCell, EmptyState, Pagination } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import type { Assembly, StorageLocation } from '@/types';

const locationNames: Record<string, string> = {
  bh: 'BH Storage',
  BH: 'BH Storage',
};

export default function BhStoragePage() {
  const { code = 'BH' } = useParams();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [showMove, setShowMove] = useState(false);
  const [targetLocation, setTargetLocation] = useState('');

  const storageCode = code?.toUpperCase() || 'BH';

  const { data: locations } = useQuery({
    queryKey: ['storage-locations'],
    queryFn: () => storageApi.getLocations().then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['storage', storageCode, page],
    queryFn: () => storageApi.listByLocation(storageCode, { page: String(page) }).then((r) => r.data),
  });

  const items = (data?.data as Assembly[]) || [];
  const pagination = data?.pagination;

  const moveMutation = useMutation({
    mutationFn: () => storageApi.move({ assemblyIds: selected, toLocationCode: targetLocation }),
    onSuccess: () => {
      toast.success(`Moved ${selected.length} doors`);
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSelected([]);
      setShowMove(false);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Move failed'),
  });

  const toggleAll = () => {
    if (selected.length === items.length) setSelected([]);
    else setSelected(items.map((i) => i.id));
  };

  return (
    <div>
      <PageHeader
        title={locationNames[storageCode] || `${storageCode} Storage`}
        description="Manage doors in storage"
        actions={
          selected.length > 0 && (
            <Button onClick={() => setShowMove(true)}>
              <ArrowRight className="h-4 w-4 mr-1" /> Move ({selected.length})
            </Button>
          )
        }
      />

      {isLoading ? <TableSkeleton /> : (
        <DataTable>
          <TableHeader>
            <TableHead><Checkbox checked={selected.length === items.length && items.length > 0} onCheckedChange={toggleAll} /></TableHead>
            <TableHead>Job Number</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Storage Date</TableHead>
            <TableHead>Status</TableHead>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <tr><td colSpan={6}><EmptyState message="No doors in this storage location" /></td></tr>
            ) : items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(item.id)}
                    onCheckedChange={() => setSelected((prev) =>
                      prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                    )}
                  />
                </TableCell>
                <TableCell className="font-medium">{item.jobNumber}</TableCell>
                <TableCell>{item.serialNumber}</TableCell>
                <TableCell>{item.barcode?.barcodeValue || '-'}</TableCell>
                <TableCell>{formatDate(item.updatedAt)}</TableCell>
                <TableCell>{item.qualityCheck?.status || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      {pagination && <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />}

      <Dialog open={showMove} onOpenChange={setShowMove}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move to Location</DialogTitle></DialogHeader>
          <Select value={targetLocation} onValueChange={setTargetLocation}>
            <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
            <SelectContent>
              {(locations as StorageLocation[])?.filter((l) => l.code !== storageCode).map((loc) => (
                <SelectItem key={loc.code} value={loc.code}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMove(false)}>Cancel</Button>
            <Button onClick={() => moveMutation.mutate()} disabled={!targetLocation || moveMutation.isPending}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
