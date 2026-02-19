import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.VERCEL_ENV !== 'production') {
  global.prisma = prisma
}
