import { Layout } from 'antd'
import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const { Sider, Header, Content } = Layout

export default function AppLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Redirect về login nếu chưa đăng nhập
  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  if (!user) return null

  return (
    <Layout className="min-h-screen">
      <Sider
        width={220}
        theme="light"
        className="shadow-sm"
      >
        <Sidebar />
      </Sider>

      <Layout>
        <Header className="!bg-white !px-0 !h-auto shadow-sm">
          <Topbar />
        </Header>

        <Content className="p-6 bg-gray-50 overflow-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}