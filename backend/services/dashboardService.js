import prisma from '../config/database.js';

function getPagination(query) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export { getPagination };

export function buildDateFilter(startDate, endDate, field = 'createdAt') {
  if (!startDate && !endDate) return {};
  const filter = {};
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) filter[field].gte = new Date(startDate);
    if (endDate) filter[field].lte = new Date(endDate);
  }
  return filter;
}

export async function getDashboardStats() {
  const [
    readyForAssembly,
    assemblyCompleted,
    bhStorage,
    camdenStorage,
    siteStorage,
    containerStorage,
    returnedDoors,
    pendingQc,
    pendingFips,
    storageLocations,
    recentActivity,
    dailyAssembly,
    monthlyAssembly,
    returnReasons,
  ] = await Promise.all([
    prisma.readyForAssembly.count({ where: { isAssembled: false } }),
    prisma.assembly.count({ where: { assemblyStatus: 'COMPLETED' } }),
    getStorageCount('BH'),
    getStorageCount('CAMDEN'),
    getStorageCount('SITE'),
    getStorageCount('CONTAINER'),
    prisma.return.count(),
    prisma.qualityCheck.count({ where: { status: 'PENDING' } }),
    prisma.fipsForm.count({ where: { status: 'PENDING' } }),
    prisma.storageLocation.findMany({
      where: { isActive: true },
      include: { _count: { select: { assemblies: true } } },
    }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
    getDailyAssemblyTrend(30),
    getMonthlyAssemblyTrend(12),
    getReturnReasonsAnalysis(),
  ]);

  return {
    kpis: {
      readyForAssembly,
      assemblyCompleted,
      bhStorage,
      camdenStorage,
      siteStorage,
      containerStorage,
      returnedDoors,
      pendingQc,
      pendingFips,
    },
    storageDistribution: storageLocations.map((loc) => ({
      name: loc.name,
      code: loc.code,
      count: loc._count.assemblies,
    })),
    recentActivity,
    charts: {
      dailyAssembly,
      monthlyAssembly,
      returnReasons,
    },
  };
}

async function getStorageCount(code) {
  const location = await prisma.storageLocation.findFirst({ where: { code } });
  if (!location) return 0;
  return prisma.assembly.count({ where: { currentLocationId: location.id } });
}

async function getDailyAssemblyTrend(days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const assemblies = await prisma.assembly.findMany({
    where: {
      assemblyStatus: 'COMPLETED',
      assemblyDate: { gte: startDate },
    },
    select: { assemblyDate: true },
  });

  const grouped = {};
  assemblies.forEach((a) => {
    if (!a.assemblyDate) return;
    const key = a.assemblyDate.toISOString().split('T')[0];
    grouped[key] = (grouped[key] || 0) + 1;
  });

  return Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getMonthlyAssemblyTrend(months) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const assemblies = await prisma.assembly.findMany({
    where: {
      assemblyStatus: 'COMPLETED',
      assemblyDate: { gte: startDate },
    },
    select: { assemblyDate: true },
  });

  const grouped = {};
  assemblies.forEach((a) => {
    if (!a.assemblyDate) return;
    const key = `${a.assemblyDate.getFullYear()}-${String(a.assemblyDate.getMonth() + 1).padStart(2, '0')}`;
    grouped[key] = (grouped[key] || 0) + 1;
  });

  return Object.entries(grouped)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

async function getReturnReasonsAnalysis() {
  const returns = await prisma.return.groupBy({
    by: ['returnReasonId'],
    _count: { id: true },
  });

  const reasons = await prisma.returnReason.findMany();
  const reasonMap = Object.fromEntries(reasons.map((r) => [r.id, r.name]));

  return returns.map((r) => ({
    reason: reasonMap[r.returnReasonId] || 'Unknown',
    count: r._count.id,
  }));
}
