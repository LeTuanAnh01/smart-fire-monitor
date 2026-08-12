import {Card, Input, Row, Col, Spin } from 'antd'
import { useState, useEffect, useMemo } from 'react'
import api from '@/shared/api/axios'
import DeviceMapGrid from './components/DeviceMapGrid'
import LocationFilterTree from '@/shared/components/ui/LocationFilterTree'



const rank: Record<string, number> = { d: 3, w: 2, o: 1, n: 0 }

function getStateKey(state: number | null | undefined): string {
  if (state === 1) return 'd'
  if (state === 2) return 'w'
  if (state === -1) return 'o'
  return 'n'
}


function getAllDevices(node: any): any[] {
  let devs: any[] = []
  if (node.devices) devs = devs.concat(node.devices)
  if (node.children) node.children.forEach((c: any) => {
    devs = devs.concat(getAllDevices(c))
  })
  return devs
}

export default function DeviceMap() {
  const [selectedNode, setSelectedNode] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchTree = async () => {
    setLoading(true)
    try {
      const res = await api.get('/locations')
      const data = res.data.data

      if (data.length > 0 && !selectedNode) {
        setSelectedNode(data[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTree() }, [])

  const allDevices = useMemo(() => {
    if (!selectedNode) return []
    return getAllDevices(selectedNode)
  }, [selectedNode])

  const counts = useMemo(() => {
    const c = { d: 0, w: 0, o: 0, n: 0 }
    allDevices.forEach((dev: any) => {
      const k = getStateKey(dev.status?.state)
      c[k as keyof typeof c]++
    })
    return c
  }, [allDevices])

  const filteredDevices = useMemo(() => {
    let devs = allDevices
    if (activeFilter !== 'all') {
      devs = devs.filter((d: any) => getStateKey(d.status?.state) === activeFilter)
    }
    if (search) {
      devs = devs.filter((d: any) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.extId?.includes(search)
      )
    }
    return [...devs].sort((a: any, b: any) => rank[getStateKey(b.status?.state)] - rank[getStateKey(a.status?.state)])
  }, [allDevices, activeFilter, search])

  if (loading) return (
    <div className="flex justify-center items-center h-64"><Spin size="large" /></div>
  )

  const filterChips = [
    { key: 'all', label: `Tất cả · ${allDevices.length}` },
    { key: 'd',   label: `🔴 ${counts.d}` },
    { key: 'w',   label: `⚠️ ${counts.w}` },
    { key: 'o',   label: `📵 ${counts.o}` },
    { key: 'n',   label: `✅ ${counts.n}` },
  ]

  const chipColors: Record<string, string> = {
    d: 'bg-red-50 text-red-700 border-red-200',
    w: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    o: 'bg-gray-100 text-gray-500 border-gray-200',
    n: 'bg-green-50 text-green-700 border-green-200',
  }

  return (
    <div>

      <Row gutter={16} style={{ height: 'calc(100vh - 160px)' }}>
        {/* Cây location */}
        <Col xs={24} md={6} lg={5} style={{ height: '100%' }}>
          <LocationFilterTree
            selectedId={selectedNode?.id || null}
            onSelect={(_, node) => {
              setSelectedNode(node)
              setActiveFilter('all')
              setSearch('')
            }}
            showState
            title="Khu vực"
          />
        </Col>

        {/* Grid thiết bị */}
        <Col xs={24} md={18} lg={19} style={{ height: '100%' }}>
          <Card
            className="shadow-sm h-full flex flex-col"
            size="small"
            title={
              <div className="flex items-center gap-2 flex-wrap">
                {filterChips.map(chip => (
                  <button
                    key={chip.key}
                    onClick={() => setActiveFilter(chip.key)}
                    className={`px-3 py-1 rounded-full text-xs border cursor-pointer transition-all
                      ${activeFilter === chip.key
                        ? chip.key === 'all'
                          ? 'bg-blue-50 text-blue-600 border-blue-200 font-medium'
                          : (chipColors[chip.key] || '') + ' font-medium'
                        : 'bg-white text-gray-500 border-gray-200'
                      }`}
                  >
                    {chip.label}
                  </button>
                ))}
                <Input
                  size="small"
                  placeholder="Tìm tên, ID..."
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