import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth.routes'
import deviceRoutes from './routes/device.routes'
import alertRoutes from './routes/alert.routes'
import userRoutes from './routes/user.routes'
import statsRoutes from './routes/stats.routes'
import { initSocket } from './socket/socket.service'
import { initMQTT, checkOfflineDevices } from './mqtt/mqtt.service'
import locationRoutes from './routes/location.routes'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const prisma = new PrismaClient()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/users', userRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/locations', locationRoutes)


app.get('/health', (_, res) => res.json({ status: 'ok' }))

// ── Global error handler ──
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err.message)
  res.status(500).json({ success: false, message: 'Lỗi server', code: 'INTERNAL_ERROR' })
})

setInterval(checkOfflineDevices, 5 * 60 * 1000)  // check mỗi 5 phút, threshold 30 phút

// ── Khởi động ──
initSocket(httpServer)
initMQTT()

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

export { httpServer }