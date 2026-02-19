import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';  // ← ADDED

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inspectionId: string }> }
) {
  const { inspectionId } = await params;
  const { roof, siding, windows, notes } = await request.json();

  const inspection = await prisma.inspection.update({
    where: { id: inspectionId },
    data: { roof, siding, windows, notes }
  });

  return NextResponse.json(inspection);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inspectionId: string }> }
) {
  const { inspectionId } = await params;
  
  await prisma.inspection.delete({
    where: { id: inspectionId }
  });
  
  return NextResponse.json({ success: true });
}

