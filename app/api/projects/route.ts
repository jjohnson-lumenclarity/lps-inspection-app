import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const projects = await prisma.project.findMany({
    select: { 
      id: true, 
      name: true, 
      address: true, 
      createdAt: true 
    }
  })
  
  return NextResponse.json(projects)
}
