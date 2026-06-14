import prisma from '../config/database.js';
import { AppError } from '../utils/helpers.js';
import { generateBarcodeValue, generateBarcodeImage } from '../utils/barcode.js';
import { logMovement, logActivity } from '../utils/movementLogger.js';
import { getPagination, buildDateFilter } from './dashboardService.js';

export async function listAssemblies(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.search) {
    where.OR = [
      { jobNumber: { contains: query.search, mode: 'insensitive' } },
      { serialNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.jobNumber) where.jobNumber = { contains: query.jobNumber, mode: 'insensitive' };
  if (query.status) where.assemblyStatus = query.status;
  Object.assign(where, buildDateFilter(query.startDate, query.endDate, 'assemblyDate'));

  const [items, total] = await Promise.all([
    prisma.assembly.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        barcode: true,
        fipsForm: true,
        qualityCheck: true,
        currentLocation: true,
        components: { include: { readyForAssembly: true } },
      },
    }),
    prisma.assembly.count({ where }),
  ]);

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createAssembly(data, userId) {
  const components = await prisma.readyForAssembly.findMany({
    where: { id: { in: data.readyForAssemblyIds }, isAssembled: false },
  });

  if (components.length !== data.readyForAssemblyIds.length) {
    throw new AppError('Some components are invalid or already assembled', 400);
  }

  const existing = await prisma.assembly.findUnique({
    where: { jobNumber_serialNumber: { jobNumber: data.jobNumber, serialNumber: data.serialNumber } },
  });
  if (existing) throw new AppError('Assembly with this job/serial already exists', 409);

  const assembly = await prisma.$transaction(async (tx) => {
    const created = await tx.assembly.create({
      data: {
        jobNumber: data.jobNumber,
        serialNumber: data.serialNumber,
        lockType: data.lockType || 'SASH_LOCK',
        leafType: data.leafType || 'SINGLE_LEAF',
        assemblyDate: data.assemblyDate ? new Date(data.assemblyDate) : new Date(),
        assemblyStatus: 'COMPLETED',
        components: {
          create: data.readyForAssemblyIds.map((id) => ({ readyForAssemblyId: id })),
        },
        fipsForm: {
          create: { jobNumber: data.jobNumber, serialNumber: data.serialNumber },
        },
        qualityCheck: {
          create: { jobNumber: data.jobNumber, serialNumber: data.serialNumber },
        },
      },
      include: { barcode: true, fipsForm: true, qualityCheck: true, components: true },
    });

    await tx.readyForAssembly.updateMany({
      where: { id: { in: data.readyForAssemblyIds } },
      data: { isAssembled: true },
    });

    return created;
  });

  await logMovement({
    assemblyId: assembly.id,
    jobNumber: assembly.jobNumber,
    serialNumber: assembly.serialNumber,
    eventType: 'ASSEMBLY_COMPLETED',
  });

  await logActivity({
    userId,
    action: 'CREATE',
    module: 'assembly',
    entityId: assembly.id,
    details: `Assembly completed for job ${assembly.jobNumber}`,
  });

  return assembly;
}

export async function updateAssembly(id, data, userId) {
  const assembly = await prisma.assembly.findUnique({ where: { id } });
  if (!assembly) throw new AppError('Assembly not found', 404);

  const updated = await prisma.assembly.update({
    where: { id },
    data: {
      ...data,
      assemblyDate: data.assemblyDate ? new Date(data.assemblyDate) : undefined,
    },
    include: { barcode: true, fipsForm: true, qualityCheck: true },
  });

  if (data.assemblyStatus === 'COMPLETED') {
    await logMovement({
      assemblyId: id,
      jobNumber: updated.jobNumber,
      serialNumber: updated.serialNumber,
      eventType: 'ASSEMBLY_COMPLETED',
    });
  }

  await logActivity({ userId, action: 'UPDATE', module: 'assembly', entityId: id });
  return updated;
}

export async function generateBarcode(id, userId) {
  const assembly = await prisma.assembly.findUnique({
    where: { id },
    include: { barcode: true },
  });
  if (!assembly) throw new AppError('Assembly not found', 404);
  if (assembly.barcode) throw new AppError('Barcode already exists', 400);

  const barcodeValue = generateBarcodeValue(assembly.jobNumber, assembly.serialNumber);
  const barcode = await prisma.barcode.create({
    data: { assemblyId: id, barcodeValue },
  });

  await logMovement({
    assemblyId: id,
    jobNumber: assembly.jobNumber,
    serialNumber: assembly.serialNumber,
    eventType: 'BARCODE_GENERATED',
    metadata: { barcodeValue },
  });

  await logActivity({ userId, action: 'GENERATE_BARCODE', module: 'assembly', entityId: id });
  return barcode;
}

export async function getBarcodeImage(id) {
  const assembly = await prisma.assembly.findUnique({
    where: { id },
    include: { barcode: true },
  });
  if (!assembly?.barcode) throw new AppError('Barcode not found', 404);

  const png = await generateBarcodeImage(assembly.barcode.barcodeValue);
  return { png, value: assembly.barcode.barcodeValue };
}

export async function lookupByBarcode(barcodeValue) {
  const barcode = await prisma.barcode.findUnique({
    where: { barcodeValue },
    include: {
      assembly: {
        include: {
          fipsForm: true,
          qualityCheck: true,
          currentLocation: true,
          currentSite: true,
          movementHistory: { orderBy: { eventDate: 'desc' }, take: 20 },
        },
      },
    },
  });
  if (!barcode) throw new AppError('Barcode not found', 404);
  return barcode.assembly;
}

export async function getAssemblyById(id) {
  const assembly = await prisma.assembly.findUnique({
    where: { id },
    include: {
      barcode: true,
      fipsForm: { include: { documents: true } },
      qualityCheck: true,
      currentLocation: true,
      currentSite: true,
      components: { include: { readyForAssembly: true } },
      movementHistory: { orderBy: { eventDate: 'desc' } },
    },
  });
  if (!assembly) throw new AppError('Assembly not found', 404);
  return assembly;
}
