import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import prisma from '../config/database.js';
import { buildDateFilter } from './dashboardService.js';
import { EVENT_LABELS } from '../utils/movementLogger.js';

function buildReportDateFilter(query) {
  const now = new Date();
  let startDate = query.startDate;
  let endDate = query.endDate;

  if (query.period === 'daily') {
    startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
  } else if (query.period === 'weekly') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    startDate = weekAgo.toISOString();
  } else if (query.period === 'monthly') {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    startDate = monthAgo.toISOString();
  }

  return buildDateFilter(startDate, endDate);
}

export async function getAssemblyReport(query) {
  const dateFilter = buildReportDateFilter(query);
  return prisma.assembly.findMany({
    where: { ...dateFilter, assemblyStatus: 'COMPLETED' },
    include: { barcode: true, components: { include: { readyForAssembly: true } } },
    orderBy: { assemblyDate: 'desc' },
  });
}

export async function getQcReport(query) {
  const dateFilter = buildReportDateFilter(query);
  return prisma.qualityCheck.findMany({
    where: dateFilter.assemblyDate ? { qcDate: dateFilter.assemblyDate } : {},
    include: { assembly: { include: { barcode: true } } },
    orderBy: { qcDate: 'desc' },
  });
}

export async function getStorageReport(query) {
  const locations = await prisma.storageLocation.findMany({
    where: { isActive: true },
    include: {
      assemblies: {
        include: { barcode: true, qualityCheck: true },
      },
    },
  });
  return locations;
}

export async function getDeliveryReport(query) {
  const dateFilter = buildReportDateFilter(query);
  return prisma.delivery.findMany({
    where: dateFilter,
    include: { site: true, assembly: { include: { barcode: true } } },
    orderBy: { deliveryDate: 'desc' },
  });
}

export async function getReturnReport(query) {
  const dateFilter = buildReportDateFilter(query);
  return prisma.return.findMany({
    where: dateFilter,
    include: { returnReason: true, assembly: true },
    orderBy: { returnDate: 'desc' },
  });
}

export async function getMovementReport(query) {
  const dateFilter = buildReportDateFilter(query);
  const items = await prisma.movementHistory.findMany({
    where: dateFilter,
    orderBy: { eventDate: 'desc' },
  });
  return items.map((item) => ({
    ...item,
    eventLabel: EVENT_LABELS[item.eventType] || item.eventType,
  }));
}

