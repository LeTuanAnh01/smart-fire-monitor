import { useState, useEffect } from 'react'
import { Device, PaginatedResponse } from '@/shared/types'
import { deviceApi } from '../api/device.api'

interface Filters {
  page: number
  limit: number
  states?: number[]
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
        const res = await deviceApi.getDevices({
          ...filters,
          states: filters.states?.join(',') as any
        })
        if (!cancelled) {
          const sorted = {
            ...res.data.data,
            items: [...res.data.data.items].sort((a, b) => {
              const stateRank = (state?: number) => {
                if (state === 1) return 3  // FIRE — lên đầu
                if (state === 2) return 2  // WARNING
                if (state === -1) return 1 // OFFLINE
                return 0                   // NORMAL — xuống cuối
              }
              return stateRank(b.status?.state) - stateRank(a.status?.state)
            })
          }
          setData(sorted)
        }
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
      setData(prev => {
        const updated = prev.items.map(d =>
          d.id === deviceId ? { ...d, status } : d
        )
        const sorted = [...updated].sort((a, b) => {
          const stateRank = (state?: number) => {
            if (state === 1) return 3
            if (state === 2) return 2
            if (state === -1) return 1
            return 0
          }
          return stateRank(b.status?.state) - stateRank(a.status?.state)
        })
        return { ...prev, items: sorted }
      })
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