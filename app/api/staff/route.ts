import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listStaff, createStaff, updateStaff, deleteStaff } from '@/lib/staff';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const staff = await listStaff();
  return NextResponse.json(staff);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, role, services, active } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'İsim zorunlu' }, { status: 400 });
  const created = await createStaff({
    name: name.trim(),
    role: (role ?? '').trim(),
    services: Array.isArray(services) ? services : [],
    active: active ?? true,
  });
  return NextResponse.json(created);
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  const updated = await updateStaff(id, data);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  await deleteStaff(id);
  return NextResponse.json({ ok: true });
}
