import { NextRequest, NextResponse } from 'next/server';
import { holdSlot } from '@/lib/booking-hold';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = rateLimit(`hold:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 });
    }

    const body = await req.json() as { date?: string; time?: string; staffId?: string };
    if (!body.date || !body.time) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 });
    }

    holdSlot(body.date, body.time, body.staffId);
    return NextResponse.json({ held: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sunucu hatası';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
