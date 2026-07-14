import { Menu, Typography } from 'antd'
import {
  DashboardOutlined,
  ApartmentOutlined,
  BellOutlined,
  AppstoreOutlined,
  HomeOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  FireOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'

const { Text } = Typography

const menuItems = [
  { key: '/dashboard',  icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/device-map', icon: <ApartmentOutlined />, label: 'Sơ đồ thiết bị' },
  { key: '/alerts',     icon: <BellOutlined />,      label: 'Cảnh báo' },
  { key: '/devices',    icon: <AppstoreOutlined />,  label: 'Thiết bị' },
  { key: '/locations',  icon: <HomeOutlined />,      label: 'Khu vực', adminOnly: true },
  { key: '/users',      icon: <TeamOutlined />,      label: 'Người dùng', hideForUser: true },
  { key: '/reports',    icon: <BarChartOutlined />,  label: 'Báo cáo' },
  { key: '/settings',   icon: <SettingOutlined />,   label: 'Cài đặt', adminOnly: true },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

const items = menuItems
  .filter(item => {
    if (item.adminOnly && !['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '')) return false
    if (item.hideForUser && user?.role === 'USER') return false
    return true
  })
  .map(({ key, icon, label }) => ({ key, icon, label }))

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-200">
        <FireOutlined className="text-2xl text-red-500" />
        <div>
          <Text strong className="block leading-tight">Smart Fire Monitor</Text>
          <Text type="secondary" className="text-xs">Quản lý báo cháy</Text>
        </div>
      </div>

      {/* Menu */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => navigate(key)}
        className="flex-1 border-none pt-2"
      />
    </div>
  )
}