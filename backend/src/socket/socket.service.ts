import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'

let io: Server

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true }
  })

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`)

    socket.on('join-locations', (locationIds: string[]) => {
      socket.join('superadmin-room')
      if (Array.isArray(locationIds) && locationIds.length > 0) {
        locationIds.forEach(id => socket.join(`room:${id}`))
      }
      console.log(`📌 ${socket.id} joined locations:`, locationIds)
    })

    // Giữ backward compat với FE cũ còn dùng join-buildings
    socket.on('join-buildings', (ids: string[]) => {
      socket.join('superadmin-room')
      if (Array.isArray(ids) && ids.length > 0) {
        ids.forEach(id => socket.join(`room:${id}`))
      }
      console.log(`📌 ${socket.id} joined locations:`, ids)
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

// Giữ alias cũ để không cần sửa chỗ khác
export const emitToBuilding = emitToRoom