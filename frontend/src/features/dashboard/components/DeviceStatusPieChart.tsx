import { Card, Empty } from 'antd'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { STATE_LABELS } from '@/shared/types'

interface Props {
  data: { state: number; count: number }[]
}

const COLORS: Record<number, string> = {
  0: '#52c41a',
  1: '#ff4d4f',
  2: '#faad14',
  [-1]: '#d9d9d9',
}

export default function DeviceStatusPieChart({ data }: Props) {
  const formatted = data.map(d => ({
    name: STATE_LABELS[d.state]?.label || String(d.state),
    value: d.count,
    color: COLORS[d.state] || '#8884d8'
  })).filter(d => d.value > 0)

  return (
    <Card title="Trạng thái thiết bị" className="shadow-sm h-full">
      {formatted.length === 0 ? <Empty /> : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={formatted}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
            >
              {formatted.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(val, name) => [val, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}