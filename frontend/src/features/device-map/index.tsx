import { Typography, Card, Tree, Spin, Input, Row, Col } from 'antd'
import { useState, useEffect, useMemo } from 'react'
import api from '@/shared/api/axios'
import DeviceMapGrid from './components/DeviceMapGrid'

const { Title } = Typography

const ICONS: Record<string, string> = { n: '✅', w: '⚠️', d: '🔴', o: '📵' }

function getWorstState(node: any): string {
  const rank: Record<string, number> = { d: 3, w: 2, o: 1, n: 0 }
  let worst = 'n'
  if (node.devices) {
    node.devices.forEach((d: any) => {
      const s = d.status?.state
      const key = s === 1 ? 'd' : s === 2 ? 'w' : s === -1 ? 'o' : 'n'
      if (rank[key] > rank[worst]) worst = key
    })
  }
  if (node.children) {
    node.children.forEach((c: any) => {
      const cs = getWorstState(c)
      if (rank[cs] > rank[worst]) worst = cs
    })
  }
  return worst
}

function getAllDevices(node: any): any[] {
  let devs: any[] = []
  if (node.devices) devs = devs.concat(node.devices)
  if (node.children) node.children.forEach((c: any) => {
    devs = devs.concat(getAllDevices(c))
  })
  return devs
}

function updateDeviceStatus(nodes: any[], deviceId: string, status: any): any[] {
  return nodes.map(node => ({
    ...node,
    devices: node.devices?.map((d: any) =>
      d.id === deviceId ? { ...d, status } : d
    ),
    children: node.children
      ? updateDeviceStatus(node.children, deviceId, status)
      : undefined
  }))
}

const toTreeData = (nodes: any[]): any[] =>
  nodes.map(n => {
    const worst = getWorstState(n)
    return {
      key: n.id,
      title: `${ICONS[worst]} ${n.name}`,
      children: n.children?.length ? toTreeData(n.children) : undefined,
      data: n,
    }
  })

export default function DeviceMap() {
  const [tree, setTree] = useState<any[]>([])
  const [selectedNode, setSelectedNode] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchTree = async () => {
    setLoading(true)
    try {
      const res = await api.get('/locations')
      const data = res.data.data
      setTree(data)
      // Auto chọn node gốc đầu tiên
      if (data.length > 0) {
        setSelectedNode(data[0])
        setExpandedKeys([data[0].id])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTree() }, [])

  // Realtime update
 useEffect(() => {
  const handler = (e: Event) => {
    const { deviceId, status } = (e as CustomEvent).detail
    if (!deviceId || !status) return

    // Cập nhật status trong tree mà không reload
    setTree(prev => updateDeviceStatus(prev, deviceId, status))
  }

  window.addEventListener('sensor-update', handler)
  return () => window.removeEventListener('sensor-update', handler)
}, [])


  const allDevices = useMemo(() => {
    if (!selectedNode) return []
    return getAllDevices(selectedNode)
  }, [selectedNode])

  const counts = useMemo(() => {
    const c = { d: 0, w: 0, o: 0, n: 0 }
    allDevices.forEach((dev: any) => {
      const s = dev.status?.state
      const key = s === 1 ? 'd' : s === 2 ? 'w' : s === -1 ? 'o' : 'n'
      c[key as keyof typeof c]++
    })
    return c
  }, [allDevices])

  const filteredDevices = useMemo(() => {
    let devs = allDevices
    if (activeFilter !== 'all') {
      devs = devs.filter((d: any) => {
        const s = d.status?.state
        const key = s === 1 ? 'd' : s === 2 ? 'w' : s === -1 ? 'o' : 'n'
        return key === activeFilter
      })
    }
    if (search) {
      devs = devs.filter((d: any) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.extId?.includes(search)
      )
    }
    // Sort: nguy hiểm trước
    const rank: Record<string, number> = { d: 3, w: 2, o: 1, n: 0 }
    return [...devs].sort((a: any, b: any) => {
      const sa = a.status?.state
      const sb = b.status?.state
      const ka = sa === 1 ? 'd' : sa === 2 ? 'w' : sa === -1 ? 'o' : 'n'
      const kb = sb === 1 ? 'd' : sb === 2 ? 'w' : sb === -1 ? 'o' : 'n'
      return rank[kb] - rank[ka]
    })
  }, [allDevices, activeFilter, search])

  if (loading) return (
    <div className="flex justify-center items-center h-64"><Spin size="large" /></div>
  )

  const treeData = toTreeData(tree)

  const filterChips = [
    { key: 'all', label: `Tất cả · ${allDevices.length}` },
    { key: 'd',   label: `🔴 ${counts.d}` },
    { key: 'w',   label: `⚠️ ${counts.w}` },
    { key: 'o',   label: `📵 ${counts.o}` },
    { key: 'n',   label: `✅ ${counts.n}` },
  ]

  const chipColors: Record<string, string> = {
    all: '',
    d: 'bg-red-50 text-red-700 border-red-200',
    w: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    o: 'bg-gray-100 text-gray-500',
    n: 'bg-green-50 text-green-700 border-green-200',
  }

  return (
    <div>
      <Title level={4} className="!mb-6">Sơ đồ thiết bị</Title>

      <Row gutter={16} style={{ height: 'calc(100vh - 160px)' }}>
        {/* Cây location */}
        <Col xs={24} md={6} lg={5} style={{ height: '100%' }}>
          <Card title="Khu vực" className="shadow-sm h-full overflow-auto" size="small">
            <Tree
              treeData={treeData}
              expandedKeys={expandedKeys}
              onExpand={keys => setExpandedKeys(keys as string[])}
              selectedKeys={selectedNode ? [selectedNode.id] : []}
              onSelect={(_, { node }) => {
                const n = (node as any).data
                setSelectedNode(n)
                setActiveFilter('all')
                setSearch('')
              }}
              showLine
            />
          </Card>
        </Col>

        {/* Grid thiết bị */}
        <Col xs={24} md={18} lg={19} style={{ height: '100%' }}>
          <Card className="shadow-sm h-full flex flex-col" size="small"
            title={
              <div className="flex items-center gap-3 flex-wrap">
                {filterChips.map(chip => (
                  <button
                    key={chip.key}
                    onClick={() => setActiveFilter(chip.key)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all cursor-pointer
                      ${activeFilter === chip.key
                        ? chip.key === 'all'
                          ? 'bg-blue-50 text-blue-600 border-blue-200 font-medium'
                          : chipColors[chip.key] + ' font-medium border'
                        : 'bg-white text-gray-500 border-gray-200'
                      }`}
                  >
                    {chip.label}
                  </button>
                ))}
                <Input
                  size="small"
                  placeholder="Tìm tên, ID..."
                  prefix={<i className="ti ti-search text-gray-400 text-xs" />}
                  className="w-36 ml-auto"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  allowClear
                />
              </div>
            }
          >
            <div className="text-xs text-gray-400 mb-3">
              Hiển thị {filteredDevices.length} thiết bị
              {selectedNode ? ` · ${selectedNode.name}` : ''}
            </div>
            <DeviceMapGrid devices={filteredDevices} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}