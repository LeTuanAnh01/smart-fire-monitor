import { Tree, Card, Input, Spin } from 'antd'
import { useState, useEffect } from 'react'
import api from '@/shared/api/axios'

const toTreeData = (nodes: any[], showState = false): any[] =>
  nodes.map(n => {
    return {
      key: n.id,
      title: (
        <span>
        {/* {showState && worst && <span className="mr-1">{ICONS[worst]}</span>} */}
          {n.name}
        </span>
      ),
      children: n.children?.length ? toTreeData(n.children, showState) : undefined,
      data: n,
    }
  })

interface Props {
  selectedId: string | null
  onSelect: (locationId: string | null, node: any | null) => void
  showState?: boolean  // hiện icon trạng thái thiết bị (dùng cho device-map)
  title?: string
}

export default function LocationFilterTree({
  selectedId, onSelect, showState = false, title = 'Khu vực'
}: Props) {
  const [tree, setTree] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [searchVal, setSearchVal] = useState('')

  useEffect(() => {
    api.get('/locations').then(res => {
      const data = res.data.data
      setTree(data)
      // Auto expand root
      if (data.length > 0) {
        setExpandedKeys([data[0].id])
      }
    }).finally(() => setLoading(false))
  }, [])

  // Filter tree theo search
  const filterTree = (nodes: any[], search: string): any[] => {
    if (!search) return nodes
    return nodes.reduce((acc: any[], node: any) => {
      const children = filterTree(node.children || [], search)
      if (
        node.name.toLowerCase().includes(search.toLowerCase()) ||
        children.length > 0
      ) {
        acc.push({ ...node, children })
      }
      return acc
    }, [])
  }

  const filteredTree = filterTree(tree, searchVal)
  const treeData = toTreeData(filteredTree, showState)

  return (
    <Card
      title={title}
      size="small"
      className="shadow-sm h-full"
      styles={{ body: { padding: '8px', overflow: 'auto' } }}
    >
      <Input.Search
        placeholder="Tìm khu vực..."
        allowClear
        size="small"
        className="mb-2"
        value={searchVal}
        onChange={e => setSearchVal(e.target.value)}
      />

      {/* Nút xem tất cả */}
      <div
        className={`px-2 py-1.5 rounded cursor-pointer text-sm mb-1 ${
          !selectedId
            ? 'bg-blue-50 text-blue-600 font-medium'
            : 'text-gray-500 hover:bg-gray-50'
        }`}
        onClick={() => onSelect(null, null)}
      >
        🏠 Tất cả khu vực
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Spin size="small" /></div>
      ) : (
        <Tree
          treeData={treeData}
          expandedKeys={expandedKeys}
          onExpand={keys => setExpandedKeys(keys as string[])}
          selectedKeys={selectedId ? [selectedId] : []}
          onSelect={(_, { node }) => {
            const data = (node as any).data
            onSelect(data.id, data)
          }}
          showLine
          blockNode
        />
      )}
    </Card>
  )
}