# Smart Fire Monitor — Frontend Documentation

## Tech Stack
- **Framework:** React + TypeScript
- **Build tool:** Vite
- **Styling:** Tailwind CSS (layout, spacing, custom styles)
- **UI Components:** Ant Design (`antd`) (Table, Form, Modal, Layout...)
- **Icons:** `@ant-design/icons`
- **Charts:** Recharts
- **Routing:** React Router DOM v6
- **HTTP Client:** Axios
- **Realtime:** Socket.IO Client
- **Port:** 5173

> Tailwind và Ant Design dùng song song — Ant Design lo component, Tailwind lo layout/spacing/custom.

---

## Setup môi trường

```bash
cd ..
npm create vite@latest frontend -- --template react-ts
cd frontend

# Cài dependencies
npm install antd @ant-design/icons axios socket.io-client react-router-dom recharts
npm install @types/react @types/react-dom

# Cài Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### `tailwind.config.js`
```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

### `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### `src/main.tsx` — import Ant Design CSS
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
// Import Ant Design styles
import 'antd/dist/reset.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## Cấu trúc thư mục (Feature-based)

```
src/
├── app/
│   ├── App.tsx                   # Root component, setup router
│   ├── router.tsx                # Định nghĩa routes
│   └── main.tsx                  # Entry point
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   └── LoginForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── api/
│   │   │   └── auth.api.ts
│   │   └── types.ts
│   │
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── StatCard.tsx
│   │   │   ├── AlertFeed.tsx
│   │   │   ├── AlertsBarChart.tsx
│   │   │   ├── DeviceStatusPieChart.tsx
│   │   │   └── SensorLineChart.tsx
│   │   ├── hooks/
│   │   │   └── useDashboard.ts
│   │   ├── api/
│   │   │   └── stats.api.ts
│   │   └── index.tsx             # Dashboard page
│   │
│   ├── floor-map/
│   │   ├── components/
│   │   │   ├── FloorSelector.tsx
│   │   │   ├── FloorGrid.tsx
│   │   │   └── RoomCard.tsx
│   │   ├── hooks/
│   │   │   └── useFloorMap.ts
│   │   ├── api/
│   │   │   └── floor.api.ts
│   │   └── index.tsx             # FloorMap page
│   │
│   ├── alerts/
│   │   ├── components/
│   │   │   ├── AlertTable.tsx
│   │   │   ├── AlertFilters.tsx
│   │   │   └── AlertBadge.tsx
│   │   ├── hooks/
│   │   │   └── useAlerts.ts
│   │   ├── api/
│   │   │   └── alert.api.ts
│   │   └── index.tsx             # Alerts page
│   │
│   ├── devices/
│   │   ├── components/
│   │   │   ├── DeviceTable.tsx
│   │   │   ├── DeviceForm.tsx
│   │   │   ├── DeviceDetail.tsx
│   │   │   └── SensorLogChart.tsx
│   │   ├── hooks/
│   │   │   └── useDevices.ts
│   │   ├── api/
│   │   │   └── device.api.ts
│   │   └── index.tsx             # Devices page
│   │
│   ├── buildings/
│   │   ├── components/
│   │   │   ├── BuildingCard.tsx
│   │   │   └── BuildingForm.tsx
│   │   ├── hooks/
│   │   │   └── useBuildings.ts
│   │   ├── api/
│   │   │   └── building.api.ts
│   │   └── index.tsx             # Buildings page
│   │
│   ├── users/
│   │   ├── components/
│   │   │   ├── UserTable.tsx
│   │   │   └── UserForm.tsx
│   │   ├── hooks/
│   │   │   └── useUsers.ts
│   │   ├── api/
│   │   │   └── user.api.ts
│   │   └── index.tsx             # Users page
│   │
│   ├── reports/
│   │   ├── components/
│   │   │   ├── ReportFilters.tsx
│   │   │   └── ReportTable.tsx
│   │   ├── api/
│   │   │   └── report.api.ts
│   │   └── index.tsx             # Reports page
│   │
│   └── settings/
│       ├── components/
│       │   └── ThresholdForm.tsx
│       └── index.tsx             # Settings page
│
└── shared/
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.tsx     # Layout tổng: sidebar + topbar + content
    │   │   ├── Sidebar.tsx
    │   │   └── Topbar.tsx
    │   └── ui/                   # shadcn components (auto-generated)
    ├── hooks/
    │   └── useSocket.ts          # Socket.IO hook toàn app
    ├── api/
    │   └── axios.ts              # Axios instance + interceptor JWT
    ├── context/
    │   └── AuthContext.tsx       # Global auth state
    └── types/
        └── index.ts              # TypeScript interfaces dùng chung
```

