import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma'

const getCreatedUserIds = async (creatorId: string): Promise<string[]> => {
  const ids: string[] = [creatorId]
  const created = await prisma.user.findMany({
    where: { createdById: creatorId },
    select: { id: true }
  })
  for (const u of created) {
    const childIds = await getCreatedUserIds(u.id)
    ids.push(...childIds)
  }
  return ids
}

export const findUsers = async (filters: {
  role?: string
  search?: string
  requesterId: string
  requesterRole: string
  requesterLocationIds: string[]
  page: number
  limit: number
}) => {
  const { role, search, requesterId, requesterRole, page, limit } = filters

  let where: any = {
    ...(search && { fullName: { contains: search, mode: 'insensitive' } }),
  }

  if (requesterRole === 'SUPER_ADMIN') {
    if (role) where.role = role
  } else if (requesterRole === 'ADMIN') {
    const createdIds = await getCreatedUserIds(requesterId)
    where.id = { in: createdIds, not: requesterId }
    where.role = { not: 'SUPER_ADMIN', ...(role ? { equals: role } : {}) }
  } else if (requesterRole === 'MANAGER') {
    where.createdById = requesterId
    where.role = { not: 'SUPER_ADMIN', ...(role ? { equals: role } : {}) }
  } else {
    return { items: [], total: 0 }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, fullName: true, email: true,
        phone: true,
        role: true, isActive: true, createdAt: true, createdById: true,
        locations: {
          include: { location: { select: { id: true, name: true } } }
        }
      }
    }),
    prisma.user.count({ where })
  ])

  const items = users.map(u => ({
    id: u.id, fullName: u.fullName, email: u.email,
    phone: u.phone,
    role: u.role, isActive: u.isActive, createdAt: u.createdAt,
    createdById: u.createdById,
    locations: u.locations.map(ul => ul.location)
  }))

  return { items, total }
}

export const canManageUser = async (
  managerId: string,
  managerRole: string,
  targetUserId: string
): Promise<boolean> => {
  if (managerRole === 'SUPER_ADMIN') return true
  if (targetUserId === managerId) return false

  if (managerRole === 'ADMIN') {
    const createdIds = await getCreatedUserIds(managerId)
    return createdIds.includes(targetUserId)
  }

  if (managerRole === 'MANAGER') {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } })
    return target?.createdById === managerId
  }

  return false
}

export const createUser = async (
  data: { fullName: string; email: string; password: string; role?: string; phone?: string },
  creatorId: string,
  creatorRole: string,
): Promise<{ success: boolean; message: string; data?: any }> => {
  const allowedRoles: Record<string, string[]> = {
    SUPER_ADMIN: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
    ADMIN:       ['ADMIN', 'MANAGER', 'USER'],
    MANAGER:     ['MANAGER', 'USER'],
  }

  const allowed = allowedRoles[creatorRole] || []
  const targetRole = data.role || 'USER'

  if (!allowed.includes(targetRole)) {
    return { success: false, message: `Bạn không có quyền tạo tài khoản role ${targetRole}` }
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) return { success: false, message: 'Email đã tồn tại' }

  const passwordHash = await bcrypt.hash(data.password, 10)
  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: targetRole as any,
      createdById: creatorId,
    },
    select: {
      id: true, fullName: true, email: true, phone: true,
      role: true, isActive: true, createdAt: true, createdById: true
    }
  })

  return { success: true, message: 'Tạo tài khoản thành công', data: user }
}

export const updateUserChecked = async (
  targetUserId: string,
  data: { fullName?: string; phone?: string; isActive?: boolean; password?: string; role?: string },
  updaterId: string,
  updaterRole: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  const canManage = await canManageUser(updaterId, updaterRole, targetUserId)
  if (!canManage) return { success: false, message: 'Bạn không có quyền sửa tài khoản này' }

  if (data.role) {
    const allowedRoles: Record<string, string[]> = {
      SUPER_ADMIN: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
      ADMIN:       ['ADMIN', 'MANAGER', 'USER'],
      MANAGER:     ['MANAGER', 'USER'],
    }
    const allowed = allowedRoles[updaterRole] || []
    if (!allowed.includes(data.role)) {
      return { success: false, message: `Bạn không có quyền gán role ${data.role}` }
    }
  }

  const updateData: any = {
    ...(data.fullName && { fullName: data.fullName }),
    ...(data.phone !== undefined && { phone: data.phone || null }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    ...(data.role && { role: data.role as any }),
    ...(data.password && { passwordHash: await bcrypt.hash(data.password, 10) })
  }

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: updateData,
    select: {
      id: true, fullName: true, email: true, phone: true,
      role: true, isActive: true
    }
  })

  return { success: true, message: 'Cập nhật thành công', data: user }
}

export const deleteUserChecked = async (
  targetUserId: string,
  deleterId: string,
  deleterRole: string
): Promise<{ success: boolean; message: string }> => {
  const canManage = await canManageUser(deleterId, deleterRole, targetUserId)
  if (!canManage) return { success: false, message: 'Bạn không có quyền xóa tài khoản này' }

  await prisma.user.delete({ where: { id: targetUserId } })
  return { success: true, message: 'Xóa tài khoản thành công' }
}

export const updateUserProfile = async (
  userId: string,
  data: { fullName?: string; phone?: string }
) => {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, fullName: true, email: true, phone: true, role: true }
  })
}