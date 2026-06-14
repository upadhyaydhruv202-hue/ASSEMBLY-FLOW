import * as service from '../services/movementService.js';
import { asyncHandler, sendSuccess, sendPaginated } from '../utils/helpers.js';

export const list = asyncHandler(async (req, res) => {
  const result = await service.listMovementHistory(req.query);
  sendPaginated(res, result.items, result.pagination);
});

export const timeline = asyncHandler(async (req, res) => {
  const data = await service.getDoorTimeline(req.params.jobNumber, req.params.serialNumber);
  sendSuccess(res, data);
});

export const search = asyncHandler(async (req, res) => {
  const doors = await service.searchDoors(req.query);
  sendSuccess(res, doors);
});
