import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getNotesForCustomer, addNote, deleteNote } from '@/lib/customer-notes';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { phone } = await params;
  const notes = await getNotesForCustomer(decodeURIComponent(phone));
  return NextResponse.json(notes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { phone } = await params;
  const { note, tag } = await req.json();
  if (!note?.trim()) return NextResponse.json({ error: 'Not boş olamaz' }, { status: 400 });
  const created = await addNote(decodeURIComponent(phone), note.trim(), tag || undefined);
  return NextResponse.json(created);
}

export async function DELETE(
  req: NextRequest,
  { params: _params }: { params: Promise<{ phone: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  await deleteNote(id);
  return NextResponse.json({ ok: true });
}
