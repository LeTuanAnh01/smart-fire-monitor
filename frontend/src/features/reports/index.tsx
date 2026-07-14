import { Typography, Card } from 'antd'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import ReportFilters from './components/ReportFilters'
import ReportTable from './components/ReportTable'
import { reportApi } from './api/report.api'
import { Alert } from '@/shared/types'

const { Title } = Typography

interface Filters {
  locationId?: string
  from?: string
  to?: string
  page: number
}

export default function Reports() {
  const [filters, setFilters] = useState<Filters>({
    from: dayjs().subtract(7, 'day').toISOString(),
    to: dayjs().toISOString(),
    page: 1,
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [chartRes, alertsRes] = await Promise.all([
        reportApi.getAlertsChart({ locationId: filters.locationId }),
        reportApi.getAlerts({
          locationId: filters.locationId,
          from: filters.from,
          to: filters.to,
          page: filters.page,
          limit: 20,
        }),
      ])

      const chart = chartRes.data.data.map((d: any) => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('vi-VN', {
          month: 'numeric', day: 'numeric'
        })
      }))
      setChartData(chart)
      setAlerts(alertsRes.data.data.items)
      setTotal(alertsRes.data.data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('Filters changed:', filters)
    fetchData()
  }, [filters])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await reportApi.getAlerts({
        locationId: filters.locationId,
        from: filters.from,
        to: filters.to,
        limit: 1000,
      })
      const data: Alert[] = res.data.data.items

      const ALERT_TYPE_LABELS: Record<string, string> = {
        FIRE:        'Cháy',
        WARNING:     'Cảnh báo thiết bị',
        LOW_BATTERY: 'Pin yếu',
        WEAK_SIGNAL: 'Sóng yếu',
        OFFLINE:     'Mất kết nối',
      }

      const headers = ['Loại cảnh báo', 'Thiết bị', 'Vị trí', 'Giá trị', 'Thời gian', 'Trạng thái']
      const rows = data.map(a => [
        ALERT_TYPE_LABELS[a.alertType] || a.alertType,
        a.device.name,
        a.location?.name || '—',
        a.value !== null && a.value !== undefined ? a.value : '—',
        new Date(a.triggeredAt).toLocaleString('vi-VN'),
        a.status === 'ACTIVE' ? 'Đang xảy ra'
          : a.status === 'ACKNOWLEDGED' ? 'Đã xác nhận'
          : 'Đã xử lý',
      ])

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bao-cao-canh-bao-${dayjs().format('YYYY-MM-DD')}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <Title level={4} className="!mb-6">Báo cáo sự cố</Title>

      <ReportFilters
        onChange={(f) => setFilters(prev => ({ ...prev, ...f, page: 1 }))}
        onExport={handleExport}
        exporting={exporting}
      />

      {/* Chart */}
      <Card title="Biểu đồ cảnh báo 7 ngày qua" className="shadow-sm mb-6">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="alert" name="Nguy hiểm" fill="#ff4d4f" radius={[4, 4, 0, 0]} />
            <Bar dataKey="warning" name="Cảnh báo" fill="#faad14" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Table */}
      <Card title="Danh sách sự cố" className="shadow-sm">
        <ReportTable
          data={alerts}
          total={total}
          page={filters.page}
          loading={loading}
          onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
        />
      </Card>
    </div>
  )
}