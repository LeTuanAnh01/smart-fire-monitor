import { useState } from 'react'
import { Select, DatePicker, Button, Row, Col, Input } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface Props {
  onChange: (filters: any) => void
  onRefresh: () => void
  loading?: boolean
}

export default function AlertFilters({ onChange, onRefresh, loading }: Props) {
  const [status, setStatus] = useState<string | undefined>()
  const [alertType, setAlertType] = useState<string | undefined>()
  const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null)
  const [search, setSearch] = useState<string>('')

  const handleRefresh = () => {
    setStatus(undefined)
    setAlertType(undefined)
    setDates(null)
    setSearch('')
    onChange({ status: undefined, alertType: undefined, from: undefined, to: undefined, search: undefined, page: 1 })
    onRefresh()
  }

  return (
    <Row gutter={[12, 12]} className="mb-4">
      <Col xs={24} sm={8} md={6}>
        <Input.Search
          value={search}
          placeholder="Tìm tên thiết bị..."
          allowClear
          prefix={<SearchOutlined className="text-gray-400" />}
          onChange={e => {
            setSearch(e.target.value)
            if (!e.target.value) onChange({ search: undefined, page: 1 })
          }}
          onSearch={val => onChange({ search: val || undefined, page: 1 })}
        />
      </Col>
      <Col xs={24} sm={8} md={5}>
        <Select
          value={status}
          placeholder="Trạng thái"
          allowClear
          className="w-full"
          onChange={val => { setStatus(val); onChange({ status: val, page: 1 }) }}
          options={[
            { value: 'ACTIVE',       label: 'Đang xảy ra' },
            { value: 'ACKNOWLEDGED', label: 'Đã xác nhận' },
            { value: 'RESOLVED',     label: 'Đã xử lý' },
          ]}
        />
      </Col>
      <Col xs={24} sm={8} md={5}>
        <Select
          value={alertType}
          placeholder="Loại cảnh báo"
          allowClear
          className="w-full"
          onChange={val => { setAlertType(val); onChange({ alertType: val, page: 1 }) }}
          options={[
            { value: 'FIRE',        label: '🔴 Cháy' },
            { value: 'WARNING',     label: '🟡 Cảnh báo thiết bị' },
            { value: 'LOW_BATTERY', label: '🔋 Pin yếu' },
            { value: 'WEAK_SIGNAL', label: '📶 Sóng yếu' },
            { value: 'OFFLINE',     label: '📵 Mất kết nối' },
          ]}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <RangePicker
          value={dates}
          className="w-full"
          onChange={vals => {
            if (vals && vals[0] && vals[1]) {
              setDates([vals[0], vals[1]])
              onChange({ from: vals[0].startOf('day').toISOString(), to: vals[1].endOf('day').toISOString(), page: 1 })
            } else {
              setDates(null)
              onChange({ from: undefined, to: undefined, page: 1 })
            }
          }}
        />
      </Col>
      <Col xs={24} sm={4} md={2}>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading} className="w-full">
          Làm mới
        </Button>
      </Col>
    </Row>
  )
}