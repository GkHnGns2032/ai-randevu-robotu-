// app/api/send-reminders/route.ts
// Vercel Cron ile her 30 dakikada çalışır
// Randevudan 2 saat önce SMS hatırlatması gönderir
import { NextResponse } from 'next/server';
import { listAppointments, markReminderSent } from '@/lib/airtable';
import { sendSMS, buildReminderMessage } from '@/lib/sms';

function istanbulNowParts(): { dateStr: string; nowMs: number } {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  return { dateStr, nowMs: now.getTime() };
}

function istanbulApptMs(date: string, time: string): number {
  return new Date(`${date}T${time}:00+03:00`).getTime();
}

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { dateStr: today, nowMs } = istanbulNowParts();
  const targetMs = nowMs + 2 * 60 * 60 * 1000;
  const windowMs = 20 * 60 * 1000;

  const appointments = await listAppointments();
  const toRemind = appointments.filter((a) => {
    if (a.date !== today) return false;
    if (a.status !== 'confirmed') return false;
    if ((a as unknown as Record<string, unknown>).reminderSent) return false;
    const apptMs = istanbulApptMs(a.date, a.time);
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
