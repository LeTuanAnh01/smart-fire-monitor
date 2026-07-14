import { Table, Tag, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState, useEffect } from 'react'
import { SensorLog } from '@/shared/types'
import { deviceApi } from '../api/device.api'
import dayjs, { Dayjs } from 'dayjs'

const METRIC_CONFIG: Record<string, { label: string; unit: string; color: string }> = {
  SMOKE:       { label: 'Khói',       unit: 'ppm', color: 'error'   },
  TEMPERATURE: { label: 'Nhiệt độ',  unit: '°C',  color: 'blue'    },
  BATTERY:     { label: 'Pin',        unit: '%',   color: 'green'   },
  WIFI:        { label: 'WiFi',       unit: '',    color: 'purple'  },
  POWER:       { label: 'Điện áp',   unit: 'V',   color: 'orange'  },
  STATE:       { label: 'Trạng thái', unit: '',   color: 'default' },
}

const STATE_MAP: Record<number, { label: string; color: string }> = {
  [-1]: { label: 'Offline',      color: 'default' },
  [0]:  { label: 'Bình thường',  color: 'success' },
  [1]:  { label: 'Nguy hiểm',   color: 'error'   },
  [2]:  { label: 'Cảnh báo',    color: 'warning' },
}

interface Props {
  deviceId: string
  dateRange: [Dayjs, Dayjs]
}

export default function DeviceHistoryTable({ deviceId, dateRange }: Props) {
  const [logs, setLogs] = useState<SensorLog[]>([])
  const [loading, setLoading] = useState(false)
  const [metric, setMetric] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 20

  const fetchLogs = async (p = 1, m = metric) => {
    setLoading(true)
    try {
      const res = await deviceApi.getDeviceLogs(deviceId, {
        metric: m,
        from: dateRange[0].toISOString(),
        to: dateRange[1].toISOString(),
        limit: PAGE_SIZE,
        page: p,
      })
      setLogs(res.data.data.items)
      setTotal(res.data.data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1, metric)
    setPage(1)
  }, [deviceId, dateRange, metric])

  const columns: ColumnsType<SensorLog> = [
    {
      title: 'Thời gian',
      dataIndex: 'recordedAt',
      key: 'recordedAt',
      render: (val) => dayjs(val).format('DD/MM/YYYY HH:mm:ss'),
      width: 170,
    },
    {
      title: 'Loại',
      dataIndex: 'metric',
      key: 'metric',
      render: (val) => {
        const config = METRIC_CONFIG[val] ?? { label: val, color: 'default' }
        return <Tag color={config.color}>{config.label}</Tag>
      },
      width: 110,
    },
    {
      title: 'Giá trị',
      key: 'value',
      render: (_, record) => {
        const config = METRIC_CONFIG[record.metric]
        // Trạng thái hiện label thay vì số
        if (record.metric === 'STATE') {
          const stateConfig = STATE_MAP[record.value] ?? { label: String(record.value), color: 'default' }
          return <Tag color={stateConfig.color}>{stateConfig.label}</Tag>
        }
        return (
          <span className="font-mono">
            {record.value} {config?.unit || ''}
          </span>
        )
      },
    },
  ]

  return (
    <div>
      {/* Filter metric */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-gray-500 flex-shrink-0">Lọc theo:</span>
        <Select
          placeholder="Tất cả loại"
          allowClear
          className="w-40"
          value={metric}
          onChange={val => setMetric(val)}
          options={Object.entries(METRIC_CONFIG).map(([key, cfg]) => ({
            value: key,
            label: cfg.label,
          }))}
        />
        <span className="text-xs text-gray-400 ml-auto">Tổng {total} bản ghi</span>
      </div>

      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          onChange: (p) => {
            setPage(p)
            fetchLogs(p, metric)
          },
          showSizeChanger: false,
          showTotal: (t) => `${t} bản ghi`,
        }}
        scroll={{ x: 400 }}
      />
    </div>
  )
}