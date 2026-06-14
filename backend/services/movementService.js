import prisma from '../config/database.js';
import { getPagination, buildDateFilter } from './dashboardService.js';
import { EVENT_LABELS } from '../utils/movementLogger.js';

export async function listMovementHistory(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.jobNumber) where.jobNumber = { contains: query.jobNumber, mode: 'insensitive' };
  if (query.serialNumber) where.serialNumber = { contains: query.serialNumber, mode: 'insensitive' };
  Object.assign(where, buildDateFilter(query.startDate, query.endDate, 'eventDate'));

  const [items, total] = await Promise.all([
    prisma.movementHistory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { eventDate: 'desc' },
      include: { assembly: { select: { lockType: true, leafType: true } } },
    }),
    prisma.movementHistory.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      eventLabel: EVENT_LABELS[item.eventType] || item.eventType,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getDoorTimeline(jobNumber, serialNumber) {
  const history = await prisma.movementHistory.findMany({
    where: { jobNumber, serialNumber },
    orderBy: { eventDate: 'asc' },
  });

  const assembly = await prisma.assembly.findUnique({
    where: { jobNumber_serialNumber: { jobNumber, serialNumber } },
    include: {
      barcode: true,
      fipsForm: true,
      qualityCheck: true,
      currentLocation: true,
      currentSite: true,
      returns: { include: { returnReason: true }, orderBy: { returnDate: 'desc' } },
    },
  });

  return {
    jobNumber,
    serialNumber,
    assembly,
    timeline: history.map((h) => ({
      id: h.id,
      date: h.eventDate,
      event: EVENT_LABELS[h.eventType] || h.eventType,
      eventType: h.eventType,
      details: h.details,
      metadata: h.metadata,
    })),
  };
}

export async function searchDoors(query) {
  const where = {};
  if (query.search) {
    where.OR = [
      { jobNumber: { contains: query.search, mode: 'insensitive' } },
      { serialNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  return prisma.assembly.findMany({
    where,
    take: 20,
    include: {
      barcode: true,
      currentLocation: true,
      currentSite: true,
      qualityCheck: true,
    },
  });
}
