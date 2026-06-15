import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, DoorOpen, Frame } from 'lucide-react';
import { readyForAssemblyApi } from '@/services/modules';
import { PageHeader, SearchFilters } from '@/components/shared/PageHeader';
import { DataTable, TableHeader, TableHead, TableBody, TableRow, TableCell, EmptyState, Pagination } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TableSkeleton } from '@/components/ui/skeleton';
import { ComponentBadge, CellLightBadge } from '@/components/ui/badge';
import { formatDate, COMPONENT_TYPES } from '@/lib/utils';
import type { ReadyForAssembly } from '@/types';

const emptyForm: {
  jobNumber: string; serialNumber: string; sl: string; sl1: string; cellLight: string;
  componentType: 'DOOR_LEAF' | 'DOOR_FRAME';
} = {
  jobNumber: '', serialNumber: '', sl: '', sl1: '', cellLight: '', componentType: 'DOOR_LEAF',
};

export default function ReadyForAssemblyPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['ready-for-assembly', search, jobFilter, page],
    queryFn: () => readyForAssemblyApi.list({
      search, jobNumber: jobFilter, page: String(page), limit: '50',
    }).then((r) => r.data),
  });

  const items = (data?.data as { items?: ReadyForAssembly[]; grouped?: { date: string; doors: number; frames: number; items: ReadyForAssembly[] }[] })?.items || [];
  const grouped = (data?.data as { grouped?: { date: string; doors: number; frames: number; items: ReadyForAssembly[] }[] })?.grouped || [];
  const pagination = data?.pagination;

  const createMutation = useMutation({
    mutationFn: () => readyForAssemblyApi.create(form),
    onSuccess: () => {
      toast.success('Record added');
      queryClient.invalidateQueries({ queryKey: ['ready-for-assembly'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowAdd(false);
      setForm(emptyForm);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => readyForAssemblyApi.bulkDelete(selected),
    onSuccess: () => {
      toast.success('Records deleted');
      queryClient.invalidateQueries({ queryKey: ['ready-for-assembly'] });
      setSelected([]);
      setShowDelete(false);
    },
  });

  const toggleAll = () => {
    if (selected.length === items.length) setSelected([]);
    else setSelected(items.map((i) => i.id));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div>
      <PageHeader
        title="Ready For Assembly"
        description="Track door leaves and frames ready for assembly"
        actions={
          <>
            {selected.length > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
                <Trash2 className="h-4 w-4" /> Delete ({selected.length})
              </Button>
            )}
            <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add Record</Button>
          </>
        }
      />

      {grouped.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {grouped.map((group) => (
            <div key={group.date} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <DoorOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{formatDate(group.date)}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DoorOpen className="h-3 w-3" />
                    <span className="font-medium text-foreground">{group.doors}</span> Doors
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Frame className="h-3 w-3" />
                    <span className="font-medium text-foreground">{group.frames}</span> Frames
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SearchFilters
        search={search}
        onSearchChange={setSearch}
        onSearch={() => setPage(1)}
        placeholder="Search job or serial..."
      >
        <div className="sm:w-44">
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Job Number</Label>
          <Input
            className="h-9 bg-background"
            placeholder="Filter by job"
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
          />
        </div>
      </SearchFilters>

      {isLoading ? <TableSkeleton /> : (
        <DataTable>
          <TableHeader>
            <TableHead className="w-10">
              <Checkbox checked={selected.length === items.length && items.length > 0} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead>Auto #</TableHead>
            <TableHead>Job Number</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>SL</TableHead>
            <TableHead>SL1</TableHead>
            <TableHead>Cell Light</TableHead>
            <TableHead>Component</TableHead>
            <TableHead>Ready Date</TableHead>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <tr><td colSpan={9}><EmptyState message="No records found" /></td></tr>
            ) : items.map((item) => (
              <TableRow key={item.id}>
                <TableCell><Checkbox checked={selected.includes(item.id)} onCheckedChange={() => toggleOne(item.id)} /></TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.autoNumber}</TableCell>
                <TableCell className="font-semibold">{item.jobNumber}</TableCell>
                <TableCell>{item.serialNumber}</TableCell>
                <TableCell className="text-muted-foreground">{item.sl || '—'}</TableCell>
                <TableCell className="text-muted-foreground">{item.sl1 || '—'}</TableCell>
                <TableCell><CellLightBadge value={item.cellLight} /></TableCell>
                <TableCell><ComponentBadge type={item.componentType} /></TableCell>
                <TableCell className="text-muted-foreground">{formatDate(item.readyDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      {pagination && (
        <div className="mt-4">
          <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Ready For Assembly</DialogTitle>
            <DialogDescription>Enter door component details for the assembly queue.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Job Number</Label>
                <Input value={form.jobNumber} onChange={(e) => setForm({ ...form, jobNumber: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Serial Number</Label>
                <Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>SL</Label>
                <Input value={form.sl} onChange={(e) => setForm({ ...form, sl: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>SL1</Label>
                <Input value={form.sl1} onChange={(e) => setForm({ ...form, sl1: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Cell Light</Label>
                <Input value={form.cellLight} onChange={(e) => setForm({ ...form, cellLight: e.target.value })} placeholder="e.g. Red, Amber" />
              </div>
              <div className="space-y-1.5">
                <Label>Component Type</Label>
                <Select value={form.componentType} onValueChange={(v) => setForm({ ...form, componentType: v as 'DOOR_LEAF' | 'DOOR_FRAME' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOOR_LEAF">{COMPONENT_TYPES.DOOR_LEAF}</SelectItem>
                    <SelectItem value="DOOR_FRAME">{COMPONENT_TYPES.DOOR_FRAME}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Records"
        description={`Delete ${selected.length} selected records? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
