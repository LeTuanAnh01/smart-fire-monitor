import prisma from '../utils/prisma'
import { getAccessibleLocationIds } from './location.service'

export const getOverviewStats = async (locationIds: string[] | null) => {
  let accessibleIds: string[] | undefined
  if (locationIds !== null) {
    accessibleIds = await getAccessibleLocationIds(locationIds)
  }

  const deviceWhere = accessibleIds ? { locationId: { in: accessibleIds } } : {}
  const alertWhere = accessibleIds
    ? { device: { locationId: { in: accessibleIds } } }
    : {}

  const [devices, activeAlerts, todayAlerts] = await Promise.all([
    prisma.deviceStatus.findMany({
      where: { device: deviceWhere },
      select: { state: true }
    }),
    prisma.alert.count({
      where: { status: 'ACTIVE', ...alertWhere }
    }),
    prisma.alert.count({
      where: {
        triggeredAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        ...alertWhere
      }
    }),
  ])

  return {
    totalDevices: devices.length,
    normalDevices: devices.filter(d => d.state === 0).length,
    alertDevices: devices.filter(d => d.state === 1).length,
    warningDevices: devices.filter(d => d.state === 2).length,
    offlineDevices: devices.filter(d => d.state === -1 || d.state === null).length,
    activeAlerts,
    todayAlerts,
  }
}

export const getAlertsChartData = async (locationIds: string[] | null) => {
  let accessibleIds: string[] | undefined
  if (locationIds !== null) {
    accessibleIds = await getAccessibleLocationIds(locationIds)
  }

  const deviceFilter = accessibleIds ? { device: { locationId: { in: accessibleIds } } } : {}

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  return Promise.all(days.map(async (day) => {
    const nextDay = new Date(day)
    nextDay.setDate(nextDay.getDate() + 1)

    const [fire, warning] = await Promise.all([
      prisma.alert.count({
        where: { alertType: 'FIRE', triggeredAt: { gte: day, lt: nextDay }, ...deviceFilter }
      }),
      prisma.alert.count({
        where: { alertType: 'WARNING', triggeredAt: { gte: day, lt: nextDay }, ...deviceFilter }
      })
    ])

    return { date: day.toISOString().split('T')[0], alert: fire, warning }
  }))
}

export const getDeviceStatusData = async (locationIds: string[] | null) => {
  let accessibleIds: string[] | undefined
  if (locationIds !== null) {
    accessibleIds = await getAccessibleLocationIds(locationIds)
  }

  const where = accessibleIds ? { device: { locationId: { in: accessibleIds } } } : {}

  const statuses = await prisma.deviceStatus.findMany({
    where,
    select: { state: true }
  })

  const countMap: Record<number, number> = { '-1': 0, 0: 0, 1: 0, 2: 0 }
  statuses.forEach(s => {
    const key = s.state ?? 0
    countMap[key] = (countMap[key] || 0) + 1
  })

  return Object.entries(countMap)
    .map(([state, count]) => ({ state: parseInt(state), count }))
    .filter(d => d.count > 0)
}