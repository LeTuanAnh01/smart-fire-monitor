import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Alert } from '@/shared/types'
import { AlertTypeBadge, StatusBadge } from '@/features/alerts/components/AlertBadge'

interface Props {
  data: Alert[]
  total: number
  page: number
  loading: boolean
  onPageChange: (page: number) => void
}

export default function ReportTable({ data, total, page, loading, onPageChange }: Props) {
  const columns: ColumnsType<Alert> = [
    {
      title: 'Loại cảnh báo',
      dataIndex: 'alertType',
      render: (val) => <AlertTypeBadge alertType={val} />,
      width: 150,
    },
    {
      title: 'Thiết bị',
      key: 'device',
      render: (_, r) => (
        <div className="font-medium">{r.device.name}</div>
      ),
    },
    {
      title: 'Vị trí',
      key: 'location',
      render: (_, r) => (
        <div className="text-sm">
          <div className="font-medium">{r.location?.name || '—'}</div>
          {r.location?.path && (
            <div className="text-xs text-gray-400">{r.location.path}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      render: (val) => (
        <span className="font-mono">{val !== null && val !== undefined ? val : '—'}</span>
      ),
      width: 100,
    },
    {
      title: 'Thời gian',
      dataIndex: 'triggeredAt',
      render: (val) => new Date(val).toLocaleString('vi-VN'),
      width: 160,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (val) => <StatusBadge status={val} />,
      width: 130,
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{
        current: page,
        pageSize: 20,
        total,
        onChange: onPageChange,
        showTotal: total => `Tổng ${total} sự cố`,
        showSizeChanger: false,
      }}
      scroll={{ x: 800 }}
    />
  )
}