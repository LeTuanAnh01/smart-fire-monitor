import { Table, Tag, Button, Space, Popconfirm, Input, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAuth } from '@/shared/context/AuthContext'

interface UserRow {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  createdById: string | null
  locations: { id: string; name: string }[]
}

interface Props {
  data: UserRow[]
  total: number
  page: number
  loading: boolean
  onPageChange: (page: number) => void
  onSearch: (val: string) => void
  onFilterRole: (role: string) => void
  onEdit: (user: UserRow) => void
  onDelete: (id: string) => void
  onAdd: () => void
  currentUserId: string
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'purple' },
  ADMIN:       { label: 'Admin',       color: 'red'    },
  MANAGER:     { label: 'Quản lý',     color: 'blue'   },
  USER:        { label: 'Người dùng',  color: 'default' },
}

export default function UserTable({
  data, total, page, loading,
  onPageChange, onSearch, onFilterRole,
  onEdit, onDelete, onAdd, currentUserId
}: Props) {
  const { user: currentUser } = useAuth()

  const canManage = (row: UserRow) => {
    if (!currentUser) return false
    if (row.id === currentUserId) return false

    if (currentUser.role === 'SUPER_ADMIN') return true
    if (currentUser.role === 'ADMIN') return true  // backend đã lọc đúng
    if (currentUser.role === 'MANAGER') return row.createdById === currentUserId

    return false
  }

  const columns: ColumnsType<UserRow> = [
    {
      title: 'Họ tên',
      key: 'fullName',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.fullName}</div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.email}</div>
        </div>
      ),
      width: 200,
    },
    {
  title: 'Số điện thoại',
  dataIndex: 'phone',
  key: 'phone',
  render: (val) => val || <span className="text-gray-400">—</span>,
  width: 130,
},
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (val) => {
        const config = ROLE_CONFIG[val] ?? { label: val, color: 'default' }
        return <Tag color={config.color}>{config.label}</Tag>
      },
      width: 130,
    },
    {
      title: 'Khu vực quản lý',
      key: 'locations',
      render: (_, record) => (
        record.locations?.length > 0
          ? record.locations.map(l => <Tag key={l.id}>{l.name}</Tag>)
          : <span className="text-gray-400">—</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (val) => (
        <Tag color={val ? 'success' : 'default'}>
          {val ? 'Hoạt động' : 'Vô hiệu'}
        </Tag>
      ),
      width: 110,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val) => new Date(val).toLocaleDateString('vi-VN'),
      width: 110,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      render: (_, record) =>
        canManage(record) ? (
          <Space>
            <Button size="small" onClick={() => onEdit(record)}>Sửa</Button>
            <Popconfirm
              title="Xóa tài khoản này?"
              onConfirm={() => onDelete(record.id)}
              okType="danger"
            >
              <Button size="small" danger>Xóa</Button>
            </Popconfirm>
          </Space>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
  ]

  // Filter role theo người đang đăng nhập
  const getRoleFilterOptions = () => {
    if (currentUser?.role === 'SUPER_ADMIN') return [
      { value: 'ADMIN',   label: 'Admin' },
      { value: 'MANAGER', label: 'Quản lý' },
      { value: 'USER',    label: 'Người dùng' },
    ]
    if (currentUser?.role === 'ADMIN') return [
      { value: 'MANAGER', label: 'Quản lý' },
      { value: 'USER',    label: 'Người dùng' },
    ]
    if (currentUser?.role === 'MANAGER') return [
      { value: 'USER', label: 'Người dùng' },
    ]
    return []
  }

  const roleFilterOptions = getRoleFilterOptions()

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <Input.Search
          placeholder="Tìm tên..."
          allowClear
          className="w-52"
          onSearch={onSearch}
        />
        {roleFilterOptions.length > 1 && (
          <Select
            placeholder="Vai trò"
            allowClear
            className="w-40"
            onChange={val => onFilterRole(val || '')}
            options={roleFilterOptions}
          />
        )}
        <Button type="primary" className="ml-auto" onClick={onAdd}>
          + Tạo tài khoản
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          onChange: onPageChange,
          showTotal: total => `Tổng ${total} tài khoản`,
          showSizeChanger: false,
        }}
        scroll={{ x: 700 }}
      />
    </div>
  )
}