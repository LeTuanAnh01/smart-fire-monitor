import { Typography, Card, message } from 'antd'
import { useState } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import { useUsers } from './hooks/useUsers'
import UserTable from './components/UserTable'
import UserForm from './components/UserForm'
import { userApi } from './api/user.api'

const { Title } = Typography

export default function Users() {
  const { user } = useAuth()
  const { data, filters, setFilters, loading, refresh } = useUsers()
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState<any | null>(null)

  const handleEdit = (u: any) => {
    setEditData(u)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await userApi.deleteUser(id)
      message.success('Xóa thành công')
      refresh()
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  // Loại bản thân khỏi danh sách hiển thị
  const displayItems = data.items.filter((u: any) => u.id !== user?.id)

  return (
    <div>
      <Title level={4} className="!mb-6">Quản lý người dùng</Title>

      <Card className="shadow-sm">
        <UserTable
          data={displayItems as any}
          total={data.total - (data.items.some((u: any) => u.id === user?.id) ? 1 : 0)}
          page={filters.page}
          loading={loading}
          onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          onSearch={(search) => setFilters(prev => ({ ...prev, search, page: 1 }))}
          onFilterRole={(role) => setFilters(prev => ({ ...prev, role, page: 1 }))}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => { setEditData(null); setShowForm(true) }}
          currentUserId={user?.id || ''}
        />
      </Card>

      <UserForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={refresh}
        editData={editData}
      />
    </div>
  )
}