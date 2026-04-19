import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listStaff, createStaff, updateStaff, deleteStaff } from '@/lib/staff';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const staff = await listStaff();
  return NextResponse.json(staff);
}

function toUserError(e: unknown): string {
  const err = e as { error?: string; message?: string };
  if (err?.error === 'INVALID_MULTIPLE_CHOICE_OPTIONS') {
    return 'Airtable\'daki "services" alanına bu hizmet seçeneği eklenmemiş. Airtable\'da Staff tablosu → services field → options\'a tüm hizmetleri ekleyin.';
  }
  if (err?.error === 'UNKNOWN_FIELD_NAME') {
    return 'Airtable Staff tablosunda beklenen alan bulunamadı. Gerekli alanlar: name, role, services, active.';
  }
  return err?.message || 'Airtable işlemi başarısız oldu.';
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, role, services, active } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'İsim zorunlu' }, { status: 400 });
  try {
    const created = await createStaff({
      name: name.trim(),
      role: (role ?? '').trim(),
      services: Array.isArray(services) ? services : [],
      active: active ?? true,
    });
    return NextResponse.json(created);
  } catch (e) {
    return NextResponse.json({ error: toUserError(e) }, { status: 422 });
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  try {
    const updated = await updateStaff(id, data);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: toUserError(e) }, { status: 422 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  try {
    await deleteStaff(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: toUserError(e) }, { status: 422 });
  }
}
