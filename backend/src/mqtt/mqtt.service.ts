import mqtt from 'mqtt'
import prisma from '../utils/prisma'
import { emitToRoom } from '../socket/socket.service'
import { SensorMetric } from '@prisma/client'

const SENSOR_MAP: Record<string, { field: string; updatedField: string; metric: string }> = {
  '8':  { field: 'temperature',  updatedField: 'temperatureUpdatedAt', metric: 'TEMPERATURE' },
  '7':  { field: 'smokeLevel',   updatedField: 'smokeUpdatedAt',       metric: 'SMOKE' },
  '9':  { field: 'batteryLevel', updatedField: 'batteryUpdatedAt',     metric: 'BATTERY' },
  '6':  { field: 'wifiSignal',   updatedField: 'wifiUpdatedAt',        metric: 'WIFI' },
  '10': { field: 'powerVoltage', updatedField: 'powerUpdatedAt',       metric: 'POWER' },
  '11': { field: 'state',        updatedField: 'stateUpdatedAt',       metric: 'STATE' },
}

const LOW_BATTERY_THRESHOLD = 16
const WEAK_SIGNAL_THRESHOLD = 3
const OFFLINE_THRESHOLD_MS = 30 * 60 * 1000

// Lấy tên đường dẫn location
const getLocationPath = (location: any): string => {
  const parts = []
  if (location?.parent?.parent?.parent?.name) parts.push(location.parent.parent.parent.name)
  if (location?.parent?.parent?.name) parts.push(location.parent.parent.name)
  if (location?.parent?.name) parts.push(location.parent.name)
  if (location?.name) parts.push(location.name)
  return parts.join(' → ')
}

// Lấy root locationId để emit socket
const getRootLocationId = (location: any): string => {
  if (!location) return ''
  if (location.parent?.parent?.parent) return location.parent.parent.parent.id
  if (location.parent?.parent) return location.parent.parent.id
  if (location.parent) return location.parent.id
  return location.id
}

export const initMQTT = () => {
  const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://127.0.0.1:1883')

  client.on('connect', () => {
    console.log('📡 MQTT connected to EMQX')
    client.subscribe('devices/#', (err) => {
      if (err) console.error('MQTT subscribe error:', err)
      else console.log('📥 Subscribed to devices/#')
    })
  })

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString())

      const device = await prisma.device.findUnique({
        where: { thingId: payload.thingId },
        include: {
          status: true,
          location: {
            include: {
              parent: {
                include: {
                  parent: {
                    include: { parent: true }
                  }
                }
              }
            }
          }
        }
      })

      if (!device) {
        console.warn(`⚠️ Device not found: ${payload.thingId}`)
        return
      }

      const locationId = device.locationId
      const rootId = getRootLocationId(device.location)
      const locationPath = getLocationPath(device.location)
      const sensors = payload.status?.sensors || []

      const statusUpdate: any = { lastSyncAt: new Date() }
      const logsToCreate: {
        deviceId: string
        metric: SensorMetric
        value: number
        recordedAt: Date
      }[] = []

      for (const sensor of sensors) {
        const mapping = SENSOR_MAP[sensor.n]
        if (!mapping) continue
        statusUpdate[mapping.field] = sensor.v
        statusUpdate[mapping.updatedField] = new Date(sensor.t * 1000)
        logsToCreate.push({
          deviceId: device.id,
          metric: mapping.metric as SensorMetric,
          value: sensor.v,
          recordedAt: new Date(sensor.t * 1000),
        })
      }

      // 1. Upsert device_status
      const updatedStatus = await prisma.deviceStatus.upsert({
        where: { deviceId: device.id },
        create: { deviceId: device.id, ...statusUpdate },
        update: statusUpdate,
      })

      // 2. Lưu sensor logs
      if (logsToCreate.length > 0) {
        await prisma.sensorLog.createMany({ data: logsToCreate })
      }

      // 3. Emit sensor-update realtime
      emitToRoom(rootId, 'sensor-update', {
        deviceId: device.id,
        status: updatedStatus,
      })

      // 4. Xử lý alerts
      await handleAlerts(device, updatedStatus, rootId, locationPath)

    } catch (err) {
      console.error('MQTT message error:', err)
    }
  })

  client.on('error', (err) => console.error('MQTT error:', err))
  client.on('offline', () => console.warn('⚠️ MQTT offline'))
}

