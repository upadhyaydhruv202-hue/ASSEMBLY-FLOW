import * as service from '../services/deliveryService.js';
import { asyncHandler, sendSuccess, sendPaginated } from '../utils/helpers.js';

export const list = asyncHandler(async (req, res) => {
  const result = await service.listDeliveries(req.query);
  sendPaginated(res, result.items, result.pagination);
});

export const create = asyncHandler(async (req, res) => {
  const deliveries = await service.createDeliveries(req.body, req.user.id);
  sendSuccess(res, deliveries, `${deliveries.length} deliveries created`, 201);
});

export const getById = asyncHandler(async (req, res) => {
  const delivery = await service.getDeliveryById(req.params.id);
  sendSuccess(res, delivery);
});

export const getNote = asyncHandler(async (req, res) => {
  const note = await service.getDeliveryNoteData(req.params.id);
  sendSuccess(res, note);
});
