# Smart Fire Monitor — Backend Documentation

## Tech Stack
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Realtime:** Socket.IO
- **MQTT:** mqtt.js (subscribe) + EMQX (broker)
- **Auth:** JWT + bcrypt
- **Port:** 3000
- **EMQX Dashboard:** http://localhost:18083 (admin / public)

---

## Cấu trúc thư mục

```
backend/
├── src/
│   ├── index.ts                        # Entry point
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── building.routes.ts
│   │   ├── floor.routes.ts
│   │   ├── room.routes.ts
│   │   ├── device.routes.ts
│   │   ├── alert.routes.ts
│   │   ├── user.routes.ts
│   │   └── stats.routes.ts
│   ├── controllers/                    # Nhận request → gọi service → trả response
│   │   ├── auth.controller.ts
│   │   ├── building.controller.ts
│   │   ├── floor.controller.ts
│   │   ├── room.controller.ts
│   │   ├── device.controller.ts
│   │   ├── alert.controller.ts
│   │   ├── user.controller.ts
│   │   └── stats.controller.ts
│   ├── services/                       # Logic + database (Prisma queries)
│   │   ├── auth.service.ts
│   │   ├── building.service.ts
│   │   ├── floor.service.ts
│   │   ├── room.service.ts
│   │   ├── device.service.ts
│   │   ├── alert.service.ts
│   │   ├── user.service.ts
│   │   └── stats.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts          # Verify JWT token
│   │   └── role.middleware.ts          # Check Admin / BuildingManager + getBuildingFilter
│   ├── mqtt/
│   │   └── mqtt.service.ts             # Subscribe EMQX + xử lý data cảm biến
│   ├── socket/
│   │   └── socket.service.ts           # Emit Socket.IO events realtime
│   └── utils/
│       ├── prisma.ts                   # Prisma client singleton
│       └── response.ts                 # sendSuccess / sendError / sendPaginated
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                         # Seed data mẫu
│   └── migrations/
├── simulator/
│   └── simulator.py                    # Python IoT simulator
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Kiến trúc luồng xử lý

```
Request từ FE
    → index.ts        (cổng vào, điều hướng)
    → routes/         (URL nào gọi hàm nào, middleware nào)
    → middleware/     (kiểm tra token, kiểm tra quyền)
    → controllers/    (nhận request, gọi service, trả response)
    → services/       (logic + Prisma query database)
    → utils/response  (format JSON trả về)
```

---

## Setup môi trường

### 0. Cài EMQX broker (Docker)

```bash
docker run -d --name emqx \
  -p 1883:1883 \
  -p 8083:8083 \
  -p 18083:18083 \
  --restart unless-stopped \
  emqx/emqx:latest

# Kiểm tra đã chạy chưa
docker ps | grep emqx

# Khởi động lại nếu đã có container
docker start emqx
```

Truy cập dashboard: `http://localhost:18083` — admin / public

### 1. Khởi tạo project

```bash
mkdir backend && cd backend
npm init -y

npm install express @prisma/client mqtt socket.io jsonwebtoken bcryptjs cors dotenv
npm install -D typescript ts-node-dev @types/node @types/express @types/jsonwebtoken @types/bcryptjs @types/cors prisma

npx tsc --init
npx prisma init
```

### 2. File `.env`

```env
DATABASE_URL="postgresql://letuananh@localhost:5432/fireguard"
JWT_SECRET="fireguard-super-secret-key-2024"
JWT_EXPIRES_IN="7d"
MQTT_BROKER="mqtt://127.0.0.1:1883"
EMQX_DASHBOARD="http://localhost:18083"
PORT=3000
CLIENT_URL="http://localhost:5173"
```

