import { Response } from 'express'

export const sendSuccess = (res: Response, data: any, message = 'OK', status = 200) => {
  res.status(status).json({ success: true, data, message })
}

export const sendError = (res: Response, message: string, status = 400, code?: string) => {
  res.status(status).json({ success: false, message, code })
}

export const sendPaginated = (
  res: Response,
  items: any[],
  total: number,
  page: number,
  limit: number
) => {
  res.status(200).json({
    success: true,
    data: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}