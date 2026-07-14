import { Table, Button, Space, Popconfirm, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Alert } from '@/shared/types'
import { AlertTypeBadge, StatusBadge } from './AlertBadge'

interface Props {
  data: Alert[]
  total: number
  page: number
  limit: number
  loading: boolean
  onPageChange: (page: number) => void
  onAcknowledge: (id: string) => Promise<void>
  onResolve: (id: string) => Promise<void>
}

export default function AlertTable({
  data, total, page, limit, loading,
  onPageChange, onAcknowledge, onResolve
}: Props) {

  const columns: ColumnsType<Alert> = [
    {
      title: 'Loại cảnh báo',
      dataIndex: 'alertType',
      key: 'alertType',
      render: (val) => <AlertTypeBadge alertType={val} />,
      width: 150,
    },
    {
      title: 'Thiết bị',
      key: 'device',
      render: (_, record) => (
        <div className="font-medium">{record.device.name}</div>
      ),
    },
    {
      title: 'Vị trí',
      key: 'location',
      render: (_, record) => (
        <div className="text-sm">
          <div className="font-medium">{record.location?.name || '—'}</div>
          <div className="text-gray-400 text-xs">{record.location?.path || ''}</div>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
      render: (val) => new Date(val).toLocaleString('vi-VN'),
      width: 160,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (val) => <StatusBadge status={val} />,
      width: 130,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'ACTIVE' && (
            <Popconfirm
              title="Xác nhận đã nhận cảnh báo?"
              onConfirm={async () => {
                await onAcknowledge(record.id)
                message.success('Đã xác nhận')
              }}
            >
              <Button size="small">Xác nhận</Button>
            </Popconfirm>
          )}
          {record.status !== 'RESOLVED' && (
            <Popconfirm
              title="Đánh dấu đã xử lý xong?"
              onConfirm={async () => {
                await onResolve(record.id)
                message.success('Đã xử lý')
              }}
            >
              <Button size="small" type="primary" ghost>Xử lý xong</Button>
            </Popconfirm>
          )}
        </Space>
      ),
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
        pageSize: limit,
        total,
        onChange: onPageChange,
        showTotal: (total) => `Tổng ${total} cảnh báo`,
        showSizeChanger: false,
      }}
      rowClassName={(record) =>
        record.state === 1 && record.status === 'ACTIVE' ? 'bg-red-50' : ''
      }
      scroll={{ x: 800 }}
    />
  )
}