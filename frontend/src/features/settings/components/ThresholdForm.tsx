import { Form, InputNumber, Button, message } from 'antd'
import { useState } from 'react'

export default function ThresholdForm() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      // TODO: Gọi API cập nhật ngưỡng cho từng loại thiết bị
      console.log('Threshold values:', values)
      message.success('Đã lưu cài đặt ngưỡng cảnh báo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ smoke: 200, heat: 60, co: 50 }}
      className="max-w-md"
    >
      <div className="text-sm text-gray-500 mb-4">
        Ngưỡng mặc định áp dụng khi thêm thiết bị mới. Ngưỡng của từng thiết bị
        có thể chỉnh riêng trong phần Quản lý thiết bị.
      </div>

      <Form.Item
        label="Cảm biến khói (ppm)"
        name="smoke"
        rules={[{ required: true, min: 1 }]}
      >
        <InputNumber className="w-full" min={1} addonAfter="ppm" />
      </Form.Item>

      <Form.Item
        label="Cảm biến nhiệt (°C)"
        name="heat"
        rules={[{ required: true, min: 1 }]}
      >
        <InputNumber className="w-full" min={1} addonAfter="°C" />
      </Form.Item>

      <Form.Item
        label="Cảm biến CO (ppm)"
        name="co"
        rules={[{ required: true, min: 1 }]}
      >
        <InputNumber className="w-full" min={1} addonAfter="ppm" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Lưu cài đặt
        </Button>
      </Form.Item>
    </Form>
  )
}