export async function exportToExcel(reportType, data) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(reportType);

  if (reportType === 'assembly') {
    sheet.columns = [
      { header: 'Job Number', key: 'jobNumber', width: 15 },
      { header: 'Serial Number', key: 'serialNumber', width: 15 },
      { header: 'Lock Type', key: 'lockType', width: 15 },
      { header: 'Leaf Type', key: 'leafType', width: 15 },
      { header: 'Assembly Date', key: 'assemblyDate', width: 20 },
      { header: 'Barcode', key: 'barcode', width: 25 },
    ];
    data.forEach((row) => {
      sheet.addRow({
        jobNumber: row.jobNumber,
        serialNumber: row.serialNumber,
        lockType: row.lockType,
        leafType: row.leafType,
        assemblyDate: row.assemblyDate?.toISOString(),
        barcode: row.barcode?.barcodeValue,
      });
    });
  } else if (reportType === 'movement') {
    sheet.columns = [
      { header: 'Job Number', key: 'jobNumber', width: 15 },
      { header: 'Serial Number', key: 'serialNumber', width: 15 },
      { header: 'Event', key: 'eventLabel', width: 25 },
      { header: 'Date', key: 'eventDate', width: 20 },
      { header: 'Details', key: 'details', width: 30 },
    ];
    data.forEach((row) => sheet.addRow(row));
  } else if (reportType === 'delivery') {
    sheet.columns = [
      { header: 'Delivery Number', key: 'deliveryNumber', width: 18 },
      { header: 'Job Number', key: 'jobNumber', width: 15 },
      { header: 'Serial Number', key: 'serialNumber', width: 15 },
      { header: 'Site', key: 'site', width: 20 },
      { header: 'Date', key: 'deliveryDate', width: 20 },
      { header: 'Driver', key: 'driver', width: 15 },
    ];
    data.forEach((row) => {
      sheet.addRow({
        deliveryNumber: row.deliveryNumber,
        jobNumber: row.jobNumber,
        serialNumber: row.serialNumber,
        site: row.site?.name,
        deliveryDate: row.deliveryDate?.toISOString(),
        driver: row.driver,
      });
    });
  } else if (reportType === 'returns') {
    sheet.columns = [
      { header: 'Job Number', key: 'jobNumber', width: 15 },
      { header: 'Serial Number', key: 'serialNumber', width: 15 },
      { header: 'Returned From', key: 'returnedFrom', width: 20 },
      { header: 'Reason', key: 'reason', width: 20 },
      { header: 'Date', key: 'returnDate', width: 20 },
    ];
    data.forEach((row) => {
      sheet.addRow({
        jobNumber: row.jobNumber,
        serialNumber: row.serialNumber,
        returnedFrom: row.returnedFrom,
        reason: row.returnReason?.name,
        returnDate: row.returnDate?.toISOString(),
      });
    });
  } else if (reportType === 'qc') {
    sheet.columns = [
      { header: 'Job Number', key: 'jobNumber', width: 15 },
      { header: 'Serial Number', key: 'serialNumber', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'QC Date', key: 'qcDate', width: 20 },
      { header: 'Remarks', key: 'remarks', width: 30 },
    ];
    data.forEach((row) => sheet.addRow(row));
  } else if (reportType === 'storage') {
    sheet.columns = [
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Job Number', key: 'jobNumber', width: 15 },
      { header: 'Serial Number', key: 'serialNumber', width: 15 },
      { header: 'Barcode', key: 'barcode', width: 25 },
    ];
    data.forEach((loc) => {
      loc.assemblies.forEach((a) => {
        sheet.addRow({
          location: loc.name,
          jobNumber: a.jobNumber,
          serialNumber: a.serialNumber,
          barcode: a.barcode?.barcodeValue,
        });
      });
    });
  }

  return workbook.xlsx.writeBuffer();
}

export function exportToCsv(reportType, data) {
  let headers = [];
  let rows = [];

  if (reportType === 'assembly') {
    headers = ['Job Number', 'Serial Number', 'Lock Type', 'Leaf Type', 'Assembly Date', 'Barcode'];
    rows = data.map((r) => [
      r.jobNumber, r.serialNumber, r.lockType, r.leafType,
      r.assemblyDate?.toISOString(), r.barcode?.barcodeValue,
    ]);
  } else if (reportType === 'movement') {
    headers = ['Job Number', 'Serial Number', 'Event', 'Date', 'Details'];
    rows = data.map((r) => [
      r.jobNumber, r.serialNumber, r.eventLabel, r.eventDate?.toISOString(), r.details,
    ]);
  }

  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c || ''}"`).join(','))].join('\n');
  return csv;
}

export function exportToPdf(reportType, data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(`AssemblyFlow ERP - ${reportType.toUpperCase()} Report`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    if (reportType === 'assembly') {
      data.slice(0, 50).forEach((row, i) => {
        doc.text(`${i + 1}. Job: ${row.jobNumber} | Serial: ${row.serialNumber} | Date: ${row.assemblyDate?.toLocaleDateString()}`);
      });
    } else if (reportType === 'movement') {
      data.slice(0, 50).forEach((row, i) => {
        doc.text(`${i + 1}. ${row.jobNumber}/${row.serialNumber} - ${row.eventLabel} (${row.eventDate?.toLocaleDateString()})`);
      });
    }

    doc.end();
  });
}

export async function generateReport(reportType, query) {
  const fetchers = {
    assembly: getAssemblyReport,
    qc: getQcReport,
    storage: getStorageReport,
    delivery: getDeliveryReport,
    returns: getReturnReport,
    movement: getMovementReport,
  };

  const fetcher = fetchers[reportType];
  if (!fetcher) throw new Error('Invalid report type');
  return fetcher(query);
}
