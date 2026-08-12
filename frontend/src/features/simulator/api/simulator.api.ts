import api from '@/shared/api/axios'

export const simulatorApi = {
  trigger: (deviceId: string, action: 'fire' | 'warning' | 'normal' | 'offline') =>
    api.post('/simulator/trigger', { deviceId, action }),

  triggerAll: (action: 'fire' | 'warning' | 'normal' | 'offline') =>
    api.post('/simulator/trigger-all', { action }),
}