import { Modal, Tabs, Form, Input, Button, message, Typography } from 'antd'
import { useState } from 'react'
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useAuth } from '@/shared/context/AuthContext'
import { authApi } from '../api/auth.api'

const { Text } = Typography

interface Props {
  open: boolean
  onClose: () => void
}

export default function ProfileModal({ open, onClose }: Props) {
  const { user, login } = useAuth()
  const [passwordForm] = Form.useForm()
  const [loadingPassword, setLoadingPassword] = useState(false)

  // Inline edit state
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [loadingEdit, setLoadingEdit] = useState(false)

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue)
  }

  const cancelEdit = () => {
    setEditingField(null)
    setEditValue('')
  }

  const saveEdit = async (field: string) => {
    if (!editValue.trim()) {
      message.error('Không được để trống')
      return
    }
    setLoadingEdit(true)
    try {
      
      // Cập nhật lại user trong context
      const token = localStorage.getItem('token')!
      login(token, { ...user!, [field]: editValue.trim() })
      message.success('Cập nhật thành công')
      setEditingField(null)
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoadingEdit(false)
    }
  }

  const onChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp')
      return
    }
    setLoadingPassword(true)
    try {
      await authApi.changePassword(values.oldPassword, values.newPassword)
      message.success('Đổi mật khẩu thành công')
      passwordForm.resetFields()
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoadingPassword(false)
    }
  }

  const EditableRow = ({
    label,
    field,
    value,
    editable = true
  }: {
    label: string
    field: string
    value: string
    editable?: boolean
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="text-sm text-gray-500 w-32 flex-shrink-0">{label}</div>
      <div className="flex-1">
        {editingField === field ? (
          <div className="flex items-center gap-2">
            <Input
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              size="small"
              autoFocus
              onPressEnter={() => saveEdit(field)}
              className="flex-1"
            />
            <Button
              icon={<CheckOutlined />}
              size="small"
              type="primary"
              loading={loadingEdit}
              onClick={() => saveEdit(field)}
            />
            <Button
              icon={<CloseOutlined />}
              size="small"
              onClick={cancelEdit}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Text className="text-sm">{value}</Text>
            {editable && (
              <Button
                icon={<EditOutlined />}
                type="text"
                size="small"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => startEdit(field, value)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Modal
      title="Thông tin cá nhân"
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      <Tabs
        items={[
          {
            key: 'info',
            label: 'Thông tin',
            children: (
              <div className="mt-2">
                <EditableRow
                  label="Họ tên"
                  field="fullName"
                  value={user?.fullName || ''}
                />
                <EditableRow
                  label="Email"
                  field="email"
                  value={user?.email || ''}
                  editable={false}
                />
                <EditableRow
                  label="Số điện thoại"
                  field="phone"
                  value={user?.phone || ''}
                />
                <EditableRow
                  label="Vai trò"
                  field="role"
                  value={user?.role === 'ADMIN' ? 'Admin' : 'Quản lý tòa nhà'}
                  editable={false}
                />
              </div>
            ),
          },
          {
            key: 'password',
            label: 'Đổi mật khẩu',
            children: (
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={onChangePassword}
                className="mt-2"
              >
                <Form.Item
                  label="Mật khẩu hiện tại"
                  name="oldPassword"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                >
                  <Input.Password placeholder="••••••••" />
                </Form.Item>
                <Form.Item
                  label="Mật khẩu mới"
                  name="newPassword"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                  ]}
                >
                  <Input.Password placeholder="••••••••" />
                </Form.Item>
                <Form.Item
                  label="Xác nhận mật khẩu mới"
                  name="confirmPassword"
                  rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu' }]}
                >
                  <Input.Password placeholder="••••••••" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loadingPassword} block>
                  Đổi mật khẩu
                </Button>
              </Form>
            ),
          },
        ]}
      />
    </Modal>
  )
}