import prisma from '../config/database.js';
import { AppError } from '../utils/helpers.js';
import { logMovement, logActivity } from '../utils/movementLogger.js';
import { getPagination, buildDateFilter } from './dashboardService.js';
import { attachDocumentUrls } from '../utils/uploadUrl.js';

export async function listFipsForms(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.search) {
    where.OR = [
      { jobNumber: { contains: query.search, mode: 'insensitive' } },
      { serialNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.status) where.status = query.status;
  Object.assign(where, buildDateFilter(query.startDate, query.endDate, 'submittedDate'));

  const [items, total] = await Promise.all([
    prisma.fipsForm.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        assembly: { include: { barcode: true } },
        documents: true,
      },
    }),
    prisma.fipsForm.count({ where }),
  ]);

  const enrichedItems = items.map((item) => ({
    ...item,
    documents: attachDocumentUrls(item.documents),
  }));

  return { items: enrichedItems, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function updateFipsForm(id, data, userId) {
  const fips = await prisma.fipsForm.findUnique({
    where: { id },
    include: { assembly: true },
  });
  if (!fips) throw new AppError('FIPS form not found', 404);

  const updated = await prisma.fipsForm.update({
    where: { id },
    data: {
      status: data.status,
      submittedDate: data.submittedDate
        ? new Date(data.submittedDate)
        : data.status === 'SUBMITTED'
          ? new Date()
          : undefined,
    },
    include: { documents: true, assembly: true },
  });

  if (data.status === 'SUBMITTED') {
    await logMovement({
      assemblyId: fips.assemblyId,
      jobNumber: fips.jobNumber,
      serialNumber: fips.serialNumber,
      eventType: 'FIPS_SUBMITTED',
    });
  } else if (data.status === 'APPROVED') {
    await logMovement({
      assemblyId: fips.assemblyId,
      jobNumber: fips.jobNumber,
      serialNumber: fips.serialNumber,
      eventType: 'FIPS_APPROVED',
    });
  }

  await logActivity({ userId, action: 'UPDATE', module: 'fips', entityId: id, details: `Status: ${data.status}` });

  return {
    ...updated,
    documents: attachDocumentUrls(updated.documents),
  };
}

export async function uploadFipsDocument(fipsId, file, userId) {
  const fips = await prisma.fipsForm.findUnique({ where: { id: fipsId } });
  if (!fips) throw new AppError('FIPS form not found', 404);

  const doc = await prisma.uploadedDocument.create({
    data: {
      entityType: 'fips_form',
      entityId: fipsId,
      fipsFormId: fipsId,
      fileName: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedById: userId,
    },
  });

  await logActivity({ userId, action: 'UPLOAD', module: 'fips', entityId: fipsId, details: file.originalname });
  return attachDocumentUrls([doc])[0];
}

export async function getFipsDocuments(fipsId) {
  const docs = await prisma.uploadedDocument.findMany({
    where: { fipsFormId: fipsId },
    orderBy: { uploadedAt: 'desc' },
  });
  return attachDocumentUrls(docs);
}

export async function deleteFipsDocument(docId, userId) {
  const doc = await prisma.uploadedDocument.findUnique({ where: { id: docId } });
  if (!doc) throw new AppError('Document not found', 404);

  await prisma.uploadedDocument.delete({ where: { id: docId } });
  await logActivity({ userId, action: 'DELETE', module: 'fips', entityId: docId });
  return { deleted: true };
}
