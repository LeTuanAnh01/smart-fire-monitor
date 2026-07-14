import { Modal, Form, Input, Select, Switch, message } from 'antd'
import { useEffect, useState } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import { userApi } from '../api/user.api'
import api from '@/shared/api/axios'
import LocationTreeSelect from '@/shared/components/ui/LocationTreeSelect'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: any | null
}

export default function UserForm({ open, onClose, onSuccess, editData }: Props) {
  const { user: currentUser } = useAuth()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const isEdit = !!editData

  const getRoleOptions = () => {
    if (currentUser?.role === 'SUPER_ADMIN') return [
      { value: 'ADMIN',   label: 'Admin' },
      { value: 'MANAGER', label: 'Quản lý' },
      { value: 'USER',    label: 'Người dùng' },
    ]
    if (currentUser?.role === 'ADMIN') return [
      { value: 'ADMIN',   label: 'Admin' },
      { value: 'MANAGER', label: 'Quản lý' },
      { value: 'USER',    label: 'Người dùng' },
    ]
    if (currentUser?.role === 'MANAGER') return [
      { value: 'MANAGER', label: 'Quản lý' },  // thêm dòng này
      { value: 'USER',    label: 'Người dùng' },
    ]
    return []
  }

  const roleOptions = getRoleOptions()
  const defaultRole = roleOptions[roleOptions.length - 1]?.value || 'USER'

  useEffect(() => {
    if (!open) return
    if (editData) {
      form.setFieldsValue({
        fullName: editData.fullName,
        phone: editData.phone || '',
        isActive: editData.isActive,
        role: editData.role,
        locationIds: editData.locations?.map((l: any) => l.id) || [],
        password: '',
      })
    } else {
      form.resetFields()
    }
  }, [open, editData, form])

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      if (isEdit) {
        const data: any = { fullName: values.fullName, phone: values.phone || null, isActive: values.isActive, role: values.role }
        if (values.password) data.password = values.password
        await userApi.updateUser(editData.id, data)

        const currentIds: string[] = editData.locations?.map((l: any) => l.id) || []
        const newIds: string[] = values.locationIds || []
        const toAdd = newIds.filter(id => !currentIds.includes(id))
        const toRemove = currentIds.filter(id => !newIds.includes(id))

        await Promise.all([
          ...toAdd.map(locationId =>
            api.post(`/locations/${locationId}/users`, { userId: editData.id })
          ),
          ...toRemove.map(locationId =>
            api.delete(`/locations/${locationId}/users/${editData.id}`)
          ),
        ])
        message.success('Cập nhật thành công')
      } else {
        const res = await userApi.createUser({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
          role: roleOptions.length > 0 ? values.role : 'USER',
        })

        const newUserId = res.data.data.id
        if (values.locationIds?.length > 0) {
          await Promise.all(
            values.locationIds.map((locationId: string) =>
              api.post(`/locations/${locationId}/users`, { userId: newUserId })
            )
          )
        }
        message.success('Tạo tài khoản thành công')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Sửa tài khoản' : 'Tạo tài khoản mới'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Họ tên"
          name="fullName"
          rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
        >
          <Input placeholder="Nguyễn Văn A" />
        </Form.Item>

        {!isEdit && (
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
          >
            <Input placeholder="user@sfm.vn" />
          </Form.Item>
        )}

        <Form.Item label="Số điện thoại" name="phone">
          <Input placeholder="VD: 0909000001" />
        </Form.Item>

        {/* Hiện select role nếu có quyền tạo nhiều loại */}
        {!isEdit && roleOptions.length > 0 && (
          <Form.Item label="Vai trò" name="role" initialValue={defaultRole}>
            <Select options={roleOptions} />
          </Form.Item>
        )}

        <Form.Item
          label={isEdit ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
          name="password"
          rules={!isEdit ? [{ required: true, min: 6, message: 'Mật khẩu ít nhất 6 ký tự' }] : []}
        >
          <Input.Password placeholder="••••••••" />
        </Form.Item>

        {isEdit && (
          <Form.Item label="Vai trò" name="role">
            <Select
              options={roleOptions}
              disabled={roleOptions.length === 0}
            />
          </Form.Item>
        )}

        {/* Khu vực — ẩn khi role là ADMIN hoặc SUPER_ADMIN */}
        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => prev.role !== curr.role}
        >
          {({ getFieldValue }) => {
            const role = getFieldValue('role') || editData?.role
            if (role === 'SUPER_ADMIN') return null
            return (
              <Form.Item label="Khu vực quản lý" name="locationIds">
                <LocationTreeSelect
                  multiple
                  placeholder="Chọn khu vực..."
                />
              </Form.Item>
            )
          }}
        </Form.Item>

        {isEdit && (
          <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}