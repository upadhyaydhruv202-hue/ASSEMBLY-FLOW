import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
  }),
});

export const readyForAssemblySchema = z.object({
  body: z.object({
    jobNumber: z.string().min(1),
    serialNumber: z.string().min(1),
    sl: z.string().optional(),
    sl1: z.string().optional(),
    cellLight: z.string().optional(),
    componentType: z.enum(['DOOR_LEAF', 'DOOR_FRAME']),
    readyDate: z.string().datetime().optional(),
  }),
});

export const bulkReadySchema = z.object({
  body: z.object({
    items: z.array(readyForAssemblySchema.shape.body).min(1),
  }),
});

export const assemblyCreateSchema = z.object({
  body: z.object({
    readyForAssemblyIds: z.array(z.string().uuid()).min(1),
    jobNumber: z.string().min(1),
    serialNumber: z.string().min(1),
    lockType: z.enum(['SASH_LOCK', 'MORTICE_LOCK', 'DEAD_LOCK', 'OTHER']).optional(),
    leafType: z.enum(['SINGLE_LEAF', 'DOUBLE_LEAF']).optional(),
    assemblyDate: z.string().datetime().optional(),
  }),
});

export const assemblyUpdateSchema = z.object({
  body: z.object({
    lockType: z.enum(['SASH_LOCK', 'MORTICE_LOCK', 'DEAD_LOCK', 'OTHER']).optional(),
    leafType: z.enum(['SINGLE_LEAF', 'DOUBLE_LEAF']).optional(),
    assemblyStatus: z.enum(['PENDING', 'COMPLETED']).optional(),
    assemblyDate: z.string().datetime().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
});

export const fipsUpdateSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'SUBMITTED', 'APPROVED']).optional(),
    submittedDate: z.string().datetime().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
});

export const qcUpdateSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'CHECKED', 'REJECTED']),
    remarks: z.string().optional(),
    qcDate: z.string().datetime().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
});

export const storageMoveSchema = z.object({
  body: z.object({
    assemblyIds: z.array(z.string().uuid()).min(1),
    toLocationCode: z.string().min(1),
    notes: z.string().optional(),
  }),
});

export const bulkStorageMoveSchema = z.object({
  body: z.object({
    movements: z.array(z.object({
      assemblyIds: z.array(z.string().uuid()).min(1),
      toLocationCode: z.string().min(1),
      notes: z.string().optional(),
    })).min(1),
  }),
});

export const deliverySchema = z.object({
  body: z.object({
    assemblyIds: z.array(z.string().uuid()).min(1),
    siteId: z.string().uuid().optional(),
    siteName: z.string().min(1).max(200).optional(),
    deliveryDate: z.string().datetime().optional(),
    driver: z.string().optional(),
    vehicleNumber: z.string().optional(),
    type: z.enum(['DELIVERY', 'CUSTOMER_COLLECTION']).optional(),
    notes: z.string().optional(),
  }).refine((data) => data.siteId || data.siteName?.trim(), {
    message: 'Delivery location is required',
  }),
});

export const returnSchema = z.object({
  body: z.object({
    assemblyIds: z.array(z.string().uuid()).min(1),
    returnedFrom: z.string().min(1),
    returnReasonCode: z.string().min(1),
    notes: z.string().optional(),
    returnDate: z.string().datetime().optional(),
  }),
});

export const siteDoorStatusSchema = z.object({
  body: z.object({
    assemblyIds: z.array(z.string().uuid()).min(1),
    status: z.enum(['AT_SITE', 'INSTALLED', 'RETURNED']),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    jobNumber: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const movementSearchSchema = z.object({
  query: z.object({
    jobNumber: z.string().optional(),
    serialNumber: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const siteSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    address: z.string().optional(),
  }),
});

export const storageLocationSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    description: z.string().optional(),
  }),
});
