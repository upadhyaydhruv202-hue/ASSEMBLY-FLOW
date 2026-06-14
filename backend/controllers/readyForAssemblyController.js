import * as service from '../services/readyForAssemblyService.js';
import { asyncHandler, sendSuccess, sendPaginated } from '../utils/helpers.js';

export const list = asyncHandler(async (req, res) => {
  const result = await service.listReadyForAssembly(req.query);
  sendPaginated(res, { items: result.items, grouped: result.grouped }, result.pagination);
});

export const create = asyncHandler(async (req, res) => {
  const item = await service.createReadyForAssembly(req.body, req.user.id);
  sendSuccess(res, item, 'Record created', 201);
});

export const bulkCreate = asyncHandler(async (req, res) => {
  const items = await service.bulkCreateReadyForAssembly(req.body.items, req.user.id);
  sendSuccess(res, items, `${items.length} records created`, 201);
});

export const remove = asyncHandler(async (req, res) => {
  const result = await service.deleteReadyForAssembly(req.params.id, req.user.id);
  sendSuccess(res, result, 'Record deleted');
});

export const bulkRemove = asyncHandler(async (req, res) => {
  const result = await service.bulkDeleteReadyForAssembly(req.body.ids, req.user.id);
  sendSuccess(res, result, `${result.deleted} records deleted`);
});
