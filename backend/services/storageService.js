import prisma from '../config/database.js';
import { AppError } from '../utils/helpers.js';
import { logMovement, logActivity } from '../utils/movementLogger.js';
import { getPagination } from './dashboardService.js';

const LOCATION_EVENT_MAP = {
  BH: 'MOVED_TO_BH_STORAGE',
  CAMDEN: 'MOVED_TO_CAMDEN',
  SITE: 'MOVED_TO_SITE',
  CONTAINER: 'MOVED_TO_CONTAINER',
  STUDY: 'MOVED_TO_OTHER_STORAGE',
};

export async function listStorageLocations() {
  return prisma.storageLocation.findMany({
    where: { isActive: true },
    include: { _count: { select: { assemblies: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function createStorageLocation(data, userId) {
  const location = await prisma.storageLocation.create({ data });
  await logActivity({ userId, action: 'CREATE', module: 'storage', entityId: location.id });
  return location;
}

export async function listDoorsInStorage(locationCode, query) {
  const { page, limit, skip } = getPagination(query);
  const location = await prisma.storageLocation.findFirst({ where: { code: locationCode } });
  if (!location) throw new AppError('Storage location not found', 404);

  const where = { currentLocationId: location.id };
  if (query.search) {
    where.OR = [
      { jobNumber: { contains: query.search, mode: 'insensitive' } },
      { serialNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.assembly.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        barcode: true,
        qualityCheck: true,
        currentLocation: true,
        storageMovements: { take: 1, orderBy: { movedAt: 'desc' } },
      },
    }),
    prisma.assembly.count({ where }),
  ]);

  return {
    location,
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function moveToStorage({ assemblyIds, toLocationCode, notes }, userId) {
  const toLocation = await prisma.storageLocation.findFirst({ where: { code: toLocationCode } });
  if (!toLocation) throw new AppError('Target storage location not found', 404);

  const assemblies = await prisma.assembly.findMany({
    where: { id: { in: assemblyIds } },
    include: { qualityCheck: true },
  });

  if (assemblies.length !== assemblyIds.length) {
    throw new AppError('Some assemblies not found', 400);
  }

  const notApproved = assemblies.filter((a) => a.qualityCheck?.status !== 'CHECKED');
  if (notApproved.length > 0 && toLocationCode !== 'BH') {
    throw new AppError('Only QC approved items can be moved to storage locations', 400);
  }

  const eventType = LOCATION_EVENT_MAP[toLocationCode] || 'MOVED_TO_OTHER_STORAGE';
  const results = [];

  for (const assembly of assemblies) {
    const fromLocationId = assembly.currentLocationId;

    await prisma.$transaction([
      prisma.assembly.update({
        where: { id: assembly.id },
        data: { currentLocationId: toLocation.id, currentSiteId: null },
      }),
      prisma.storageMovement.create({
        data: {
          assemblyId: assembly.id,
          fromLocationId,
          toLocationId: toLocation.id,
          notes,
        },
      }),
    ]);

    await logMovement({
      assemblyId: assembly.id,
      jobNumber: assembly.jobNumber,
      serialNumber: assembly.serialNumber,
      eventType,
      details: notes || `Moved to ${toLocation.name}`,
      metadata: { fromLocationId, toLocationId: toLocation.id },
    });

    results.push(assembly.id);
  }

  await logActivity({
    userId,
    action: 'BULK_MOVE',
    module: 'storage',
    details: `Moved ${results.length} doors to ${toLocation.name}`,
  });

  return { moved: results.length, location: toLocation };
}

export async function bulkMoveToStorage(movements, userId) {
  const results = [];
  for (const movement of movements) {
    const result = await moveToStorage(movement, userId);
    results.push(result);
  }
  return results;
}

export async function getStorageSummary() {
  const locations = await prisma.storageLocation.findMany({
    where: { isActive: true },
    include: { _count: { select: { assemblies: true } } },
  });

  return locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    code: loc.code,
    count: loc._count.assemblies,
  }));
}

export async function getStorageMovements(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.assemblyId) where.assemblyId = query.assemblyId;

  const [items, total] = await Promise.all([
    prisma.storageMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { movedAt: 'desc' },
      include: {
        assembly: { select: { jobNumber: true, serialNumber: true } },
        fromLocation: true,
        toLocation: true,
      },
    }),
    prisma.storageMovement.count({ where }),
  ]);

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
