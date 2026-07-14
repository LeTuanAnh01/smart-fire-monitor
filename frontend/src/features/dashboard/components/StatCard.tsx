import { Card } from 'antd'
import { ReactNode } from 'react'

interface Props {
  title: string
  value: number | string
  icon?: ReactNode
  iconColor?: string
  valueColor?: string
  sub?: string
  subColor?: string
}

export default function StatCard({ title, value, icon, iconColor, valueColor, sub, subColor }: Props) {
  return (
    <Card className="shadow-sm h-full" size="small">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs text-gray-400 mb-1">{title}</div>
          <div
            className="text-2xl font-semibold"
            style={{ color: valueColor || '#1f2937' }}
          >
            {value}
          </div>
          {sub && (
            <div className="text-xs mt-1" style={{ color: subColor || '#6b7280' }}>
              {sub}
            </div>
          )}
        </div>
        {icon && (
          <div
            className="text-2xl opacity-20"
            style={{ color: iconColor || '#6b7280' }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}