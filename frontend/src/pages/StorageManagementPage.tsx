import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { storageApi } from '@/services/modules';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTable, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/shared/DataTable';
import type { Assembly, StorageLocation } from '@/types';

interface MoveAssignment {
  toLocationCode: string;
  count: number;
}

export default function StorageManagementPage() {
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState('BH');
  const [selected, setSelected] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<MoveAssignment[]>([]);
  const [showBulkMove, setShowBulkMove] = useState(false);

  const { data: summary } = useQuery({
    queryKey: ['storage-summary'],
    queryFn: () => storageApi.getSummary().then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const { data: locations } = useQuery({
    queryKey: ['storage-locations'],
    queryFn: () => storageApi.getLocations().then((r) => r.data.data),
  });

  const { data: doorsData } = useQuery({
    queryKey: ['storage-doors', selectedLocation],
    queryFn: () => storageApi.listByLocation(selectedLocation, { limit: '100' }).then((r) => r.data),
    enabled: !!selectedLocation,
  });

  const items = (doorsData?.data as Assembly[]) || [];

  const bulkMoveMutation = useMutation({
    mutationFn: () => {
      let remaining = [...selected];
      const movements = assignments
        .filter((a) => a.count > 0 && a.toLocationCode)
        .map((a) => {
          const ids = remaining.splice(0, a.count);
          return { assemblyIds: ids, toLocationCode: a.toLocationCode };
        })
        .filter((m) => m.assemblyIds.length > 0);
      return storageApi.bulkMove(movements);
    },
    onSuccess: () => {
      toast.success('Bulk move completed');
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSelected([]);
      setAssignments([]);
      setShowBulkMove(false);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Move failed'),
  });

  const addAssignment = () => {
    setAssignments([...assignments, { toLocationCode: '', count: 0 }]);
  };

  const totalAssigned = assignments.reduce((sum, a) => sum + a.count, 0);

  return (
    <div>
      <PageHeader
        title="Storage Management"
        description="Move doors between storage locations"
        actions={
          selected.length > 0 && (
            <Button onClick={() => setShowBulkMove(true)}>
              <ArrowRight className="h-4 w-4 mr-1" /> Bulk Move ({selected.length})
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6 mb-6">
        {(summary || []).map((loc: { name: string; code: string; count: number }) => (
          <Card
            key={loc.code}
            className={`cursor-pointer transition-all ${selectedLocation === loc.code ? 'ring-2 ring-primary' : ''}`}
            onClick={() => { setSelectedLocation(loc.code); setSelected([]); }}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{loc.count}</p>
              <p className="text-xs text-muted-foreground">{loc.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doors in {(locations as StorageLocation[])?.find((l) => l.code === selectedLocation)?.name || selectedLocation}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable>
            <TableHeader>
              <TableHead>
                <Checkbox
                  checked={selected.length === items.length && items.length > 0}
                  onCheckedChange={() => {
                    if (selected.length === items.length) setSelected([]);
                    else setSelected(items.map((i) => i.id));
                  }}
                />
              </TableHead>
              <TableHead>Job Number</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Barcode</TableHead>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(item.id)}
                      onCheckedChange={() => setSelected((prev) =>
                        prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                      )}
                    />
                  </TableCell>
                  <TableCell>{item.jobNumber}</TableCell>
                  <TableCell>{item.serialNumber}</TableCell>
                  <TableCell>{item.barcode?.barcodeValue || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </CardContent>
      </Card>

      <Dialog open={showBulkMove} onOpenChange={setShowBulkMove}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader><DialogTitle>Bulk Move - {selected.length} doors selected</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {assignments.map((a, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Location</Label>
                  <Select
                    value={a.toLocationCode}
                    onValueChange={(v) => {
                      const updated = [...assignments];
                      updated[i].toLocationCode = v;
                      setAssignments(updated);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(locations as StorageLocation[])?.filter((l) => l.code !== selectedLocation).map((loc) => (
                        <SelectItem key={loc.code} value={loc.code}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label>Count</Label>
                  <Input
                    type="number"
                    min={0}
                    max={selected.length}
                    value={a.count}
                    onChange={(e) => {
                      const updated = [...assignments];
                      updated[i].count = parseInt(e.target.value) || 0;
                      setAssignments(updated);
                    }}
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setAssignments(assignments.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addAssignment} className="w-full"><Plus className="h-4 w-4 mr-1" /> Add Assignment</Button>
            <p className="text-sm text-muted-foreground">
              Assigned: {totalAssigned} / {selected.length}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkMove(false)}>Cancel</Button>
            <Button
              onClick={() => bulkMoveMutation.mutate()}
              disabled={totalAssigned !== selected.length || bulkMoveMutation.isPending}
            >
              Execute Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
