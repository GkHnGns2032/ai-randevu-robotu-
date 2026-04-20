import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listAppointments } from '@/lib/airtable';
import { priceOf } from '@/lib/pricing';

function csvEscape(v: string | number | undefined): string {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const appointments = await listAppointments();
  const SEP = ';';
  const header = ['Ad','Telefon','Hizmet','Tarih','Saat','Süre (dk)','Durum','Fiyat (₺)','Not'].join(SEP);
  const rows = appointments.map((a) => [
    csvEscape(a.customerName),
    csvEscape(a.customerPhone),
    csvEscape(a.service),
    csvEscape(a.date),
    csvEscape(a.time),
    csvEscape(a.durationMinutes),
    csvEscape(a.status),
    csvEscape(priceOf(a.service)),
    csvEscape(a.notes),
  ].join(SEP));

  const csv = '\uFEFF' + [header, ...rows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="randevular-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
