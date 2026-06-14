export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface ReadyForAssembly {
  id: string;
  autoNumber: number;
  jobNumber: string;
  serialNumber: string;
  sl?: string;
  sl1?: string;
  cellLight?: string;
  componentType: 'DOOR_LEAF' | 'DOOR_FRAME';
  readyDate: string;
  isAssembled: boolean;
}

export interface Assembly {
  id: string;
  jobNumber: string;
  serialNumber: string;
  lockType: string;
  leafType: string;
  assemblyDate?: string;
  assemblyStatus: string;
  currentLocationId?: string;
  currentSiteId?: string;
  barcode?: Barcode;
  fipsForm?: FipsForm;
  qualityCheck?: QualityCheck;
  currentLocation?: StorageLocation;
  currentSite?: Site;
  components?: { readyForAssembly: ReadyForAssembly }[];
  updatedAt?: string;
}

export interface Barcode {
  id: string;
  barcodeValue: string;
  generatedAt: string;
}

export interface FipsForm {
  id: string;
  jobNumber: string;
  serialNumber: string;
  status: string;
  submittedDate?: string;
  documents?: UploadedDocument[];
}

export interface QualityCheck {
  id: string;
  jobNumber: string;
  serialNumber: string;
  status: string;
  qcDate?: string;
  remarks?: string;
  assembly?: Assembly;
}

export interface StorageLocation {
  id: string;
  name: string;
  code: string;
  description?: string;
  _count?: { assemblies: number };
}

export interface StorageMovement {
  id: string;
  assemblyId: string;
  movedAt: string;
  notes?: string;
  assembly?: { jobNumber: string; serialNumber: string };
  fromLocation?: StorageLocation;
  toLocation?: StorageLocation;
}

export interface Site {
  id: string;
  name: string;
  address?: string;
  _count?: { siteDoors: number };
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  jobNumber: string;
  serialNumber: string;
  deliveryDate: string;
  siteId: string;
  driver?: string;
  vehicleNumber?: string;
  type: string;
  notes?: string;
  site?: Site;
  assembly?: Assembly;
}

export interface SiteDoor {
  id: string;
  jobNumber: string;
  serialNumber: string;
  siteId: string;
  deliveredDate: string;
  status: string;
  site?: Site;
  assembly?: Assembly;
}

export interface ReturnReason {
  id: string;
  name: string;
  code: string;
}

export interface Return {
  id: string;
  jobNumber: string;
  serialNumber: string;
  returnedFrom: string;
  returnDate: string;
  returnReason?: ReturnReason;
  notes?: string;
  assembly?: Assembly;
}

export interface MovementHistory {
  id: string;
  jobNumber: string;
  serialNumber: string;
  eventType: string;
  eventLabel?: string;
  eventDate: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

export interface UploadedDocument {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize?: number;
  uploadedAt: string;
  url?: string;
}

export interface DashboardStats {
  kpis: {
    readyForAssembly: number;
    assemblyCompleted: number;
    bhStorage: number;
    camdenStorage: number;
    siteStorage: number;
    containerStorage: number;
    returnedDoors: number;
    pendingQc: number;
    pendingFips: number;
  };
  storageDistribution: { name: string; code: string; count: number }[];
  recentActivity: ActivityLog[];
  charts: {
    dailyAssembly: { date: string; count: number }[];
    monthlyAssembly: { month: string; count: number }[];
    returnReasons: { reason: string; count: number }[];
  };
}

export interface ActivityLog {
  id: string;
  action: string;
  module: string;
  details?: string;
  createdAt: string;
  user?: { name: string };
}

export interface DateGroup {
  date: string;
  doors: number;
  frames: number;
  items: ReadyForAssembly[];
}
