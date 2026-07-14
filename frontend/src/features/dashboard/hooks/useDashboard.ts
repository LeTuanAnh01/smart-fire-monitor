import { useState, useEffect } from 'react'
import { statsApi } from '../api/stats.api'

interface OverviewStats {
  totalDevices: number
  normalDevices: number
  alertDevices: number
  warningDevices: number
  offlineDevices: number
  activeAlerts: number
  todayAlerts: number
  totalBuildings: number
  totalFloors: number
}

interface AlertChartData {
  date: string
  alert: number
  warning: number
}

interface DeviceStatusData {
  state: number
  count: number
}

export const useDashboard = () => {
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [alertsChart, setAlertsChart] = useState<AlertChartData[]>([])
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    try {
      const [overviewRes, chartRes, statusRes] = await Promise.all([
        statsApi.getOverview(),
        statsApi.getAlertsChart(),
        statsApi.getDeviceStatus(),
      ])
      setOverview(overviewRes.data.data)
      setAlertsChart(chartRes.data.data)
      setDeviceStatus(statusRes.data.data)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    const handler = () => fetchAll()
    window.addEventListener('new-alert', handler)
    window.addEventListener('sensor-update', handler)  // thêm dòng này
    return () => {
      window.removeEventListener('new-alert', handler)
      window.removeEventListener('sensor-update', handler)
    }
  }, [])

  return { overview, alertsChart, deviceStatus, loading, refresh: fetchAll }
}