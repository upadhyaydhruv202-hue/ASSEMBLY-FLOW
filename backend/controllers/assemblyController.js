import * as service from '../services/assemblyService.js';
import { asyncHandler, sendSuccess, sendPaginated } from '../utils/helpers.js';

export const list = asyncHandler(async (req, res) => {
  const result = await service.listAssemblies(req.query);
  sendPaginated(res, result.items, result.pagination);
});

export const getById = asyncHandler(async (req, res) => {
  const item = await service.getAssemblyById(req.params.id);
  sendSuccess(res, item);
});

export const create = asyncHandler(async (req, res) => {
  const item = await service.createAssembly(req.body, req.user.id);
  sendSuccess(res, item, 'Assembly created', 201);
});

export const update = asyncHandler(async (req, res) => {
  const item = await service.updateAssembly(req.params.id, req.body, req.user.id);
  sendSuccess(res, item, 'Assembly updated');
});

export const generateBarcode = asyncHandler(async (req, res) => {
  const barcode = await service.generateBarcode(req.params.id, req.user.id);
  sendSuccess(res, barcode, 'Barcode generated');
});

export const downloadBarcode = asyncHandler(async (req, res) => {
  const { png, value } = await service.getBarcodeImage(req.params.id);
  res.set('Content-Type', 'image/png');
  res.set('Content-Disposition', `attachment; filename="barcode-${value}.png"`);
  res.send(png);
});

export const scanBarcode = asyncHandler(async (req, res) => {
  const assembly = await service.lookupByBarcode(req.params.barcode);
  sendSuccess(res, assembly);
});
