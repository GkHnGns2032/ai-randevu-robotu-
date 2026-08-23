import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { listAppointments } from '@/lib/airtable';
import { CLIENT_CONFIG } from '@/config/client';
import { logger } from '@/lib/logger';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// `?demo=1` okumak `request.url`e dokunuyor; bu, rotanın derleme anında
// STATİK üretilmesini imkânsız kılıyor ve `revalidate` ile birlikte build
// sırasında `Dynamic server usage` hatası basıyordu (derleme yeşil kalıyor,
// rota sessizce dinamiğe düşüyordu — yani ölçülmeyen bir kip değişikliği).
// Kip artık AÇIKÇA dinamik. Önbellek kaybolmuyor: yanıtın kendi
// `Cache-Control: s-maxage=1800` başlığı 30 dakikalık katmanı taşımaya
// devam ediyor. Zaten canlı Airtable okuyan bir uç için derleme-anı statik
// üretim de yanlıştı — build'deki veriyi servis ediyordu.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Panelin geri kalanı verisini `page.tsx`'ten prop olarak alır; bu uç ise
    // KENDİ verisini çekiyordu. Sonuç: `?demo=1` ile açılan panoda diğer tüm
    // görünümler örnek veriyi gösterirken Akıllı Analiz canlı (ve bu hafta boş)
    // tabana bakıyor, "%0 doluluk · ay sonu ₺0" basıyor ve modele "salon
    // tamamen boş" dedirtiyordu. Hesap mantığı TEK kalsın diye kopyalamak
    // yerine yalnız KAYNAK değiştiriliyor — iki ayrı hesap zamanla birbirinden
    // ayrılır ve hangisinin doğru olduğu bilinemez.
    const demo = new URL(request.url).searchParams.get('demo') === '1';
    const appointments = demo
      ? (await import('@/lib/demo-data')).buildDemoAppointments()
      : await listAppointments();
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
      if (!a.time) {
        logger.warn('insights_field_missing', { field: 'time', appointmentId: a.id });
        continue;
      }
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
    logger.error('insights_failed', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    const message = err instanceof Error ? err.message : 'Hata';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
