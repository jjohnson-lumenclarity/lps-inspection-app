import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const photo = formData.get('photo') as File;
    const projectId = formData.get('projectId') as string;

    if (!photo) {
      return NextResponse.json({ error: 'No photo' }, { status: 400 });
    }

    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${projectId}-${Date.now()}-${photo.name}`;
    const filepath = join(process.cwd(), 'public', 'photos', filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({ photo_url: `/photos/${filename}` });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
