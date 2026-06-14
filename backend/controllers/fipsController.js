import fs from 'fs';
import * as service from '../services/fipsService.js';
import { asyncHandler, sendSuccess, sendPaginated } from '../utils/helpers.js';

export const list = asyncHandler(async (req, res) => {
  const result = await service.listFipsForms(req.query);
  sendPaginated(res, result.items, result.pagination);
});

export const update = asyncHandler(async (req, res) => {
  const item = await service.updateFipsForm(req.params.id, req.body, req.user.id);
  sendSuccess(res, item, 'FIPS form updated');
});

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const doc = await service.uploadFipsDocument(req.params.id, req.file, req.user.id);
  sendSuccess(res, doc, 'Document uploaded', 201);
});

export const listDocuments = asyncHandler(async (req, res) => {
  const docs = await service.getFipsDocuments(req.params.id);
  sendSuccess(res, docs);
});

export const downloadDocument = asyncHandler(async (req, res) => {
  const docs = await service.getFipsDocuments(req.params.fipsId);
  const doc = docs.find((d) => d.id === req.params.docId);
  if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
  res.download(doc.filePath, doc.fileName);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const result = await service.deleteFipsDocument(req.params.docId, req.user.id);
  sendSuccess(res, result);
});
