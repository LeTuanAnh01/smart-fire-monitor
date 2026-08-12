import prisma from '../utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import { getAccessibleLocationIds } from './location.service'

export const findDevices = async (filters: {
  locationIds: string[] | null
  locationId?: string
  search?: string
  states?: number[]
  page: number
  limit: number
}) => {
  const { locationIds, locationId, search, states, page, limit } = filters

  // Lấy tất cả locationIds có thể truy cập (bao gồm descendants)
  let accessibleIds: string[] | undefined
  if (locationId) {
    // Filter theo 1 location cụ thể + descendants
    accessibleIds = await getAccessibleLocationIds([locationId])
  } else if (locationIds !== null) {
    accessibleIds = await getAccessibleLocationIds(locationIds)
  }

  const where: any = {
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
    ...(accessibleIds && { locationId: { in: accessibleIds } }),
    ...(states && states.length > 0 && {
      status: { state: { in: states } }
    })
  }

  const [devices, total] = await Promise.all([
    prisma.device.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { status: { state: 'desc' } },
        { name: 'asc' }
      ],
      include: {
        status: true,
        location: {
          include: { parent: { include: { parent: true } } }
        }
      }
    }),
    prisma.device.count({ where })
  ])

  const items = devices.map(d => ({
    id: d.id,
    thingId: d.thingId,
    extId: d.extId,
    name: d.name,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    status: d.status ? {
      smokeLevel: d.status.smokeLevel,
      smokeUpdatedAt: d.status.smokeUpdatedAt,
      temperature: d.status.temperature,
      temperatureUpdatedAt: d.status.temperatureUpdatedAt,
      batteryLevel: d.status.batteryLevel,
      batteryUpdatedAt: d.status.batteryUpdatedAt,
      wifiSignal: d.status.wifiSignal,
      wifiUpdatedAt: d.status.wifiUpdatedAt,
      powerVoltage: d.status.powerVoltage,
      powerUpdatedAt: d.status.powerUpdatedAt,
      state: d.status.state,
      stateUpdatedAt: d.status.stateUpdatedAt,
      lastSyncAt: d.status.lastSyncAt,
    } : null,
    location: {
      id: d.location.id,
      name: d.location.name,
      code: d.location.code,
      parent: d.location.parent ? {
        id: d.location.parent.id,
        name: d.location.parent.name,
        parent: d.location.parent.parent ? {
          id: d.location.parent.parent.id,
          name: d.location.parent.parent.name,
        } : null
      } : null
    }
  }))

  return { items, total }
}

export const findDeviceById = async (id: string) => {
  return prisma.device.findUnique({
    where: { id },
    include: {
      status: true,
      location: { include: { parent: { include: { parent: true } } } },
      alerts: { orderBy: { triggeredAt: 'desc' }, take: 10 }
    }
  })
}

export const createDevice = async (data: {
  locationId: string
  extId: string
  name: string
}): Promise<{ success: boolean; message: string; data?: any }> => {
  const existing = await prisma.device.findUnique({ where: { extId: data.extId } })
  if (existing) return { success: false, message: `Ext ID "${data.extId}" đã tồn tại` }

  const device = await prisma.device.create({
    data: {
      locationId: data.locationId,
      thingId: uuidv4(),
      thingKey: uuidv4(),
      extId: data.extId,
      name: data.name,
    },
    include: { status: true }
  })
  return { success: true, message: 'Thêm thiết bị thành công', data: device }
}

export const updateDevice = async (id: string, data: { name?: string; locationId?: string }) => {
  return prisma.device.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.locationId && { locationId: data.locationId }),
    },
    include: { status: true, location: true }
  })
}

export const deleteDevice = async (id: string) => {
  return prisma.device.delete({ where: { id } })
}

export const findDeviceLogs = async (filters: {
  deviceId: string
  metric?: string
  from?: string
  to?: string
  limit: number
  page?: number
}) => {
  const { deviceId, metric, from, to, limit, page = 1 } = filters

  const where: any = {
    deviceId,
    ...(metric && { metric: metric as any }),
    ...(from && to && { recordedAt: { gte: new Date(from), lte: new Date(to) } })
  }

  const [logs, total] = await Promise.all([
    prisma.sensorLog.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 2000),
    }),
    prisma.sensorLog.count({ where })
  ])

  return { items: logs.reverse(), total, page, limit }
}