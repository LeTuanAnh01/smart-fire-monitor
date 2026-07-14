import api from '@/shared/api/axios'

export const userApi = {
  getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    api.get('/users', { params }),

  createUser: (data: { fullName: string; email: string; password: string; role?: string; phone?: string }) =>
    api.post('/users', data),

  updateUser: (id: string, data: { fullName?: string; phone?: string; isActive?: boolean; password?: string, role?: string }) =>
    api.put(`/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/users/${id}`),
}