### 3. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Scripts `package.json`

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "npx prisma migrate dev",
    "db:seed": "ts-node --transpile-only prisma/seed.ts",
    "db:studio": "npx prisma studio"
  }
}
```

### 5. Tạo database và migrate

```bash
psql -U letuananh -d postgres -c "CREATE DATABASE fireguard;"
npx prisma migrate dev --name init
npm run db:seed
```

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  BUILDING_MANAGER
}

enum DeviceStatus {
  ONLINE
  OFFLINE
  ERROR
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

model User {
  id           String   @id @default(uuid())
  fullName     String
  email        String   @unique
  passwordHash String
  role         Role     @default(BUILDING_MANAGER)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  buildingManagers BuildingManager[]
  @@map("users")
}

model Building {
  id        String   @id @default(uuid())
  name      String
  address   String
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  floors    Floor[]
  managers  BuildingManager[]
  @@map("buildings")
}

model BuildingManager {
  id         String   @id @default(uuid())
  userId     String
  buildingId String
  assignedAt DateTime @default(now())
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  building Building @relation(fields: [buildingId], references: [id], onDelete: Cascade)
  @@unique([userId, buildingId])
  @@map("building_managers")
}

model Floor {
  id          String @id @default(uuid())
  buildingId  String
  floorNumber Int
  name        String
  building Building @relation(fields: [buildingId], references: [id], onDelete: Cascade)
  rooms    Room[]
  @@map("floors")
}

model Room {
  id      String @id @default(uuid())
  floorId String
  name    String
  code    String
  floor   Floor    @relation(fields: [floorId], references: [id], onDelete: Cascade)
  devices Device[]
  @@map("rooms")
}

model DeviceType {
  id       String @id @default(uuid())
  code     String @unique   // "SMOKE", "HEAT", "CO", "SPRINKLER"
  name     String           // "Cảm biến khói"
  unit     String           // "ppm", "celsius"
  category String           // "sensor", "control", "suppression"
  devices  Device[]
  @@map("device_types")
}

model Device {
  id             String       @id @default(uuid())
  roomId         String
  deviceTypeId   String
  name           String
  serialNumber   String       @unique
  status         DeviceStatus @default(OFFLINE)
  thresholdValue Float
  mqttTopic      String       @unique
  installedAt    DateTime     @default(now())
  lastSeenAt     DateTime?
  updatedAt      DateTime     @updatedAt
  room       Room       @relation(fields: [roomId], references: [id], onDelete: Cascade)
  deviceType DeviceType @relation(fields: [deviceTypeId], references: [id])
  sensorLogs SensorLog[]
  alerts     Alert[]
  @@map("devices")
}

model SensorLog {
  id         String   @id @default(uuid())
  deviceId   String
  value      Float
  unit       String
  recordedAt DateTime @default(now())
  device Device @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  @@index([deviceId, recordedAt])
  @@map("sensor_logs")
}

model Alert {
  id             String      @id @default(uuid())
  deviceId       String
  triggeredValue Float
  severity       Severity
  status         AlertStatus @default(ACTIVE)
  triggeredAt    DateTime    @default(now())
  resolvedAt     DateTime?
  device Device @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  @@index([deviceId, triggeredAt])
  @@index([status])
  @@map("alerts")
}
```

---

## Response Format chuẩn

```typescript
// Success
{ "success": true, "data": { ... }, "message": "OK" }

// Error
{ "success": false, "message": "Unauthorized", "code": "AUTH_INVALID" }

// Paginated
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## JWT Payload

```typescript
{
  userId: string
  email: string
  role: "ADMIN" | "BUILDING_MANAGER"
  buildingIds: string[]   // Admin: [] | Manager: ['id-toa-a', 'id-toa-b']
}
```

---

## Phân quyền

### `auth.middleware.ts` — Verify JWT
Dùng cho tất cả route cần đăng nhập. Gắn thông tin user vào `req.user`.

### `role.middleware.ts` — Phân quyền

```typescript
// Chỉ Admin
router.post('/buildings', authenticate, requireAdmin, handler)

// Admin hoặc Manager (scope khác nhau)
router.get('/buildings', authenticate, handler)
```

### `getBuildingFilter` — Scope dữ liệu

```typescript
// Admin    → {} (thấy tất cả)
// Manager  → { id: { in: ['building-a', 'building-b'] } }
const filter = getBuildingFilter(req)
prisma.building.findMany({ where: filter })
```

---

## API Endpoints

### Auth
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| POST | `/api/auth/login` | Public | Đăng nhập → trả JWT token |
| GET | `/api/auth/me` | Auth | Lấy thông tin user hiện tại |
| PUT | `/api/auth/change-password` | Auth | Đổi mật khẩu |

### Buildings
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/buildings` | Auth | Danh sách tòa nhà |
| POST | `/api/buildings` | Admin | Tạo tòa nhà |
| GET | `/api/buildings/:id` | Auth | Chi tiết tòa nhà |
| PUT | `/api/buildings/:id` | Auth | Sửa tòa nhà |
| DELETE | `/api/buildings/:id` | Admin | Xóa tòa nhà |
| GET | `/api/buildings/:id/stats` | Auth | Thống kê tòa nhà |
| POST | `/api/buildings/:id/managers` | Admin | Phân công quản lý |
| DELETE | `/api/buildings/:id/managers/:userId` | Admin | Hủy phân công |

