#!/bin/bash

# ════════════════════════════════════════════════
#   Smart Fire Monitor (SFM) — Deploy Script
#   Dùng: bash deploy.sh [start|stop|restart|logs|seed|status|tunnel]
# ════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

COMMAND=${1:-start}

# ── Kiểm tra dependencies ──
check_deps() {
  log_info "Kiểm tra dependencies..."

  if ! command -v docker &>/dev/null; then
    log_error "Docker chưa được cài. Tải tại: https://docs.docker.com/get-docker/"
  fi

  if ! docker compose version &>/dev/null; then
    log_error "Docker Compose chưa được cài hoặc quá cũ."
  fi

  log_success "Docker OK ($(docker --version))"
}

# ── Tạo file .env nếu chưa có ──
setup_env() {
  if [ ! -f .env ]; then
    log_warn ".env chưa tồn tại — tạo mới..."
    cat > .env << 'ENVEOF'
# Database
DB_PASSWORD=sfm_secret_2024

# JWT — ĐỔI THÀNH CHUỖI MẠNH TRƯỚC KHI DEMO
JWT_SECRET=sfm-jwt-secret-please-change-this

# URL
CLIENT_URL=http://localhost
ENVEOF
    log_success "Tạo .env xong — mở file và kiểm tra lại trước khi chạy"
  else
    log_success ".env đã tồn tại"
  fi
}

# ── Build và start ──
cmd_start() {
  check_deps
  setup_env

  log_info "Building Docker images..."
  docker compose build --no-cache

  log_info "Khởi động services..."
  docker compose up -d

  log_info "Chờ database sẵn sàng..."
  sleep 8

  log_info "Chạy database migration..."
  docker exec fireguard_backend npx prisma migrate deploy 2>/dev/null || true

  DEVICE_COUNT=$(docker exec fireguard_backend \
    npx ts-node --transpile-only -e \
    "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.device.count().then(c=>{console.log(c);p.\$disconnect()})" \
    2>/dev/null || echo "0")

  if [ "$DEVICE_COUNT" = "0" ]; then
    log_info "Chạy seed data..."
    docker exec fireguard_backend npm run db:seed
    log_success "Seed data xong"
  else
    log_info "Database đã có data ($DEVICE_COUNT thiết bị) — bỏ qua seed"
  fi

  echo ""
  echo -e "${GREEN}════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}   SFM — Smart Fire Monitor đã chạy thành công! ${NC}"
  echo -e "${GREEN}════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  🌐 Web:          ${BLUE}http://localhost${NC}"
  echo -e "  🔌 API:          ${BLUE}http://localhost/api${NC}"
  echo -e "  📡 EMQX:         ${BLUE}http://localhost:18083${NC} (admin/public)"
  echo ""
  echo -e "  👤 SuperAdmin:   superadmin@sfm.vn    / SuperAdmin@123"
  echo -e "  👤 Admin:        admin@96dinhcong.vn  / Admin@123"
  echo -e "  👤 Manager:      baove@96dinhcong.vn  / Manager@123"
  echo -e "  👤 User:         dancu@96dinhcong.vn  / User@123"
  echo ""
  echo -e "  📋 Logs:         bash deploy.sh logs"
  echo -e "  🛑 Dừng:         bash deploy.sh stop"
  echo -e "  🌍 Tunnel:       bash deploy.sh tunnel"
  echo ""
}

# ── Stop ──
cmd_stop() {
  log_info "Dừng tất cả services..."
  docker compose down
  log_success "Đã dừng"
}

# ── Restart ──
cmd_restart() {
  log_info "Restart services..."
  docker compose restart
  log_success "Đã restart"
}

# ── Logs ──
cmd_logs() {
  SERVICE=${2:-}
  if [ -n "$SERVICE" ]; then
    docker compose logs -f "$SERVICE"
  else
    docker compose logs -f
  fi
}

# ── Seed ──
cmd_seed() {
  log_info "Chạy seed data..."
  docker exec fireguard_backend npm run db:seed
  log_success "Seed xong"
}

# ── Status ──
cmd_status() {
  echo ""
  docker compose ps
  echo ""

  check_service() {
    local name=$1
    local url=$2
    if curl -sf "$url" &>/dev/null; then
      echo -e "  ${GREEN}✓${NC} $name"
    else
      echo -e "  ${RED}✗${NC} $name"
    fi
  }

  echo "Health check:"
  check_service "Backend API" "http://localhost:3000/health"
  check_service "Frontend"    "http://localhost"
  check_service "EMQX"        "http://localhost:18083"
  echo ""
}

# ── Tunnel ──
cmd_tunnel() {
  echo ""
  echo -e "${YELLOW}Giữ terminal này mở trong khi demo!${NC}"
  echo ""

  # Ưu tiên Cloudflare Tunnel (miễn phí, nhiều connection)
  if command -v cloudflared &>/dev/null; then
    log_info "Mở Cloudflare Tunnel (không giới hạn connection)..."
    cloudflared tunnel --url http://localhost:80

  # Fallback sang ngrok
  elif command -v ngrok &>/dev/null; then
    log_info "Mở ngrok tunnel..."
    log_warn "ngrok free chỉ cho 1 connection — dùng Cloudflare Tunnel nếu cần nhiều hơn"
    log_warn "Cài Cloudflare: brew install cloudflare/cloudflare/cloudflared"
    ngrok http 80

  else
    log_error "Chưa cài tunnel tool. Cài một trong hai:\n  Cloudflare: brew install cloudflare/cloudflare/cloudflared\n  ngrok:      brew install ngrok"
  fi
}

# ── Main ──
case $COMMAND in
  start)   cmd_start   ;;
  stop)    cmd_stop    ;;
  restart) cmd_restart ;;
  logs)    cmd_logs $@ ;;
  seed)    cmd_seed    ;;
  status)  cmd_status  ;;
  tunnel)  cmd_tunnel  ;;
  *)
    echo "Dùng: bash deploy.sh [start|stop|restart|logs|seed|status|tunnel]"
    echo ""
    echo "  start    — Build và khởi động toàn bộ"
    echo "  stop     — Dừng tất cả"
    echo "  restart  — Restart services"
    echo "  logs     — Xem logs (thêm tên service: logs backend)"
    echo "  seed     — Chạy seed data"
    echo "  status   — Kiểm tra trạng thái"
    echo "  tunnel   — Mở tunnel để demo từ xa (Cloudflare ưu tiên)"
    ;;
esac