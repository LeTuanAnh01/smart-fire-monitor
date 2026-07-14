# Smart Fire Monitor — Hệ thống quản lý thiết bị báo cháy

## Tổng quan đề tài
Web quản lý thiết bị báo cháy IoT cho các chung cư. Thiết bị IoT được giả lập bằng Python script.

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Realtime | Socket.IO |
| IoT Protocol | MQTT (Mosquitto broker) |
| IoT Simulator | Python (paho-mqtt) |
| Auth | JWT + bcrypt |

**Ports:** Frontend 5173 · Backend 3000 · MQTT 1883 · PostgreSQL 5432

---

## Actors & Phân quyền

### 1. Admin — toàn quyền
- Đăng nhập hệ thống
- Xem dashboard toàn hệ thống
- Xem sơ đồ thiết bị tất cả tòa
- Nhận cảnh báo realtime toàn hệ thống
- Xem lịch sử cảnh báo
- Xem chi tiết thiết bị
- Thêm / Sửa / Xóa thiết bị
- Tạo mới / Xóa tòa nhà
- Sửa thông tin tòa nhà
- Quản lý tầng / phòng
- Phân công quản lý tòa nhà
- Quản lý toàn bộ tài khoản user
- Cài ngưỡng cảnh báo
- Xuất báo cáo PDF/Excel

### 2. Quản lý tòa nhà — phạm vi tòa được phân công
- Đăng nhập hệ thống
- Xem dashboard (chỉ tòa mình)
- Xem sơ đồ thiết bị (chỉ tòa mình)
- Nhận cảnh báo realtime (chỉ tòa mình)
- Xem lịch sử cảnh báo (chỉ tòa mình)
- Xem chi tiết thiết bị (chỉ tòa mình)
- Sửa thông tin tòa nhà (chỉ tòa mình)
- Quản lý tầng / phòng (chỉ tòa mình)
- Quản lý user thuộc tòa mình

### 3. IoT Simulator (Python script)
- Gửi dữ liệu cảm biến qua MQTT mỗi 5 giây
- Cập nhật trạng thái thiết bị (online/offline/error)
- Kích hoạt cảnh báo tự động khi vượt ngưỡng

---

## Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(uuid())
  fullName      String
  email         String    @unique
  passwordHash  String
  role          Role      @default(BUILDING_MANAGER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  buildingManagers BuildingManager[]
}

enum Role {
  ADMIN
  BUILDING_MANAGER
}

model Building {
  id        String    @id @default(uuid())
  name      String
  address   String
  phone     String?
  createdAt DateTime  @default(now())
  floors    Floor[]
  managers  BuildingManager[]
}

model BuildingManager {
  id         String   @id @default(uuid())
  userId     String
  buildingId String
  assignedAt DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
  building   Building @relation(fields: [buildingId], references: [id])
  @@unique([userId, buildingId])
}

model Floor {
  id          String   @id @default(uuid())
  buildingId  String
  floorNumber Int
  name        String
  building    Building @relation(fields: [buildingId], references: [id])
  rooms       Room[]
}

model Room {
  id      String   @id @default(uuid())
  floorId String
  name    String
  code    String
  floor   Floor    @relation(fields: [floorId], references: [id])
  devices Device[]
}

model Device {
  id             String       @id @default(uuid())
  roomId         String
  name           String
  serialNumber   String       @unique
  type           DeviceType
  status         DeviceStatus @default(OFFLINE)
  thresholdValue Float
  mqttTopic      String       @unique
  installedAt    DateTime     @default(now())
  lastSeenAt     DateTime?
  room           Room         @relation(fields: [roomId], references: [id])
  sensorLogs     SensorLog[]
  alerts         Alert[]
}

enum DeviceType {
  SMOKE
  HEAT
  CO
  SPRINKLER
}

enum DeviceStatus {
  ONLINE
  OFFLINE
  ERROR
}

model SensorLog {
  id         String   @id @default(uuid())
  deviceId   String
  value      Float
  unit       String
  recordedAt DateTime @default(now())
  device     Device   @relation(fields: [deviceId], references: [id])
}

model Alert {
  id             String      @id @default(uuid())
  deviceId       String
  triggeredValue Float
  severity       Severity
  status         AlertStatus @default(ACTIVE)
  triggeredAt    DateTime    @default(now())
  resolvedAt     DateTime?
  device         Device      @relation(fields: [deviceId], references: [id])
}

