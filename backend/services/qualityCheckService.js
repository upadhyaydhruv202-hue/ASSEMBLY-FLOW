import prisma from '../config/database.js';
import { AppError } from '../utils/helpers.js';
import { logMovement, logActivity } from '../utils/movementLogger.js';
import { getPagination, buildDateFilter } from './dashboardService.js';

export async function listQualityChecks(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.search) {
    where.OR = [
      { jobNumber: { contains: query.search, mode: 'insensitive' } },
      { serialNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.status) where.status = query.status;
  Object.assign(where, buildDateFilter(query.startDate, query.endDate, 'qcDate'));

  const [items, total] = await Promise.all([
    prisma.qualityCheck.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        assembly: { include: { barcode: true, fipsForm: true, currentLocation: true } },
      },
    }),
    prisma.qualityCheck.count({ where }),
  ]);

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function updateQualityCheck(id, data, userId) {
  const qc = await prisma.qualityCheck.findUnique({
    where: { id },
    include: { assembly: { include: { fipsForm: true } } },
  });
  if (!qc) throw new AppError('Quality check not found', 404);

  if (data.status === 'CHECKED' && qc.assembly.fipsForm?.status !== 'APPROVED') {
    throw new AppError('FIPS must be approved before QC approval', 400);
  }

  const updated = await prisma.qualityCheck.update({
    where: { id },
    data: {
      status: data.status,
      remarks: data.remarks,
      qcDate: data.qcDate ? new Date(data.qcDate) : new Date(),
    },
    include: { assembly: { include: { barcode: true } } },
  });

  const eventType = data.status === 'CHECKED' ? 'QC_APPROVED' : data.status === 'REJECTED' ? 'QC_REJECTED' : null;
  if (eventType) {
    await logMovement({
      assemblyId: qc.assemblyId,
      jobNumber: qc.jobNumber,
      serialNumber: qc.serialNumber,
      eventType,
      details: data.remarks || undefined,
    });

    if (data.status === 'CHECKED') {
      const bhLocation = await prisma.storageLocation.findFirst({ where: { code: 'BH' } });
      if (bhLocation) {
        await prisma.assembly.update({
          where: { id: qc.assemblyId },
          data: { currentLocationId: bhLocation.id },
        });
        await prisma.storageMovement.create({
          data: {
            assemblyId: qc.assemblyId,
            toLocationId: bhLocation.id,
            notes: 'Auto-moved after QC approval',
          },
        });
        await logMovement({
          assemblyId: qc.assemblyId,
          jobNumber: qc.jobNumber,
          serialNumber: qc.serialNumber,
          eventType: 'MOVED_TO_BH_STORAGE',
        });
      }
    }
  }

  await logActivity({
    userId,
    action: 'UPDATE',
    module: 'quality_check',
    entityId: id,
    details: `QC ${data.status}`,
  });

  return updated;
}

export async function getQcLabelData(id) {
  const qc = await prisma.qualityCheck.findUnique({
    where: { id },
    include: { assembly: { include: { barcode: true } } },
  });
  if (!qc) throw new AppError('Quality check not found', 404);
  return {
    jobNumber: qc.jobNumber,
    serialNumber: qc.serialNumber,
    qcDate: qc.qcDate,
    status: qc.status,
    barcode: qc.assembly.barcode?.barcodeValue,
    lockType: qc.assembly.lockType,
    leafType: qc.assembly.leafType,
  };
}
