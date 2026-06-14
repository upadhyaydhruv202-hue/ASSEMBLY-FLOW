import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, fmt = 'dd-MMM-yyyy') {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDateTime(date: string | Date | null | undefined) {
  return formatDate(date, 'dd-MMM-yyyy HH:mm');
}

export const LOCK_TYPES = {
  SASH_LOCK: 'Sash Lock',
  MORTICE_LOCK: 'Mortice Lock',
  DEAD_LOCK: 'Dead Lock',
  OTHER: 'Other',
} as const;

export const LEAF_TYPES = {
  SINGLE_LEAF: 'Single Leaf',
  DOUBLE_LEAF: 'Double Leaf',
} as const;

export const COMPONENT_TYPES = {
  DOOR_LEAF: 'Door Leaf',
  DOOR_FRAME: 'Door Frame',
} as const;

export const FIPS_STATUS = {
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
} as const;

export const QC_STATUS = {
  PENDING: 'Pending',
  CHECKED: 'Checked',
  REJECTED: 'Rejected',
} as const;

export const ASSEMBLY_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
} as const;

export const SITE_DOOR_STATUS = {
  AT_SITE: 'At Site',
  INSTALLED: 'Installed',
  RETURNED: 'Returned',
} as const;

export const DELIVERY_TYPES = {
  DELIVERY: 'Delivery',
  CUSTOMER_COLLECTION: 'Customer Collection',
} as const;

export function getUploadUrl(filePath: string, url?: string | null) {
  if (url) return url;
  const normalized = filePath.replace(/\\/g, '/');
  const uploadsIndex = normalized.indexOf('/uploads/');
  if (uploadsIndex >= 0) return normalized.slice(uploadsIndex);
  const relativeIndex = normalized.indexOf('uploads/');
  if (relativeIndex >= 0) return `/${normalized.slice(relativeIndex)}`;
  return `/uploads/${normalized.split('/').pop()}`;
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    CHECKED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    AT_SITE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    INSTALLED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    RETURNED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
}
