import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Barcode, Download, Plus, ScanLine } from 'lucide-react';
import { assemblyApi, readyForAssemblyApi } from '@/services/modules';
import { PageHeader, SearchFilters } from '@/components/shared/PageHeader';
import { DataTable, TableHeader, TableHead, TableBody, TableRow, TableCell, EmptyState, Pagination } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatDate, LOCK_TYPES, LEAF_TYPES } from '@/lib/utils';
import type { Assembly, ReadyForAssembly } from '@/types';

export default function AssemblyPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [scanValue, setScanValue] = useState('');
  const [scanResult, setScanResult] = useState<Assembly | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [form, setForm] = useState({
    jobNumber: '', serialNumber: '', lockType: 'SASH_LOCK', leafType: 'SINGLE_LEAF',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['assemblies', search, page],
    queryFn: () => assemblyApi.list({ search, page: String(page) }).then((r) => r.data),
  });

  const { data: readyData } = useQuery({
    queryKey: ['ready-for-assembly-all'],
    queryFn: () => readyForAssemblyApi.list({ limit: '100' }).then((r) => r.data),
    enabled: showCreate,
  });

  const items = (data?.data as Assembly[]) || [];
  const pagination = data?.pagination;
  const readyItems = ((readyData?.data as { items?: ReadyForAssembly[] })?.items) || [];

  const createMutation = useMutation({
    mutationFn: () => assemblyApi.create({ ...form, readyForAssemblyIds: selectedComponents }),
    onSuccess: () => {
      toast.success('Assembly completed');
      queryClient.invalidateQueries({ queryKey: ['assemblies'] });
      queryClient.invalidateQueries({ queryKey: ['ready-for-assembly'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowCreate(false);
      resetCreateForm();
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const barcodeMutation = useMutation({
    mutationFn: (id: string) => assemblyApi.generateBarcode(id),
    onSuccess: () => {
      toast.success('Barcode generated');
      queryClient.invalidateQueries({ queryKey: ['assemblies'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleDownload = async (id: string) => {
    try {
      const res = await assemblyApi.downloadBarcode(id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barcode-${id}.png`;
      a.click();
    } catch {
      toast.error('Download failed');
    }
  };

  const handleScan = async () => {
    try {
      const res = await assemblyApi.scan(scanValue);
      setScanResult(res.data.data);
      toast.success('Barcode found');
    } catch {
      toast.error('Barcode not found');
      setScanResult(null);
    }
  };

  const resetCreateForm = () => {
    setSelectedComponents([]);
    setForm({ jobNumber: '', serialNumber: '', lockType: 'SASH_LOCK', leafType: 'SINGLE_LEAF' });
  };

  const handleComponentToggle = (item: ReadyForAssembly, checked: boolean) => {
    if (checked) {
      if (selectedComponents.length === 0) {
        setForm((prev) => ({ ...prev, jobNumber: item.jobNumber, serialNumber: item.serialNumber }));
        setSelectedComponents([item.id]);
        return;
      }
      if (item.jobNumber !== form.jobNumber || item.serialNumber !== form.serialNumber) {
        toast.error('All components must share the same job number and serial number');
        return;
      }
      setSelectedComponents([...selectedComponents, item.id]);
      return;
    }

    const next = selectedComponents.filter((id) => id !== item.id);
    setSelectedComponents(next);
    if (next.length === 0) {
      setForm((prev) => ({ ...prev, jobNumber: '', serialNumber: '' }));
    }
  };

  return (
    <div>
      <PageHeader
        title="Door Assembly"
        description="Complete assemblies and manage barcodes"
        actions={
          <>
            <Button variant="outline" onClick={() => setShowScan(true)}><ScanLine className="h-4 w-4 mr-1" /> Scan</Button>
            <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> New Assembly</Button>
          </>
        }
      />

      <SearchFilters search={search} onSearchChange={setSearch} onSearch={() => setPage(1)} placeholder="Search job or serial..." />

      {isLoading ? <TableSkeleton /> : (
        <DataTable>
          <TableHeader>
            <TableHead>Job Number</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Lock Type</TableHead>
            <TableHead>Leaf Type</TableHead>
            <TableHead>Assembly Date</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <tr><td colSpan={8}><EmptyState message="No assemblies found" /></td></tr>
            ) : items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.jobNumber}</TableCell>
                <TableCell>{item.serialNumber}</TableCell>
                <TableCell>{LOCK_TYPES[item.lockType as keyof typeof LOCK_TYPES]}</TableCell>
                <TableCell>{LEAF_TYPES[item.leafType as keyof typeof LEAF_TYPES]}</TableCell>
                <TableCell>{formatDate(item.assemblyDate)}</TableCell>
                <TableCell>{item.barcode?.barcodeValue || '-'}</TableCell>
                <TableCell><StatusBadge status={item.assemblyStatus} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {!item.barcode ? (
                      <Button size="sm" variant="outline" onClick={() => barcodeMutation.mutate(item.id)}>
                        <Barcode className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleDownload(item.id)}>
                        <Download className="h-3 w-3" />
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

      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Create Assembly</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Job Number</Label>
                <Input
                  value={form.jobNumber}
                  readOnly
                  placeholder="Auto-filled from selected components"
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Serial Number</Label>
                <Input
                  value={form.serialNumber}
                  readOnly
                  placeholder="Auto-filled from selected components"
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Lock Type</Label>
                <Select value={form.lockType} onValueChange={(v) => setForm({ ...form, lockType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOCK_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Leaf Type</Label>
                <Select value={form.leafType} onValueChange={(v) => setForm({ ...form, leafType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAF_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Select Components ({selectedComponents.length} selected)</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 mt-1 space-y-1">
                {readyItems.map((item) => {
                  const isSelected = selectedComponents.includes(item.id);
                  const isCompatible = selectedComponents.length === 0
                    || (item.jobNumber === form.jobNumber && item.serialNumber === form.serialNumber);

                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-2 text-sm p-1 rounded ${
                        isCompatible ? 'cursor-pointer hover:bg-muted' : 'cursor-not-allowed opacity-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isCompatible && !isSelected}
                        onChange={(e) => handleComponentToggle(item, e.target.checked)}
                      />
                      {item.jobNumber} / {item.serialNumber} - {item.componentType.replace('_', ' ')}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetCreateForm(); }}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || selectedComponents.length === 0 || !form.jobNumber || !form.serialNumber}
            >
              Complete Assembly
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showScan} onOpenChange={setShowScan}>
        <DialogContent>
          <DialogHeader><DialogTitle>Scan Barcode</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Enter barcode value" value={scanValue} onChange={(e) => setScanValue(e.target.value)} />
            <Button onClick={handleScan} className="w-full">Lookup</Button>
            {scanResult && (
              <div className="border rounded-md p-4 space-y-2 text-sm">
                <p><strong>Job:</strong> {scanResult.jobNumber}</p>
                <p><strong>Serial:</strong> {scanResult.serialNumber}</p>
                <p><strong>Status:</strong> {scanResult.assemblyStatus}</p>
                <p><strong>Location:</strong> {scanResult.currentLocation?.name || 'N/A'}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
