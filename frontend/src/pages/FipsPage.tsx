import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, FileText, Eye } from 'lucide-react';
import { fipsApi } from '@/services/modules';
import { PageHeader, SearchFilters } from '@/components/shared/PageHeader';
import { DataTable, TableHeader, TableHead, TableBody, TableRow, TableCell, EmptyState, Pagination } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatDate, getUploadUrl } from '@/lib/utils';
import type { FipsForm } from '@/types';

export default function FipsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [viewDocs, setViewDocs] = useState<FipsForm | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['fips', search, statusFilter, page],
    queryFn: () => fipsApi.list({ search, status: statusFilter === 'ALL' ? '' : statusFilter, page: String(page) }).then((r) => r.data),
  });

  const items = (data?.data as FipsForm[]) || [];
  const pagination = data?.pagination;

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => fipsApi.update(id, { status }),
    onSuccess: () => {
      toast.success('FIPS status updated');
      queryClient.invalidateQueries({ queryKey: ['fips'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => fipsApi.uploadDocument(id, file),
    onSuccess: () => {
      toast.success('Document uploaded');
      queryClient.invalidateQueries({ queryKey: ['fips'] });
      setUploadId(null);
    },
  });

  return (
    <div>
      <PageHeader title="FIPS Tracking" description="Track FIPS submissions and documents" />

      <SearchFilters search={search} onSearchChange={setSearch} onSearch={() => setPage(1)}>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
          </SelectContent>
        </Select>
      </SearchFilters>

      {isLoading ? <TableSkeleton /> : (
        <DataTable>
          <TableHeader>
            <TableHead>Job Number</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>FIPS Status</TableHead>
            <TableHead>Submitted Date</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Actions</TableHead>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <tr><td colSpan={6}><EmptyState message="No FIPS records found" /></td></tr>
            ) : items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.jobNumber}</TableCell>
                <TableCell>{item.serialNumber}</TableCell>
                <TableCell><StatusBadge status={item.status} /></TableCell>
                <TableCell>{formatDate(item.submittedDate)}</TableCell>
                <TableCell>{item.documents?.length || 0} files</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {item.status === 'PENDING' && (
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: item.id, status: 'SUBMITTED' })}>Submit</Button>
                    )}
                    {item.status === 'SUBMITTED' && (
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: item.id, status: 'APPROVED' })}>Approve</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setUploadId(item.id)}><Upload className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setViewDocs(item)}><Eye className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      {pagination && <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />}

      <Dialog open={!!uploadId} onOpenChange={() => setUploadId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && uploadId) uploadMutation.mutate({ id: uploadId, file });
            }}
            className="w-full"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewDocs} onOpenChange={() => setViewDocs(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Documents - {viewDocs?.jobNumber}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {viewDocs?.documents?.length ? viewDocs.documents.map((doc) => {
              const docUrl = getUploadUrl(doc.filePath, doc.url);
              const isImage = doc.mimeType?.startsWith('image/');

              return (
                <div key={doc.id} className="flex gap-3 p-3 border rounded-lg">
                  {isImage ? (
                    <a href={docUrl} target="_blank" rel="noreferrer">
                      <img
                        src={docUrl}
                        alt={doc.fileName}
                        className="w-24 h-32 object-cover rounded border bg-muted"
                      />
                    </a>
                  ) : (
                    <div className="w-24 h-32 flex items-center justify-center rounded border bg-muted">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{doc.mimeType}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(doc.uploadedAt)}</p>
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-xs text-primary hover:underline"
                    >
                      Open document
                    </a>
                  </div>
                </div>
              );
            }) : <p className="text-muted-foreground text-sm">No documents uploaded</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
