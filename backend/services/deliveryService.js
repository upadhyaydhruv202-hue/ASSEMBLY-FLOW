import prisma from '../config/database.js';
import { AppError } from '../utils/helpers.js';
import { logMovement, logActivity } from '../utils/movementLogger.js';
import { getPagination, buildDateFilter } from './dashboardService.js';

async function generateDeliveryNumber() {
  const count = await prisma.delivery.count();
  const date = new Date();
  const prefix = `DN-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `${prefix}-${String(count + 1).padStart(5, '0')}`;
}

export async function listDeliveries(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.search) {
    where.OR = [
      { jobNumber: { contains: query.search, mode: 'insensitive' } },
      { deliveryNumber: { contains: query.search, mode: 'insensitive' } },
      { serialNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  Object.assign(where, buildDateFilter(query.startDate, query.endDate, 'deliveryDate'));

  const [items, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      skip,
      take: limit,
      orderBy: { deliveryDate: 'desc' },
      include: {
        site: true,
        assembly: { include: { barcode: true } },
      },
    }),
    prisma.delivery.count({ where }),
  ]);

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createDeliveries(data, userId) {
  const site = await prisma.site.findUnique({ where: { id: data.siteId } });
  if (!site) throw new AppError('Site not found', 404);

  const assemblies = await prisma.assembly.findMany({
    where: { id: { in: data.assemblyIds } },
    include: { qualityCheck: true },
  });

  if (assemblies.length !== data.assemblyIds.length) {
    throw new AppError('Some assemblies not found', 400);
  }

  const notApproved = assemblies.filter((a) => a.qualityCheck?.status !== 'CHECKED');
  if (notApproved.length > 0) {
    throw new AppError('Only QC approved items can be delivered', 400);
  }

  const siteLocation = await prisma.storageLocation.findFirst({ where: { code: 'SITE' } });
  const deliveries = [];

  for (const assembly of assemblies) {
    const deliveryNumber = await generateDeliveryNumber();

    const delivery = await prisma.$transaction(async (tx) => {
      const created = await tx.delivery.create({
        data: {
          deliveryNumber,
          assemblyId: assembly.id,
          jobNumber: assembly.jobNumber,
          serialNumber: assembly.serialNumber,
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : new Date(),
          siteId: data.siteId,
          driver: data.driver,
          vehicleNumber: data.vehicleNumber,
          type: data.type || 'DELIVERY',
          notes: data.notes,
        },
        include: { site: true, assembly: { include: { barcode: true } } },
      });

      await tx.siteDoor.create({
        data: {
          assemblyId: assembly.id,
          jobNumber: assembly.jobNumber,
          serialNumber: assembly.serialNumber,
          siteId: data.siteId,
          deliveredDate: created.deliveryDate,
          status: 'AT_SITE',
        },
      });

      if (siteLocation) {
        await tx.assembly.update({
          where: { id: assembly.id },
          data: { currentLocationId: siteLocation.id, currentSiteId: data.siteId },
        });
        await tx.storageMovement.create({
          data: {
            assemblyId: assembly.id,
            fromLocationId: assembly.currentLocationId,
            toLocationId: siteLocation.id,
            notes: `Delivery to ${site.name}`,
          },
        });
      }

      return created;
    });

    const eventType = data.type === 'CUSTOMER_COLLECTION' ? 'COLLECTED' : 'DELIVERED';
    await logMovement({
      assemblyId: assembly.id,
      jobNumber: assembly.jobNumber,
      serialNumber: assembly.serialNumber,
      eventType,
      details: `${eventType === 'DELIVERED' ? 'Delivered' : 'Collected'} to ${site.name}`,
      metadata: { deliveryNumber, siteId: site.id },
    });

    deliveries.push(delivery);
  }

  await logActivity({
    userId,
    action: 'CREATE',
    module: 'delivery',
    details: `Created ${deliveries.length} deliveries to ${site.name}`,
  });

  return deliveries;
}

export async function getDeliveryById(id) {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: {
      site: true,
      assembly: { include: { barcode: true, qualityCheck: true } },
    },
  });
  if (!delivery) throw new AppError('Delivery not found', 404);
  return delivery;
}

export async function getDeliveryNoteData(id) {
  const delivery = await getDeliveryById(id);
  return {
    deliveryNumber: delivery.deliveryNumber,
    deliveryDate: delivery.deliveryDate,
    site: delivery.site,
    driver: delivery.driver,
    vehicleNumber: delivery.vehicleNumber,
    type: delivery.type,
    notes: delivery.notes,
    items: [{
      jobNumber: delivery.jobNumber,
      serialNumber: delivery.serialNumber,
      barcode: delivery.assembly.barcode?.barcodeValue,
    }],
  };
}
