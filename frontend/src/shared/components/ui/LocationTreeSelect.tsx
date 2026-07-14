import { TreeSelect } from 'antd'
import { useEffect, useState } from 'react'
import api from '@/shared/api/axios'

interface Props {
  value?: string | string[]
  onChange?: (value: any) => void
  multiple?: boolean
  placeholder?: string
  disabled?: boolean
}

const toTreeData = (nodes: any[]): any[] =>
  nodes.map(n => ({
    value: n.id,
    title: n.name + (n.code ? ` [${n.code}]` : ''),
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }))

export default function LocationTreeSelect({
  value, onChange, multiple = false,
  placeholder = 'Chọn vị trí...', disabled
}: Props) {
  const [treeData, setTreeData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/locations').then(res => {
      setTreeData(toTreeData(res.data.data))
    }).finally(() => setLoading(false))
  }, [])

  if (multiple) {
    return (
      <TreeSelect
        treeData={treeData}
        value={value}
        onChange={onChange}
        placeholder={loading ? 'Đang tải...' : placeholder}
        treeDefaultExpandAll={false}
        showSearch
        treeNodeFilterProp="title"
        multiple
        allowClear
        disabled={disabled || loading}
        style={{ width: '100%' }}
      />
    )
  }

  return (
    <TreeSelect
      treeData={treeData}
      value={typeof value === 'string' ? value : value?.[0]}
      onChange={(val) => onChange?.(val)}
      placeholder={loading ? 'Đang tải...' : placeholder}
      treeDefaultExpandAll={false}
      showSearch
      treeNodeFilterProp="title"
      allowClear
      disabled={disabled || loading}
      style={{ width: '100%' }}
    />
  )
}