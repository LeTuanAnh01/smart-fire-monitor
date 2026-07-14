import { Drawer, Descriptions, Tag, Spin, Row, Col, Statistic, DatePicker, Tabs } from 'antd'
import { useState, useEffect } from 'react'
import { Device, SensorLog, STATE_LABELS } from '@/shared/types'
import { deviceApi } from '../api/device.api'
import SensorLogChart from './SensorLogChart'
import DeviceHistoryTable from './DeviceHistoryTable' 
import dayjs, { Dayjs } from 'dayjs'
import DeviceSettingsForm from './DeviceSettingsForm'
import { useAuth } from '@/shared/context/AuthContext'

const { RangePicker } = DatePicker

interface Props {
  device: Device | null
  open: boolean
  onClose: () => void
}

export default function DeviceDetail({ device, open, onClose }: Props) {
  const [smokeLogs, setSmokeLogs] = useState<SensorLog[]>([])
  const [tempLogs, setTempLogs] = useState<SensorLog[]>([])
  const [powerLogs, setPowerLogs] = useState<SensorLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const { user } = useAuth()
  const canEdit = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '')
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(24, 'hour'),
    dayjs()
  ])

  const fetchLogs = async (from: Dayjs, to: Dayjs) => {
    if (!device) return
    setLoadingLogs(true)
    try {
      // Tính limit dựa theo khoảng thời gian
      const diffHours = to.diff(from, 'hour')
      const limit = diffHours <= 6 ? 100
        : diffHours <= 24 ? 200
        : diffHours <= 24 * 7 ? 500
        : 1000000000  // 30 ngày lấy 1000 điểm

      const params = {
        from: from.toISOString(),
        to: to.toISOString(),
        limit
      }
      const [smokeRes, tempRes, powerRes] = await Promise.all([
        deviceApi.getDeviceLogs(device.id, { ...params, metric: 'SMOKE' }),
        deviceApi.getDeviceLogs(device.id, { ...params, metric: 'TEMPERATURE' }),
        deviceApi.getDeviceLogs(device.id, { ...params, metric: 'POWER' }),
      ])
      setSmokeLogs(smokeRes.data.data.items || [])
      setTempLogs(tempRes.data.data.items || [])
      setPowerLogs(powerRes.data.data.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    if (!device || !open) return
    fetchLogs(dateRange[0], dateRange[1])
  }, [device, open])

  if (!device) return null

  const state = device.status?.state
  const stateConfig = state !== null && state !== undefined
    ? STATE_LABELS[state] ?? { label: String(state), color: 'default' }
    : { label: 'Chưa có dữ liệu', color: 'default' }

  return (
    <Drawer
      title={device.name}
      open={open}
      onClose={onClose}
      size="large"
    >
      <Tabs
        items={[
          {
            key: 'overview',
            label: 'Tổng quan',
            children: (
              <div>
                {/* Trạng thái tổng quan */}
                <div className="mb-4">
                  <Tag color={stateConfig.color} className="text-sm px-3 py-1">
                    ● {stateConfig.label}
                  </Tag>
                  <span className="text-xs text-gray-400 ml-2">
                    {device.status?.stateUpdatedAt
                      ? `Cập nhật: ${new Date(device.status.stateUpdatedAt).toLocaleString('vi-VN')}`
                      : ''}
                  </span>
                </div>

                {/* Thông tin định danh */}
                <Descriptions column={2} bordered size="small" className="mb-4">
                  <Descriptions.Item label="ID thiết bị" span={2}>
                    <span className="font-mono text-xs">{device.extId}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Vị trí đầy đủ" span={2}>
                    {[
                        device.location?.parent?.parent?.name,
                        device.location?.parent?.name,
                        device.location?.name,
                      ].filter(Boolean).join(' → ') || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tầng/Khu vực">
                    {device.location?.parent?.name || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Lắp đặt">
                    {new Date(device.createdAt).toLocaleDateString('vi-VN')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Đồng bộ lần cuối">
                    {device.status?.lastSyncAt
                      ? new Date(device.status.lastSyncAt).toLocaleString('vi-VN')
                      : '—'}
                  </Descriptions.Item>
                </Descriptions>

                {/* Dữ liệu cảm biến hiện tại */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-600 mb-3">Dữ liệu hiện tại</div>
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <Statistic
                          title="Nồng độ khói"
                          value={device.status?.smokeLevel ?? '—'}
                          suffix={device.status?.smokeLevel !== null ? 'ppm' : ''}
                          styles={{
                            content: {
                              fontSize: 20,
                              color: (device.status?.smokeLevel ?? 0) > 200 ? '#ff4d4f' : '#52c41a'
                            }
                          }}
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          {device.status?.smokeUpdatedAt
                            ? new Date(device.status.smokeUpdatedAt).toLocaleString('vi-VN')
                            : '—'}
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <Statistic
                          title="Nhiệt độ"
                          value={device.status?.temperature ?? '—'}
                          suffix={device.status?.temperature !== null ? '°C' : ''}
                          styles={{
                            content: {
                              fontSize: 20,
                              color: (device.status?.temperature ?? 0) > 60 ? '#ff4d4f' : '#1677ff'
                            }
                          }}
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          {device.status?.temperatureUpdatedAt
                            ? new Date(device.status.temperatureUpdatedAt).toLocaleString('vi-VN')
                            : '—'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className={`rounded-lg p-3 ${(device.status?.batteryLevel ?? 100) <= 20 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                        <Statistic
                          title="Pin"
                          value={device.status?.batteryLevel ?? '—'}
                          suffix={device.status?.batteryLevel !== null ? '%' : ''}
                          styles={{
                            content: {
                              fontSize: 18,
                              color: (device.status?.batteryLevel ?? 100) <= 20 ? '#ff4d4f'
                                : (device.status?.batteryLevel ?? 100) <= 50 ? '#faad14' : '#52c41a'
                            }
                          }}
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          {device.status?.batteryUpdatedAt
                            ? new Date(device.status.batteryUpdatedAt).toLocaleString('vi-VN')
                            : '—'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className={`rounded-lg p-3 ${(device.status?.wifiSignal ?? 10) <= 3 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                        <Statistic
                          title="Tín hiệu WiFi"
                          value={device.status?.wifiSignal ?? '—'}
                          suffix={
                            (device.status?.wifiSignal ?? 10) <= 3
                              ? <span className="text-xs text-yellow-500 ml-1">Yếu</span>
                              : undefined
                          }
                          styles={{
                            content: {
                              fontSize: 18,
                              color: (device.status?.wifiSignal ?? 10) <= 3 ? '#faad14' : undefined
                            }
                          }}
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          {device.status?.wifiUpdatedAt
                            ? new Date(device.status.wifiUpdatedAt).toLocaleString('vi-VN')
                            : '—'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className={`rounded-lg p-3 ${(device.status?.powerVoltage ?? 20) < 16 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                        <Statistic
                          title="Điện áp (Pin)"
                          value={device.status?.powerVoltage ?? '—'}
                          suffix={device.status?.powerVoltage !== null ? 'V' : ''}
                          styles={{
                            content: {
                              fontSize: 18,
                              color: (device.status?.powerVoltage ?? 20) < 16 ? '#faad14' : undefined
                            }
                          }}
                        />
                        {(device.status?.powerVoltage ?? 20) < 16 && (
                          <div className="text-xs text-yellow-500 mt-1">⚠️ Pin yếu</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {device.status?.powerUpdatedAt
                            ? new Date(device.status.powerUpdatedAt).toLocaleString('vi-VN')
                            : '—'}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Filter thời gian cho biểu đồ */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-medium text-gray-600 flex-shrink-0">Lịch sử:</span>
                  <RangePicker
                    size="small"
                    showTime
                    value={dateRange}
                    onChange={dates => {
                      if (dates && dates[0] && dates[1]) {
                        const range: [Dayjs, Dayjs] = [dates[0], dates[1]]
                        setDateRange(range)
                        fetchLogs(dates[0], dates[1])
                      }
                    }}
                    presets={[
                      { label: '6 giờ qua', value: [dayjs().subtract(6, 'hour'), dayjs()] },
                      { label: '24 giờ qua', value: [dayjs().subtract(24, 'hour'), dayjs()] },
                      { label: '7 ngày qua', value: [dayjs().subtract(7, 'day'), dayjs()] },
                      { label: '30 ngày qua', value: [dayjs().subtract(30, 'day'), dayjs()] },
                    ]}
                    className="flex-1"
                  />
                </div>

                {/* Biểu đồ lịch sử */}
                {loadingLogs ? (
                  <div className="flex justify-center py-6"><Spin /></div>
                ) : (
                  <div className="space-y-4">
                    <SensorLogChart
                      title="Lịch sử nồng độ khói"
                      logs={smokeLogs}
                      unit="ppm"
                      color="#ff4d4f"
                    />
                    <SensorLogChart
                      title="Lịch sử nhiệt độ"
                      logs={tempLogs}
                      unit="°C"
                      color="#1677ff"
                    />
                    <SensorLogChart
                      title="Lịch sử điện áp"
                      logs={powerLogs}
                      unit="V"
                      color="#52c41a"
                    />
                  </div>
                )}
              </div>
            )
          },

          ...(canEdit ? [{
            key: 'settings',
            label: 'Cài đặt',
            children: (
              <DeviceSettingsForm
                device={device}
                onSuccess={onClose}
              />
            )
          }] : []),

          {
            key: 'history',
            label: 'Lịch sử dữ liệu',
            children: (
              <DeviceHistoryTable
                deviceId={device.id}
                dateRange={dateRange}
              />
            )
          }
        ]}
      />
      
    </Drawer>
  )
}