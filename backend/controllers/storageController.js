import * as service from '../services/storageService.js';
import { asyncHandler, sendSuccess, sendPaginated } from '../utils/helpers.js';

export const listLocations = asyncHandler(async (_req, res) => {
  const locations = await service.listStorageLocations();
  sendSuccess(res, locations);
});

export const createLocation = asyncHandler(async (req, res) => {
  const location = await service.createStorageLocation(req.body, req.user.id);
  sendSuccess(res, location, 'Location created', 201);
});

export const listByLocation = asyncHandler(async (req, res) => {
  const result = await service.listDoorsInStorage(req.params.code, req.query);
  sendPaginated(res, result.items, result.pagination, `Doors in ${result.location.name}`);
});

export const move = asyncHandler(async (req, res) => {
  const result = await service.moveToStorage(req.body, req.user.id);
  sendSuccess(res, result, `Moved ${result.moved} doors`);
});

export const bulkMove = asyncHandler(async (req, res) => {
  const results = await service.bulkMoveToStorage(req.body.movements, req.user.id);
  sendSuccess(res, results, 'Bulk move completed');
});

export const summary = asyncHandler(async (_req, res) => {
  const data = await service.getStorageSummary();
  sendSuccess(res, data);
});

export const movements = asyncHandler(async (req, res) => {
  const result = await service.getStorageMovements(req.query);
  sendPaginated(res, result.items, result.pagination);
});
