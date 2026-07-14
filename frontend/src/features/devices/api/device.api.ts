import api from '@/shared/api/axios'

export const deviceApi = {
  getDevices: (params?: {
    page?: number
    limit?: number
    search?: string
    locationId?: string
    state?: number
  }) => api.get('/devices', { params }),

  getDeviceById: (id: string) => api.get(`/devices/${id}`),

  getDeviceLogs: (id: string, params?: {
    metric?: string
    from?: string
    to?: string
    limit?: number
    page?: number   
  }) => api.get(`/devices/${id}/logs`, { params }),

  createDevice: (data: {
    extId: string
    name: string
    locationId: string
  }) => api.post('/devices', data),

  updateDevice: (id: string, data: { name?: string; locationId?: string }) => api.put(`/devices/${id}`, data),

  deleteDevice: (id: string) => api.delete(`/devices/${id}`),
}