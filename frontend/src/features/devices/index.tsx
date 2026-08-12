import {Card, Row, Col } from 'antd'
import { useState } from 'react'
import { Device } from '@/shared/types'
import { useAuth } from '@/shared/context/AuthContext'
import DeviceTable from './components/DeviceTable'
import DeviceDetail from './components/DeviceDetail'
import DeviceForm from './components/DeviceForm'
import { useDevices } from './hooks/useDevices'
import LocationFilterTree from '@/shared/components/ui/LocationFilterTree'
import { deviceApi } from './api/device.api'



export default function Devices() {
  const { user } = useAuth() 
  const canAddDevice = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '')
  const { data, filters, setFilters, loading, refresh } = useDevices()
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)

  return (
    <div>
      <Row gutter={16} style={{ height: 'calc(100vh - 160px)' }}>
        {/* Cây location */}
        <Col xs={24} md={6} lg={5} style={{ height: '100%' }}>
          <LocationFilterTree
            selectedId={selectedLocationId}
            onSelect={(id) => {
              setSelectedLocationId(id)
              // Trigger filter
              setFilters(prev => ({ ...prev, locationId: id || undefined, page: 1 }))
            }}
          />
        </Col>

        {/* Bảng thiết bị */}
        <Col xs={24} md={18} lg={19}>
          <Card className="shadow-sm">
            <DeviceTable
              data={data.items}
              total={data.total}
              page={filters.page}
              limit={filters.limit}
              loading={loading}
              canAddDevice={canAddDevice}
              onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
              onSearch={(search) => setFilters(prev => ({ ...prev, search, page: 1 }))}
              onStateFilter={(states) => setFilters(prev => ({ ...prev, states, page: 1 }))}
              onRefresh={() => {
                setFilters({ page: 1, limit: 20 })
                setSelectedLocationId(null)
              }}
              onView={setSelectedDevice}
              onAdd={() => setShowForm(true)}
              onDelete={async (id) => {
                await deviceApi.deleteDevice(id)
                refresh()
              }}
            />
          </Card>
        </Col>
      </Row>

      <DeviceDetail
        device={selectedDevice}
        open={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
      />

      {canAddDevice && (
        <DeviceForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={refresh}
        />
      )}
    </div>
  )
}