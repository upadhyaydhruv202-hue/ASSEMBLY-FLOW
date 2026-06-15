import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { movementApi } from '@/services/modules';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, TableHeader, TableHead, TableBody, TableRow, TableCell, EmptyState, Pagination } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { MovementHistory } from '@/types';

export default function MovementHistoryPage() {
  const [jobNumber, setJobNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [page, setPage] = useState(1);
  const [timelineJob, setTimelineJob] = useState('');
  const [timelineSerial, setTimelineSerial] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['movements', jobNumber, serialNumber, page],
    queryFn: () => movementApi.list({
      jobNumber, serialNumber, page: String(page),
    }).then((r) => r.data),
  });

  const { data: timelineData } = useQuery({
    queryKey: ['timeline', timelineJob, timelineSerial],
    queryFn: () => movementApi.timeline(timelineJob, timelineSerial).then((r) => r.data.data),
    enabled: !!timelineJob && !!timelineSerial,
  });

  const items = (data?.data as MovementHistory[]) || [];
  const pagination = data?.pagination;

  const handleTimelineSearch = () => {
    if (jobNumber && serialNumber) {
      setTimelineJob(jobNumber);
      setTimelineSerial(serialNumber);
    }
  };

  return (
    <div>
      <PageHeader title="Movement History" description="Complete door lifecycle tracking" />

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="w-full sm:w-auto"><Label>Job Number</Label><Input className="w-full" value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} placeholder="44.00044" /></div>
            <div className="w-full sm:w-auto"><Label>Serial Number</Label><Input className="w-full" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="1" /></div>
            <div className="w-full sm:w-auto sm:flex sm:items-end">
              <Button className="w-full sm:w-auto" onClick={() => { setPage(1); handleTimelineSearch(); }}><Search className="h-4 w-4 mr-1" /> Search</Button>
            </div>
          </div>

          {isLoading ? <TableSkeleton /> : (
            <DataTable>
              <TableHeader>
                <TableHead>Job Number</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Details</TableHead>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState message="No movement records found" /></td></tr>
                ) : items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.jobNumber}</TableCell>
                    <TableCell>{item.serialNumber}</TableCell>
                    <TableCell>{item.eventLabel || item.eventType.replace(/_/g, ' ')}</TableCell>
                    <TableCell>{formatDateTime(item.eventDate)}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{item.details || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          )}

          {pagination && <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="w-full sm:w-auto"><Label>Job Number</Label><Input className="w-full" value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} /></div>
            <div className="w-full sm:w-auto"><Label>Serial Number</Label><Input className="w-full" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} /></div>
            <div className="w-full sm:w-auto sm:flex sm:items-end">
              <Button className="w-full sm:w-auto" onClick={handleTimelineSearch}><Search className="h-4 w-4 mr-1" /> View Timeline</Button>
            </div>
          </div>

          {timelineData ? (
            <Card>
              <CardHeader>
                <CardTitle>Job: {timelineData.jobNumber} | Serial: {timelineData.serialNumber}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative border-l-2 border-primary/30 ml-4 space-y-6">
                  {timelineData.timeline?.map((event: { id: string; date: string; event: string; details?: string; metadata?: Record<string, unknown> }) => (
                    <div key={event.id} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary" />
                      <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
                      <p className="font-medium">{event.event}</p>
                      {event.details && <p className="text-sm text-muted-foreground">{event.details}</p>}
                      {event.metadata?.returnReason != null && (
                        <p className="text-sm">Reason: {String(event.metadata.returnReason)}</p>
                      )}
                    </div>
                  ))}
                  {!timelineData.timeline?.length && (
                    <p className="text-muted-foreground pl-6">No timeline events found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState message="Enter job number and serial number to view timeline" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
