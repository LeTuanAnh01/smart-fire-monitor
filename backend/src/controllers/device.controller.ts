import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { catchAsync } from '../utils/catchAsync'
import { getLocationFilter } from '../middleware/role.middleware'
import {
  findDevices, findDeviceById, createDevice,
  updateDevice, deleteDevice, findDeviceLogs
} from '../services/device.service'

export const getDevices = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const locationFilter = getLocationFilter(req)
  const queryLocationId = req.query.locationId as string | undefined

  const { items, total } = await findDevices({
    locationIds: locationFilter,
    locationId: queryLocationId,
    search: req.query.search as string,
    page,
    limit
  })
  return sendPaginated(res, items, total, page, limit)
})

export const getDeviceById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const device = await findDeviceById(id)
  if (!device) return sendError(res, 'Không tìm thấy thiết bị', 404)
  return sendSuccess(res, device)
})

export const createDeviceHandler = catchAsync(async (req: Request, res: Response) => {
  const { locationId, extId, name } = req.body
  if (!locationId || !extId || !name) return sendError(res, 'Thiếu thông tin thiết bị')
  const result = await createDevice({ locationId, extId, name })
  if (!result.success) return sendError(res, result.message)
  return sendSuccess(res, result.data, result.message, 201)
})

export const updateDeviceHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const device = await updateDevice(id, req.body)
  return sendSuccess(res, device, 'Cập nhật thành công')
})

export const deleteDeviceHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  await deleteDevice(id)
  return sendSuccess(res, null, 'Xóa thiết bị thành công')
})

export const getDeviceLogs = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await findDeviceLogs({
    deviceId: id,
    metric: req.query.metric as string,
    from: req.query.from as string,
    to: req.query.to as string,
    limit: parseInt(req.query.limit as string) || 100,
    page: parseInt(req.query.page as string) || 1,
  })
  return sendSuccess(res, result)
})
