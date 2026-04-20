import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { listAppointments } from '@/lib/airtable';
import { CLIENT_CONFIG } from '@/config/client';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export const revalidate = 1800;

export async function GET() {
  try {
    const appointments = await listAppointments();
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');

    // Bu haftaki randevular
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const thisWeek = appointments.filter((a) => {
      const d = parseISO(a.date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });

    // Bu ayki randevular
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const thisMonth = appointments.filter((a) => {
      const d = parseISO(a.date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });

    // Geçmiş randevular (gerçekleşmiş)
    const past = appointments.filter((a) => a.date < today);

    // Haftalık doluluk oranı
    const { workingHours } = CLIENT_CONFIG;
    const workingDaysInWeek = workingHours.workingDays.filter(
      (d) => d >= weekStart.getDay() && d <= Math.min(now.getDay(), weekEnd.getDay())
    ).length || 1;
    const slotsPerDay = ((workingHours.end - workingHours.start) * 60) / workingHours.slotMinutes;
    const weeklyCapacity = workingDaysInWeek * slotsPerDay;
    const capacityRate = Math.min(100, Math.round((thisWeek.length / weeklyCapacity) * 100));

    // En popüler hizmet
    const serviceCounts: Record<string, number> = {};
    for (const a of past) {
      serviceCounts[a.service] = (serviceCounts[a.service] ?? 0) + 1;
    }
    const popularService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0] ?? ['—', 0];

    // En yoğun saatler
    const hourCounts: Record<string, number> = {};
    for (const a of past) {
      const hour = a.time.split(':')[0] + ':00';
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    }
    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ hour, count }));

    // Bu ay gerçekleşen gelir
    const monthRevenue = thisMonth
      .filter((a) => a.date <= today)
      .reduce((sum, a) => {
        const svc = CLIENT_CONFIG.services.find((s) => s.name === a.service);
        return sum + (svc?.price ?? 0);
      }, 0);

    // Ay sonu tahmini
    const dayOfMonth = now.getDate();
    const daysInMonth = monthEnd.getDate();
    const projectedRevenue = dayOfMonth > 0
      ? Math.round((monthRevenue / dayOfMonth) * daysInMonth)
      : 0;

    // Yaklaşan randevular özeti (Claude için)
    const upcomingStr = appointments
      .filter((a) => a.date >= today)
      .slice(0, 10)
      .map((a) => `${a.date} ${a.time} — ${a.service}`)
      .join('\n');

    const statsStr = `
- Bu hafta ${thisWeek.length} randevu, doluluk %${capacityRate}
- Bu ay ${monthRevenue.toLocaleString('tr-TR')} ₺ gelir, tahmini ay sonu: ${projectedRevenue.toLocaleString('tr-TR')} ₺
- En popüler hizmet: ${popularService[0]} (${popularService[1]} randevu)
- En yoğun saatler: ${peakHours.map((h) => h.hour).join(', ')}
- Yaklaşan randevular:\n${upcomingStr || 'Yok'}
    `.trim();

    // Claude'dan öneri
    const aiResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Sen ${CLIENT_CONFIG.businessName} için akıllı bir iş danışmanısın. Aşağıdaki verilere bakarak 2-3 cümlelik, pratik ve özgün bir öneri yaz. Türkçe, samimi, doğrudan. Tekrar eden jenerik öneriler verme.

${statsStr}`,
      }],
    });

    const recommendation = aiResponse.content.find((b) => b.type === 'text')?.text ?? '';

    return NextResponse.json({
      capacityRate,
      popularService: { name: popularService[0], count: Number(popularService[1]) },
      peakHours,
      monthRevenue,
      projectedRevenue,
      thisWeekCount: thisWeek.length,
      thisMonthCount: thisMonth.length,
      recommendation,
      generatedAt: now.toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Hata';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
