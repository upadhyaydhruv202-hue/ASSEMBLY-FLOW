import prisma from '../config/database.js';
import { AppError } from '../utils/helpers.js';
import { logMovement, logActivity } from '../utils/movementLogger.js';
import { getPagination, buildDateFilter } from './dashboardService.js';

export async function listReadyForAssembly(query) {
  const { page, limit, skip } = getPagination(query);
  const where = { isAssembled: false };

  if (query.search) {
    where.OR = [
      { jobNumber: { contains: query.search, mode: 'insensitive' } },
      { serialNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.jobNumber) where.jobNumber = { contains: query.jobNumber, mode: 'insensitive' };
  if (query.componentType) where.componentType = query.componentType;
  Object.assign(where, buildDateFilter(query.startDate, query.endDate, 'readyDate'));

  const [items, total] = await Promise.all([
    prisma.readyForAssembly.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ readyDate: 'desc' }, { autoNumber: 'desc' }],
    }),
    prisma.readyForAssembly.count({ where }),
  ]);

  const grouped = groupByDate(items);
  return { items, grouped, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

function groupByDate(items) {
  const groups = {};
  items.forEach((item) => {
    const dateKey = item.readyDate.toISOString().split('T')[0];
    if (!groups[dateKey]) {
      groups[dateKey] = { date: dateKey, doors: 0, frames: 0, items: [] };
    }
    groups[dateKey].items.push(item);
    if (item.componentType === 'DOOR_LEAF') groups[dateKey].doors++;
    else groups[dateKey].frames++;
  });
  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
}

export async function createReadyForAssembly(data, userId) {
  const item = await prisma.readyForAssembly.create({
    data: {
      ...data,
      readyDate: data.readyDate ? new Date(data.readyDate) : new Date(),
    },
  });

  await logMovement({
    jobNumber: item.jobNumber,
    serialNumber: item.serialNumber,
    eventType: 'READY_FOR_ASSEMBLY',
    details: `Ready for assembly - ${item.componentType === 'DOOR_LEAF' ? 'Door Leaf' : 'Door Frame'}`,
    metadata: { componentType: item.componentType, readyForAssemblyId: item.id },
  });

  await logActivity({
    userId,
    action: 'CREATE',
    module: 'ready_for_assembly',
    entityId: item.id,
    details: `Added ${item.componentType} for job ${item.jobNumber}`,
  });

  return item;
}

export async function bulkCreateReadyForAssembly(items, userId) {
  const created = [];
  for (const item of items) {
    created.push(await createReadyForAssembly(item, userId));
  }
  return created;
}

export async function deleteReadyForAssembly(id, userId) {
  const item = await prisma.readyForAssembly.findUnique({ where: { id } });
  if (!item) throw new AppError('Record not found', 404);
  if (item.isAssembled) throw new AppError('Cannot delete assembled component', 400);

  await prisma.readyForAssembly.delete({ where: { id } });
  await logActivity({
    userId,
    action: 'DELETE',
    module: 'ready_for_assembly',
    entityId: id,
    details: `Deleted ready for assembly record`,
  });
  return { deleted: true };
}

export async function bulkDeleteReadyForAssembly(ids, userId) {
  const items = await prisma.readyForAssembly.findMany({
    where: { id: { in: ids }, isAssembled: false },
  });
  await prisma.readyForAssembly.deleteMany({
    where: { id: { in: items.map((i) => i.id) } },
  });
  await logActivity({
    userId,
    action: 'BULK_DELETE',
    module: 'ready_for_assembly',
    details: `Deleted ${items.length} records`,
  });
  return { deleted: items.length };
}
