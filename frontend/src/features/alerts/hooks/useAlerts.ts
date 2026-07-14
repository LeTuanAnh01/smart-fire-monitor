import { useState, useEffect } from 'react'
import { Alert, PaginatedResponse } from '@/shared/types'
import { alertApi } from '../api/alert.api'

interface Filters {
  status?: string
  alertType?: string
  from?: string
  to?: string
  page: number
  limit: number
}

export const useAlerts = () => {
  const [data, setData] = useState<PaginatedResponse<Alert>>({
    items: [], total: 0, page: 1, limit: 20, totalPages: 0
  })
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const fetch = async () => {
      try {
        const res = await alertApi.getAlerts(filters)
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
    const handler = () => setTick(t => t + 1)
    window.addEventListener('new-alert', handler)
    return () => window.removeEventListener('new-alert', handler)
  }, [])

  const refresh = () => setTick(t => t + 1)

  const acknowledge = async (id: string) => {
    await alertApi.acknowledge(id)
    refresh()
  }

  const resolve = async (id: string) => {
    await alertApi.resolve(id)
    refresh()
  }

  return { data, filters, setFilters, loading, refresh, acknowledge, resolve }
}