const handleAlerts = async (
  device: any,
  status: any,
  rootId: string,
  locationPath: string
) => {
  const alerts: { type: string; state?: number; value?: number; message: string }[] = []

  if (status.state === 1) alerts.push({ type: 'FIRE', state: 1, message: 'Phát hiện cháy!' })
  if (status.state === 2) alerts.push({ type: 'WARNING', state: 2, message: 'Thiết bị cảnh báo' })
  if (status.powerVoltage !== null && status.powerVoltage < LOW_BATTERY_THRESHOLD) {
    alerts.push({ type: 'LOW_BATTERY', value: status.powerVoltage, message: `Pin yếu (${status.powerVoltage}V)` })
  }
  if (status.wifiSignal !== null && status.wifiSignal <= WEAK_SIGNAL_THRESHOLD) {
    alerts.push({ type: 'WEAK_SIGNAL', value: status.wifiSignal, message: `Sóng yếu (${status.wifiSignal})` })
  }

  for (const alert of alerts) {
    const cooldownMinutes = alert.type === 'FIRE' ? 5 : 30
    const cooldownTime = new Date(Date.now() - cooldownMinutes * 60 * 1000)

    const recentAlert = await prisma.alert.findFirst({
      where: {
        deviceId: device.id,
        alertType: alert.type as any,
        triggeredAt: { gte: cooldownTime }
      },
      orderBy: { triggeredAt: 'desc' }
    })

    if (!recentAlert) {
      const created = await prisma.alert.create({
        data: {
          deviceId: device.id,
          alertType: alert.type as any,
          state: alert.state ?? undefined,
          value: alert.value ?? undefined,
          status: 'ACTIVE',
        }
      })

      const isCritical = alert.type === 'FIRE'
      console.log(`${isCritical ? '🚨' : '⚠️'} Alert [${alert.type}] — ${device.name}: ${alert.message}`)

      emitToRoom(rootId, 'new-alert', {
        alert: created,
        alertType: alert.type,
        message: alert.message,
        isCritical,
        device: { id: device.id, name: device.name },
        location: { path: locationPath }
      })
    }
  }
}

export const checkOfflineDevices = async () => {
  const cutoff = new Date(Date.now() - OFFLINE_THRESHOLD_MS)

  const staleStatuses = await prisma.deviceStatus.findMany({
    where: {
      lastSyncAt: { lt: cutoff },
      state: { not: -1 },
    },
    include: {
      device: {
        include: {
          location: {
            include: {
              parent: {
                include: { parent: true }
              }
            }
          }
        }
      }
    }
  })

  for (const status of staleStatuses) {
    if (status.state === 1) continue

    await prisma.deviceStatus.update({
      where: { id: status.id },
      data: { state: -1, stateUpdatedAt: new Date() }
    })

    const rootId = getRootLocationId(status.device.location)
    const locationPath = getLocationPath(status.device.location)

    const cooldownTime = new Date(Date.now() - 60 * 60 * 1000)
    const recentOfflineAlert = await prisma.alert.findFirst({
      where: {
        deviceId: status.deviceId,
        alertType: 'OFFLINE',
        triggeredAt: { gte: cooldownTime }
      }
    })

    if (!recentOfflineAlert) {
      const created = await prisma.alert.create({
        data: {
          deviceId: status.deviceId,
          alertType: 'OFFLINE',
          status: 'ACTIVE',
        }
      })

      console.log(`📵 Alert [OFFLINE] — ${status.device.name}`)

      emitToRoom(rootId, 'new-alert', {
        alert: created,
        alertType: 'OFFLINE',
        message: 'Thiết bị mất kết nối',
        isCritical: false,
        device: { id: status.device.id, name: status.device.name },
        location: { path: locationPath }
      })
    }
  }
}