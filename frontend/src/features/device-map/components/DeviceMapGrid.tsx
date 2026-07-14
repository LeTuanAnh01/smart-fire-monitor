import { Empty, Spin } from 'antd'
import { useState } from 'react'
import DeviceDetail from '@/features/devices/components/DeviceDetail'
import { deviceApi } from '@/features/devices/api/device.api'

interface Props {
  devices: any[]
}

const STATE_CONFIG: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  n: { bg: 'bg-green-50',  border: 'border-green-200', icon: '✅', label: 'Bình thường' },
  w: { bg: 'bg-yellow-50', border: 'border-yellow-300', icon: '⚠️', label: 'Cảnh báo' },
  d: { bg: 'bg-red-50',    border: 'border-red-300',   icon: '🔴', label: 'Nguy hiểm' },
  o: { bg: 'bg-gray-50',   border: 'border-gray-200',  icon: '📵', label: 'Offline' },
}

function getStateKey(state: number | null | undefined): string {
  if (state === 1) return 'd'
  if (state === 2) return 'w'
  if (state === -1) return 'o'
  return 'n'
}

export default function DeviceMapGrid({ devices }: Props) {
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null)
  const [loadingDevice, setLoadingDevice] = useState(false)

  const handleClickDevice = async (dev: any) => {
    setLoadingDevice(true)
    try {
      const res = await deviceApi.getDeviceById(dev.id)
      setSelectedDevice(res.data.data)
    } catch (err) {
      console.error(err)
      setSelectedDevice(dev)
    } finally {
      setLoadingDevice(false)
    }
  }

  if (devices.length === 0) {
    return <Empty description="Không có thiết bị" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  return (
    <>
      {loadingDevice && (
        <div className="fixed inset-0 bg-black/10 z-50 flex items-center justify-center">
          <Spin size="large" />
        </div>
      )}

      <div className="grid gap-2" style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 280px)'
      }}>
        {devices.map(dev => {
          const stateKey = getStateKey(dev.status?.state)
          const config = STATE_CONFIG[stateKey]
          const isDanger = stateKey === 'd'

          return (
            <div
              key={dev.id}
              onClick={() => handleClickDevice(dev)}
              className={`
                ${config.bg} border ${config.border}
                rounded-lg p-3 text-center cursor-pointer
                transition-all duration-200 select-none
                hover:opacity-80
                ${isDanger ? 'animate-pulse' : ''}
              `}
            >
              <div className="text-2xl mb-2">{config.icon}</div>
              <div className="text-sm font-medium text-gray-800 truncate" title={dev.name}>
                {dev.name}
              </div>
              <div className="text-xs text-gray-400 truncate mt-0.5" title={dev.location?.name}>
                {dev.location?.name || '—'}
              </div>
              {stateKey !== 'o' && dev.status && (
                <div className="flex justify-center gap-3 mt-2">
                  <span className="text-xs text-gray-500">
                    <b className="text-gray-700">{dev.status.smokeLevel ?? '—'}</b> ppm
                  </span>
                  <span className="text-xs text-gray-500">
                    <b className="text-gray-700">{dev.status.temperature ?? '—'}</b>°C
                  </span>
                </div>
              )}
              {stateKey === 'o' && (
                <div className="text-xs text-gray-400 mt-2">Mất kết nối</div>
              )}
            </div>
          )
        })}
      </div>

      <DeviceDetail
        device={selectedDevice}
        open={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
      />
    </>
  )
}