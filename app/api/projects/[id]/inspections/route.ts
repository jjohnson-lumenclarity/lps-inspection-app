import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const inspections = await prisma.inspection.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(inspections);
}
