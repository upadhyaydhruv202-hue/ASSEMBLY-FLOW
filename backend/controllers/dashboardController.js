import * as dashboardService from '../services/dashboardService.js';
import { asyncHandler, sendSuccess } from '../utils/helpers.js';

export const getStats = asyncHandler(async (_req, res) => {
  const stats = await dashboardService.getDashboardStats();
  sendSuccess(res, stats);
});
