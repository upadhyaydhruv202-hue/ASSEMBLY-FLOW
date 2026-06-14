import * as service from '../services/siteService.js';
import { asyncHandler, sendSuccess, sendPaginated } from '../utils/helpers.js';

export const list = asyncHandler(async (_req, res) => {
  const sites = await service.listSites();
  sendSuccess(res, sites);
});

export const create = asyncHandler(async (req, res) => {
  const site = await service.createSite(req.body, req.user.id);
  sendSuccess(res, site, 'Site created', 201);
});

export const update = asyncHandler(async (req, res) => {
  const site = await service.updateSite(req.params.id, req.body, req.user.id);
  sendSuccess(res, site, 'Site updated');
});

export const listDoors = asyncHandler(async (req, res) => {
  const result = await service.listSiteDoors(req.query);
  sendPaginated(res, result.items, result.pagination);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const result = await service.updateSiteDoorStatus(req.body, req.user.id);
  sendSuccess(res, result);
});
