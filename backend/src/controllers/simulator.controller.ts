import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../utils/response'
import { catchAsync } from '../utils/catchAsync'
import prisma from '../utils/prisma'
import mqtt from 'mqtt'

const mqttClient = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://127.0.0.1:1883')

const publishDevice = (thingId: string, sensors: any[]) => {
  const payload = JSON.stringify({
    thingId,
    status: {
      updated_at: new Date().toISOString(),
      sensors
    }
  })
  mqttClient.publish(`devices/${thingId}`, payload)
}

const SENSORS = {
  normal: (t = Date.now() / 1000) => [
    { n: '7',  v: Math.floor(Math.random() * 30) + 15, t },
    { n: '8',  v: Math.floor(Math.random() * 8)  + 22, t },
    { n: '9',  v: Math.floor(Math.random() * 30) + 60, t },
    { n: '6',  v: Math.floor(Math.random() * 5)  + 5,  t },
    { n: '10', v: Math.floor(Math.random() * 4)  + 18, t },
    { n: '11', v: 0, t },
  ],
  fire: (t = Date.now() / 1000) => [
    { n: '7',  v: Math.floor(Math.random() * 100) + 280, t },
    { n: '8',  v: Math.floor(Math.random() * 20)  + 70,  t },
    { n: '9',  v: Math.floor(Math.random() * 30)  + 50,  t },
    { n: '6',  v: Math.floor(Math.random() * 5)   + 5,   t },
    { n: '10', v: Math.floor(Math.random() * 4)   + 18,  t },
    { n: '11', v: 1, t },
  ],
  warning: (t = Date.now() / 1000) => [
    { n: '7',  v: Math.floor(Math.random() * 50) + 150, t },
    { n: '8',  v: Math.floor(Math.random() * 15) + 50,  t },
    { n: '9',  v: Math.floor(Math.random() * 30) + 50,  t },
    { n: '6',  v: Math.floor(Math.random() * 5)  + 5,   t },
    { n: '10', v: Math.floor(Math.random() * 4)  + 18,  t },
    { n: '11', v: 2, t },
  ],
}

// Trigger 1 thiết bị
export const triggerDevice = catchAsync(async (req: Request, res: Response) => {
  const { deviceId, action } = req.body
  if (!deviceId || !action) return sendError(res, 'Thiếu deviceId hoặc action')

  const device = await prisma.device.findUnique({ where: { id: deviceId } })
  if (!device) return sendError(res, 'Không tìm thấy thiết bị', 404)

  if (action === 'offline') {
    await prisma.deviceStatus.update({
      where: { deviceId },
      data: { state: -1, stateUpdatedAt: new Date() }
    })
    return sendSuccess(res, null, 'Đã set offline')
  }

  const sensors = action === 'fire' ? SENSORS.fire()
    : action === 'warning' ? SENSORS.warning()
    : SENSORS.normal()

  publishDevice(device.thingId, sensors)
  return sendSuccess(res, null, `Đã gửi MQTT: ${action}`)
})

// Trigger tất cả thiết bị
export const triggerAll = catchAsync(async (req: Request, res: Response) => {
  const { action } = req.body
  if (!action) return sendError(res, 'Thiếu action')

  const devices = await prisma.device.findMany({ select: { id: true, thingId: true } })

  if (action === 'offline') {
    await prisma.deviceStatus.updateMany({
      where: { deviceId: { in: devices.map(d => d.id) } },
      data: { state: -1, stateUpdatedAt: new Date() }
    })
    return sendSuccess(res, null, `Đã set offline ${devices.length} thiết bị`)
  }

  devices.forEach(device => {
    const sensors = action === 'fire' ? SENSORS.fire()
      : action === 'warning' ? SENSORS.warning()
      : SENSORS.normal()
    publishDevice(device.thingId, sensors)
  })

  return sendSuccess(res, null, `Đã gửi MQTT ${action} cho ${devices.length} thiết bị`)
})