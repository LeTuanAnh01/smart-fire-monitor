import { Card, Button, Modal, Form, Input, message, Popconfirm, Space, Tag, Row, Col, Spin } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import api from '@/shared/api/axios'



const countDevices = (node: any): number => {
  const direct = node.devices?.length || 0
  const fromChildren = (node.children || []).reduce((s: number, c: any) => s + countDevices(c), 0)
  return direct + fromChildren
}

const countAlerts = (node: any): number => {
  const direct = (node.devices || []).reduce((s: number, d: any) => s + (d.alerts?.length || 0), 0)
  const fromChildren = (node.children || []).reduce((s: number, c: any) => s + countAlerts(c), 0)
  return direct + fromChildren
}

const getWorstState = (node: any): string => {
  const rank: Record<string, number> = { d: 3, w: 2, o: 1, n: 0 }
  let worst = 'n'
  const check = (s: number | null) => {
    const k = s === 1 ? 'd' : s === 2 ? 'w' : s === -1 ? 'o' : 'n'
    if (rank[k] > rank[worst]) worst = k
  }
  node.devices?.forEach((d: any) => check(d.status?.state ?? null))
  node.children?.forEach((c: any) => {
    const cs = getWorstState(c)
    if (rank[cs] > rank[worst]) worst = cs
  })
  return worst
}

const STATE_ICON: Record<string, string> = { d: '🔴', w: '⚠️', o: '📵', n: '✅' }
const STATE_COLOR: Record<string, string> = { d: 'red', w: 'orange', o: 'default', n: 'success' }
const STATE_LABEL: Record<string, string> = { d: 'Nguy hiểm', w: 'Cảnh báo', o: 'Offline', n: 'Bình thường' }

const findNode = (nodes: any[], id: string): any => {
  for (const n of nodes) {
    if (n.id === id) return n
    const found = findNode(n.children || [], id)
    if (found) return found
  }
  return null
}

