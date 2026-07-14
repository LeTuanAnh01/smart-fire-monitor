import { Modal, Form, Input, message} from 'antd'
import { useState } from 'react'
import { deviceApi } from '../api/device.api'
import LocationTreeSelect from '@/shared/components/ui/LocationTreeSelect'


interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

// Chuyển location tree thành format TreeSelect
const toTreeSelectData = (nodes: any[]): any[] =>
  nodes.map(n => ({
    value: n.id,
    title: n.name + (n.code ? ` [${n.code}]` : ''),
    children: n.children?.length ? toTreeSelectData(n.children) : undefined,
  }))

export default function DeviceForm({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const locationId = Array.isArray(values.locationId)
        ? values.locationId[0]
        : values.locationId

      await deviceApi.createDevice({
        locationId,
        extId: values.extId,
        name: values.name,
      })
      message.success('Thêm thiết bị thành công')
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
      title="Thêm thiết bị mới"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnHidden
      width={480}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="Tên thiết bị" name="name" rules={[{ required: true }]}>
          <Input placeholder="VD: Cảm biến khói P401" />
        </Form.Item>

        <Form.Item label="Ext ID" name="extId" rules={[{ required: true }]}
          extra="Mã thiết bị từ IoT platform (VD: 0204)"
        >
          <Input placeholder="VD: 0204" />
        </Form.Item>

        <Form.Item label="Vị trí" name="locationId" rules={[{ required: true }]}>
          <LocationTreeSelect
            placeholder="Chọn vị trí lắp đặt"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}