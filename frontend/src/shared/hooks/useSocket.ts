import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { notification } from 'antd'
import { useAuth } from '../context/AuthContext'

export default function SocketProvider() {
  const { user } = useAuth()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Nếu đã có socket thì không tạo lại
    if (socketRef.current?.connected) return
    if (!user) return

    const socket = io(import.meta.env.VITE_SOCKET_URL || '', {  // '' = same origin
      path: '/socket.io',
      reconnection: true,
      reconnectionDelay: 2000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      socket.emit('join-locations', user.locationIds || [])
    })

    socket.on('active-fire-alerts', (alerts: any[]) => {
      alerts.forEach((alert, i) => {
        setTimeout(() => {
          notification.error({
            message: `🔥 Đang có cháy — ${alert.device?.name || 'Thiết bị'}`,
            description: alert.location?.path || alert.location?.name || '—',
            duration: 0,
            key: `fire-active-${alert.id}`,
          })
        }, i * 500)  // stagger 500ms để không hiện cùng lúc
      })
    })

    socket.on('new-alert', (data: any) => {
      const { alertType, isCritical, device, location, alert } = data

      const ALERT_MESSAGES: Record<string, string> = {
        FIRE:        '🚨 Phát hiện cháy!',
        WARNING:     '⚠️ Cảnh báo từ thiết bị',
        LOW_BATTERY: '🔋 Pin thiết bị yếu',
        WEAK_SIGNAL: '📶 Tín hiệu yếu',
        OFFLINE:     '📵 Thiết bị mất kết nối',
      }

      const desc = `${device.name} · ${location?.path || location?.name || '—'}`

      if (isCritical) {
        notification.error({
          key: `alert-${alert.id}`,
          title: ALERT_MESSAGES[alertType] || '🚨 Phát hiện cháy!',
          description: desc,
          duration: 10,
          placement: 'topRight',
        })
      } else {
        notification.warning({
          key: `alert-${alert.id}`,
          title: ALERT_MESSAGES[alertType] || '⚠️ Cảnh báo',
          description: desc,
          duration: 8,
          placement: 'topRight',
        })
      }

      window.dispatchEvent(new CustomEvent('new-alert', { detail: data }))
    })

    notification.config({ maxCount: 1 })

    socket.on('sensor-update', (data: any) => {
      window.dispatchEvent(new CustomEvent('sensor-update', { detail: data }))
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])

  return null
}