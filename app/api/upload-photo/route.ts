import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const photo = formData.get('photo') as File | null;
    const projectId = formData.get('projectId') as string | null;

    if (!photo || !projectId) {
      return NextResponse.json({ error: 'Missing photo or projectId' }, { status: 400 });
    }

    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${projectId}-${Date.now()}-${photo.name}`;
    const photosDir = join(process.cwd(), 'public', 'photos');
    const filepath = join(photosDir, filename);

    await mkdir(photosDir, { recursive: true });
    await writeFile(filepath, buffer);

    return NextResponse.json({ photo_url: `/photos/${filename}` });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
