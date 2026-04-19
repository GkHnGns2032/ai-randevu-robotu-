import { NextResponse } from 'next/server';
import Airtable from 'airtable';

export async function GET() {
  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! })
      .base(process.env.AIRTABLE_BASE_ID!);
    const table = base(process.env.AIRTABLE_TABLE_NAME!);

    const record = await table.create({
      customerName: 'TEST SİL',
      customerPhone: '5000000000',
      service: 'Manikür',
      date: '2026-04-19',
      time: '09:00',
      durationMinutes: 60,
      status: 'confirmed',
      notes: 'test kaydı - silin',
      googleCalendarEventId: '',
    });

    return NextResponse.json({ ok: true, id: record.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
