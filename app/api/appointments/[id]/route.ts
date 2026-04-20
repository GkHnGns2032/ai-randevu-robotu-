import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  updateAppointmentFields,
  cancelAppointment,
  getAppointmentById,
} from '@/lib/airtable';
import { isSlotStillAvailable } from '@/lib/booking-lock';
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/calendar';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json() as Partial<{
      customerName: string; customerPhone: string; service: string;
      date: string; time: string; notes: string; status: string;
    }>;

    const current = await getAppointmentById(id);
    if (!current) {
      return NextResponse.json({ error: 'Randevu bulunamadı' }, { status: 404 });
    }

    const dateChanged = body.date !== undefined && body.date !== current.date;
    const timeChanged = body.time !== undefined && body.time !== current.time;

    const extraFields: { googleCalendarEventId?: string } = {};

    if (dateChanged || timeChanged) {
      if (current.status === 'cancelled') {
        return NextResponse.json(
          { error: 'cancelled', message: 'İptal edilmiş randevu taşınamaz' },
          { status: 400 },
        );
      }
      const newDate = body.date ?? current.date;
      const newTime = body.time ?? current.time;

      const free = await isSlotStillAvailable(newDate, newTime, current.durationMinutes, id);
      if (!free) {
        return NextResponse.json(
          { error: 'conflict', message: 'Bu saatte zaten bir randevu var' },
          { status: 409 },
        );
      }

      try {
        if (current.googleCalendarEventId) {
          try { await deleteCalendarEvent(current.googleCalendarEventId); } catch { /* ignore */ }
        }
        const newEventId = await createCalendarEvent({
          summary: `${current.service} - ${current.customerName}`,
          description: `Müşteri: ${current.customerName}\nTelefon: ${current.customerPhone}`,
          date: newDate,
          time: newTime,
          durationMinutes: current.durationMinutes,
          attendeePhone: current.customerPhone,
        });
        extraFields.googleCalendarEventId = newEventId;
      } catch (calErr) {
        console.error('[appointments PATCH] GCal sync failed:', calErr);
      }
    }

    const updated = await updateAppointmentFields(
      id,
      { ...body, ...extraFields } as Parameters<typeof updateAppointmentFields>[1],
    );
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
