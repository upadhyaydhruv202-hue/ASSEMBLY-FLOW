import prisma from '../config/database.js';
import { AppError } from '../utils/helpers.js';
import { logMovement, logActivity } from '../utils/movementLogger.js';
import { getPagination, buildDateFilter } from './dashboardService.js';

export async function listReturnReasons() {
  return prisma.returnReason.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
}

export async function listReturns(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.search) {
    where.OR = [
      { jobNumber: { contains: query.search, mode: 'insensitive' } },
      { serialNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  Object.assign(where, buildDateFilter(query.startDate, query.endDate, 'returnDate'));

  const [items, total] = await Promise.all([
    prisma.return.findMany({
      where,
      skip,
      take: limit,
      orderBy: { returnDate: 'desc' },
      include: {
        returnReason: true,
        assembly: { include: { barcode: true, currentLocation: true } },
      },
    }),
    prisma.return.count({ where }),
  ]);

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function processReturns(data, userId) {
  const reason = await prisma.returnReason.findFirst({ where: { code: data.returnReasonCode } });
  if (!reason) throw new AppError('Return reason not found', 404);

  const bhLocation = await prisma.storageLocation.findFirst({ where: { code: 'BH' } });
  if (!bhLocation) throw new AppError('BH Storage location not configured', 500);

  const assemblies = await prisma.assembly.findMany({
    where: { id: { in: data.assemblyIds } },
  });

  if (assemblies.length !== data.assemblyIds.length) {
    throw new AppError('Some assemblies not found', 400);
  }

  const returns = [];

  for (const assembly of assemblies) {
    const returnRecord = await prisma.$transaction(async (tx) => {
      const created = await tx.return.create({
        data: {
          assemblyId: assembly.id,
          jobNumber: assembly.jobNumber,
          serialNumber: assembly.serialNumber,
          returnedFrom: data.returnedFrom,
          returnDate: data.returnDate ? new Date(data.returnDate) : new Date(),
          returnReasonId: reason.id,
          notes: data.notes,
        },
        include: { returnReason: true },
      });

      await tx.assembly.update({
        where: { id: assembly.id },
        data: { currentLocationId: bhLocation.id, currentSiteId: null },
      });

      await tx.storageMovement.create({
        data: {
          assemblyId: assembly.id,
          fromLocationId: assembly.currentLocationId,
          toLocationId: bhLocation.id,
          notes: `Return: ${reason.name}`,
        },
      });

      await tx.siteDoor.updateMany({
        where: { assemblyId: assembly.id },
        data: { status: 'RETURNED' },
      });

      return created;
    });

    await logMovement({
      assemblyId: assembly.id,
      jobNumber: assembly.jobNumber,
      serialNumber: assembly.serialNumber,
      eventType: 'RETURNED_TO_BH',
      details: `Returned from ${data.returnedFrom}. Reason: ${reason.name}`,
      metadata: { returnReason: reason.name, returnedFrom: data.returnedFrom },
    });

    returns.push(returnRecord);
  }

  await logActivity({
    userId,
    action: 'BULK_RETURN',
    module: 'returns',
    details: `Processed ${returns.length} returns to BH Storage`,
  });

  return returns;
}

export async function bulkReturnFromSite(assemblyIds, returnReasonCode, notes, userId) {
  return processReturns(
    {
      assemblyIds,
      returnedFrom: 'Site',
      returnReasonCode,
      notes,
    },
    userId,
  );
}
