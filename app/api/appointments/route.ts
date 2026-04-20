// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listAppointments, createAppointment } from '@/lib/airtable';
import { AppointmentStatus, SERVICE_DURATIONS } from '@/lib/types';
import { createCalendarEvent } from '@/lib/calendar';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromDate = searchParams.get('from') ?? undefined;
  const toDate = searchParams.get('to') ?? undefined;
  const rawStatus = searchParams.get('status');
  const validStatuses: AppointmentStatus[] = ['confirmed', 'pending', 'cancelled'];
  const status: AppointmentStatus | undefined =
    rawStatus && validStatuses.includes(rawStatus as AppointmentStatus)
      ? (rawStatus as AppointmentStatus)
      : undefined;

  try {
    const appointments = await listAppointments({ fromDate, toDate, status });
    return NextResponse.json({ appointments });
  } catch (err) {
    console.error('[appointments GET]', err);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json() as {
      customerName: string; customerPhone: string; service: string;
      date: string; time: string; notes?: string; staffId?: string;
    };

    const duration = SERVICE_DURATIONS[body.service as keyof typeof SERVICE_DURATIONS] ?? 60;
    let eventId: string | undefined;
    try {
      eventId = await createCalendarEvent({
        summary: `${body.service} - ${body.customerName}`,  // staffName yok, sadece hizmet+isim
        description: `Müşteri: ${body.customerName}\nTel: ${body.customerPhone}\n${body.notes ?? ''}`,
        date: body.date, time: body.time, durationMinutes: duration,
        attendeePhone: body.customerPhone,
      });
    } catch { /* calendar hatası kritik değil */ }

    const appointment = await createAppointment({
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      service: body.service as keyof typeof SERVICE_DURATIONS,
      date: body.date,
      time: body.time,
      durationMinutes: duration,
      status: 'confirmed',
      notes: body.notes,
      googleCalendarEventId: eventId,
      staffId: body.staffId,
    });

    return NextResponse.json(appointment);
  } catch (err) {
    console.error('[appointments POST]', err);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
