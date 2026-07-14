import { Form, Input, Button, message } from 'antd'
import { useState, useEffect } from 'react'
import { deviceApi } from '../api/device.api'
import LocationTreeSelect from '@/shared/components/ui/LocationTreeSelect'

interface Props {
  device: any
  onSuccess: () => void
}

export default function DeviceSettingsForm({ device, onSuccess }: Props) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    form.setFieldsValue({
      name: device.name,
      locationId: device.location?.id,
    })
  }, [device, form])

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const locationId = Array.isArray(values.locationId)
        ? values.locationId[0]
        : values.locationId

      await deviceApi.updateDevice(device.id, {
        name: values.name,
        locationId,
      })
      message.success('Cập nhật thiết bị thành công')
      onSuccess()
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        label="Tên thiết bị"
        name="name"
        rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị' }]}
      >
        <Input placeholder="VD: Cảm biến khói P401" />
      </Form.Item>

      <Form.Item
        label="Vị trí lắp đặt"
        name="locationId"
        rules={[{ required: true, message: 'Vui lòng chọn vị trí' }]}
        extra={
          <span className="text-xs text-gray-400"></span>
        }
      >
        <LocationTreeSelect placeholder="Chọn vị trí mới..." />
      </Form.Item>

      <Form.Item label="Ext ID">
        <Input value={device.extId} disabled />
      </Form.Item>

      <Form.Item label="Thing ID">
        <Input value={device.thingId} disabled className="font-mono text-xs" />
      </Form.Item>

      <Button type="primary" htmlType="submit" loading={loading}>
        Lưu thay đổi
      </Button>
    </Form>
  )
}