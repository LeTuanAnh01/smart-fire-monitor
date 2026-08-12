import { Table, Tag, Input, Button, Tooltip, Space, Popconfirm } from 'antd'
import { ReloadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { Device, STATE_LABELS } from '@/shared/types'

interface Props {
  data: Device[]
  total: number
  page: number
  limit: number
  loading: boolean
  onPageChange: (page: number) => void
  onSearch: (search: string) => void
  onRefresh: () => void
  onView: (device: Device) => void
  canAddDevice: boolean
  onAdd: () => void
  onDelete: (id: string) => void
  onStateFilter: (states: number[]) => void 
}

export default function DeviceTable({
  data, total, page, limit, loading,
  onPageChange, onSearch, onRefresh,
  onView, canAddDevice, onAdd, onDelete,
  onStateFilter 
}: Props) {

  const columns: ColumnsType<Device> = [
    {
      title: 'Tên thiết bị',
      key: 'name',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.name}</div>
          <div className="text-xs text-gray-400">ID: {record.extId}</div>
        </div>
      ),
    },
    {
      title: 'Vị trí',
      key: 'location',
      render: (_, record) => (
        <div className="text-sm">
          <div>{record.location?.name || '—'}</div>
          {record.location?.parent && (
            <div className="text-gray-400 text-xs">
              {[
                record.location.parent?.parent?.name,
                record.location.parent?.name,
              ].filter(Boolean).join(' → ')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'state',
      filters: [
        { text: '🟢 Bình thường', value: 0 },
        { text: '🔴 Nguy hiểm',   value: 1 },
        { text: '⚠️ Cảnh báo',    value: 2 },
        { text: '📵 Offline',      value: -1 },
      ],
      filterMultiple: true,

      render: (_, record) => {
        const state = record.status?.state
        if (state === null || state === undefined) return <Tag>Chưa có dữ liệu</Tag>
        const config = STATE_LABELS[state] ?? { label: String(state), color: 'default' }
        return <Tag color={config.color}>● {config.label}</Tag>
      },
      width: 130,
    },
    {
      title: 'Khói (ppm)',
      key: 'smoke',
      sorter: (a, b) => (a.status?.smokeLevel ?? 0) - (b.status?.smokeLevel ?? 0),
      render: (_, record) => (
        <span className="font-mono">{record.status?.smokeLevel ?? '—'}</span>
      ),
      width: 110,
    },
    {
      title: 'Nhiệt độ (°C)',
      key: 'temp',
      sorter: (a, b) => (a.status?.temperature ?? 0) - (b.status?.temperature ?? 0),
      render: (_, record) => (
        <span className="font-mono">{record.status?.temperature ?? '—'}</span>
      ),
      width: 120,
    },
    {
      title: 'Pin (%)',
      key: 'battery',
      sorter: (a, b) => (a.status?.batteryLevel ?? 0) - (b.status?.batteryLevel ?? 0),
      render: (_, record) => {
        const val = record.status?.batteryLevel
        if (val === null || val === undefined) return <span className="font-mono">—</span>
        const color = val <= 20 ? 'text-red-500' : val <= 50 ? 'text-yellow-500' : 'text-green-600'
        return <span className={`font-mono ${color}`}>{val}%</span>
      },
      width: 90,
    },
    {
      title: 'Đồng bộ',
      key: 'lastSync',
      sorter: (a, b) =>
        new Date(a.status?.lastSyncAt || 0).getTime() -
        new Date(b.status?.lastSyncAt || 0).getTime(),
      render: (_, record) => (
        <span className="text-xs text-gray-400">
          {record.status?.lastSyncAt
            ? new Date(record.status.lastSyncAt).toLocaleString('vi-VN')
            : '—'}
        </span>
      ),
      width: 150,
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<EyeOutlined />}
              size="small"
              type="text"
              onClick={() => onView(record)}
            />
          </Tooltip>
          {canAddDevice && (
            <Tooltip title="Xóa thiết bị">
              <Popconfirm
                title="Xóa thiết bị này?"
                description="Toàn bộ lịch sử và cảnh báo sẽ bị xóa!"
                onConfirm={() => onDelete(record.id)}
                okType="danger"
              >
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  type="text"
                  danger
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>  
      ),
    },
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Input.Search
          placeholder="Tìm tên, ID thiết bị..."
          allowClear
          className="w-56"
          onSearch={onSearch}
        />
        
        <div className="flex gap-2 ml-auto">
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>Làm mới</Button>
          {canAddDevice && (
            <Button type="primary" onClick={onAdd}>+ Thêm thiết bị</Button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        onChange={(_, filters) => {
          const states = (filters.state as number[]) || []
          onStateFilter(states)
        }}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: onPageChange,
          showTotal: (total) => `Tổng ${total} thiết bị`,
          showSizeChanger: false,
        }}
        rowClassName={(record) => {
          const state = record.status?.state
          if (state === 1) return 'bg-red-50'
          if (state === 2) return 'bg-yellow-50'
          if (state === -1) return 'bg-gray-50'
          return ''
        }}
        scroll={{ x: 900 }}
      />
    </div>
  )
}