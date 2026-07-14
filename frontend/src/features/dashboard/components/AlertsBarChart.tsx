import { Card, Empty } from 'antd'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface Props {
  data: { date: string; alert: number; warning: number }[]
}

export default function AlertsBarChart({ data }: Props) {
  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('vi-VN', {
      month: 'numeric', day: 'numeric'
    })
  }))
  console.log('formatted', formatted)

  return (
    <Card title="Cảnh báo 7 ngày qua" className="shadow-sm h-full">
      {data.length === 0 ? <Empty /> : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="alert" name="Nguy hiểm" fill="#ff4d4f" radius={[4, 4, 0, 0]} />
            <Bar dataKey="warning" name="Cảnh báo" fill="#faad14" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}