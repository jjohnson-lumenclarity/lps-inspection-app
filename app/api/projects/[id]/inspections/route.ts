import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  
  const inspections = await prisma.inspection.findMany({
    where: { projectId },  // ← Direct projectId field
    orderBy: { createdAt: 'desc' },
    include: { photos: true }
  });
  
  return Response.json(inspections);
}
