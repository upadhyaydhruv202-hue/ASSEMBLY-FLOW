import * as service from '../services/qualityCheckService.js';
import { asyncHandler, sendSuccess, sendPaginated } from '../utils/helpers.js';

export const list = asyncHandler(async (req, res) => {
  const result = await service.listQualityChecks(req.query);
  sendPaginated(res, result.items, result.pagination);
});

export const update = asyncHandler(async (req, res) => {
  const item = await service.updateQualityCheck(req.params.id, req.body, req.user.id);
  sendSuccess(res, item, 'Quality check updated');
});

export const getLabel = asyncHandler(async (req, res) => {
  const data = await service.getQcLabelData(req.params.id);
  sendSuccess(res, data);
});
