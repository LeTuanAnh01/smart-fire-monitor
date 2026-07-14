import { useState, useEffect } from 'react'
import { Device, PaginatedResponse } from '@/shared/types'
import { deviceApi } from '../api/device.api'

interface Filters {
  page: number
  limit: number
  state?: number
  search?: string
  locationId?: string
}

export const useDevices = () => {
  const [data, setData] = useState<PaginatedResponse<Device>>({
    items: [], total: 0, page: 1, limit: 20, totalPages: 0
  })
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
      console.log('🔄 Fetching devices, tick:', tick, 'filters:', filters)

    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await deviceApi.getDevices(filters)
        if (!cancelled) setData(res.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [filters, tick])


  useEffect(() => {
    const handler = (e: any) => {
      const { deviceId, status } = e.detail
      setData(prev => ({
        ...prev,
        items: prev.items.map(d =>
          d.id === deviceId ? { ...d, status } : d
        )
      }))
    }
    window.addEventListener('sensor-update', handler)
    return () => window.removeEventListener('sensor-update', handler)
  }, [])

  const refresh = () => {
  console.log('🔁 Refresh called')
  setTick(t => t + 1)
}

  return { data, filters, setFilters, loading, refresh }
}