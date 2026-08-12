import { Card, Empty } from 'antd'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { SensorLog } from '@/shared/types'
import dayjs from 'dayjs'

interface Props {
  title: string
  logs: SensorLog[]
  unit: string
  color?: string
}

export default function SensorLogChart({ title, logs, unit, color = '#1677ff' }: Props) {
  if (!logs || logs.length === 0) {
    return (
      <Card title={title} size="small" className="shadow-sm">
        <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    )
  }

  // Tự động format thời gian theo khoảng data
  const first = dayjs(logs[0].recordedAt)
  const last = dayjs(logs[logs.length - 1].recordedAt)
  const diffHours = last.diff(first, 'hour')

  const formatTime = (recordedAt: string) => {
    const d = dayjs(recordedAt)
    if (diffHours <= 1)  return d.format('HH:mm:ss')
    return d.format('DD/MM HH:mm')  // luôn hiện ngày + giờ với mọi khoảng > 1h
  }

  // Đảm bảo data đúng thứ tự cũ → mới trước khi sample
  const sorted = [...logs].sort((a, b) =>
    dayjs(a.recordedAt).valueOf() - dayjs(b.recordedAt).valueOf()
  )

  const maxPoints = 200
  const sampled = sorted.length > maxPoints
    ? sorted.filter((_, i) => i % Math.ceil(sorted.length / maxPoints) === 0)
    : sorted

  const chartData = sampled.map(log => ({
    time: formatTime(log.recordedAt),         // trục X — ngắn
    fullTime: dayjs(log.recordedAt).format('DD/MM/YYYY HH:mm:ss'),  // tooltip — đầy đủ
    value: Number(log.value.toFixed(1)),
  }))

  const CustomTooltip = ({ active, payload, unit }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}>
        <div style={{ color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
          {payload[0]?.payload?.fullTime}  {/* dùng fullTime thay vì label */}
        </div>
        <div style={{ color: payload[0].color, fontWeight: 500 }}>
          {payload[0].value} {unit}
        </div>
      </div>
    )
  }

  return (
    <Card title={`${title}`} size="small" className="shadow-sm">
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.floor(chartData.length / 6))}
            reversed={false}  // đảm bảo không bị đảo ngược
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            dot={false}
            strokeWidth={1.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}