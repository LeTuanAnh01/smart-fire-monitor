import api from '@/shared/api/axios'

export const statsApi = {
  getOverview: (params?: { buildingId?: string }) =>
    api.get('/stats/overview', { params }),
  getAlertsChart: (params?: { buildingId?: string }) =>
    api.get('/stats/alerts-chart', { params }),
  getDeviceStatus: (params?: { buildingId?: string }) =>
    api.get('/stats/device-status', { params }),
}