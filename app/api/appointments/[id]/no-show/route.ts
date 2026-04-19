import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { markNoShow } from '@/lib/airtable';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await markNoShow(id);
  return NextResponse.json({ ok: true });
}
