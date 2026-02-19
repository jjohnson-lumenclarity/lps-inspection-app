import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const projects = await prisma.project.findMany();
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const { name, address } = await request.json();
  const project = await prisma.project.create({
    data: { name, address }
  });
  return NextResponse.json(project);
}
