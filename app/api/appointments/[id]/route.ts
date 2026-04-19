import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateAppointmentFields, cancelAppointment } from '@/lib/airtable';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json() as Partial<{
      customerName: string; customerPhone: string; service: string;
      date: string; time: string; notes: string; status: string;
    }>;
    const updated = await updateAppointmentFields(id, body as Parameters<typeof updateAppointmentFields>[1]);
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[appointments PATCH]', err);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    await cancelAppointment(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[appointments DELETE]', err);
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
  }
}
