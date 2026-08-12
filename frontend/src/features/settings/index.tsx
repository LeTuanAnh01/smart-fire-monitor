import { Card } from 'antd'
import { useAuth } from '@/shared/context/AuthContext'
import { Navigate } from 'react-router-dom'



export default function Settings() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div>

      <Card title="Thông tin hệ thống" className="shadow-sm max-w-2xl">
        <div className="text-sm space-y-3">
          <div><span className="font-medium text-gray-600">Phiên bản:</span> 1.0.0</div>
          <div><span className="font-medium text-gray-600">Backend:</span> http://localhost:3000</div>
          <div>
            <span className="font-medium text-gray-600">EMQX Dashboard:</span>{' '}
            <a href="http://localhost:18083" target="_blank" rel="noreferrer"
              className="text-blue-500">
              http://localhost:18083
            </a>
          </div>
          <div><span className="font-medium text-gray-600">Database:</span> PostgreSQL</div>
        </div>
      </Card>
    </div>
  )
}