import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { readyForAssemblyApi } from '@/services/modules';
import { PageHeader, SearchFilters } from '@/components/shared/PageHeader';
import { DataTable, TableHeader, TableHead, TableBody, TableRow, TableCell, EmptyState, Pagination } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatDate, COMPONENT_TYPES } from '@/lib/utils';
import type { ReadyForAssembly } from '@/types';

export default function ReadyForAssemblyPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState<{
    jobNumber: string; serialNumber: string; sl: string; sl1: string; cellLight: string;
    componentType: 'DOOR_LEAF' | 'DOOR_FRAME';
  }>({
    jobNumber: '', serialNumber: '', sl: '', sl1: '', cellLight: '', componentType: 'DOOR_LEAF',
  });

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
      setForm({ jobNumber: '', serialNumber: '', sl: '', sl1: '', cellLight: '', componentType: 'DOOR_LEAF' });
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
                <Trash2 className="h-4 w-4 mr-1" /> Delete ({selected.length})
              </Button>
            )}
            <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Add Record</Button>
          </>
        }
      />

      <SearchFilters
        search={search}
        onSearchChange={setSearch}
        onSearch={() => setPage(1)}
        placeholder="Search job or serial..."
      >
        <Input placeholder="Job Number" value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="w-40" />
      </SearchFilters>

      {grouped.map((group) => (
        <div key={group.date} className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="font-semibold">{formatDate(group.date)}</h3>
            <span className="text-sm text-muted-foreground">{group.doors} Doors • {group.frames} Frames</span>
          </div>
        </div>
      ))}

      {isLoading ? <TableSkeleton /> : (
        <DataTable>
          <TableHeader>
            <TableHead><Checkbox checked={selected.length === items.length && items.length > 0} onCheckedChange={toggleAll} /></TableHead>
            <TableHead>Auto #</TableHead>
            <TableHead>Job Number</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>SL</TableHead>
            <TableHead>SL1</TableHead>
            <TableHead>Cell Light</TableHead>
            <TableHead>Component Type</TableHead>
            <TableHead>Ready Date</TableHead>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <tr><td colSpan={9}><EmptyState message="No records found" /></td></tr>
            ) : items.map((item) => (
              <TableRow key={item.id}>
                <TableCell><Checkbox checked={selected.includes(item.id)} onCheckedChange={() => toggleOne(item.id)} /></TableCell>
                <TableCell>{item.autoNumber}</TableCell>
                <TableCell className="font-medium">{item.jobNumber}</TableCell>
                <TableCell>{item.serialNumber}</TableCell>
                <TableCell>{item.sl || '-'}</TableCell>
                <TableCell>{item.sl1 || '-'}</TableCell>
                <TableCell>{item.cellLight || '-'}</TableCell>
                <TableCell>{COMPONENT_TYPES[item.componentType]}</TableCell>
                <TableCell>{formatDate(item.readyDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      {pagination && <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Ready For Assembly</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Job Number</Label><Input value={form.jobNumber} onChange={(e) => setForm({ ...form, jobNumber: e.target.value })} /></div>
              <div><Label>Serial Number</Label><Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></div>
              <div><Label>SL</Label><Input value={form.sl} onChange={(e) => setForm({ ...form, sl: e.target.value })} /></div>
              <div><Label>SL1</Label><Input value={form.sl1} onChange={(e) => setForm({ ...form, sl1: e.target.value })} /></div>
              <div><Label>Cell Light</Label><Input value={form.cellLight} onChange={(e) => setForm({ ...form, cellLight: e.target.value })} /></div>
              <div>
                <Label>Component Type</Label>
                <Select value={form.componentType} onValueChange={(v) => setForm({ ...form, componentType: v as 'DOOR_LEAF' | 'DOOR_FRAME' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOOR_LEAF">Door Leaf</SelectItem>
                    <SelectItem value="DOOR_FRAME">Door Frame</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Records"
        description={`Delete ${selected.length} selected records?`}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
