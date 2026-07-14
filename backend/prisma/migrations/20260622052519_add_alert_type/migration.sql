-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('FIRE', 'WARNING', 'LOW_BATTERY', 'WEAK_SIGNAL', 'OFFLINE');

-- Thêm cột value (nullable)
ALTER TABLE "alerts" ADD COLUMN "value" DOUBLE PRECISION;

-- Thêm cột alertType dạng TEXT với default
ALTER TABLE "alerts" ADD COLUMN "alertType" TEXT NOT NULL DEFAULT 'FIRE';

-- Xóa default TRƯỚC khi đổi kiểu
ALTER TABLE "alerts" ALTER COLUMN "alertType" DROP DEFAULT;

-- Đổi kiểu sang enum
ALTER TABLE "alerts" ALTER COLUMN "alertType" TYPE "AlertType" USING "alertType"::"AlertType";

-- CreateIndex
CREATE INDEX "alerts_alertType_idx" ON "alerts"("alertType");