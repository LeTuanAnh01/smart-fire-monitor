import { Request, Response } from 'express'
import { sendSuccess } from '../utils/response'
import { catchAsync } from '../utils/catchAsync'
import { getLocationFilter } from '../middleware/role.middleware'
import { getOverviewStats, getAlertsChartData, getDeviceStatusData } from '../services/stats.service'

export const getOverview = catchAsync(async (req: Request, res: Response) => {
  const data = await getOverviewStats(getLocationFilter(req))
  return sendSuccess(res, data)
})

export const getAlertsChart = catchAsync(async (req: Request, res: Response) => {
  const data = await getAlertsChartData(getLocationFilter(req))
  return sendSuccess(res, data)
})

export const getDeviceStatus = catchAsync(async (req: Request, res: Response) => {
  const data = await getDeviceStatusData(getLocationFilter(req))
  return sendSuccess(res, data)
})
