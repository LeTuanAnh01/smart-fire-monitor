#!/bin/bash

# ════════════════════════════════════════════════
#   Smart Fire Monitor (SFM) — Deploy Script
#   Dùng: bash deploy.sh [command]
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

check_deps() {
  log_info "Kiểm tra dependencies..."
  if ! command -v docker &>/dev/null; then
    log_error "Docker chưa được cài."
  fi
  if ! docker compose version &>/dev/null; then
    log_error "Docker Compose chưa được cài hoặc quá cũ."
  fi
  log_success "Docker OK ($(docker --version))"
}

setup_env() {
  if [ ! -f .env ]; then
    log_warn ".env chưa tồn tại — tạo mới..."
    cat > .env << 'ENVEOF'
DB_PASSWORD=sfm_secret_2024
JWT_SECRET=sfm-jwt-secret-please-change-this
CLIENT_URL=http://localhost
ENVEOF
    log_success "Tạo .env xong"
  else
    log_success ".env đã tồn tại"
  fi
}

print_info() {
  echo ""
  echo -e "${GREEN}════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}   SFM — Smart Fire Monitor đã chạy thành công! ${NC}"
  echo -e "${GREEN}════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  🌐 Web:        ${BLUE}http://localhost${NC}"
  echo -e "  🔌 API:        ${BLUE}http://localhost/api${NC}"
  echo -e "  📡 EMQX:       ${BLUE}http://localhost:18083${NC} (admin/public)"
  echo ""
  echo -e "  👤 SuperAdmin: superadmin@sfm.vn    / SuperAdmin@123"
  echo -e "  👤 Admin:      admin@96dinhcong.vn  / Admin@123"
  echo -e "  👤 Manager:    baove@96dinhcong.vn  / Manager@123"
  echo -e "  👤 User:       dancu@96dinhcong.vn  / User@123"
  echo ""
}

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
  docker exec sfm_backend npx prisma migrate deploy 2>/dev/null || true

  DEVICE_COUNT=$(docker exec sfm_backend \
    npx ts-node --transpile-only -e \
    "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.device.count().then(c=>{console.log(c);p.\$disconnect()})" \
    2>/dev/null || echo "0")

  if [ "$DEVICE_COUNT" = "0" ]; then
    log_info "Chạy seed data..."
    docker exec sfm_backend npm run db:seed
    log_success "Seed data xong"
  else
    log_info "Database đã có data ($DEVICE_COUNT thiết bị) — bỏ qua seed"
  fi

  print_info
}

cmd_stop() {
  log_info "Dừng tất cả services..."
  docker compose down
  log_success "Đã dừng"
}

cmd_restart() {
  log_info "Restart services..."
  docker compose restart
  log_success "Đã restart"
}

cmd_rebuild() {
  log_info "Rebuild toàn bộ và deploy..."
  docker compose build --no-cache
  docker compose up -d
  log_success "Deploy xong!"
  print_info
}

cmd_rebuild_be() {
  log_info "Rebuild backend..."
  docker compose build --no-cache backend
  docker compose up -d backend
  log_success "Backend deploy xong!"
}

cmd_rebuild_fe() {
  log_info "Rebuild frontend..."
  docker compose build --no-cache frontend
  docker compose up -d frontend
  log_success "Frontend deploy xong!"
}

cmd_logs() {
  SERVICE=${2:-}
  if [ -n "$SERVICE" ]; then
    docker compose logs -f "$SERVICE"
  else
    docker compose logs -f
  fi
}

cmd_seed() {
  log_info "Chạy seed data..."
  docker exec sfm_backend npm run db:seed
  log_success "Seed xong"
}

cmd_status() {
  echo ""
  docker compose ps
  echo ""
  check_service() {
    local name=$1 url=$2
    if curl -sf "$url" &>/dev/null; then
      echo -e "  ${GREEN}✓${NC} $name"
    else
      echo -e "  ${RED}✗${NC} $name"
    fi
  }
  echo "Health check:"
  check_service "Backend API" "http://localhost/api/health"
  check_service "Frontend"    "http://localhost"
  check_service "EMQX"        "http://localhost:18083"
  echo ""
}

