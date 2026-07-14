import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { catchAsync } from '../utils/catchAsync'
import { getLocationFilter } from '../middleware/role.middleware'
import { findAlerts, changeAlertStatus } from '../services/alert.service'
import { getAccessibleLocationIds } from '../services/location.service'

export const getAlerts = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20

  const locationFilter = getLocationFilter(req)
  const queryLocationId = req.query.locationId as string

  let locationIds: string[] | undefined

  if (queryLocationId) {
    // Có filter cụ thể từ query → dùng locationId này (bất kể role)
    locationIds = await getAccessibleLocationIds([queryLocationId])
  } else if (locationFilter !== null) {
    // Không có filter cụ thể nhưng không phải SuperAdmin → dùng locationIds từ JWT
    locationIds = await getAccessibleLocationIds(locationFilter)
  }
  // SuperAdmin không có queryLocationId → locationIds = undefined → xem tất cả

  const { items, total } = await findAlerts({
    locationIds,
    status: req.query.status as string,
    alertType: req.query.alertType as string,
    from: req.query.from as string,
    to: req.query.to as string,
    page,
    limit
  })

  return sendPaginated(res, items, total, page, limit)
})

export const acknowledgeAlert = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await changeAlertStatus(id, 'ACKNOWLEDGED')
  if (!result.success) return sendError(res, result.message)
  return sendSuccess(res, result.data, 'Đã xác nhận cảnh báo')
})

export const resolveAlert = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await changeAlertStatus(id, 'RESOLVED')
  if (!result.success) return sendError(res, result.message)
  return sendSuccess(res, result.data, 'Đã xử lý cảnh báo')
})