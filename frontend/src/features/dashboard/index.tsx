import { Row, Col,Spin } from 'antd'
import {
  AlertOutlined, CheckCircleOutlined,
  WarningOutlined, DisconnectOutlined, BellOutlined
} from '@ant-design/icons'
import StatCard from './components/StatCard'
import AlertsBarChart from './components/AlertsBarChart'
import DeviceStatusPieChart from './components/DeviceStatusPieChart'
import AlertFeed from './components/AlertFeed'
import { useDashboard } from './hooks/useDashboard'



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
            iconColor={overview?.alertDevices ? '#fff' : '#ff4d4f'}
            valueColor={overview?.alertDevices ? '#fff' : '#ff4d4f'}
            sub={overview?.alertDevices ? 'Có thiết bị đang cháy!' : 'Không có thiết bị cháy'}
            subColor={overview?.alertDevices ? '#fecaca' : '#6b7280'}
            bgColor={overview?.alertDevices ? '#dc2626' : undefined}
            pulse={!!overview?.alertDevices}
          />
        </Col>

        <Col xs={12} sm={12} lg={4}>
          <StatCard
            title="Cảnh báo"
            value={overview?.warningDevices || 0}
            icon={<WarningOutlined />}
            iconColor={overview?.warningDevices ? '#fff' : '#faad14'}
            valueColor={overview?.warningDevices ? '#fff' : '#faad14'}
            sub={overview?.warningDevices ? 'Cần kiểm tra' : 'Không có cảnh báo'}
            subColor={overview?.warningDevices ? '#fef08a' : '#6b7280'}
            bgColor={overview?.warningDevices ? '#d97706' : undefined}
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

        <Col xs={12} sm={12} lg={6}>
          <StatCard
            title="Cảnh báo hôm nay"
            value={overview?.todayAlerts || 0}
            icon={<BellOutlined />}
            iconColor="#1677ff"
            valueColor="#1677ff"
            sub={`${overview?.activeAlerts || 0} chưa xử lý`}
            subColor={overview?.activeAlerts ? '#ff4d4f' : '#6b7280'}
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