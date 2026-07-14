import { Row, Col, Typography, Spin } from 'antd'
import {
  AlertOutlined, CheckCircleOutlined,
  WarningOutlined, DisconnectOutlined, BellOutlined
} from '@ant-design/icons'
import StatCard from './components/StatCard'
import AlertsBarChart from './components/AlertsBarChart'
import DeviceStatusPieChart from './components/DeviceStatusPieChart'
import AlertFeed from './components/AlertFeed'
import { useDashboard } from './hooks/useDashboard'

const { Title } = Typography

export default function Dashboard() {
  const { overview, alertsChart, deviceStatus, loading } = useDashboard()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Title level={4} className="!mb-6">Dashboard</Title>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={12} lg={5}>
          <StatCard
            title="Tổng thiết bị"
            value={overview?.totalDevices || 0}
            icon={<CheckCircleOutlined />}
            iconColor="#52c41a"
            sub={`${overview?.normalDevices || 0} bình thường`}
            subColor="#52c41a"
          />
        </Col>
        <Col xs={12} sm={12} lg={5}>
          <StatCard
            title="Nguy hiểm"
            value={overview?.alertDevices || 0}
            icon={<AlertOutlined />}
            iconColor="#ff4d4f"
            valueColor="#ff4d4f"
            sub={`${overview?.warningDevices || 0} đang cảnh báo`}
            subColor="#faad14"
          />
        </Col>
        <Col xs={12} sm={12} lg={4}>
          <StatCard
            title="Offline"
            value={overview?.offlineDevices || 0}
            icon={<DisconnectOutlined />}
            iconColor="#8c8c8c"
            valueColor="#8c8c8c"
            sub="thiết bị mất kết nối"
            subColor="#8c8c8c"
          />
        </Col>
        <Col xs={12} sm={12} lg={5}>
          <StatCard
            title="Cảnh báo hôm nay"
            value={overview?.todayAlerts || 0}
            icon={<BellOutlined />}
            iconColor="#1677ff"
            valueColor="#1677ff"
            sub={`${overview?.activeAlerts || 0} chưa xử lý`}
            subColor="#ff4d4f"
          />
        </Col>
        <Col xs={12} sm={12} lg={5}>
          <StatCard
            title="Đang xử lý"
            value={overview?.activeAlerts || 0}
            icon={<WarningOutlined />}
            iconColor="#faad14"
            valueColor="#faad14"
            sub="cảnh báo đang active"
            subColor="#faad14"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={15}>
          <AlertsBarChart data={alertsChart} />
        </Col>
        <Col xs={24} lg={9}>
          <DeviceStatusPieChart data={deviceStatus} />
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <AlertFeed />
        </Col>
      </Row>
    </div>
  )
}