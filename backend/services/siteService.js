import prisma from '../config/database.js';
import { AppError } from '../utils/helpers.js';
import { logActivity } from '../utils/movementLogger.js';
import { getPagination } from './dashboardService.js';

export async function listSites() {
  return prisma.site.findMany({
    where: { isActive: true },
    include: { _count: { select: { siteDoors: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function createSite(data, userId) {
  const site = await prisma.site.create({ data });
  await logActivity({ userId, action: 'CREATE', module: 'site', entityId: site.id });
  return site;
}

export async function updateSite(id, data, userId) {
  const site = await prisma.site.update({ where: { id }, data });
  await logActivity({ userId, action: 'UPDATE', module: 'site', entityId: id });
  return site;
}

export async function listSiteDoors(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.search) {
    where.OR = [
      { jobNumber: { contains: query.search, mode: 'insensitive' } },
      { serialNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.siteId) where.siteId = query.siteId;
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.siteDoor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { deliveredDate: 'desc' },
      include: {
        site: true,
        assembly: { include: { barcode: true } },
      },
    }),
    prisma.siteDoor.count({ where }),
  ]);

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function updateSiteDoorStatus({ assemblyIds, status }, userId) {
  const siteDoors = await prisma.siteDoor.findMany({
    where: { assemblyId: { in: assemblyIds }, status: { not: 'RETURNED' } },
  });

  await prisma.siteDoor.updateMany({
    where: { assemblyId: { in: assemblyIds } },
    data: { status },
  });

  await logActivity({
    userId,
    action: 'BULK_UPDATE',
    module: 'site',
    details: `Updated ${siteDoors.length} site doors to ${status}`,
  });

  return { updated: siteDoors.length };
}
