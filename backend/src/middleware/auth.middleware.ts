import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { sendError } from '../utils/response'

declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string
        email: string
        role: string
        locationIds: string[]  // thay buildingIds
      }
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return sendError(res, 'Unauthorized', 401, 'AUTH_REQUIRED')

  const token = auth.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.user = payload
    next()
  } catch {
    return sendError(res, 'Token không hợp lệ', 401, 'AUTH_INVALID')
  }
}