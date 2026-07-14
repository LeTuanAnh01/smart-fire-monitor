import { DatePicker, Button, Row, Col } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import LocationTreeSelect from '@/shared/components/ui/LocationTreeSelect'

const { RangePicker } = DatePicker

interface Filters {
  locationId?: string  // đổi buildingId → locationId
  from?: string
  to?: string
}

interface Props {
  onChange: (filters: Filters) => void
  onExport: () => void
  exporting: boolean
}

export default function ReportFilters({ onChange, onExport, exporting }: Props) {
  return (
    <Row gutter={[12, 12]} className="mb-6">
      <Col xs={24} sm={8} md={6}>
        <LocationTreeSelect
  placeholder="Tất cả khu vực"
  onChange={(val) => {
    console.log('Location selected:', val)
    onChange({ locationId: val?.[0] })
  }}
/>
      </Col>
      <Col xs={24} sm={12} md={10}>
        <RangePicker
          className="w-full"
          defaultValue={[dayjs().subtract(7, 'day'), dayjs()]}
          onChange={dates => {
            if (dates) {
              onChange({
                from: dayjs(dates[0]!).startOf('day').toISOString(),
                to: dayjs(dates[1]!).endOf('day').toISOString(),
              })
            } else {
              onChange({ from: undefined, to: undefined })
            }
          }}
        />
      </Col>
      <Col xs={24} sm={4} md={4}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={onExport}
          loading={exporting}
          className="w-full"
        >
          Xuất Excel
        </Button>
      </Col>
    </Row>
  )
}