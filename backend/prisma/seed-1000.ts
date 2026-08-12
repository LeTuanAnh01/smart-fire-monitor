import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding 1000 thiết bị...')

  // ── Users (giống seed gốc) ──
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@sfm.vn' },
    update: {},
    create: {
      fullName: 'Super Admin',
      email: 'superadmin@sfm.vn',
      passwordHash: await bcrypt.hash('SuperAdmin@123', 10),
      role: Role.SUPER_ADMIN,
    }
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@khudt.vn' },
    update: {},
    create: {
      fullName: 'Ban Quản Lý Khu Đô Thị',
      email: 'admin@khudt.vn',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      role: Role.ADMIN,
      createdById: superAdmin.id,
    }
  })

  const manager = await prisma.user.upsert({
    where: { email: 'baove@khudt.vn' },
    update: {},
    create: {
      fullName: 'Nguyễn Bảo Vệ',
      email: 'baove@khudt.vn',
      passwordHash: await bcrypt.hash('Manager@123', 10),
      role: Role.MANAGER,
      createdById: admin.id,
    }
  })

  console.log('✅ Users created')

  // ── Location tree — Khu đô thị test 1000 thiết bị ──
  // Cấu trúc: Khu đô thị → 5 tòa → 10 tầng/tòa → 20 căn/tầng = 1000 thiết bị
  const root = await prisma.location.create({
    data: { name: 'Khu đô thị Vinhomes Test', code: 'VH-TEST', order: 0 }
  })

  await prisma.userLocation.create({ data: { userId: admin.id, locationId: root.id } })
  await prisma.userLocation.create({ data: { userId: manager.id, locationId: root.id } })

  let extIdCounter = 1001 // Bắt đầu từ 1001 để không trùng với DB gốc
  let totalDevices = 0

  // 5 tòa nhà: T1 - T5
  for (let toa = 1; toa <= 5; toa++) {
    const toaNode = await prisma.location.create({
      data: {
        name: `Tòa ${String.fromCharCode(64 + toa)}`,
        code: `T${String.fromCharCode(64 + toa)}`,
        parentId: root.id,
        order: toa
      }
    })

    // 10 tầng/tòa
    for (let tang = 1; tang <= 10; tang++) {
      const tangNode = await prisma.location.create({
        data: {
          name: `Tầng ${tang}`,
          code: `T${String.fromCharCode(64 + toa)}F${tang}`,
          parentId: toaNode.id,
          order: tang
        }
      })

      // 20 căn hộ/tầng
      for (let can = 1; can <= 20; can++) {
        const code = `T${String.fromCharCode(64 + toa)}${tang}${String(can).padStart(2, '0')}`
        const canHoNode = await prisma.location.create({
          data: {
            name: `Căn hộ ${code}`,
            code,
            parentId: tangNode.id,
            order: can
          }
        })

        // 1 thiết bị/căn
        await prisma.device.create({
          data: {
            locationId: canHoNode.id,
            thingId: uuidv4(),
            thingKey: uuidv4(),
            extId: String(extIdCounter).padStart(4, '0'),
            name: `Cảm biến khói ${code}`,
            status: {
              create: {
                smokeLevel: Math.floor(Math.random() * 60) + 20,
                temperature: Math.floor(Math.random() * 12) + 22,
                batteryLevel: Math.floor(Math.random() * 40) + 60,
                wifiSignal: Math.floor(Math.random() * 5) + 5,
                powerVoltage: Math.floor(Math.random() * 4) + 18,
                state: 0,
                smokeUpdatedAt: new Date(),
                temperatureUpdatedAt: new Date(),
                batteryUpdatedAt: new Date(),
                wifiUpdatedAt: new Date(),
                powerUpdatedAt: new Date(),
                stateUpdatedAt: new Date(),
                lastSyncAt: new Date(),
              }
            }
          }
        })

        extIdCounter++
        totalDevices++
      }
    }

    console.log(`✅ Tòa ${String.fromCharCode(64 + toa)}: 200 thiết bị`)
  }

  console.log('')
  console.log('════════════════════════════════════════')
  console.log('  Smart Fire Monitor — Load Test DB')
  console.log('  Khu đô thị Vinhomes Test')
  console.log('════════════════════════════════════════')
  console.log(`  Tổng thiết bị: ${totalDevices}`)
  console.log(`  Cấu trúc: 5 tòa × 10 tầng × 20 căn`)
  console.log('')
  console.log('  SuperAdmin: superadmin@sfm.vn / SuperAdmin@123')
  console.log('  Admin:      admin@khudt.vn    / Admin@123')
  console.log('  Manager:    baove@khudt.vn    / Manager@123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())