import { Tag } from 'antd'
import { AlertStatus, AlertType } from '@/shared/types'

const ALERT_TYPE_CONFIG: Record<AlertType, { label: string; color: string }> = {
  FIRE:        { label: '🔴 Cháy',        color: 'error'   },
  WARNING:     { label: '🟡 Cảnh báo',    color: 'warning' },
  LOW_BATTERY: { label: '🔋 Pin yếu',     color: 'warning' },
  WEAK_SIGNAL: { label: '📶 Sóng yếu',    color: 'warning' },
  OFFLINE:     { label: '📵 Mất kết nối', color: 'default' },
}

export const AlertTypeBadge = ({ alertType }: { alertType: AlertType }) => {
  const config = ALERT_TYPE_CONFIG[alertType] ?? { label: alertType, color: 'default' }
  return <Tag color={config.color}>{config.label}</Tag>
}

export const StatusBadge = ({ status }: { status: AlertStatus }) => {
  const config = {
    ACTIVE:       { color: 'error',   label: 'Đang xảy ra' },
    ACKNOWLEDGED: { color: 'warning', label: 'Đã xác nhận' },
    RESOLVED:     { color: 'success', label: 'Đã xử lý'    },
  }
  const { color, label } = config[status]
  return <Tag color={color}>{label}</Tag>
}