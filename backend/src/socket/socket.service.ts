import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import prisma from '../utils/prisma'

let io: Server

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true }
  })

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`)

    const sendActiveFireAlerts = async (locationIds?: string[]) => {
  try {
    console.log('🔍 Checking active fire alerts...', { locationIds })
    const where: any = {
      status: 'ACTIVE',
      alertType: 'FIRE'
    }
    if (locationIds && locationIds.length > 0) {
      where.locationId = { in: locationIds }
    }

    const activeFireAlerts = await prisma.alert.findMany({
      where,
      include: {
        device: { select: { name: true, extId: true } },
        location: { select: { name: true, path: true } }
      },
      orderBy: { triggeredAt: 'desc' },
      take: 5
    })

    console.log('🔥 Found active fire alerts:', activeFireAlerts.length)
    if (activeFireAlerts.length > 0) {
      socket.emit('active-fire-alerts', activeFireAlerts)
    }
  } catch (err) {
    console.error('Error fetching active fire alerts:', err)
  }
}

    socket.on('join-locations', (locationIds: string[]) => {
      socket.join('superadmin-room')
      if (Array.isArray(locationIds) && locationIds.length > 0) {
        locationIds.forEach(id => socket.join(`room:${id}`))
      }
      console.log(`📌 ${socket.id} joined locations:`, locationIds)

      // Gửi ngay các FIRE alert đang active
      const isSuperAdmin = !locationIds || locationIds.length === 0
      sendActiveFireAlerts(isSuperAdmin ? undefined : locationIds)
    })

    socket.on('join-buildings', (ids: string[]) => {
      socket.join('superadmin-room')
      if (Array.isArray(ids) && ids.length > 0) {
        ids.forEach(id => socket.join(`room:${id}`))
      }
      console.log(`📌 ${socket.id} joined locations:`, ids)
      sendActiveFireAlerts(ids?.length > 0 ? ids : undefined)
    })

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
    })
  })

  console.log('🚀 Socket.IO initialized')
}

export const emitToRoom = (roomId: string, event: string, data: object) => {
  if (!roomId) return
  console.log(`📢 Emitting ${event} to room:${roomId}`)
  io.to(`room:${roomId}`).emit(event, data)
  io.to('superadmin-room').emit(event, data)
}

export const emitToBuilding = emitToRoom