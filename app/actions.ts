'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  const name = formData.get('name') as string
  const address = formData.get('address') as string
  
  await prisma.project.create({
    data: { name, address }
  })
  
  revalidatePath('/')
}