cmd_tunnel() {
  echo ""
  echo -e "${YELLOW}Giữ terminal này mở trong khi demo!${NC}"
  echo -e "${YELLOW}Ctrl+C để dừng tunnel${NC}"
  echo ""
  if command -v cloudflared &>/dev/null; then
    log_info "Mở Cloudflare Tunnel (auto-retry khi bị drop)..."
    while true; do
      cloudflared tunnel --url http://localhost:80 --loglevel warn 2>&1
      log_warn "Tunnel bị drop — tự động kết nối lại sau 5 giây..."
      sleep 5
    done
  elif command -v ngrok &>/dev/null; then
    log_info "Mở ngrok tunnel..."
    ngrok http 80
  else
    log_error "Chưa cài tunnel. Cài: brew install cloudflare/cloudflare/cloudflared"
  fi
}

cmd_switch_db() {
  DB=${2:-prod}
  if [ "$DB" = "test" ]; then
    DB_NAME="sfm_test"
    log_info "Switch sang DB test (1000 thiết bị)..."
  else
    DB_NAME="sfm"
    log_info "Switch sang DB prod (144 thiết bị)..."
  fi

  # Cập nhật .env gốc (Docker đọc file này)
  if grep -q "^DB_NAME=" .env; then
    sed -i '' "s|^DB_NAME=.*|DB_NAME=$DB_NAME|" .env
  else
    echo "DB_NAME=$DB_NAME" >> .env
  fi

  # Cập nhật backend/.env cho dev local
  if [ -f backend/.env ]; then
    sed -i '' "s|@localhost:5432/[a-z_]*|@localhost:5432/$DB_NAME|" backend/.env
  fi

  # Recreate Docker backend
  docker compose up -d --force-recreate backend
  log_success "Đã switch sang DB $DB! ($DB_NAME)"
  log_warn "Nếu đang chạy dev: Ctrl+C npm run dev rồi chạy lại!"
}

cmd_simulator() {
  ENV=${2:-docker}
  if [ "$ENV" = "dev" ]; then
    API_URL="http://localhost:3002/api"
    log_info "Chạy simulator — Dev mode (port 3002)..."
  else
    API_URL="http://localhost/api"
    log_info "Chạy simulator — Docker mode (port 80)..."
  fi

  if [ ! -f simulator/simulator.py ]; then
    log_error "Không tìm thấy simulator/simulator.py"
  fi

  echo -e "${YELLOW}Ctrl+C để dừng simulator${NC}"
  echo ""
  cd simulator && API_URL=$API_URL python3 simulator.py
}

# ── Main ──
case $COMMAND in
  start)      cmd_start         ;;
  stop)       cmd_stop          ;;
  restart)    cmd_restart       ;;
  rebuild)    cmd_rebuild       ;;
  rebuild-be) cmd_rebuild_be    ;;
  rebuild-fe) cmd_rebuild_fe    ;;
  logs)       cmd_logs $@       ;;
  seed)       cmd_seed          ;;
  status)     cmd_status        ;;
  tunnel)     cmd_tunnel        ;;
  switch-db)  cmd_switch_db $@  ;;
  simulator)  cmd_simulator $@  ;;
  *)
    echo ""
    echo -e "${BLUE}Smart Fire Monitor — Deploy Script${NC}"
    echo ""
    echo "Dùng: bash deploy.sh [command]"
    echo ""
    echo -e "${GREEN}Khởi động:${NC}"
    echo "  start            — Build và khởi động toàn bộ"
    echo "  stop             — Dừng tất cả"
    echo "  restart          — Restart services"
    echo ""
    echo -e "${GREEN}Deploy:${NC}"
    echo "  rebuild          — Rebuild toàn bộ với code mới"
    echo "  rebuild-be       — Rebuild chỉ backend"
    echo "  rebuild-fe       — Rebuild chỉ frontend"
    echo ""
    echo -e "${GREEN}Database:${NC}"
    echo "  switch-db prod   — Dùng DB gốc (144 thiết bị)"
    echo "  switch-db test   — Dùng DB test (1000 thiết bị)"
    echo "  seed             — Chạy seed data"
    echo ""
    echo -e "${GREEN}Simulator:${NC}"
    echo "  simulator        — Chạy simulator (Docker mode)"
    echo "  simulator dev    — Chạy simulator (Dev mode port 3002)"
    echo ""
    echo -e "${GREEN}Khác:${NC}"
    echo "  logs [service]   — Xem logs"
    echo "  status           — Kiểm tra trạng thái"
    echo "  tunnel           — Mở tunnel demo từ xa"
    echo ""
    ;;
esac