# 🔥 Smart Fire Monitor (SFM)

> Hệ thống website giám sát và cảnh báo cháy realtime cho tòa chung cư cao tầng

---

## 📋 Giới thiệu

**Smart Fire Monitor (SFM)** là hệ thống web quản lý và giám sát thiết bị cảm biến khói IoT theo thời gian thực, được xây dựng dựa trên khảo sát thực tế tại **chung cư 96 Định Công, Hà Nội** (21 tầng, 144 căn hộ).

Hệ thống cho phép ban quản lý tòa nhà theo dõi trạng thái toàn bộ thiết bị, nhận cảnh báo cháy tự động và quản lý phân quyền người dùng theo cơ cấu tổ chức thực tế.

---

## ✨ Tính năng chính

- 📡 **Realtime** — Nhận dữ liệu từ thiết bị IoT qua MQTT, cập nhật giao diện qua WebSocket (< 2 giây)
- 🚨 **Cảnh báo tự động** — Phát hiện 5 loại bất thường: Cháy, Cảnh báo, Pin yếu, Sóng yếu, Offline
- 🗺️ **Sơ đồ thiết bị** — Grid màu trực quan theo trạng thái, thiết bị nguy hiểm nhấp nháy
- 🏢 **Quản lý khu vực** — Cây phân cấp tự do (Adjacency List), linh hoạt cho mọi loại tòa nhà
- 👥 **Phân quyền 4 cấp** — Super Admin → Admin → Manager → User, phân quyền theo khu vực
- 📊 **Dashboard** — Thống kê tổng quan, biểu đồ cảnh báo 7 ngày, phân bố trạng thái thiết bị
- 📥 **Xuất báo cáo** — Xuất dữ liệu cảnh báo ra CSV theo bộ lọc
- 🧪 **Simulator Tool** — Công cụ test trigger thiết bị realtime (Super Admin)

---

## 🏗️ Kiến trúc hệ thống

```
Thiết bị IoT → MQTT → EMQX Broker → Backend Node.js → PostgreSQL
                                          ↓
                                    Socket.IO → Frontend React
                                          ↓
                                    Nginx (port 80)
```

---

## 🛠️ Tech Stack

| Thành phần | Công nghệ |
|---|---|
| **Backend** | Node.js · Express · TypeScript · Prisma ORM |
| **Database** | PostgreSQL 16 |
| **Realtime** | MQTT (EMQX) · Socket.IO |
| **Frontend** | React · TypeScript · Ant Design · Recharts |
| **DevOps** | Docker · Docker Compose · Nginx |
| **Tunnel** | Cloudflare Tunnel · ngrok |
| **Simulator** | Python · paho-mqtt |

---

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Docker Desktop
- EMQX Broker (chạy local, port 1883)

### Khởi động

```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/smart-fire-monitor.git
cd smart-fire-monitor

# Tạo file .env
cp .env.example .env
# Chỉnh sửa .env nếu cần

# Build và khởi động toàn bộ hệ thống
bash deploy.sh start
```

Truy cập: **http://localhost**

### Các lệnh thường dùng

```bash
bash deploy.sh start        # Khởi động toàn bộ
bash deploy.sh stop         # Dừng tất cả
bash deploy.sh rebuild      # Rebuild với code mới
bash deploy.sh rebuild-be   # Rebuild chỉ backend
bash deploy.sh rebuild-fe   # Rebuild chỉ frontend
bash deploy.sh tunnel       # Mở tunnel demo từ xa
bash deploy.sh simulator    # Chạy Python Simulator
bash deploy.sh switch-db test  # Chuyển sang DB test (1000 thiết bị)
bash deploy.sh switch-db prod  # Chuyển về DB prod (144 thiết bị)
```

---

## 👤 Tài khoản demo

| Role | Email | Mật khẩu |
|---|---|---|
| Super Admin | superadmin@sfm.vn | SuperAdmin@123 |
| Admin | admin@96dinhcong.vn | Admin@123 |
| Manager | baove@96dinhcong.vn | Manager@123 |
| User | dancu@96dinhcong.vn | User@123 |

---

## 📁 Cấu trúc dự án

```
smart-fire-monitor/
├── backend/               # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/   # Xử lý request
│   │   ├── services/      # Logic nghiệp vụ
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth + Role middleware
│   │   ├── mqtt/          # MQTT Service
│   │   └── socket/        # Socket.IO Service
│   └── prisma/            # Schema + Migration + Seed
├── frontend/              # React + TypeScript + Ant Design
│   └── src/
│       ├── features/      # Dashboard, Alerts, Devices...
│       └── shared/        # Components, hooks, API, types
├── simulator/             # Python MQTT Simulator
│   └── simulator.py
├── docker-compose.yml
├── deploy.sh              # Deploy script
└── .env.example
```

---

## 🗄️ Database Schema

7 bảng chính: `User`, `Location` (cây Adjacency List), `UserLocation`, `Device`, `DeviceStatus`, `SensorLog`, `Alert`

---

## 📡 API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | /api/auth/login | Đăng nhập |
| GET | /api/locations | Lấy cây khu vực |
| GET | /api/devices | Danh sách thiết bị |
| GET | /api/alerts | Danh sách cảnh báo |
| GET | /api/stats/overview | Thống kê dashboard |
| POST | /api/simulator/trigger | Trigger thiết bị (test) |

---

## 🧪 Simulator

Python Simulator mô phỏng thiết bị IoT gửi dữ liệu MQTT:

```bash
# Docker mode
bash deploy.sh simulator

# Dev mode
bash deploy.sh simulator dev
```

---

## 📄 License

MIT License — [Lê Tuấn Anh](mailto:tuananhle18092001@gmail.com)
