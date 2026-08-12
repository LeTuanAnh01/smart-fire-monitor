import { Button, Empty, Tag } from 'antd'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert } from '@/shared/types'
import { AlertTypeBadge } from '@/features/alerts/components/AlertBadge'
import api from '@/shared/api/axios'

// Key lưu vào localStorage
const READ_KEY = 'sfm_read_alerts'

const getReadIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(READ_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

const saveReadIds = (ids: Set<string>) => {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
}

interface Props {
  onUnreadChange?: (count: number) => void
}

export default function AlertFeed({ onUnreadChange }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(getReadIds)
  const navigate = useNavigate()

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get('/alerts', {
        params: { limit: 10, status: 'ACTIVE' }
      })
      setAlerts(res.data.data.items)
    } catch {}
  }, [])

  // Tính số chưa đọc và notify ra ngoài
  useEffect(() => {
    const unread = alerts.filter(a => !readIds.has(a.id)).length
    onUnreadChange?.(unread)
  }, [alerts, readIds])

  // Khi có alert mới → tự động đánh dấu là chưa đọc (xóa khỏi readIds nếu có)
  useEffect(() => {
    const handler = (e: any) => {
      const alertId = e.detail?.alert?.id
      if (alertId) {
        setReadIds(prev => {
          const next = new Set(prev)
          next.delete(alertId) // alert mới → chưa đọc
          saveReadIds(next)
          return next
        })
      }
      fetchAlerts()
    }
    window.addEventListener('new-alert', handler)
    return () => window.removeEventListener('new-alert', handler)
  }, [fetchAlerts])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const markAllRead = () => {
    const next = new Set([...readIds, ...alerts.map(a => a.id)])
    saveReadIds(next)
    setReadIds(next)
  }

  const markRead = (id: string) => {
    const next = new Set(readIds)
    next.add(id)
    saveReadIds(next)
    setReadIds(next)
  }

  const unreadCount = alerts.filter(a => !readIds.has(a.id)).length

  return (
    <div className="w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Cảnh báo</span>
          {unreadCount > 0 && (
            <Tag color="red" className="m-0 text-xs">{unreadCount} mới</Tag>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button type="text" size="small" onClick={markAllRead}
              className="text-xs text-gray-500">
              Đọc tất cả
            </Button>
          )}
          <Button type="link" size="small" onClick={() => navigate('/alerts')}>
            Xem tất cả →
          </Button>
        </div>
      </div>

      {/* Danh sách */}
      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <Empty description="Không có cảnh báo nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="py-6"
          />
        ) : (
          <div>
            {alerts.map(alert => {
              const isRead = readIds.has(alert.id)
              return (
                <div
                  key={alert.id}
                  onClick={() => markRead(alert.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b cursor-pointer transition-colors hover:bg-gray-50 ${
                    isRead ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  {/* Dot chưa đọc */}
                  <div className="mt-1.5 flex-shrink-0">
                    {!isRead
                      ? <div className="w-2 h-2 rounded-full bg-red-500"/>
                      : <div className="w-2 h-2 rounded-full bg-transparent"/>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm ${isRead ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
                        {alert.device.name}
                      </span>
                      <AlertTypeBadge alertType={alert.alertType} />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {alert.location?.path || alert.location?.name || '—'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(alert.triggeredAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}