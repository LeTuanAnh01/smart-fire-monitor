import { Request, Response, NextFunction } from 'express'

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

// Dùng trong controller
export const getBuildings = catchAsync(async (req: Request, res: Response) => {
  // ... code như cũ
})