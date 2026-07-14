import { Typography, Card } from 'antd'
import AlertFilters from './components/AlertFilters'
import AlertTable from './components/AlertTable'
import { useAlerts } from './hooks/useAlerts'

const { Title } = Typography

export default function Alerts() {
  const { data, filters, setFilters, loading, refresh, acknowledge, resolve } = useAlerts()

  return (
    <div>
      <Title level={4} className="!mb-6">Cảnh báo</Title>

      <Card className="shadow-sm">
        <AlertFilters
          onChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          onRefresh={refresh}
          loading={loading}
        />
        <AlertTable
          data={data.items}
          total={data.total}
          page={filters.page}
          limit={filters.limit}
          loading={loading}
          onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          onAcknowledge={acknowledge}
          onResolve={resolve}
        />
      </Card>
    </div>
  )
}