/*
  Warnings:

  - You are about to drop the column `severity` on the `alerts` table. All the data in the column will be lost.
  - You are about to drop the column `triggeredValue` on the `alerts` table. All the data in the column will be lost.
  - You are about to drop the column `deviceTypeId` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `installedAt` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `lastSeenAt` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `mqttTopic` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `serialNumber` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `thresholdValue` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `sensor_logs` table. All the data in the column will be lost.
  - You are about to drop the `device_types` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[thingId]` on the table `devices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[thingKey]` on the table `devices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[extId]` on the table `devices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `state` to the `alerts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `extId` to the `devices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thingId` to the `devices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thingKey` to the `devices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metric` to the `sensor_logs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SensorMetric" AS ENUM ('SMOKE', 'TEMPERATURE', 'BATTERY', 'WIFI', 'POWER', 'STATE');

-- DropForeignKey
ALTER TABLE "devices" DROP CONSTRAINT "devices_deviceTypeId_fkey";

-- DropIndex
DROP INDEX "devices_mqttTopic_key";

-- DropIndex
DROP INDEX "devices_serialNumber_key";

-- DropIndex
DROP INDEX "sensor_logs_deviceId_recordedAt_idx";

-- AlterTable
ALTER TABLE "alerts" DROP COLUMN "severity",
DROP COLUMN "triggeredValue",
ADD COLUMN     "state" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "devices" DROP COLUMN "deviceTypeId",
DROP COLUMN "installedAt",
DROP COLUMN "lastSeenAt",
DROP COLUMN "mqttTopic",
DROP COLUMN "serialNumber",
DROP COLUMN "status",
DROP COLUMN "thresholdValue",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "extId" TEXT NOT NULL,
ADD COLUMN     "thingId" TEXT NOT NULL,
ADD COLUMN     "thingKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sensor_logs" DROP COLUMN "unit",
ADD COLUMN     "metric" "SensorMetric" NOT NULL;

-- DropTable
DROP TABLE "device_types";

-- DropEnum
DROP TYPE "DeviceStatus";

-- DropEnum
DROP TYPE "Severity";

-- CreateTable
CREATE TABLE "device_status" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "smokeLevel" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "batteryLevel" INTEGER,
    "wifiSignal" INTEGER,
    "powerVoltage" DOUBLE PRECISION,
    "state" INTEGER,
    "smokeUpdatedAt" TIMESTAMP(3),
    "temperatureUpdatedAt" TIMESTAMP(3),
    "batteryUpdatedAt" TIMESTAMP(3),
    "wifiUpdatedAt" TIMESTAMP(3),
    "powerUpdatedAt" TIMESTAMP(3),
    "stateUpdatedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "device_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_status_deviceId_key" ON "device_status"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "devices_thingId_key" ON "devices"("thingId");

-- CreateIndex
CREATE UNIQUE INDEX "devices_thingKey_key" ON "devices"("thingKey");

-- CreateIndex
CREATE UNIQUE INDEX "devices_extId_key" ON "devices"("extId");

-- CreateIndex
CREATE INDEX "sensor_logs_deviceId_metric_recordedAt_idx" ON "sensor_logs"("deviceId", "metric", "recordedAt");

-- AddForeignKey
ALTER TABLE "device_status" ADD CONSTRAINT "device_status_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
