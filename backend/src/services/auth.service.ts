import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma'

export const verifyLogin = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      locations: { select: { locationId: true } }
    }
  })

  if (!user || !user.isActive) return null

  const isMatch = await bcrypt.compare(password, user.passwordHash)
  if (!isMatch) return null

  return user
}

export const generateToken = (user: {
  id: string
  email: string
  role: string
  locations: { locationId: string }[]
}) => {
  const locationIds = user.locations.map(l => l.locationId)

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, locationIds },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  )

  return { token, locationIds }
}

export const getUserById = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      locations: {
        include: { location: { select: {
          id: true, fullName: true, email: true, phone: true,
          role: true, isActive: true,
          locations: { include: { location: { select: { id: true, name: true, code: true } } } }
        } } }
      }
    }
  })
}

export const updatePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { success: false, message: 'User không tồn tại' }

  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash)
  if (!isMatch) return { success: false, message: 'Mật khẩu cũ không đúng' }

  const newHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash }
  })

  return { success: true, message: 'Đổi mật khẩu thành công' }
}

export const updateUserProfile = async (userId: string, data: { fullName?: string; phone?: string }) => {
  return prisma.user.update({
    where: { id: userId },
    data: { ...data },
    select: { id: true, fullName: true, email: true, phone: true, role: true }
  })
}