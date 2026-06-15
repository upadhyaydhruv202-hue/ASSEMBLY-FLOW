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
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const CHART_MARGIN = { top: 12, right: 20, left: 4, bottom: 8 };

function getCountYAxisProps(items: { count: number }[]) {
  const max = items.reduce((highest, item) => Math.max(highest, item.count), 0);
  return {
    allowDecimals: false,
    width: 36,
    tickMargin: 8,
    tick: { fontSize: 11 },
    domain: [0, Math.max(max + 1, 1)] as [number, number],
  };
}

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
  const storageData = data?.storageDistribution || [];
  const storagePieData = storageData.filter((item) => item.count > 0);
  const returnReasonData = data?.charts.returnReasons || [];
  const returnReasonBarData = returnReasonData.filter((item) => item.count > 0);
  const dailyAssemblyData = data?.charts.dailyAssembly || [];
  const monthlyAssemblyData = data?.charts.monthlyAssembly || [];

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

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {kpiConfig.map(({ key, label, icon: Icon, color }) => (
          <Card key={key} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{kpis?.[key] ?? 0}</p>
                </div>
                <div className={`rounded-lg bg-muted/60 p-2 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Daily Assembly Trend</CardTitle></CardHeader>
          <CardContent>
            {dailyAssemblyData.length === 0 ? (
              <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No assembly data available
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={dailyAssemblyData} margin={CHART_MARGIN}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickMargin={8}
                      padding={{ left: 24, right: 24 }}
                    />
                    <YAxis {...getCountYAxisProps(dailyAssemblyData)} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
                  {dailyAssemblyData.map((item) => (
                    <li key={item.date} className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-blue-500" />
                      <span>{item.date}: {item.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Monthly Assembly Trend</CardTitle></CardHeader>
          <CardContent>
            {monthlyAssemblyData.length === 0 ? (
              <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No assembly data available
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyAssemblyData} margin={CHART_MARGIN} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickMargin={8} />
                    <YAxis {...getCountYAxisProps(monthlyAssemblyData)} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" barSize={40} maxBarSize={48} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
                  {monthlyAssemblyData.map((item) => (
                    <li key={item.month} className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-violet-500" />
                      <span>{item.month}: {item.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Storage Distribution</CardTitle></CardHeader>
          <CardContent>
            {storagePieData.length === 0 ? (
              <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No items in storage
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={storagePieData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={70}
                    label={false}
                  >
                    {storagePieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    content={() => (
                      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
                        {storageData.map((item, i) => (
                          <li key={item.code} className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span className={item.count === 0 ? 'text-muted-foreground' : ''}>
                              {item.name}: {item.count}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Return Reasons Analysis</CardTitle></CardHeader>
          <CardContent>
            {returnReasonBarData.length === 0 ? (
              <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No returns recorded
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={Math.max(120, returnReasonBarData.length * 40 + 32)}>
                  <BarChart
                    data={returnReasonBarData}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="reason" type="category" width={120} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" barSize={24} maxBarSize={28} radius={[0, 4, 4, 0]}>
                      {returnReasonBarData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
                  {returnReasonData.map((item, i) => (
                    <li key={item.reason} className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className={item.count === 0 ? 'text-muted-foreground' : ''}>
                        {item.reason}: {item.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(data?.recentActivity || []).map((log) => (
                <div key={log.id} className="flex flex-col gap-1 border-b pb-2 text-sm last:border-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{log.action} - {log.module}</p>
                    <p className="text-xs text-muted-foreground">{log.details}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground sm:whitespace-nowrap">{formatDateTime(log.createdAt)}</span>
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
