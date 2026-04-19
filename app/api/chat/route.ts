// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { APPOINTMENT_TOOLS, SYSTEM_PROMPT } from '@/lib/ai-tools';
import { getAvailableSlots, findNextAvailableSlots, createCalendarEvent, deleteCalendarEvent } from '@/lib/calendar';
import { createAppointment, findAppointmentsByPhone, cancelAppointment, rescheduleAppointment } from '@/lib/airtable';
import { sendSMS, buildConfirmationMessage } from '@/lib/sms';
import { isSlotStillAvailable } from '@/lib/booking-lock';
import { rateLimit } from '@/lib/rate-limit';
import { SERVICE_DURATIONS, ServiceType } from '@/lib/types';

// I3 — Env var guard at module level
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set');
}

// M1 — Model constant
const MODEL = 'claude-sonnet-4-6' as const;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function executeTool(toolName: string, toolInput: Record<string, string>): Promise<string> {
  // I2 — try/catch for check_availability
  if (toolName === 'check_availability') {
    try {
      const service = toolInput.service as ServiceType;
      const duration = SERVICE_DURATIONS[service] ?? 60;
      const slots = await getAvailableSlots(toolInput.date, duration);
      const available = slots.filter((s) => s.available);

      const slotList = available.map((s) => s.time);
      const requestedTime = toolInput.requested_time;

      // Müşteri spesifik saat istediyse — net yanıt ver
      if (requestedTime) {
        const isAvailable = slotList.includes(requestedTime);
        if (!isAvailable) {
          const suggestions = slotList.slice(0, 4).join(', ');
          return JSON.stringify({
            requested_time_available: false,
            message: `${requestedTime} saati bu hizmet için müsait değil (başka randevuyla çakışıyor veya çalışma saati dışı). Müşteriye bunu söyle ve şu müsait saatleri öner: ${suggestions || 'Bu gün için uygun saat kalmadı'}.`,
          });
        }
        return JSON.stringify({
          requested_time_available: true,
          message: `${requestedTime} saati müsait. Randevu için adı ve telefonu al, sonra book_appointment çağır.`,
        });
      }

      // Saat belirtilmemişse müsait slotları listele
      if (slotList.length === 0) {
        return JSON.stringify({ available: false, message: 'Bu tarihte müsait saat yok. find_alternative_slots çağır.' });
      }
      return JSON.stringify({ available: true, slots: slotList });
    } catch (err) {
      console.error('[check_availability] Calendar error:', err);
      return JSON.stringify({
        available: false,
        slots: [],
        message: 'Takvim şu an kontrol edilemiyor. Müşteriye hangi saati istediğini sor, randevuyu yine de oluştur.',
      });
    }
  }

  // I2 — try/catch for find_alternative_slots
  if (toolName === 'find_alternative_slots') {
    try {
      const service = toolInput.service as ServiceType;
      const duration = SERVICE_DURATIONS[service] ?? 60;
      const slots = await findNextAvailableSlots(toolInput.from_date, duration, 5);
      return JSON.stringify({ alternatives: slots });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Alternatif slotlar bulunamadı';
      return JSON.stringify({ alternatives: [], error: message });
    }
  }

  if (toolName === 'book_appointment') {
    const service = toolInput.service as ServiceType;
    const duration = SERVICE_DURATIONS[service] ?? 60;

    // Race condition double-check — slot hâlâ boş mu?
    try {
      const stillFree = await isSlotStillAvailable(toolInput.date, toolInput.time, duration);
      if (!stillFree) {
        return JSON.stringify({
          success: false,
          error: 'conflict',
          message: 'Üzgünüm, bu slot biraz önce başka biri tarafından alındı. Lütfen başka bir saat seçin.',
        });
      }
    } catch (lockErr) {
      console.error('[book_appointment] Slot doğrulama hatası (devam ediliyor):', lockErr);
    }

    // Google Calendar — hata olsa bile devam et
    let eventId: string | undefined;
    try {
      eventId = await createCalendarEvent({
        summary: `${toolInput.service} - ${toolInput.customer_name}`,
        description: `Müşteri: ${toolInput.customer_name}\nTel: ${toolInput.customer_phone}\n${toolInput.notes ?? ''}`,
        date: toolInput.date,
        time: toolInput.time,
        durationMinutes: duration,
        attendeePhone: toolInput.customer_phone,
      });
    } catch (calErr) {
      console.error('[book_appointment] Google Calendar error (devam ediliyor):', calErr);
    }

    // Airtable kaydı — bu kritik
    try {
      const appointment = await createAppointment({
        customerName: toolInput.customer_name,
        customerPhone: toolInput.customer_phone,
        service,
        date: toolInput.date,
        time: toolInput.time,
        durationMinutes: duration,
        status: 'confirmed',
        notes: toolInput.notes,
        googleCalendarEventId: eventId,
      });
      try {
        await sendSMS(
          toolInput.customer_phone,
          buildConfirmationMessage({
            customerName: toolInput.customer_name,
            service,
            date: toolInput.date,
            time: toolInput.time,
          })
        );
      } catch (smsErr) {
        console.error('[book_appointment] SMS onay gönderilemedi (devam):', smsErr);
      }
      return JSON.stringify({ success: true, appointmentId: appointment.id });
    } catch (err) {
      console.error('[book_appointment] Airtable error:', err);
      const message = err instanceof Error ? err.message : 'Randevu kaydedilemedi';
      return JSON.stringify({ success: false, error: message });
    }
  }

  if (toolName === 'find_appointment') {
    try {
      const appointments = await findAppointmentsByPhone(toolInput.customer_phone);
      if (appointments.length === 0) {
        return JSON.stringify({ found: false, message: 'Bu telefon numarasına kayıtlı aktif randevu bulunamadı.' });
      }
      const list = appointments.map((a) => ({
        id: a.id,
        date: a.date,
        time: a.time,
        service: a.service,
        googleCalendarEventId: (a as unknown as Record<string, string>).googleCalendarEventId ?? '',
      }));
      return JSON.stringify({ found: true, appointments: list });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Randevu aranamadı';
      return JSON.stringify({ found: false, error: message });
    }
  }

  if (toolName === 'cancel_appointment') {
    try {
      await cancelAppointment(toolInput.appointment_id);
      if (toolInput.google_calendar_event_id) {
        try { await deleteCalendarEvent(toolInput.google_calendar_event_id); } catch { /* ignore */ }
      }
      return JSON.stringify({ success: true, message: 'Randevu iptal edildi.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'İptal edilemedi';
      return JSON.stringify({ success: false, error: message });
    }
  }

  if (toolName === 'reschedule_appointment') {
    const service = toolInput.service as ServiceType;
    const duration = SERVICE_DURATIONS[service] ?? 60;

    // Race condition double-check — yeni slot hâlâ boş mu? (mevcut randevu hariç)
    try {
      const stillFree = await isSlotStillAvailable(
        toolInput.new_date,
        toolInput.new_time,
        duration,
        toolInput.appointment_id,
      );
      if (!stillFree) {
        return JSON.stringify({
          success: false,
          error: 'conflict',
          message: 'Üzgünüm, seçtiğiniz yeni saat biraz önce başka biri tarafından alındı. Lütfen başka bir saat seçin.',
        });
      }
    } catch (lockErr) {
      console.error('[reschedule_appointment] Slot doğrulama hatası (devam ediliyor):', lockErr);
    }

    let newEventId: string | undefined;
    try {
      if (toolInput.old_google_calendar_event_id) {
        try { await deleteCalendarEvent(toolInput.old_google_calendar_event_id); } catch { /* ignore */ }
      }
      newEventId = await createCalendarEvent({
        summary: `${service} - Randevu`,
        description: 'Yeniden zamanlandı',
        date: toolInput.new_date,
        time: toolInput.new_time,
        durationMinutes: duration,
        attendeePhone: '',
      });
    } catch { /* calendar hatası kritik değil */ }

    try {
      const updated = await rescheduleAppointment(
        toolInput.appointment_id,
        toolInput.new_date,
        toolInput.new_time,
        newEventId,
      );
      return JSON.stringify({ success: true, appointment: { date: updated.date, time: updated.time, service: updated.service } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Değişiklik yapılamadı';
      return JSON.stringify({ success: false, error: message });
    }
  }

  return JSON.stringify({ error: 'Bilinmeyen araç' });
}

export async function POST(req: NextRequest) {
  // C1 — Wrap entire handler body in try/catch
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = rateLimit(`chat:${ip}`, 20, 60_000); // 20 req/dk
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Çok fazla istek. 1 dakika sonra tekrar deneyin.' }, { status: 429 });
    }

    const { messages } = await req.json() as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    // C2 — Validate messages input
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const systemWithDate = `${SYSTEM_PROMPT}\n\nBugünün tarihi: ${today}. Bundan önceki herhangi bir tarihe randevu oluşturma — müşteriye bugün veya sonrası için tarih belirlemesini söyle.`;

    let response = await client.messages.create({
      model: MODEL, // M1
      max_tokens: 2048, // I4
      system: systemWithDate,
      tools: APPOINTMENT_TOOLS,
      messages: anthropicMessages,
    });

    // Tool use döngüsü
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      );

const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          const input = Object.fromEntries(
            Object.entries(block.input as Record<string, unknown>).map(([k, v]) => [k, String(v)])
          );
          const result = await executeTool(block.name, input);
          return { type: 'tool_result' as const, tool_use_id: block.id, content: result };
        })
      );

      anthropicMessages.push({ role: 'assistant', content: response.content });
      anthropicMessages.push({ role: 'user', content: toolResults });

      response = await client.messages.create({
        model: MODEL, // M1
        max_tokens: 2048, // I4
        system: systemWithDate,
        tools: APPOINTMENT_TOOLS,
        messages: anthropicMessages,
      });
    }

    // I4 — Handle max_tokens stop reason
    if (response.stop_reason === 'max_tokens') {
      return NextResponse.json({ message: 'Yanıt çok uzun oldu, lütfen tekrar deneyin.' });
    }

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    return NextResponse.json({ message: textBlock?.text ?? '' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sunucu hatası';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
