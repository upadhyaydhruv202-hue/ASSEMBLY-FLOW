import * as service from '../services/reportService.js';
import { asyncHandler, sendSuccess } from '../utils/helpers.js';
import { AppError } from '../utils/helpers.js';

export const generate = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const data = await service.generateReport(type, req.query);
  sendSuccess(res, data);
});

export const exportReport = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const format = req.query.format || 'excel';
  const data = await service.generateReport(type, req.query);

  if (format === 'excel') {
    const buffer = await service.exportToExcel(type, data);
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.set('Content-Disposition', `attachment; filename="${type}-report.xlsx"`);
    return res.send(buffer);
  }

  if (format === 'csv') {
    const csv = service.exportToCsv(type, data);
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    return res.send(csv);
  }

  if (format === 'pdf') {
    const buffer = await service.exportToPdf(type, data);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
    return res.send(buffer);
  }

  throw new AppError('Invalid export format', 400);
});
