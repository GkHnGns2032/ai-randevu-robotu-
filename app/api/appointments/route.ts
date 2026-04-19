// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listAppointments } from '@/lib/airtable';
import { AppointmentStatus } from '@/lib/types';

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
