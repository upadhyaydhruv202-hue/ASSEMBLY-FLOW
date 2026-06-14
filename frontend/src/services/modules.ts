import api from './api';
import type {
  ApiResponse,
  User,
  DashboardStats,
  ReadyForAssembly,
  Assembly,
  FipsForm,
  QualityCheck,
  StorageLocation,
  Delivery,
  Site,
  SiteDoor,
  Return,
  ReturnReason,
  MovementHistory,
  DateGroup,
  Pagination,
} from '@/types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', { email, password, name }),
  getProfile: () => api.get<ApiResponse<User>>('/auth/profile'),
};

export const dashboardApi = {
  getStats: () => api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
};

export const readyForAssemblyApi = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<{ items: ReadyForAssembly[]; grouped: DateGroup[] }>>('/ready-for-assembly', { params }),
  create: (data: Partial<ReadyForAssembly>) =>
    api.post<ApiResponse<ReadyForAssembly>>('/ready-for-assembly', data),
  bulkCreate: (items: Partial<ReadyForAssembly>[]) =>
    api.post<ApiResponse<ReadyForAssembly[]>>('/ready-for-assembly/bulk', { items }),
  delete: (id: string) => api.delete(`/ready-for-assembly/${id}`),
  bulkDelete: (ids: string[]) => api.delete('/ready-for-assembly/bulk', { data: { ids } }),
};

export const assemblyApi = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<Assembly[]>>('/assemblies', { params }),
  getById: (id: string) => api.get<ApiResponse<Assembly>>(`/assemblies/${id}`),
  create: (data: {
    readyForAssemblyIds: string[];
    jobNumber: string;
    serialNumber: string;
    lockType?: string;
    leafType?: string;
  }) => api.post<ApiResponse<Assembly>>('/assemblies', data),
  update: (id: string, data: Partial<Assembly>) =>
    api.patch<ApiResponse<Assembly>>(`/assemblies/${id}`, data),
  generateBarcode: (id: string) => api.post<ApiResponse<{ barcodeValue: string }>>(`/assemblies/${id}/barcode`),
  downloadBarcode: (id: string) => api.get(`/assemblies/${id}/barcode/download`, { responseType: 'blob' }),
  scan: (barcode: string) => api.get<ApiResponse<Assembly>>(`/assemblies/scan/${barcode}`),
};

export const fipsApi = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<FipsForm[]>>('/fips', { params }),
  update: (id: string, data: { status?: string; submittedDate?: string }) =>
    api.patch<ApiResponse<FipsForm>>(`/fips/${id}`, data),
  uploadDocument: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/fips/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDocuments: (id: string) => api.get(`/fips/${id}/documents`),
};

export const qcApi = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<QualityCheck[]>>('/quality-checks', { params }),
  update: (id: string, data: { status: string; remarks?: string }) =>
    api.patch<ApiResponse<QualityCheck>>(`/quality-checks/${id}`, data),
  getLabel: (id: string) => api.get(`/quality-checks/${id}/label`),
};

export const storageApi = {
  getLocations: () => api.get<ApiResponse<StorageLocation[]>>('/storage/locations'),
  getSummary: () => api.get<ApiResponse<{ name: string; code: string; count: number }[]>>('/storage/summary'),
  listByLocation: (code: string, params?: Record<string, string>) =>
    api.get<ApiResponse<Assembly[]>>(`/storage/${code}`, { params }),
  move: (data: { assemblyIds: string[]; toLocationCode: string; notes?: string }) =>
    api.post('/storage/move', data),
  bulkMove: (movements: { assemblyIds: string[]; toLocationCode: string; notes?: string }[]) =>
    api.post('/storage/bulk-move', { movements }),
  getMovements: (params?: Record<string, string>) =>
    api.get('/storage/movements', { params }),
};

export const deliveryApi = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<Delivery[]>>('/deliveries', { params }),
  create: (data: {
    assemblyIds: string[];
    siteId: string;
    driver?: string;
    vehicleNumber?: string;
    type?: string;
    notes?: string;
  }) => api.post<ApiResponse<Delivery[]>>('/deliveries', data),
  getById: (id: string) => api.get<ApiResponse<Delivery>>(`/deliveries/${id}`),
  getNote: (id: string) => api.get(`/deliveries/${id}/note`),
};

export const siteApi = {
  list: () => api.get<ApiResponse<Site[]>>('/sites'),
  create: (data: { name: string; address?: string }) =>
    api.post<ApiResponse<Site>>('/sites', data),
  listDoors: (params?: Record<string, string>) =>
    api.get<ApiResponse<SiteDoor[]>>('/sites/doors', { params }),
  updateDoorStatus: (assemblyIds: string[], status: string) =>
    api.patch('/sites/doors/status', { assemblyIds, status }),
};

export const returnApi = {
  listReasons: () => api.get<ApiResponse<ReturnReason[]>>('/returns/reasons'),
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<Return[]>>('/returns', { params }),
  process: (data: {
    assemblyIds: string[];
    returnedFrom: string;
    returnReasonCode: string;
    notes?: string;
  }) => api.post<ApiResponse<Return[]>>('/returns', data),
};

export const movementApi = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<MovementHistory[]>>('/movements', { params }),
  timeline: (jobNumber: string, serialNumber: string) =>
    api.get(`/movements/timeline/${jobNumber}/${serialNumber}`),
  search: (search: string) => api.get('/movements/search', { params: { search } }),
};

export const reportApi = {
  generate: (type: string, params?: Record<string, string>) =>
    api.get(`/reports/${type}`, { params }),
  export: (type: string, format: string, params?: Record<string, string>) =>
    api.get(`/reports/${type}/export`, { params: { ...params, format }, responseType: 'blob' }),
};

export type { Pagination };
