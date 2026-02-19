// ADD THIS FIRST
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; inspectionId: string }> }) {
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
  const { inspectionId } = await params;  // Don't need projectId for delete
  
  await prisma.inspection.delete({
    where: { id: inspectionId }  // Just inspection ID
  });
  
  return NextResponse.json({ success: true });
}
