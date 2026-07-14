import api from '@/shared/api/axios'

export const alertApi = {
  getAlerts: (params?: {
    page?: number
    limit?: number
    status?: string
    alertType?: string
    buildingId?: string
    from?: string
    to?: string
  }) => api.get('/alerts', { params }),

  acknowledge: (id: string) => api.put(`/alerts/${id}/acknowledge`),
  resolve: (id: string) => api.put(`/alerts/${id}/resolve`),
}