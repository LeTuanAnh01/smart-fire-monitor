import prisma from '../utils/prisma'

// Lấy toàn bộ cây location (đệ quy)
export const getLocationTree = async (locationIds: string[] | null) => {
  // SuperAdmin — trả về tất cả root nodes
  if (locationIds === null) {
    return prisma.location.findMany({
      where: { parentId: null },
      orderBy: { order: 'asc' },
      include: { devices: { include: { status: true } }, children: buildInclude(5) }
    })
  }

  if (locationIds.length === 0) return []

  // Các role khác — lấy đúng các node được gán và con của chúng
  return prisma.location.findMany({
    where: { id: { in: locationIds } },
    orderBy: { order: 'asc' },
    include: { children: buildInclude(5) }
  })
}

// Đệ quy include children
const buildInclude = (depth: number): any => {
  if (depth === 0) return undefined
  return {
    orderBy: { order: 'asc' },
    include: {
      devices: {
        select: {
          id: true,
          name: true,
          extId: true,
          status: { select: { state: true } },
          alerts: {
            where: { status: 'ACTIVE' },
            select: { id: true, alertType: true }
          }
        }
      },
      children: buildInclude(depth - 1)
    }
  }
} 

// Lấy root ids từ danh sách locationIds của user
const getRootId = async (id: string): Promise<string> => {
  const loc = await prisma.location.findUnique({ where: { id } })
  if (!loc?.parentId) return id
  return getRootId(loc.parentId)
}

// Filter tree — chỉ giữ node có trong allowedIds
const filterTree = (nodes: any[], allowedIds: string[]): any[] => {
  return nodes
    .filter(n => allowedIds.includes(n.id) ||
      (n.children && filterTree(n.children, allowedIds).length > 0))
    .map(n => ({
      ...n,
      children: n.children ? filterTree(n.children, allowedIds) : []
    }))
}

const getRoot = async (id: string): Promise<string> => {
  const loc = await prisma.location.findUnique({ where: { id } })
  if (!loc?.parentId) return id
  return getRoot(loc.parentId)
}

// Lấy tất cả descendant ids của 1 location
export const getDescendantIds = async (locationId: string): Promise<string[]> => {
  const ids: string[] = [locationId]
  const children = await prisma.location.findMany({
    where: { parentId: locationId },
    select: { id: true }
  })
  for (const child of children) {
    const childIds = await getDescendantIds(child.id)
    ids.push(...childIds)
  }
  return ids
}

// Lấy tất cả locationIds user có quyền xem (bao gồm descendants)
export const getAccessibleLocationIds = async (locationIds: string[]): Promise<string[]> => {
  const allIds: string[] = []
  for (const id of locationIds) {
    const descendants = await getDescendantIds(id)
    allIds.push(...descendants)
  }
  return [...new Set(allIds)]
}

export const createLocation = async (data: {
  name: string
  code?: string
  parentId?: string
  order?: number
}): Promise<{ success: boolean; message: string; data?: any }> => {
  // Kiểm tra code unique trong cùng parent
  if (data.code) {
    const existing = await prisma.location.findFirst({
      where: {
        code: { equals: data.code, mode: 'insensitive' },
        parentId: data.parentId || null
      }
    })
    if (existing) return { success: false, message: `Mã "${data.code}" đã tồn tại trong khu vực này` }
  }

  const location = await prisma.location.create({ data })
  return { success: true, message: 'Tạo thành công', data: location }
}

export const updateLocation = async (id: string, data: {
  name?: string
  code?: string
  order?: number
}) => {
  return prisma.location.update({ where: { id }, data })
}

export const deleteLocation = async (id: string) => {
  return prisma.location.delete({ where: { id } })
}

export const findLocationById = async (id: string) => {
  return prisma.location.findUnique({
    where: { id },
    include: {
      parent: true,
      children: {
        orderBy: { order: 'asc' },
        include: {
          devices: { include: { status: true } },
          children: {
            orderBy: { order: 'asc' },
            include: { devices: { include: { status: true } } }
          }
        }
      },
      devices: { include: { status: true } }
    }
  })
}

export const assignUserToLocation = async (
  userId: string,
  locationId: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  const existing = await prisma.userLocation.findUnique({
    where: { userId_locationId: { userId, locationId } }
  })
  if (existing) return { success: false, message: 'User đã được gán vào vị trí này' }

  const result = await prisma.userLocation.create({ data: { userId, locationId } })
  return { success: true, message: 'Gán thành công', data: result }
}

export const removeUserFromLocation = async (userId: string, locationId: string) => {
  return prisma.userLocation.deleteMany({ where: { userId, locationId } })
}