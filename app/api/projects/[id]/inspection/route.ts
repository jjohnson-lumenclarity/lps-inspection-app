import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;  // Line 9-10 fixed
  
  const { roof, siding, windows, notes } = await request.json();

  console.log('Saving for projectId:', projectId); // Debug

  const inspection = await prisma.inspection.create({
    data: {
      projectId,
      roof,
      siding,
      windows,
      notes,
    },
  });

  return NextResponse.json(inspection);
}
