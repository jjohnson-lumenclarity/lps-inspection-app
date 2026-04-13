import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const photo = formData.get('photo') as File | null;
    const projectId = formData.get('projectId') as string | null;

    if (!photo || !projectId) {
      return NextResponse.json({ error: 'Missing photo or projectId' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileExt = photo.name.split('.').pop() || 'jpg';
      const path = `project-photos/${projectId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-media')
        .upload(path, buffer, {
          contentType: photo.type || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
      }

      const { data: publicData } = supabase.storage.from('project-media').getPublicUrl(uploadData.path);
      return NextResponse.json({ photo_url: publicData.publicUrl });
    }

    // Dev fallback (works locally without Supabase service key)
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${projectId}-${Date.now()}-${photo.name}`;
    const photosDir = join(process.cwd(), 'public', 'photos');
    const filepath = join(photosDir, filename);

    await mkdir(photosDir, { recursive: true });
    await writeFile(filepath, buffer);

    return NextResponse.json({
      photo_url: `/photos/${filename}`,
      warning: 'Using local filesystem fallback (SUPABASE_SERVICE_ROLE_KEY not configured).',
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
