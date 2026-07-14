import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Smart Fire Monitor — Smart Fire Monitor — Seeding...')

  // ── Users ──
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
    where: { email: 'admin@96dinhcong.vn' },
    update: {},
    create: {
      fullName: 'Ban Quản Lý 96 Định Công',
      email: 'admin@96dinhcong.vn',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      role: Role.ADMIN,
      createdById: superAdmin.id,
    }
  })

  const manager = await prisma.user.upsert({
    where: { email: 'baove@96dinhcong.vn' },
    update: {},
    create: {
      fullName: 'Nguyễn Bảo Vệ',
      email: 'baove@96dinhcong.vn',
      passwordHash: await bcrypt.hash('Manager@123', 10),
      role: Role.MANAGER,
      createdById: admin.id,
    }
  })

  const resident = await prisma.user.upsert({
    where: { email: 'dancu@96dinhcong.vn' },
    update: {},
    create: {
      fullName: 'Trần Văn Dân',
      email: 'dancu@96dinhcong.vn',
      passwordHash: await bcrypt.hash('User@123', 10),
      role: Role.USER,
      createdById: admin.id,
    }
  })

  console.log('✅ Users created')

  // ── Location tree — 96 Định Công ──
  const root = await prisma.location.create({
    data: { name: 'Chung cư 96 Định Công', code: 'DC96', order: 0 }
  })

  const toaChiNh = await prisma.location.create({
    data: { name: 'Tòa nhà chính', code: 'MAIN', parentId: root.id, order: 0 }
  })

  const khuXeNgoai = await prisma.location.create({
    data: { name: 'Khu để xe ngoài trời', code: 'PARK-OUT', parentId: root.id, order: 1 }
  })

  // Tầng hầm B1
  const tangHam = await prisma.location.create({
    data: { name: 'Tầng hầm B1', code: 'B1', parentId: toaChiNh.id, order: 0 }
  })
  await prisma.location.createMany({
    data: [
      { name: 'Khu để xe B1-A', code: 'B1-A', parentId: tangHam.id, order: 0 },
      { name: 'Khu để xe B1-B', code: 'B1-B', parentId: tangHam.id, order: 1 },
    ]
  })

  // Bãi xe ngoài
  await prisma.location.createMany({
    data: [
      { name: 'Bãi xe A', code: 'PA', parentId: khuXeNgoai.id, order: 0 },
      { name: 'Bãi xe B', code: 'PB', parentId: khuXeNgoai.id, order: 1 },
    ]
  })

  // Tầng 1-3: Dịch vụ
  for (let i = 1; i <= 3; i++) {
    const tang = await prisma.location.create({
      data: { name: `Tầng ${i} — Dịch vụ`, code: `F${i}`, parentId: toaChiNh.id, order: i }
    })
    // Mỗi tầng dịch vụ có 8 phòng
    for (let j = 1; j <= 8; j++) {
      const code = `P${i}0${j}`
      await prisma.location.create({
        data: { name: `Phòng ${code}`, code, parentId: tang.id, order: j }
      })
    }
  }

  // Tầng 4-21: Dân cư — 8 căn/tầng
  let extIdCounter = 1
  const firstCanHo: string[] = []

  for (let i = 4; i <= 21; i++) {
    const tang = await prisma.location.create({
      data: { name: `Tầng ${i}`, code: `F${i}`, parentId: toaChiNh.id, order: i }
    })

    for (let j = 1; j <= 8; j++) {
      const code = `P${i}0${j}`
      const canHo = await prisma.location.create({
        data: { name: `Căn hộ ${code}`, code, parentId: tang.id, order: j }
      })

      if (i === 4 && j === 1) firstCanHo.push(canHo.id)

      // Thiết bị cảm biến khói cho mỗi căn
      await prisma.device.create({
        data: {
          locationId: canHo.id,
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
    }
  }

  // Gán user vào location
  await prisma.userLocation.create({ data: { userId: admin.id,    locationId: root.id } })
  await prisma.userLocation.create({ data: { userId: manager.id,  locationId: toaChiNh.id } })
  if (firstCanHo[0]) {
    await prisma.userLocation.create({ data: { userId: resident.id, locationId: firstCanHo[0] } })
  }

  console.log(`✅ Location tree created`)
  console.log(`✅ ${extIdCounter - 1} thiết bị (144 căn hộ tầng 4-21)`)
  console.log('')
  console.log('════════════════════════════════════════')
  console.log('  Smart Fire Monitor — Smart Fire Monitor')
  console.log('  Chung cư 96 Định Công')
  console.log('════════════════════════════════════════')
  console.log('  SuperAdmin: superadmin@sfm.vn       / SuperAdmin@123')
  console.log('  Admin:      admin@96dinhcong.vn     / Admin@123')
  console.log('  Manager:    baove@96dinhcong.vn     / Manager@123')
  console.log('  User:       dancu@96dinhcong.vn     / User@123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())