import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { catchAsync } from '../utils/catchAsync'
import {
  findUsers, createUser, updateUserChecked,
  deleteUserChecked
} from '../services/user.service'

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20

  const { items, total } = await findUsers({
    role: req.query.role as string,
    search: req.query.search as string,
    requesterId: req.user.userId,
    requesterRole: req.user.role,
    requesterLocationIds: req.user.locationIds,
    page,
    limit
  })

  return sendPaginated(res, items, total, page, limit)
})

export const createUserHandler = catchAsync(async (req: Request, res: Response) => {
  const { fullName, email, password, role, phone } = req.body  // thêm phone
  if (!fullName || !email || !password) return sendError(res, 'Thiếu thông tin')

  const result = await createUser(
    { fullName, email, password, role, phone },
    req.user.userId,
    req.user.role,
  )
  if (!result.success) return sendError(res, result.message)
  return sendSuccess(res, result.data, result.message, 201)
})

export const updateUserHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const { fullName, isActive, password, role, phone } = req.body  // thêm phone

  const result = await updateUserChecked(
    id,
    { fullName, isActive, password, role, phone },
    req.user.userId,
    req.user.role
  )
  if (!result.success) return sendError(res, result.message)
  return sendSuccess(res, result.data, result.message)
})

export const deleteUserHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  if (id === req.user.userId) return sendError(res, 'Không thể xóa chính mình')

  const result = await deleteUserChecked(id, req.user.userId, req.user.role)
  if (!result.success) return sendError(res, result.message)
  return sendSuccess(res, null, result.message)
})