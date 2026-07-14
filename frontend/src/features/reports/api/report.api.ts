import api from '@/shared/api/axios'

export const reportApi = {
  getAlertsChart: (params?: { locationId?: string }) =>
    api.get('/stats/alerts-chart', { params }),

  getOverview: (params?: { locationId?: string }) =>
    api.get('/stats/overview', { params }),

  getAlerts: (params?: {
    locationId?: string
    from?: string
    to?: string
    page?: number
    limit?: number
  }) => api.get('/alerts', { params }),
}