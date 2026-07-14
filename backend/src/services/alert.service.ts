import prisma from '../utils/prisma'

export const findAlerts = async (filters: {
  locationIds?: string[]
  status?: string
  alertType?: string
  from?: string
  to?: string
  page: number
  limit: number
}) => {
  const { locationIds, status, alertType, from, to, page, limit } = filters

  const where: any = {
    ...(status && { status }),
    ...(alertType && { alertType }),
    ...(from && to && { triggeredAt: { gte: new Date(from), lte: new Date(to) } }),
    ...(locationIds && { device: { locationId: { in: locationIds } } })
  }

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { triggeredAt: 'desc' },
      include: {
        device: {
          include: {
            location: {
              include: { parent: { include: { parent: true } } }
            }
          }
        }
      }
    }),
    prisma.alert.count({ where })
  ])

  const items = alerts.map(a => ({
    id: a.id,
    alertType: a.alertType,
    state: a.state,
    value: a.value,
    status: a.status,
    triggeredAt: a.triggeredAt,
    resolvedAt: a.resolvedAt,
    device: { id: a.device.id, name: a.device.name },
    location: {
      id: a.device.location.id,
      name: a.device.location.name,
      path: [
        a.device.location.parent?.parent?.name,
        a.device.location.parent?.name,
        a.device.location.name,
      ].filter(Boolean).join(' → ')
    }
  }))

  return { items, total }
}

export const changeAlertStatus = async (
  id: string,
  newStatus: 'ACKNOWLEDGED' | 'RESOLVED'
): Promise<{ success: boolean; message: string; data?: any }> => {
  const alert = await prisma.alert.findUnique({ where: { id } })
  if (!alert) return { success: false, message: 'Không tìm thấy cảnh báo' }

  if (newStatus === 'ACKNOWLEDGED' && alert.status !== 'ACTIVE') {
    return { success: false, message: 'Cảnh báo không ở trạng thái ACTIVE' }
  }
  if (newStatus === 'RESOLVED' && alert.status === 'RESOLVED') {
    return { success: false, message: 'Cảnh báo đã được xử lý rồi' }
  }

  const updated = await prisma.alert.update({
    where: { id },
    data: {
      status: newStatus,
      ...(newStatus === 'RESOLVED' && { resolvedAt: new Date() })
    }
  })

  return { success: true, message: 'Thành công', data: updated }
}