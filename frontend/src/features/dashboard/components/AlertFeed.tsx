import { Card, Button, Empty, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert } from '@/shared/types'
import { AlertTypeBadge } from '@/features/alerts/components/AlertBadge'
import api from '@/shared/api/axios'

// const STATE_COLORS: Record<string, string> = {
//   FIRE:        'red',
//   WARNING:     'orange',
//   LOW_BATTERY: 'gold',
//   WEAK_SIGNAL: 'blue',
//   OFFLINE:     'default',
// }

export default function AlertFeed() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [resolving, setResolving] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts', {
        params: { limit: 10, status: 'ACTIVE' }
      })
      setAlerts(res.data.data.items)
    } catch {}
  }

  const handleResolve = async (id: string) => {
    setResolving(id)
    try {
      await api.put(`/alerts/${id}/resolve`)
      fetchAlerts()
    } catch {} finally {
      setResolving(null)
    }
  }

  useEffect(() => {
    fetchAlerts()
    const handler = () => fetchAlerts()
    window.addEventListener('new-alert', handler)
    return () => window.removeEventListener('new-alert', handler)
  }, [])

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <span>Cảnh báo đang hoạt động</span>
          {alerts.length > 0 && (
            <Tag color="red">{alerts.length}</Tag>
          )}
        </div>
      }
      className="shadow-sm"
      extra={
        <Button type="link" onClick={() => navigate('/alerts')}>
          Xem tất cả →
        </Button>
      }
    >
      {alerts.length === 0 ? (
        <Empty
          description="Không có cảnh báo nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                alert.alertType === 'FIRE'
                  ? 'bg-red-50 border-red-100'
                  : alert.alertType === 'WARNING'
                  ? 'bg-yellow-50 border-yellow-100'
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{alert.device.name}</span>
                  <AlertTypeBadge alertType={alert.alertType} />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {alert.location?.path || alert.location?.name || '—'}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {new Date(alert.triggeredAt).toLocaleString('vi-VN')}
                </div>
              </div>
              <Button
                size="small"
                loading={resolving === alert.id}
                onClick={() => handleResolve(alert.id)}
              >
                Xử lý xong
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}