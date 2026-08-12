import { Typography, Table, Tag, Button, Input, Space, Popconfirm, message, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState, useEffect } from 'react'
import { deviceApi } from '@/features/devices/api/device.api'
import { simulatorApi } from './api/simulator.api'

const { Title } = Typography

const STATE_CONFIG: Record<number, { label: string; color: string }> = {
  0:  { label: '✅ Bình thường', color: 'success' },
  1:  { label: '🔴 Nguy hiểm',  color: 'error' },
  2:  { label: '⚠️ Cảnh báo',   color: 'warning' },
  [-1]: { label: '📵 Offline',   color: 'default' },
}

export default function SimulatorTool() {
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [triggeringAll, setTriggeringAll] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterState, setFilterState] = useState<string>('all')

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const res = await deviceApi.getDevices({ limit: 1000 })
      setDevices(res.data.data.items)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
    const handler = () => fetchDevices()
    window.addEventListener('sensor-update', handler)
    return () => window.removeEventListener('sensor-update', handler)
  }, [])

  const trigger = async (deviceId: string, action: 'fire' | 'warning' | 'normal' | 'offline') => {
    setTriggering(deviceId + action)
    try {
      await simulatorApi.trigger(deviceId, action)
      message.success(`Đã gửi lệnh ${action}`)
      setTimeout(fetchDevices, 1000)
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setTriggering(null)
    }
  }

  const triggerAll = async (action: 'fire' | 'warning' | 'normal' | 'offline') => {
    setTriggeringAll(action)
    try {
      await simulatorApi.triggerAll(action)
      message.success(`Đã gửi lệnh ${action} cho tất cả thiết bị`)
      setTimeout(fetchDevices, 1500)
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setTriggeringAll(null)
    }
  }

  const counts = {
    total: devices.length,
    normal: devices.filter(d => d.status?.state === 0).length,
    fire: devices.filter(d => d.status?.state === 1).length,
    warning: devices.filter(d => d.status?.state === 2).length,
    offline: devices.filter(d => d.status?.state === -1 || !d.status).length,
  }

  const filteredDevices = devices.filter(d => {
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.extId?.includes(search)
    const state = d.status?.state ?? -1
    const matchState =
      filterState === 'all' ||
      (filterState === 'fire'    && state === 1) ||
      (filterState === 'warning' && state === 2) ||
      (filterState === 'normal'  && state === 0) ||
      (filterState === 'offline' && (state === -1 || !d.status))
    return matchSearch && matchState
  })

  const columns: ColumnsType<any> = [
    {
      title: 'Thiết bị',
      key: 'device',
      render: (_, r) => (
        <div>
          <div className="font-medium text-sm">{r.name}</div>
          <div className="text-xs text-gray-400">ID: {r.extId}</div>
        </div>
      ),
    },
    {
      title: 'Vị trí',
      key: 'location',
      render: (_, r) => (
        <div className="text-sm text-gray-600">
          {[r.location?.parent?.parent?.name, r.location?.parent?.name, r.location?.name]
            .filter(Boolean).join(' → ')}
        </div>
      ),
    },
    {
      title: 'Khói',
      key: 'smoke',
      width: 90,
      render: (_, r) => (
        <span className={`font-mono text-sm ${r.status?.state === 1 ? 'text-red-600 font-bold' : ''}`}>
          {r.status?.smokeLevel ?? '—'} ppm
        </span>
      ),
    },
    {
      title: 'Nhiệt',
      key: 'temp',
      width: 80,
      render: (_, r) => (
        <span className={`font-mono text-sm ${r.status?.state === 1 ? 'text-red-600 font-bold' : ''}`}>
          {r.status?.temperature ?? '—'}°C
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'state',
      width: 130,
      render: (_, r) => {
        const state = r.status?.state ?? -1
        const config = STATE_CONFIG[state] ?? STATE_CONFIG[-1]
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 220,
      render: (_, r) => {
        const state = r.status?.state ?? -1
        const isOffline = state === -1 || !r.status
        return (
          <Space size={4}>
            {state !== 1 && (
              <Button size="small" danger
                loading={triggering === r.id + 'fire'}
                onClick={() => trigger(r.id, 'fire')}
              >🔴 Báo cháy</Button>
            )}
            {state === 1 && (
              <Button size="small"
                style={{ color: '#52c41a', borderColor: '#52c41a' }}
                loading={triggering === r.id + 'normal'}
                onClick={() => trigger(r.id, 'normal')}
              >✅ Dừng cháy</Button>
            )}
            {state !== 2 && state !== 1 && (
              <Button size="small"
                style={{ color: '#faad14', borderColor: '#faad14' }}
                loading={triggering === r.id + 'warning'}
                onClick={() => trigger(r.id, 'warning')}
              >⚠️</Button>
            )}
            {!isOffline && (
              <Button size="small"
                loading={triggering === r.id + 'offline'}
                onClick={() => trigger(r.id, 'offline')}
              >📵</Button>
            )}
            {isOffline && (
              <Button size="small" type="primary"
                loading={triggering === r.id + 'normal'}
                onClick={() => trigger(r.id, 'normal')}
              >🟢 Online</Button>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Title level={4} className="!mb-0">🧪 Simulator Tool</Title>
          <Tag color="warning">Chỉ dùng để test</Tag>
        </div>
        <Space>
          <Popconfirm title="Báo cháy tất cả thiết bị?" okType="danger" onConfirm={() => triggerAll('fire')}>
            <Button danger loading={triggeringAll === 'fire'}>🔴 Báo cháy tất cả</Button>
          </Popconfirm>
          <Popconfirm title="Reset tất cả về bình thường?" onConfirm={() => triggerAll('normal')}>
            <Button style={{ color: '#52c41a', borderColor: '#52c41a' }} loading={triggeringAll === 'normal'}>
              ✅ Reset tất cả
            </Button>
          </Popconfirm>
          <Popconfirm title="Set tất cả offline?" onConfirm={() => triggerAll('offline')}>
            <Button loading={triggeringAll === 'offline'}>📵 Offline tất cả</Button>
          </Popconfirm>
        </Space>
      </div>

      {/* Stat cards */}
      <Row gutter={[8, 8]} className="mb-4">
        {[
          { label: 'Tổng', value: counts.total, color: 'text-gray-800', bg: 'bg-gray-50' },
          { label: 'Bình thường', value: counts.normal, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Nguy hiểm', value: counts.fire, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Cảnh báo', value: counts.warning, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Offline', value: counts.offline, color: 'text-gray-400', bg: 'bg-gray-50' },
        ].map(s => (
          <Col span={4} key={s.label}>
            <div className={`${s.bg} rounded-lg p-3 text-center`}>
              <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <Input.Search
          placeholder="Tìm tên, ID..."
          allowClear
          className="w-52"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {[
          { key: 'all',     label: `Tất cả (${counts.total})` },
          { key: 'fire',    label: `🔴 Cháy (${counts.fire})` },
          { key: 'warning', label: `⚠️ Cảnh báo (${counts.warning})` },
          { key: 'offline', label: `📵 Offline (${counts.offline})` },
          { key: 'normal',  label: `✅ Bình thường (${counts.normal})` },
        ].map(f => (
          <Button
            key={f.key}
            type={filterState === f.key ? 'primary' : 'default'}
            size="small"
            onClick={() => setFilterState(f.key)}
          >
            {f.label}
          </Button>
        ))}
        <Button size="small" onClick={fetchDevices} className="ml-auto">
          🔄 Làm mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredDevices}
        rowKey="id"
        loading={loading}
        size="small"
        rowClassName={r => {
          const state = r.status?.state
          if (state === 1) return 'bg-red-50'
          if (state === 2) return 'bg-yellow-50'
          if (state === -1 || !r.status) return 'opacity-60'
          return ''
        }}
        pagination={{
          pageSize: 20,
          showTotal: total => `${total} thiết bị`,
          showSizeChanger: false,
        }}
        scroll={{ x: 900 }}
      />
    </div>
  )
}