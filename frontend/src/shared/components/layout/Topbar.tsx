import { Button, Badge, Dropdown, Avatar, Typography, Space } from 'antd'
import {
  BellOutlined, UserOutlined, LogoutOutlined,
  IdcardOutlined, CheckOutlined
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import api from '@/shared/api/axios'
import ProfileModal from '@/features/auth/components/ProfileModal'

const { Text } = Typography

export default function Topbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [alertCount, setAlertCount] = useState(0)
  const [recentAlerts, setRecentAlerts] = useState<any[]>([])
  const [showProfile, setShowProfile] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchAlertCount = async () => {
    try {
      const res = await api.get('/alerts', { params: { status: 'ACTIVE', limit: 5 } })
      setAlertCount(res.data.data.total)
      setRecentAlerts(res.data.data.items)
    } catch {}
  }

  useEffect(() => {
    fetchAlertCount()
    const handler = () => fetchAlertCount()
    window.addEventListener('new-alert', handler)
    return () => window.removeEventListener('new-alert', handler)
  }, [])

  const markAllResolved = async () => {
    setMarkingAll(true)
    try {
      // Lấy tất cả alert ACTIVE
      const res = await api.get('/alerts', { params: { status: 'ACTIVE', limit: 1000 } })
      const items = res.data.data.items
      // Resolve tất cả
      await Promise.all(items.map((a: any) =>
        api.put(`/alerts/${a.id}/resolve`)
      ))
      setAlertCount(0)
      setRecentAlerts([])
    } catch (err) {
      console.error(err)
    } finally {
      setMarkingAll(false)
    }
  }

  const ALERT_LABELS: Record<string, string> = {
    FIRE:        '🔴 Cháy',
    WARNING:     '⚠️ Cảnh báo',
    LOW_BATTERY: '🔋 Pin yếu',
    WEAK_SIGNAL: '📶 Sóng yếu',
    OFFLINE:     '📵 Mất kết nối',
  }

  const bellDropdown = {
    items: [
      {
        key: 'header',
        label: (
          <div className="flex items-center justify-between py-1 px-1 min-w-[320px]">
            <Text strong>Cảnh báo đang xảy ra ({alertCount})</Text>
            {alertCount > 0 && (
              <Button
                size="small"
                icon={<CheckOutlined />}
                loading={markingAll}
                onClick={(e) => { e.stopPropagation(); markAllResolved() }}
              >
                Xử lý tất cả
              </Button>
            )}
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' as const },
      ...(recentAlerts.length === 0 ? [{
        key: 'empty',
        label: <div className="py-4 text-center text-gray-400 text-sm">Không có cảnh báo</div>,
        disabled: true,
      }] : recentAlerts.map(a => ({
        key: a.id,
        label: (
          <div className="py-1">
            <div className="font-medium text-sm">
              {ALERT_LABELS[a.alertType] || a.alertType}
            </div>
            <div className="text-xs text-gray-500">{a.device?.name}</div>
            <div className="text-xs text-gray-400">{a.location?.path || a.location?.name}</div>
          </div>
        ),
        onClick: () => navigate('/alerts'),
      }))),
      { type: 'divider' as const },
      {
        key: 'view-all',
        label: (
          <div className="text-center text-blue-500 text-sm py-1">
            Xem tất cả cảnh báo →
          </div>
        ),
        onClick: () => navigate('/alerts'),
      }
    ]
  }

  const userMenuItems = [
    {
      key: 'profile-header',
      label: (
        <div className="py-1 px-1">
          <Text strong className="block">{user?.fullName}</Text>
          <Text type="secondary" className="text-xs">{user?.email}</Text>
          <Text type="secondary" className="text-xs block">
            {isAdmin ? 'Admin' : 'Quản lý tòa nhà'}
          </Text>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'profile',
      icon: <IdcardOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => setShowProfile(true),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => { logout(); navigate('/login') },
    },
  ]

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
      <div />

      <Space size="middle">
        <Dropdown
          menu={bellDropdown}
          placement="bottomRight"
          trigger={['click']}
          styles={{ root: { minWidth: 340 } }}
          //overlayStyle={{ minWidth: 340 }}
        >
          <Badge count={alertCount} size="small" overflowCount={99}>
            <Button icon={<BellOutlined />} type="text" />
          </Badge>
        </Dropdown>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space className="cursor-pointer">
            <Avatar icon={<UserOutlined />} className="bg-red-500" />
            <Text className="hidden md:block">{user?.fullName}</Text>
          </Space>
        </Dropdown>
      </Space>

      <ProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  )
}