enum Severity {
  WARNING
  CRITICAL
}

enum AlertStatus {
  ACTIVE
  ACKNOWLEDGED
  RESOLVED
}
```

---

## Cấu trúc thư mục

### Kiến trúc Frontend: Feature-based
Mỗi feature là một thư mục độc lập chứa components, hooks, api, types riêng.
Chỉ những gì dùng chung toàn app mới đặt vào `shared/`.

```
fire-alarm-iot/
├── PLANNING.md              ← file này
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── building.routes.ts
│   │   │   ├── floor.routes.ts
│   │   │   ├── room.routes.ts
│   │   │   ├── device.routes.ts
│   │   │   ├── alert.routes.ts
│   │   │   └── user.routes.ts
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    ← verify JWT
│   │   │   └── role.middleware.ts    ← check Admin/BuildingManager
│   │   ├── services/
│   │   ├── mqtt/
│   │   │   └── mqtt.service.ts       ← subscribe + xử lý data
│   │   └── socket/
│   │       └── socket.service.ts     ← emit alert realtime
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   │   └── LoginForm.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useAuth.ts
│   │   │   │   ├── api/
│   │   │   │   │   └── auth.api.ts
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── components/
│   │   │   │   │   ├── StatCard.tsx
│   │   │   │   │   ├── AlertFeed.tsx
│   │   │   │   │   ├── SensorChart.tsx
│   │   │   │   │   └── DeviceStatusPie.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useDashboard.ts
│   │   │   │   ├── api/
│   │   │   │   │   └── dashboard.api.ts
│   │   │   │   └── index.tsx         ← page component
│   │   │   │
│   │   │   ├── devices/
│   │   │   │   ├── components/
│   │   │   │   │   ├── DeviceTable.tsx
│   │   │   │   │   ├── DeviceForm.tsx
│   │   │   │   │   ├── DeviceDetail.tsx
│   │   │   │   │   └── DeviceStatusBadge.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useDevices.ts
│   │   │   │   ├── api/
│   │   │   │   │   └── device.api.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── index.tsx
│   │   │   │
│   │   │   ├── alerts/
│   │   │   │   ├── components/
│   │   │   │   │   ├── AlertTable.tsx
│   │   │   │   │   ├── AlertFilter.tsx
│   │   │   │   │   └── AlertBadge.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useAlerts.ts
│   │   │   │   ├── api/
│   │   │   │   │   └── alert.api.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── index.tsx
│   │   │   │
│   │   │   ├── floor-map/
│   │   │   │   ├── components/
│   │   │   │   │   ├── FloorSelector.tsx
│   │   │   │   │   ├── RoomGrid.tsx
│   │   │   │   │   └── RoomCard.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useFloorMap.ts
│   │   │   │   ├── api/
│   │   │   │   │   └── floor-map.api.ts
│   │   │   │   └── index.tsx
│   │   │   │
│   │   │   ├── buildings/
│   │   │   │   ├── components/
│   │   │   │   │   ├── BuildingCard.tsx
│   │   │   │   │   └── BuildingForm.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useBuildings.ts
│   │   │   │   ├── api/
│   │   │   │   │   └── building.api.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── index.tsx
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── components/
│   │   │   │   │   ├── UserTable.tsx
│   │   │   │   │   └── UserForm.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useUsers.ts
│   │   │   │   ├── api/
│   │   │   │   │   └── user.api.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── index.tsx
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   ├── components/
│   │   │   │   │   ├── ReportChart.tsx
│   │   │   │   │   └── ReportTable.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useReports.ts
│   │   │   │   ├── api/
│   │   │   │   │   └── report.api.ts
│   │   │   │   └── index.tsx
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── components/
│   │   │       │   └── ThresholdForm.tsx
│   │   │       ├── api/
│   │   │       │   └── settings.api.ts
│   │   │       └── index.tsx
│   │   │
│   │   ├── shared/                   ← dùng chung toàn app
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Topbar.tsx
│   │   │   │   │   └── AppLayout.tsx
│   │   │   │   └── ui/               ← shadcn/ui wrappers nếu cần
│   │   │   ├── hooks/
│   │   │   │   └── useSocket.ts      ← lắng nghe Socket.IO toàn app
│   │   │   ├── api/
│   │   │   │   └── axios.ts          ← base axios + JWT interceptor
│   │   │   └── types/
│   │   │       └── index.ts          ← shared TypeScript interfaces
│   │   │
│   │   └── app/
│   │       ├── router.tsx            ← React Router config
│   │       ├── App.tsx               ← root component, gọi useSocket
│   │       └── main.tsx
│   │
│   └── package.json
│
└── simulator/
    ├── simulator.py
    └── requirements.txt
