// app/api/send-reminders/route.ts
// Vercel Cron ile her 30 dakikada çalışır
// Randevudan 2 saat önce SMS hatırlatması gönderir
import { NextResponse } from 'next/server';
import { listAppointments, markReminderSent } from '@/lib/airtable';
import { sendSMS, buildReminderMessage } from '@/lib/sms';
import { format } from 'date-fns';

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');

  // Şu anki saat + 2 saat (±20 dakika tolerans)
  const targetMs = now.getTime() + 2 * 60 * 60 * 1000;
  const windowMs = 20 * 60 * 1000;

  const appointments = await listAppointments();
  const toRemind = appointments.filter((a) => {
    if (a.date !== today) return false;
    if (a.status !== 'confirmed') return false;
    if ((a as unknown as Record<string, unknown>).reminderSent) return false;

    const [h, m] = a.time.split(':').map(Number);
    const apptMs = new Date(a.date).setHours(h, m, 0, 0);
    return Math.abs(apptMs - targetMs) <= windowMs;
  });

  const results: { phone: string; success: boolean; error?: string }[] = [];

  for (const appt of toRemind) {
    try {
      await sendSMS(
        appt.customerPhone,
        buildReminderMessage({
          customerName: appt.customerName,
          service: appt.service,
          date: appt.date,
          time: appt.time,
        })
      );
      await markReminderSent(appt.id);
      results.push({ phone: appt.customerPhone, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SMS gönderilemedi';
      results.push({ phone: appt.customerPhone, success: false, error: message });
    }
  }

  return NextResponse.json({ checked: today, total: toRemind.length, results });
}
