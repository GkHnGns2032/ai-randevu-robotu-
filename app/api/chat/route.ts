// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { APPOINTMENT_TOOLS, SYSTEM_PROMPT } from '@/lib/ai-tools';
import { getAvailableSlots, findNextAvailableSlots, createCalendarEvent } from '@/lib/calendar';
import { createAppointment } from '@/lib/airtable';
import { SERVICE_DURATIONS, ServiceType } from '@/lib/types';

// I3 — Env var guard at module level
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set');
}

// M1 — Model constant
const MODEL = 'claude-haiku-4-5' as const;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function executeTool(toolName: string, toolInput: Record<string, string>): Promise<string> {
  // I2 — try/catch for check_availability
  if (toolName === 'check_availability') {
    try {
      const service = toolInput.service as ServiceType;
      const duration = SERVICE_DURATIONS[service] ?? 60;
      const slots = await getAvailableSlots(toolInput.date, duration);
      const available = slots.filter((s) => s.available);

      if (available.length === 0) {
        return JSON.stringify({ available: false, message: 'Bu tarihte müsait saat bulunmuyor.' });
      }
      return JSON.stringify({ available: true, slots: available.map((s) => s.time) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Müsaitlik kontrol edilemedi';
      return JSON.stringify({ available: false, error: message });
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
    try {
      const service = toolInput.service as ServiceType;
      const duration = SERVICE_DURATIONS[service] ?? 60;

      const eventId = await createCalendarEvent({
        summary: `${toolInput.service} - ${toolInput.customer_name}`,
        description: `Müşteri: ${toolInput.customer_name}\nTel: ${toolInput.customer_phone}\n${toolInput.notes ?? ''}`,
        date: toolInput.date,
        time: toolInput.time,
        durationMinutes: duration,
        attendeePhone: toolInput.customer_phone,
      });

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

      return JSON.stringify({ success: true, appointmentId: appointment.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Randevu oluşturulamadı';
      return JSON.stringify({ success: false, error: message });
    }
  }

  return JSON.stringify({ error: 'Bilinmeyen araç' });
}

export async function POST(req: NextRequest) {
  // C1 — Wrap entire handler body in try/catch
  try {
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

    let response = await client.messages.create({
      model: MODEL, // M1
      max_tokens: 2048, // I4
      system: SYSTEM_PROMPT,
      tools: APPOINTMENT_TOOLS,
      messages: anthropicMessages,
    });

    // Tool use döngüsü
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      );

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => ({
          type: 'tool_result' as const,
          tool_use_id: block.id,
          // I1 — Safe cast via Object.entries
          content: await executeTool(
            block.name,
            Object.fromEntries(
              Object.entries(block.input as Record<string, unknown>).map(([k, v]) => [k, String(v)])
            )
          ),
        }))
      );

      anthropicMessages.push({ role: 'assistant', content: response.content });
      anthropicMessages.push({ role: 'user', content: toolResults });

      response = await client.messages.create({
        model: MODEL, // M1
        max_tokens: 2048, // I4
        system: SYSTEM_PROMPT,
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