```

### Quy tắc import
- Feature chỉ import từ `shared/` hoặc nội bộ feature đó
- Feature KHÔNG import chéo từ feature khác
- Nếu cần dùng chung → chuyển vào `shared/`

---

## API Endpoints

### Auth
- `POST /api/auth/login` — { email, password } → { token, user }
- `GET  /api/auth/me` — lấy thông tin user hiện tại

### Buildings
- `GET    /api/buildings` — danh sách tòa nhà (Admin: tất cả, Manager: tòa mình)
- `POST   /api/buildings` — tạo tòa nhà (Admin only)
- `GET    /api/buildings/:id` — chi tiết tòa nhà
- `PUT    /api/buildings/:id` — sửa tòa nhà
- `DELETE /api/buildings/:id` — xóa tòa nhà (Admin only)

### Floors & Rooms
- `GET  /api/buildings/:id/floors` — danh sách tầng
- `POST /api/buildings/:id/floors` — thêm tầng
- `GET  /api/floors/:id/rooms` — danh sách phòng
- `POST /api/floors/:id/rooms` — thêm phòng

### Devices
- `GET    /api/devices` — danh sách thiết bị (có filter: buildingId, status, type)
- `POST   /api/devices` — thêm thiết bị (Admin only)
- `GET    /api/devices/:id` — chi tiết + sensor logs gần nhất
- `PUT    /api/devices/:id` — sửa thiết bị (Admin only)
- `DELETE /api/devices/:id` — xóa thiết bị (Admin only)

### Alerts
- `GET  /api/alerts` — danh sách cảnh báo (filter: buildingId, status, severity, from, to)
- `PUT  /api/alerts/:id/acknowledge` — chuyển sang acknowledged
- `PUT  /api/alerts/:id/resolve` — chuyển sang resolved

### Users
- `GET    /api/users` — danh sách user
- `POST   /api/users` — tạo user
- `PUT    /api/users/:id` — sửa user
- `DELETE /api/users/:id` — xóa user

---

## Luồng dữ liệu IoT

```
Python simulator
  → MQTT publish topic: "sensors/{buildingCode}/{floor}/{room}"
  → payload: { deviceId, value, unit, timestamp }

Backend MQTT subscriber
  → nhận message
  → lưu SensorLog
  → so sánh value với device.thresholdValue
  → nếu vượt ngưỡng → tạo Alert → emit Socket.IO event "new-alert"

Frontend Socket.IO client
  → lắng nghe "new-alert"
  → hiển thị toast notification
  → cập nhật badge số cảnh báo
```

## Socket.IO Events

| Event | Hướng | Payload |
|---|---|---|
| `new-alert` | Server → Client | { alert, device, location } |
| `device-status` | Server → Client | { deviceId, status } |
| `sensor-update` | Server → Client | { deviceId, value, unit } |

---

## Lộ trình 8 tuần

| Tuần | Nội dung |
|---|---|
| 1 | ✅ Phân tích, use case, ERD, wireframe |
| 2 | Setup project, Prisma schema, API Auth + Buildings + Devices |
| 3 | MQTT subscriber, Socket.IO, Python simulator |
| 4 | Frontend layout, routing, auth, Dashboard |
| 5 | Frontend: FloorMap, Alerts realtime, Devices |
| 6 | Frontend: Buildings, Users, Reports |
| 7 | Hoàn thiện, seed data, kiểm thử |
| 8 | Báo cáo, slide, demo |

---

## Conventions khi code

- Tất cả response API theo format: `{ success: boolean, data: any, message?: string }`
- Lỗi trả về: `{ success: false, message: string, code?: string }`
- JWT payload: `{ userId, email, role, buildingIds[] }`
- BuildingManager chỉ thấy data có `buildingId` nằm trong `buildingIds` của token
- Seed data: 3 tòa nhà, 3–5 tầng mỗi tòa, 20–30 thiết bị, 2 user manager
