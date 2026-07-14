import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../utils/response'
import { verifyLogin, generateToken, getUserById, updatePassword, updateUserProfile  } from '../services/auth.service'
import { catchAsync } from '../utils/catchAsync'

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) return sendError(res, 'Email và mật khẩu không được để trống')

  const user = await verifyLogin(email, password)
  if (!user) return sendError(res, 'Email hoặc mật khẩu không đúng', 401, 'AUTH_INVALID')

  const { token, buildingIds } = generateToken(user)
  return sendSuccess(res, {
    token,
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, buildingIds }
  })
})

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await getUserById(req.user.userId)
  if (!user) return sendError(res, 'User không tồn tại', 404)

  return sendSuccess(res, {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    buildings: user.buildingManagers.map(bm => bm.building)
  })
})

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) return sendError(res, 'Vui lòng nhập đầy đủ thông tin')
  if (newPassword.length < 6) return sendError(res, 'Mật khẩu mới phải có ít nhất 6 ký tự')

  const result = await updatePassword(req.user.userId, oldPassword, newPassword)
  if (!result.success) return sendError(res, result.message)
  return sendSuccess(res, null, result.message)
})

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const { fullName } = req.body
  if (!fullName?.trim()) return sendError(res, 'Họ tên không được để trống')

  const user = await updateUserProfile(req.user.userId, fullName)
  return sendSuccess(res, user, 'Cập nhật thành công')
})