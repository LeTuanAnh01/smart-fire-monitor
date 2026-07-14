import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../utils/response'
import { catchAsync } from '../utils/catchAsync'
import { getLocationFilter } from '../middleware/role.middleware'
import {
  getLocationTree, findLocationById, createLocation,
  updateLocation, deleteLocation, assignUserToLocation,
  removeUserFromLocation, getAccessibleLocationIds
} from '../services/location.service'

export const getTree = catchAsync(async (req: Request, res: Response) => {
  const locationIds = getLocationFilter(req)
  const tree = await getLocationTree(locationIds)
  return sendSuccess(res, tree)
})

export const getLocation = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const location = await findLocationById(id)
  if (!location) return sendError(res, 'Không tìm thấy', 404)
  return sendSuccess(res, location)
})

export const createLocationHandler = catchAsync(async (req: Request, res: Response) => {
  const { name, code, parentId, order } = req.body
  if (!name) return sendError(res, 'Tên không được để trống')

  const result = await createLocation({ name, code, parentId, order })
  if (!result.success) return sendError(res, result.message)
  return sendSuccess(res, result.data, result.message, 201)
})

export const updateLocationHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const location = await updateLocation(id, req.body)
  return sendSuccess(res, location, 'Cập nhật thành công')
})

export const deleteLocationHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  await deleteLocation(id)
  return sendSuccess(res, null, 'Xóa thành công')
})

export const assignUser = catchAsync(async (req: Request, res: Response) => {
  const locationId = req.params.id as string
  const { userId } = req.body
  const result = await assignUserToLocation(userId, locationId)
  if (!result.success) return sendError(res, result.message)
  return sendSuccess(res, result.data, result.message, 201)
})

export const removeUser = catchAsync(async (req: Request, res: Response) => {
  const locationId = req.params.id as string
  const userId = req.params.userId as string
  await removeUserFromLocation(userId, locationId)
  return sendSuccess(res, null, 'Hủy gán thành công')
})