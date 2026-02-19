import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(
  request: NextRequest,
{ params }: { params: Promise<{ id: string; inspectionID: string }> }
const { id, inspectionID } = await params;
  const formData = await request.formData();
  const file = formData.get('photo') as File;
  
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${inspectionId}-${Date.now()}-${file.name}`;
  const filepath = path.join(process.cwd(), 'public/uploads', filename);
  
  await writeFile(filepath, buffer);
  
  await prisma.inspectionPhoto.create({
    data: {
      inspectionId,
      url: `/uploads/${filename}`,
      filename: file.name
    }
  });

  return NextResponse.json({ success: true });
}