### Floors & Rooms
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/buildings/:id/floors` | Auth | Danh sách tầng + trạng thái phòng |
| POST | `/api/buildings/:id/floors` | Auth | Thêm tầng |
| PUT | `/api/floors/:id` | Auth | Sửa tầng |
| DELETE | `/api/floors/:id` | Admin | Xóa tầng |
| GET | `/api/floors/:id/rooms` | Auth | Danh sách phòng |
| POST | `/api/floors/:id/rooms` | Auth | Thêm phòng |
| PUT | `/api/rooms/:id` | Auth | Sửa phòng |
| DELETE | `/api/rooms/:id` | Admin | Xóa phòng |

### Devices
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/devices` | Auth | Danh sách thiết bị |
| POST | `/api/devices` | Admin | Thêm thiết bị |
| GET | `/api/devices/:id` | Auth | Chi tiết + 50 sensor logs gần nhất |
| PUT | `/api/devices/:id` | Admin | Sửa thiết bị |
| DELETE | `/api/devices/:id` | Admin | Xóa thiết bị |
| GET | `/api/devices/:id/logs` | Auth | Lịch sử sensor logs |

**Query params cho GET /api/devices:**
```
?buildingId=&status=ONLINE&typeCode=SMOKE&search=&page=1&limit=20
```

### Alerts
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/alerts` | Auth | Danh sách cảnh báo |
| PUT | `/api/alerts/:id/acknowledge` | Auth | Chuyển ACTIVE → ACKNOWLEDGED |
| PUT | `/api/alerts/:id/resolve` | Auth | Chuyển → RESOLVED |

**Query params cho GET /api/alerts:**
```
?buildingId=&status=ACTIVE&severity=CRITICAL&from=2026-06-01&to=2026-06-14&page=1&limit=20
```

### Users
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/users` | Auth | Danh sách user (Manager chỉ thấy user tòa mình) |
| POST | `/api/users` | Admin | Tạo user |
| PUT | `/api/users/:id` | Auth | Sửa user |
| DELETE | `/api/users/:id` | Admin | Xóa user |

### Stats
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/stats/overview` | Auth | Thống kê tổng quan dashboard |
| GET | `/api/stats/alerts-chart` | Auth | Biểu đồ cảnh báo 7 ngày |
| GET | `/api/stats/device-status` | Auth | Tỷ lệ trạng thái thiết bị |

---

## Socket.IO Events

### Server → Client
| Event | Payload | Mô tả |
|-------|---------|-------|
| `new-alert` | `{ alert, device, location }` | Cảnh báo mới vượt ngưỡng |
| `sensor-update` | `{ deviceId, value, unit, recordedAt }` | Dữ liệu cảm biến mới nhất |

### Client → Server
| Event | Payload | Mô tả |
|-------|---------|-------|
| `join-buildings` | `string[]` | Join room theo buildingId để nhận alert |

### Room structure
```
admin-room          → Admin nhận tất cả alert
building:{id}       → Manager chỉ nhận alert tòa mình
```

---

## MQTT Topic Structure

```
sensors/{buildingCode}/{floorNumber}/{roomCode}/{sensorType}

