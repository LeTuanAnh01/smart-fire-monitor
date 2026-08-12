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
  bgColor?: string
  pulse?: boolean
}

export default function StatCard({ title, value, icon, iconColor, valueColor, sub, subColor, bgColor, pulse }: Props) {
  return (
    <Card
      className="shadow-sm h-full"
      size="small"
      style={bgColor ? { background: bgColor, border: 'none' } : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs mb-1" style={{ color: bgColor ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>
            {title}
          </div>
          <div
            className={`text-2xl font-semibold ${pulse ? 'animate-pulse' : ''}`}
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
            className="text-2xl"
            style={{ color: iconColor || '#6b7280', opacity: bgColor ? 0.4 : 0.2 }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}