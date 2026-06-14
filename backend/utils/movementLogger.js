import prisma from '../config/database.js';

const EVENT_LABELS = {
  READY_FOR_ASSEMBLY: 'Ready For Assembly',
  ASSEMBLY_COMPLETED: 'Assembly Completed',
  BARCODE_GENERATED: 'Barcode Generated',
  FIPS_SUBMITTED: 'FIPS Submitted',
  FIPS_APPROVED: 'FIPS Approved',
  QC_APPROVED: 'QC Approved',
  QC_REJECTED: 'QC Rejected',
  MOVED_TO_BH_STORAGE: 'Moved To BH Storage',
  MOVED_TO_CAMDEN: 'Moved To Camden Storage',
  MOVED_TO_SITE: 'Moved To Site',
  MOVED_TO_CONTAINER: 'Moved To Container Storage',
  MOVED_TO_OTHER_STORAGE: 'Moved To Other Storage',
  DELIVERED: 'Delivered',
  COLLECTED: 'Customer Collection',
  RETURNED_TO_BH: 'Returned To BH Storage',
  RETURNED_FROM_SITE: 'Returned From Site',
  STATUS_CHANGED: 'Status Changed',
};

export async function logMovement({
  assemblyId,
  jobNumber,
  serialNumber,
  eventType,
  details,
  metadata,
  eventDate,
}) {
  return prisma.movementHistory.create({
    data: {
      assemblyId: assemblyId || null,
      jobNumber,
      serialNumber,
      eventType,
      details: details || EVENT_LABELS[eventType] || eventType,
      metadata: metadata || null,
      eventDate: eventDate || new Date(),
    },
  });
}

export async function logActivity({ userId, action, module, entityId, details }) {
  return prisma.activityLog.create({
    data: { userId, action, module, entityId, details },
  });
}

export { EVENT_LABELS };