---

## Quy tắc import

```typescript
// ✅ Feature import từ shared
import { useSocket } from '@/shared/hooks/useSocket'
import axios from '@/shared/api/axios'

// ✅ Feature import nội bộ
import { AlertBadge } from './components/AlertBadge'

// ❌ Feature KHÔNG import chéo từ feature khác
import { DeviceForm } from '../devices/components/DeviceForm' // SAI
// → Nếu cần dùng chung thì chuyển vào shared/
```

---

## `src/shared/types/index.ts`

```typescript
export type Role = 'ADMIN' | 'BUILDING_MANAGER'
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'ERROR'
export type Severity = 'WARNING' | 'CRITICAL'
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'

export interface User {
  id: string
  fullName: string
  email: string
  role: Role
  buildingIds: string[]
}

export interface Building {
  id: string
  name: string
  address: string
  phone?: string
  floorCount: number
  deviceCount: number
  managers: Pick<User, 'id' | 'fullName' | 'email'>[]
}

export interface Floor {
  id: string
  floorNumber: number
  name: string
  roomCount: number
  rooms: Room[]
}

export interface Room {
  id: string
  name: string
  code: string
  deviceStatus: 'ok' | 'warning' | 'alert' | 'offline'
}

export interface DeviceType {
  id: string
  code: string
  name: string
  unit: string
  category: string
}

export interface Device {
  id: string
  name: string
  serialNumber: string
  status: DeviceStatus
  thresholdValue: number
  mqttTopic: string
  lastSeenAt: string | null
  currentValue: number | null
  deviceType: DeviceType
  location: {
    building: { id: string; name: string }
    floor: { id: string; name: string }
    room: { id: string; name: string; code: string }
  }
}

export interface Alert {
  id: string
  triggeredValue: number
  severity: Severity
  status: AlertStatus
  triggeredAt: string
  resolvedAt: string | null
  device: { id: string; name: string; deviceType: DeviceType }
  location: {
    building: { id: string; name: string }
    floor: { name: string }
    room: { name: string; code: string }
  }
}

export interface SensorLog {
  id: string
  deviceId: string
  value: number
  unit: string
  recordedAt: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}
```

---

## `src/shared/api/axios.ts`

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

// Tự động gắn JWT token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Tự động redirect về login nếu token hết hạn
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

---

## `src/shared/context/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, ReactNode } from 'react'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  )

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setToken(token)
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, token,
      login, logout,
      isAdmin: user?.role === 'ADMIN'
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

---

## `src/shared/hooks/useSocket.ts`

```typescript
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import { notification } from 'antd'
import { Alert } from '../types'

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const socket = io(import.meta.env.VITE_SOCKET_URL)
    socketRef.current = socket

    // Join room theo buildingIds của user
    socket.emit('join-buildings', user.buildingIds)

    // Nhận cảnh báo mới → hiện notification
    socket.on('new-alert', (data: { alert: Alert; device: any; location: any }) => {
      const { alert, device, location } = data
      const isCritical = alert.severity === 'CRITICAL'

      notification[isCritical ? 'error' : 'warning']({
        message: isCritical ? '🚨 Cảnh báo nguy hiểm!' : '⚠️ Cảnh báo',
        description: `${device.name} · ${location.building.name} · ${location.floor.name} · ${location.room.code}`,
        duration: isCritical ? 0 : 8,   // 0 = không tự đóng
        placement: 'topRight',
      })

      // Dispatch event để các component khác lắng nghe
      window.dispatchEvent(new CustomEvent('new-alert', { detail: data }))
    })

    // Nhận cập nhật trạng thái thiết bị
    socket.on('sensor-update', (data: any) => {
      window.dispatchEvent(new CustomEvent('sensor-update', { detail: data }))
    })

    return () => { socket.disconnect() }
  }, [user])

  return socketRef.current
}
```

---

## `src/app/router.tsx`

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import LoginPage from '@/features/auth/components/LoginForm'
import Dashboard from '@/features/dashboard'
import FloorMap from '@/features/floor-map'
import Alerts from '@/features/alerts'
import Devices from '@/features/devices'
import Buildings from '@/features/buildings'
import Users from '@/features/users'
import Reports from '@/features/reports'
import Settings from '@/features/settings'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <AppLayout />,    // Layout bọc tất cả page bên trong
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'floor-map', element: <FloorMap /> },
      { path: 'alerts', element: <Alerts /> },
      { path: 'devices', element: <Devices /> },
      { path: 'devices/:id', element: <Devices /> },
      { path: 'buildings', element: <Buildings /> },
      { path: 'users', element: <Users /> },
      { path: 'reports', element: <Reports /> },
      { path: 'settings', element: <Settings /> },
    ]
  }
])
```

---

## `src/app/App.tsx`

```typescript
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext'
import { router } from './router'
import { useSocket } from '@/shared/hooks/useSocket'

