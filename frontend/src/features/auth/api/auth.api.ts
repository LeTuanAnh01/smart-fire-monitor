import api from '@/shared/api/axios'

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  getMe: () => api.get('/auth/me'),

  updateMe: (data: { fullName?: string }) =>
    api.put('/auth/me', data),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { oldPassword, newPassword }),
}