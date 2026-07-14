import { useState, useEffect } from 'react'
import { PaginatedResponse } from '@/shared/types'
import { userApi } from '../api/user.api'

interface Filters {
  role?: string
  search?: string
  page: number
  limit: number
}

export const useUsers = () => {
  const [data, setData] = useState<PaginatedResponse<any>>({
    items: [], total: 0, page: 1, limit: 20, totalPages: 0
  })
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await userApi.getUsers(filters)
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

  const refresh = () => setTick(t => t + 1)

  return { data, filters, setFilters, loading, refresh }
}