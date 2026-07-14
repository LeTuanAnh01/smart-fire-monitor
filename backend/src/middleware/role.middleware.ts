import { Request, Response, NextFunction } from 'express'
import { sendError } from '../utils/response'

// Chỉ SuperAdmin
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user.role !== 'SUPER_ADMIN') return sendError(res, 'Chỉ SuperAdmin mới có quyền này', 403)
  next()
}

// SuperAdmin hoặc Admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    return sendError(res, 'Không có quyền thực hiện', 403)
  }
  next()
}

// SuperAdmin, Admin hoặc Manager
export const requireManager = (req: Request, res: Response, next: NextFunction) => {
  if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
    return sendError(res, 'Không có quyền thực hiện', 403)
  }
  next()
}

// Lấy locationIds theo role
// SuperAdmin → null (xem tất cả)
// Admin/Manager/User → locationIds từ JWT
export const getLocationFilter = (req: Request): string[] | null => {
  if (req.user.role === 'SUPER_ADMIN') return null
  return req.user.locationIds || []
}