export default function Locations() {
  const { isAdmin } = useAuth()
  const [tree, setTree] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editNode, setEditNode] = useState<any | null>(null)
  const [parentNode, setParentNode] = useState<any | null>(null)
  const [form] = Form.useForm()

  const selectedRef = useRef<any>(null)
  useEffect(() => { selectedRef.current = selected }, [selected])

  const fetchTree = async () => {
    try {
      const res = await api.get('/locations')
      const data = res.data.data
      setTree(data)

      const currentSelected = selectedRef.current
      if (currentSelected) {
        const updated = findNode(data, currentSelected.id)
        if (updated) setSelected(updated)
      } else if (data.length > 0) {
        setSelected(data[0])
        setExpandedIds(new Set([data[0].id]))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTree()
    const h = () => fetchTree()
    window.addEventListener('new-alert', h)
    return () => window.removeEventListener('new-alert', h)
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const openAdd = (parent?: any) => {
    setEditNode(null)
    setParentNode(parent || null)
    form.resetFields()
    setShowModal(true)
  }

  const openEdit = (node: any) => {
    setEditNode(node)
    setParentNode(null)
    form.setFieldsValue({ name: node.name, code: node.code })
    setShowModal(true)
  }

  const handleSave = async (values: any) => {
    try {
      if (editNode) {
        await api.put(`/locations/${editNode.id}`, values)
        message.success('Cập nhật thành công')
      } else {
        await api.post('/locations', { ...values, parentId: parentNode?.id })
        message.success('Thêm thành công')
      }
      setShowModal(false)
      fetchTree()
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/locations/${id}`)
      message.success('Xóa thành công')
      if (selectedRef.current?.id === id) setSelected(null)
      fetchTree()
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const renderNodes = (nodes: any[], depth = 0): React.ReactNode =>
    nodes.map(node => {
      const hasChildren = node.children?.length > 0
      const isExpanded = expandedIds.has(node.id)
      const isSelected = selected?.id === node.id

      return (
        <div key={node.id}>
          <div
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer group transition-colors ${
              isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
            onClick={() => setSelected(node)}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span
                className="text-gray-400 text-xs w-4 flex-shrink-0 select-none"
                onClick={e => { e.stopPropagation(); toggleExpand(node.id) }}
              >
                {hasChildren ? (isExpanded ? '▼' : '▶') : ''}
              </span>
              <span className={`text-sm truncate ${isSelected ? 'text-blue-600 font-medium' : 'text-gray-800'}`}>
                {node.name}
              </span>
              {node.code && (
                <span className="text-xs text-gray-400 flex-shrink-0">[{node.code}]</span>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
            
              {isAdmin && (
                <Space size={2}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  onClick={e => e.stopPropagation()}
                >
                  <Button size="small" type="text" icon={<PlusOutlined />}
                    onClick={() => openAdd(node)} title="Thêm cấp con" />
                  <Button size="small" type="text" icon={<EditOutlined />}
                    onClick={() => openEdit(node)} />
                  <Popconfirm
                    title="Xóa khu vực này?"
                    description="Tất cả dữ liệu bên trong sẽ bị xóa!"
                    onConfirm={() => handleDelete(node.id)}
                    okType="danger"
                  >
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              )}
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div>{renderNodes(node.children, depth + 1)}</div>
          )}
        </div>
      )
    })

  const renderDetail = () => {
    if (!selected) return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Chọn khu vực bên trái để xem chi tiết
      </div>
    )

    const directDevices = selected.devices || []
    const children = selected.children || []

    const allDevices: any[] = []
    const collectDevices = (node: any) => {
      node.devices?.forEach((d: any) => allDevices.push(d))
      node.children?.forEach((c: any) => collectDevices(c))
    }
    collectDevices(selected)

    const stateCount = { d: 0, w: 0, o: 0, n: 0 }
    allDevices.forEach(d => {
      const s = d.status?.state
      const k = s === 1 ? 'd' : s === 2 ? 'w' : s === -1 ? 'o' : 'n'
      stateCount[k as keyof typeof stateCount]++
    })

    return (
      <div className="space-y-4">
        <div>
          <div className="text-base font-medium text-gray-900">{selected.name}</div>
          {selected.code && (
            <div className="text-xs text-gray-400 mt-0.5">Mã: {selected.code}</div>
          )}
        </div>

        <Row gutter={[8, 8]}>
          <Col span={6}>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-medium text-gray-800">{allDevices.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Tổng thiết bị</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-medium text-red-600">{stateCount.d}</div>
              <div className="text-xs text-red-400 mt-0.5">Nguy hiểm</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-medium text-yellow-600">{stateCount.w + stateCount.o}</div>
              <div className="text-xs text-yellow-400 mt-0.5">Cảnh báo/Offline</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-medium text-green-600">{stateCount.n}</div>
              <div className="text-xs text-green-400 mt-0.5">Bình thường</div>
            </div>
          </Col>
        </Row>

        {children.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Khu vực con ({children.length})
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
              {children.map((child: any) => {
                const cw = getWorstState(child)
                const ca = countAlerts(child)
                const cd = countDevices(child)
                return (
                  <div
                    key={child.id}
                    className={`rounded-lg p-2 text-center cursor-pointer border transition-colors hover:opacity-80 ${
                      cw === 'd' ? 'bg-red-50 border-red-200' :
                      cw === 'w' ? 'bg-yellow-50 border-yellow-200' :
                      cw === 'o' ? 'bg-gray-50 border-gray-200' :
                      'bg-green-50 border-green-200'
                    }`}
                    onClick={() => {
                      setSelected(child)
                      setExpandedIds(prev => new Set([...prev, child.id]))
                    }}
                  >
                    <div className="text-base mb-0.5">{STATE_ICON[cw]}</div>
                    <div className="text-xs font-medium text-gray-800 truncate" title={child.name}>
                      {child.code || child.name}
                    </div>
                    <div className="text-xs text-gray-400">{cd} TB</div>
                    {ca > 0 && <div className="text-xs text-red-500">🚨 {ca}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {directDevices.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Thiết bị gắn trực tiếp ({directDevices.length})
            </div>
            <div className="space-y-1.5">
              {directDevices.map((dev: any) => {
                const s = dev.status?.state
                const k = s === 1 ? 'd' : s === 2 ? 'w' : s === -1 ? 'o' : 'n'
                return (
                  <div key={dev.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm text-gray-800">{dev.name}</div>
                      <div className="text-xs text-gray-400">ID: {dev.extId}</div>
                    </div>
                    <Tag color={STATE_COLOR[k]} className="text-xs m-0">
                      {STATE_ICON[k]} {STATE_LABEL[k]}
                    </Tag>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {allDevices.length === 0 && children.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Khu vực này chưa có thiết bị hay khu vực con
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openAdd()}>
            Thêm khu vực gốc
          </Button>
        )}
      </div>

      <Row gutter={16} style={{ height: 'calc(100vh - 160px)' }}>
        <Col xs={24} md={9} lg={7} style={{ height: '100%' }}>
          <Card
            title="Cấu trúc khu vực"
            size="small"
            className="shadow-sm h-full overflow-auto"
          >
            {loading ? (
              <div className="flex justify-center py-8"><Spin /></div>
            ) : (
              <div className="space-y-0.5">
                {renderNodes(tree)}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={15} lg={17} style={{ height: '100%' }}>
          <Card
            size="small"
            className="shadow-sm h-full overflow-auto"
            title={selected ? `Chi tiết — ${selected.name}` : 'Chi tiết'}
          >
            {renderDetail()}
          </Card>
        </Col>
      </Row>

      <Modal
        title={editNode ? 'Sửa khu vực' : `Thêm vào ${parentNode?.name || 'gốc'}`}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="Tên" name="name" rules={[{ required: true }]}>
            <Input placeholder="VD: Tầng 1, Căn hộ P401..." />
          </Form.Item>
          <Form.Item label="Mã" name="code" extra="Tùy chọn — mã ngắn để nhận dạng">
            <Input placeholder="VD: F1, P401, PARK-A..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}