Ví dụ:
sensors/toaA/1/P101/smoke  → { deviceId, value, unit, timestamp }
sensors/toaB/2/P202/heat   → { deviceId, value, unit, timestamp }
```

### Luồng xử lý khi nhận MQTT message

```
1. Parse JSON payload
2. Tìm device trong DB theo deviceId
3. Lưu SensorLog
4. Cập nhật device.lastSeenAt + status = ONLINE
5. Emit sensor-update qua Socket.IO
6. So sánh value với device.thresholdValue
7. Nếu vượt ngưỡng + chưa có ACTIVE alert → tạo Alert
8. Emit new-alert qua Socket.IO đến đúng building room
```

### Severity logic
```
value >= threshold * 1.2  → CRITICAL
value >= threshold         → WARNING
```

---

## Seed Data

Chạy: `npm run db:seed`

**Tài khoản:**
```
Admin:     admin@fg.vn      / Admin@123
Manager A: manager_a@fg.vn  / Manager@123  (quản lý Tòa A)
Manager B: manager_b@fg.vn  / Manager@123  (quản lý Tòa B)
```

**Data mẫu:**
- 3 tòa nhà (A, B, C)
- 4 loại DeviceType: SMOKE, HEAT, CO, SPRINKLER
- Tòa A: 3 tầng, 4 phòng/tầng, 2 thiết bị/phòng = 24 thiết bị
- Tòa B: 2 tầng, 3 phòng/tầng, 2 thiết bị/phòng = 12 thiết bị
- 2 alert mẫu (ACTIVE + RESOLVED)

---

## IoT Simulator (Python)

```bash
cd simulator
pip3 install paho-mqtt
python3 simulator.py
```

- 8 thiết bị từ Tòa A và Tòa B
- Gửi data mỗi 5 giây
- 15% khả năng vượt ngưỡng để trigger alert
- DeviceId trong simulator phải khớp với ID trong database

---

## Test nhanh API

```bash
# Lấy token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fg.vn","password":"Admin@123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# Test các endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/buildings
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/devices
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/alerts
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/stats/overview
```

---

## Conventions

- Response luôn theo format `{ success, data, message }`
- `req.params` và `req.query` luôn ép kiểu `as string` trước khi dùng
- Prisma enum dùng đúng kiểu (VD: `DeviceStatus` thay vì `string`)
- Service trả về plain object, không biết `req`/`res`
- Controller chỉ lo validate input, gọi service, format response
- BuildingManager chỉ thấy data trong phạm vi `buildingIds` từ JWT

---

## Error Handling

### `src/utils/catchAsync.ts`
Wrapper bọc tất cả controller async để tránh server crash khi có lỗi không mong muốn:

```typescript
export const catchAsync = (fn: Function) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
```

Dùng trong controller:
```typescript
export const getBuildings = catchAsync(async (req, res) => {
  // nếu có lỗi → tự động chuyển sang global error handler
})
```

### Global error handler (`src/index.ts`)
Đặt sau tất cả routes, bắt mọi lỗi chưa được xử lý:

```typescript
app.use((err: Error, req, res, next) => {
  console.error('Unhandled error:', err.message)
  res.status(500).json({ success: false, message: 'Lỗi server', code: 'INTERNAL_ERROR' })
})
```

---

## Device Offline Detection

Chạy mỗi 30 giây trong `src/index.ts`, tự động đánh dấu `OFFLINE` những thiết bị không gửi data quá 1 phút:

```typescript
setInterval(async () => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
  const updated = await prisma.device.updateMany({
    where: { lastSeenAt: { lt: oneMinuteAgo }, status: 'ONLINE' },
    data: { status: 'OFFLINE' }
  })
  if (updated.count > 0) {
    console.log(`⚠️ Marked ${updated.count} device(s) as OFFLINE`)
  }
}, 30 * 1000)
```

**Logic:**
- Simulator gửi data → backend cập nhật `lastSeenAt = now()` + `status = ONLINE`
- Nếu simulator dừng → sau 1 phút cron job đổi sang `OFFLINE`
- FE polling hoặc Socket.IO `device-status` event sẽ cập nhật UI

---

## Checklist Backend hoàn chỉnh

- ✅ Prisma schema + migrate + seed data
- ✅ API Auth (login, me, đổi mật khẩu)
- ✅ API Buildings CRUD + stats + assign manager
- ✅ API Floors + Rooms CRUD
- ✅ API Devices CRUD + sensor logs
- ✅ API Alerts + acknowledge/resolve
- ✅ API Users CRUD
- ✅ API Stats (overview, chart, device status)
- ✅ Middleware: JWT auth + role + building scope
- ✅ Service layer tách rõ ràng khỏi controller
- ✅ catchAsync wrapper tránh server crash
- ✅ Global error handler
- ✅ EMQX MQTT broker (Docker)
- ✅ MQTT subscriber xử lý data cảm biến
- ✅ Socket.IO emit realtime (new-alert, sensor-update)
- ✅ Device offline detection (cron 30s)
- ✅ Python IoT Simulator
