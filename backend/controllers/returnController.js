import * as service from '../services/returnService.js';
import { asyncHandler, sendSuccess, sendPaginated } from '../utils/helpers.js';

export const listReasons = asyncHandler(async (_req, res) => {
  const reasons = await service.listReturnReasons();
  sendSuccess(res, reasons);
});

export const list = asyncHandler(async (req, res) => {
  const result = await service.listReturns(req.query);
  sendPaginated(res, result.items, result.pagination);
});

export const process = asyncHandler(async (req, res) => {
  const returns = await service.processReturns(req.body, req.user.id);
  sendSuccess(res, returns, `${returns.length} returns processed`, 201);
});

export const bulkReturnFromSite = asyncHandler(async (req, res) => {
  const returns = await service.bulkReturnFromSite(
    req.body.assemblyIds,
    req.body.returnReasonCode,
    req.body.notes,
    req.user.id,
  );
  sendSuccess(res, returns, `${returns.length} returns processed`);
});