// Component riêng để dùng được useSocket (cần AuthProvider bên ngoài)
const AppInner = () => {
  useSocket()  // kết nối Socket.IO + antd notification 1 lần toàn app
  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
```

---

## Cách gọi API từ feature

Mỗi feature có file `api/` riêng, dùng axios instance từ shared:

```typescript
// features/alerts/api/alert.api.ts
import api from '@/shared/api/axios'
import { PaginatedResponse, Alert } from '@/shared/types'

export const alertApi = {
  getAlerts: (params?: {
    page?: number
    limit?: number
    status?: string
    severity?: string
    buildingId?: string
  }) => api.get<{ data: PaginatedResponse<Alert> }>('/alerts', { params }),

  acknowledge: (id: string) =>
    api.put(`/alerts/${id}/acknowledge`),

  resolve: (id: string) =>
    api.put(`/alerts/${id}/resolve`),
}
```

---

## Màn hình cần làm (theo thứ tự ưu tiên)

| Màn hình | Feature folder | Ưu tiên |
|---|---|---|
| Đăng nhập | `auth/` | 🔴 Làm đầu tiên |
| Layout (Sidebar + Topbar) | `shared/layout/` | 🔴 Làm thứ 2 |
| Dashboard | `dashboard/` | 🔴 Bắt buộc |
| Sơ đồ thiết bị theo tầng | `floor-map/` | 🔴 Bắt buộc |
| Danh sách cảnh báo | `alerts/` | 🔴 Bắt buộc |
| Quản lý thiết bị | `devices/` | 🔴 Bắt buộc |
| Chi tiết thiết bị | `devices/` | 🔴 Bắt buộc |
| Quản lý tòa nhà | `buildings/` | 🟡 Nên có |
| Quản lý người dùng | `users/` | 🟡 Nên có |
| Báo cáo + xuất Excel | `reports/` | 🟡 Nên có |
| Cài ngưỡng cảnh báo | `settings/` | 🟢 Điểm cộng |

---

## Lộ trình code Frontend (Tuần 4–6)

### Tuần 4 — Core
1. Setup project, cài packages, cấu hình Tailwind + shadcn
2. `shared/types/index.ts` — TypeScript interfaces
3. `shared/api/axios.ts` — Axios instance + interceptor
4. `shared/context/AuthContext.tsx` — Global auth state
5. `features/auth/` — Trang Login
6. `shared/components/layout/` — AppLayout + Sidebar + Topbar
7. `app/router.tsx` + `App.tsx` — Routing + Socket.IO
8. `features/dashboard/` — Dashboard với StatCard + Charts

### Tuần 5 — Tính năng chính
9. `features/floor-map/` — Sơ đồ tầng/phòng realtime
10. `features/alerts/` — Bảng cảnh báo + filter + acknowledge/resolve
11. `features/devices/` — Danh sách + chi tiết + form thêm/sửa

### Tuần 6 — Hoàn thiện
12. `features/buildings/` — Quản lý tòa nhà
13. `features/users/` — Quản lý người dùng
14. `features/reports/` — Báo cáo + xuất Excel
15. `features/settings/` — Cài ngưỡng cảnh báo
16. Responsive, polish UI, seed data đủ để demo

---

## Conventions

- Tất cả component dùng TypeScript — không dùng `any` nếu có thể
- Mỗi page là default export từ `index.tsx` của feature
- API calls nằm trong file `api/` của feature, không gọi thẳng axios trong component
- State management dùng React hooks (`useState`, `useEffect`) — không cần Redux
- Dùng `useAuth()` để lấy thông tin user và kiểm tra quyền
- Admin thấy tất cả, BuildingManager chỉ thấy tòa mình → filter ở backend, FE chỉ hiển thị data nhận được
- Realtime: lắng nghe `window.dispatchEvent` từ `useSocket` hook thay vì prop drilling
- Notification: dùng `antd notification` API — không cần install thêm package
- Ant Design component mapping:
  - Layout, Sidebar → `Layout + Menu`
  - Bảng dữ liệu → `Table` (có sẵn filter, sort, pagination)
  - Form → `Form + Input + Select`
  - Badge trạng thái → `Badge`, `Tag`
  - Stat cards → `Statistic`
  - Modal, Drawer → `Modal`, `Drawer`
  - Biểu đồ → `Recharts` (BarChart, LineChart, PieChart)
