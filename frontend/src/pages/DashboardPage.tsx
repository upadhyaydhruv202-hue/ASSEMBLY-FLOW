import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package, Wrench, Warehouse, MapPin, Container, RotateCcw,
  CheckCircle, FileText, ArrowRight, TrendingUp,
} from 'lucide-react';
import { dashboardApi } from '@/services/modules';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiSkeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const kpiConfig = [
  { key: 'readyForAssembly', label: 'Ready For Assembly', icon: Package, color: 'text-blue-500' },
  { key: 'assemblyCompleted', label: 'Assembly Completed', icon: Wrench, color: 'text-green-500' },
  { key: 'bhStorage', label: 'BH Storage', icon: Warehouse, color: 'text-purple-500' },
  { key: 'camdenStorage', label: 'Camden Storage', icon: Warehouse, color: 'text-indigo-500' },
  { key: 'siteStorage', label: 'Site Storage', icon: MapPin, color: 'text-orange-500' },
  { key: 'containerStorage', label: 'Container Storage', icon: Container, color: 'text-cyan-500' },
  { key: 'returnedDoors', label: 'Returned Doors', icon: RotateCcw, color: 'text-red-500' },
  { key: 'pendingQc', label: 'Pending QC', icon: CheckCircle, color: 'text-yellow-500' },
  { key: 'pendingFips', label: 'Pending FIPS', icon: FileText, color: 'text-pink-500' },
] as const;

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getStats().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  if (isLoading) return (
    <div>
      <PageHeader title="Dashboard" description="Real-time manufacturing overview" />
      <KpiSkeleton />
    </div>
  );

  const kpis = data?.kpis;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Real-time manufacturing overview"
        actions={
          <>
            <Button asChild variant="outline"><Link to="/ready-for-assembly">Ready For Assembly</Link></Button>
            <Button asChild><Link to="/assembly">New Assembly</Link></Button>
          </>
        }
      />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6">
        {kpiConfig.map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{kpis?.[key] ?? 0}</p>
                </div>
                <Icon className={`h-8 w-8 ${color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Daily Assembly Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data?.charts.dailyAssembly || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Monthly Assembly Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.charts.monthlyAssembly || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Storage Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.storageDistribution || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {(data?.storageDistribution || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Return Reasons Analysis</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.charts.returnReasons || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="reason" type="category" width={100} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(data?.recentActivity || []).map((log) => (
                <div key={log.id} className="flex justify-between items-start text-sm border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{log.action} - {log.module}</p>
                    <p className="text-muted-foreground text-xs">{log.details}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.createdAt)}</span>
                </div>
              ))}
              {!data?.recentActivity?.length && <p className="text-muted-foreground text-sm">No recent activity</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {[
              { to: '/ready-for-assembly', label: 'Add Ready For Assembly' },
              { to: '/assembly', label: 'Complete Assembly' },
              { to: '/storage', label: 'Move Storage' },
              { to: '/deliveries', label: 'Create Delivery' },
              { to: '/movements', label: 'View Movement History' },
            ].map((action) => (
              <Button key={action.to} asChild variant="outline" className="justify-between">
                <Link to={action.to}>
                  {action.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
