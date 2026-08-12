import { Button, Badge, Dropdown, Avatar, Typography, Space, Tag } from 'antd'
import {
  BellOutlined, UserOutlined, LogoutOutlined, IdcardOutlined
} from '@ant-design/icons'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import api from '@/shared/api/axios'
import ProfileModal from '@/features/auth/components/ProfileModal'
import { AlertTypeBadge } from '@/features/alerts/components/AlertBadge'

const { Text } = Typography
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

export default function Topbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<any[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(getReadIds)
  const [showProfile, setShowProfile] = useState(false)
  const [total, setTotal] = useState(0)

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get('/alerts', { params: { status: 'ACTIVE', limit: 100 } })
      setAlerts(res.data.data.items)
      setTotal(res.data.data.total)
    } catch {}
  }, [])

  useEffect(() => {
    fetchAlerts()
    const handler = (e: any) => {
      const alertId = e.detail?.alert?.id
      if (alertId) {
        setReadIds(prev => {
          const next = new Set(prev)
          next.delete(alertId)
          saveReadIds(next)
          return next
        })
      }
      fetchAlerts()
    }
    window.addEventListener('new-alert', handler)
    return () => window.removeEventListener('new-alert', handler)
  }, [fetchAlerts])

  const unreadCount = alerts.filter(a => !readIds.has(a.id)).length

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

  const bellDropdown = {
    items: [
      {
        key: 'header',
        label: (
          <div className="flex items-center justify-between py-1 px-1 min-w-[320px]">
            <div className="flex items-center gap-2">
              <Text strong>Cảnh báo</Text>
              {unreadCount > 0 && (
                <Tag color="red" className="m-0">{unreadCount} mới</Tag>
              )}
            </div>
            {unreadCount > 0 && (
              <Button size="small" type="text"
                onClick={(e) => { e.stopPropagation(); markAllRead() }}
              >
                Đọc tất cả
              </Button>
            )}
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' as const },
      ...(alerts.length === 0 ? [{
        key: 'empty',
        label: (
          <div className="py-4 text-center text-gray-400 text-sm">
            Không có cảnh báo nào
          </div>
        ),
        disabled: true,
      }] : alerts.slice(0, 10).map(a => {
        const isRead = readIds.has(a.id)
        return {
          key: a.id,
          label: (
            <div className={`flex items-start gap-2 py-1 rounded ${!isRead ? 'bg-gray-100' : ''}`}>
              <div className="mt-1.5 flex-shrink-0">
                {!isRead
                  ? <div className="w-2 h-2 rounded-full bg-red-500" />
                  : <div className="w-2 h-2" />
                }
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5">
                  <AlertTypeBadge alertType={a.alertType} />
                </div>
                <div className={`text-xs truncate ${!isRead ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                  {a.device?.name}
                </div>
                <div className="text-xs text-gray-400 truncate max-w-[260px]">
                  {a.location?.path || a.location?.name}
                </div>
                <div className="text-xs text-gray-300 mt-0.5">
                  {new Date(a.triggeredAt).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>
          ),
          onClick: () => { markRead(a.id); navigate('/alerts') },
        }
      })),
      { type: 'divider' as const },
      {
        key: 'view-all',
        label: (
          <div className="text-center text-blue-500 text-sm py-1">
            Xem tất cả {total > 10 ? `(${total} cảnh báo)` : 'cảnh báo'} →
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
        >
          <Badge count={unreadCount} size="small" overflowCount={99}>
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

      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  )
}