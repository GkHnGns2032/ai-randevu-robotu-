// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { APPOINTMENT_TOOLS, SYSTEM_PROMPT } from '@/lib/ai-tools';
import { getAvailableSlots, findNextAvailableSlots, createCalendarEvent } from '@/lib/calendar';
import { createAppointment } from '@/lib/airtable';
import { SERVICE_DURATIONS, ServiceType } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function executeTool(toolName: string, toolInput: Record<string, string>): Promise<string> {
  if (toolName === 'check_availability') {
    const service = toolInput.service as ServiceType;
    const duration = SERVICE_DURATIONS[service] ?? 60;
    const slots = await getAvailableSlots(toolInput.date, duration);
    const available = slots.filter((s) => s.available);

    if (available.length === 0) {
      return JSON.stringify({ available: false, message: 'Bu tarihte müsait saat bulunmuyor.' });
    }
    return JSON.stringify({ available: true, slots: available.map((s) => s.time) });
  }

  if (toolName === 'find_alternative_slots') {
    const service = toolInput.service as ServiceType;
    const duration = SERVICE_DURATIONS[service] ?? 60;
    const slots = await findNextAvailableSlots(toolInput.from_date, duration, 5);
    return JSON.stringify({ alternatives: slots });
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
  const { messages } = await req.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
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
        content: await executeTool(block.name, block.input as Record<string, string>),
      }))
    );

    anthropicMessages.push({ role: 'assistant', content: response.content });
    anthropicMessages.push({ role: 'user', content: toolResults });

    response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: APPOINTMENT_TOOLS,
      messages: anthropicMessages,
    });
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  return NextResponse.json({ message: textBlock?.text ?? '' });
}
