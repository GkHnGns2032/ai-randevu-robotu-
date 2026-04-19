# AI Randevu Robotu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Güzellik salonu için müşterilerin doğal dille randevu alabileceği, Google Calendar ile senkronize çalışan, Airtable'a kaydeden ve premium admin dashboard sunan AI randevu robotu inşa etmek.

**Architecture:** Next.js App Router üzerinde çalışan full-stack uygulama; müşteri tarafı Claude AI destekli chat arayüzü, admin tarafı premium dashboard. Claude tool-use ile Google Calendar'ı kontrol eder, uygun slot yoksa alternatif önerir, tüm randevular Airtable'a kaydedilir.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Claude API (claude-haiku-4-5 — maliyet optimizasyonu) with Tool Use, Airtable REST API, Google Calendar API, Vercel deployment, Clerk Auth (dashboard koruması için)

---

## Dosya Yapısı

```
/
├── app/
│   ├── layout.tsx                        # Root layout (font, global styles)
│   ├── page.tsx                          # Müşteri chatbot landing page
│   ├── dashboard/
│   │   ├── layout.tsx                    # Dashboard layout (Clerk auth guard)
│   │   └── page.tsx                      # Ana dashboard sayfası
│   └── api/
│       ├── chat/route.ts                 # Claude AI chat endpoint (tool execution)
│       └── appointments/route.ts         # GET /appointments (dashboard için)
├── lib/
│   ├── types.ts                          # Paylaşılan TypeScript tipleri
│   ├── airtable.ts                       # Airtable client + CRUD
│   ├── calendar.ts                       # Google Calendar client + availability
│   └── ai-tools.ts                       # Claude tool definitions
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx             # Ana chat UI container
│   │   ├── MessageBubble.tsx             # Tek mesaj balonu
│   │   └── ChatInput.tsx                 # Input + gönder butonu
│   └── dashboard/
│       ├── StatsOverview.tsx             # KPI kartları (bugün/hafta/ay)
│       ├── AppointmentTable.tsx          # Randevu listesi tablosu
│       └── AppointmentCalendar.tsx       # Haftalık takvim görünümü
├── .env.local                            # API anahtarları (git'e eklenmez)
└── package.json
```

---

## Task 1: Proje Kurulumu

**Files:**
- Create: `package.json`, `app/layout.tsx`, `app/page.tsx` (scaffold)
- Create: `.env.local`
- Create: `tailwind.config.ts`, `tsconfig.json`

- [ ] **Step 1: Next.js projesi oluştur**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-git
```

Expected output: "Success! Created project at ..."

- [ ] **Step 2: Gerekli bağımlılıkları yükle**

```bash
npm install @anthropic-ai/sdk airtable googleapis @clerk/nextjs \
  @radix-ui/react-dialog @radix-ui/react-scroll-area \
  date-fns lucide-react clsx tailwind-merge
npx shadcn@latest init --defaults
npx shadcn@latest add card badge button input table scroll-area avatar skeleton
```

- [ ] **Step 3: .env.local dosyasını oluştur**

```bash
cat > .env.local << 'EOF'
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Airtable
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
AIRTABLE_TABLE_NAME=Randevular

# Google Calendar
GOOGLE_CLIENT_EMAIL=...@...iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GOOGLE_CALENDAR_ID=primary

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
EOF
```

- [ ] **Step 4: Projenin çalıştığını doğrula**

```bash
npm run dev
```

Expected: "Ready in Xs" — tarayıcıda `http://localhost:3000` açılabilmeli.

- [ ] **Step 5: Commit**

```bash
git init
git add .
git commit -m "chore: initial Next.js project setup with dependencies"
```

---

## Task 2: Tipler ve Sabitler

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Tip dosyasını oluştur**

```typescript
// lib/types.ts

export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled';

export type ServiceType =
  | 'Saç Kesimi'
  | 'Saç Boyama'
  | 'Manikür'
  | 'Pedikür'
  | 'Kaş Tasarımı'
  | 'Cilt Bakımı'
  | 'Masaj'
  | 'Kalıcı Makyaj';

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  service: ServiceType;
  date: string;        // ISO 8601: "2026-04-20"
  time: string;        // "14:30"
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;   // ISO 8601 datetime
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TimeSlot {
  date: string;   // "2026-04-20"
  time: string;   // "14:30"
  available: boolean;
}

export const SERVICE_DURATIONS: Record<ServiceType, number> = {
  'Saç Kesimi': 45,
  'Saç Boyama': 120,
  'Manikür': 60,
  'Pedikür': 60,
  'Kaş Tasarımı': 30,
  'Cilt Bakımı': 90,
  'Masaj': 60,
  'Kalıcı Makyaj': 120,
};

export const WORKING_HOURS = {
  start: 9,   // 09:00
  end: 19,    // 19:00
  slotMinutes: 30,
};
```

- [ ] **Step 2: TypeScript derleme hatası olmadığını doğrula**

```bash
npx tsc --noEmit
```

Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared TypeScript types and constants"
```

---

## Task 3: Airtable Entegrasyonu

**Files:**
- Create: `lib/airtable.ts`

Airtable'da "Randevular" tablosunu şu kolonlarla oluştur (Airtable UI'den manuel):
- `customerName` (Single line text)
- `customerPhone` (Phone number)
- `service` (Single line text)
- `date` (Date)
- `time` (Single line text)
- `durationMinutes` (Number)
- `status` (Single select: confirmed, pending, cancelled)
- `notes` (Long text)
- `createdAt` (Created time)
- `googleCalendarEventId` (Single line text)

- [ ] **Step 1: Airtable client'ı yaz**

```typescript
// lib/airtable.ts
import Airtable from 'airtable';
import { Appointment, ServiceType, AppointmentStatus } from './types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! })
  .base(process.env.AIRTABLE_BASE_ID!);

const table = base(process.env.AIRTABLE_TABLE_NAME!);

function recordToAppointment(record: Airtable.Record<Airtable.FieldSet>): Appointment {
  const f = record.fields as Record<string, unknown>;
  return {
    id: record.id,
    customerName: f.customerName as string,
    customerPhone: f.customerPhone as string,
    service: f.service as ServiceType,
    date: f.date as string,
    time: f.time as string,
    durationMinutes: f.durationMinutes as number,
    status: f.status as AppointmentStatus,
    notes: f.notes as string | undefined,
    createdAt: f.createdAt as string,
  };
}

export async function createAppointment(
  data: Omit<Appointment, 'id' | 'createdAt'> & { googleCalendarEventId?: string }
): Promise<Appointment> {
  const record = await table.create({
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    service: data.service,
    date: data.date,
    time: data.time,
    durationMinutes: data.durationMinutes,
    status: data.status,
    notes: data.notes ?? '',
    googleCalendarEventId: data.googleCalendarEventId ?? '',
  });
  return recordToAppointment(record);
}

export async function listAppointments(options?: {
  fromDate?: string;
  toDate?: string;
  status?: AppointmentStatus;
}): Promise<Appointment[]> {
  const filterParts: string[] = [];

  if (options?.fromDate) {
    filterParts.push(`IS_AFTER({date}, "${options.fromDate}")`);
  }
  if (options?.toDate) {
    filterParts.push(`IS_BEFORE({date}, "${options.toDate}")`);
  }
  if (options?.status) {
    filterParts.push(`{status} = "${options.status}"`);
  }

  const filterByFormula =
    filterParts.length > 0
      ? filterParts.length === 1
        ? filterParts[0]
        : `AND(${filterParts.join(',')})`
      : '';

  const records = await table
    .select({
      sort: [{ field: 'date', direction: 'asc' }, { field: 'time', direction: 'asc' }],
      ...(filterByFormula ? { filterByFormula } : {}),
    })
    .all();

  return records.map(recordToAppointment);
}

export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  const records = await table
    .select({
      filterByFormula: `{date} = "${date}"`,
      sort: [{ field: 'time', direction: 'asc' }],
    })
    .all();
  return records.map(recordToAppointment);
}
```

- [ ] **Step 2: TypeScript hatası olmadığını doğrula**

```bash
npx tsc --noEmit
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add lib/airtable.ts
git commit -m "feat: add Airtable client with CRUD operations"
```

---

## Task 4: Google Calendar Entegrasyonu

**Files:**
- Create: `lib/calendar.ts`

> Not: Google Calendar için Service Account kullanılır. Google Cloud Console'dan:
> 1. Proje oluştur → APIs & Services → Enable Google Calendar API
> 2. IAM & Admin → Service Accounts → Create → JSON key indir
> 3. Google Calendar'da takvimi service account email'i ile paylaş (Make changes to events izni)

- [ ] **Step 1: Calendar client'ı yaz**

```typescript
// lib/calendar.ts
import { google } from 'googleapis';
import { format, addMinutes, parse, isWithinInterval, parseISO } from 'date-fns';
import { TimeSlot, WORKING_HOURS } from './types';

function getCalendarClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL!,
    key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

export async function getAvailableSlots(
  date: string,
  durationMinutes: number
): Promise<TimeSlot[]> {
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const dayStart = new Date(`${date}T0${WORKING_HOURS.start}:00:00`);
  const dayEnd = new Date(`${date}T${WORKING_HOURS.end}:00:00`);

  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busyPeriods = data.calendars?.[calendarId]?.busy ?? [];

  const slots: TimeSlot[] = [];
  let cursor = dayStart;

  while (addMinutes(cursor, durationMinutes) <= dayEnd) {
    const slotEnd = addMinutes(cursor, durationMinutes);
    const isBlocked = busyPeriods.some((busy) => {
      const busyStart = parseISO(busy.start!);
      const busyEnd = parseISO(busy.end!);
      return cursor < busyEnd && slotEnd > busyStart;
    });

    slots.push({
      date,
      time: format(cursor, 'HH:mm'),
      available: !isBlocked,
    });

    cursor = addMinutes(cursor, WORKING_HOURS.slotMinutes);
  }

  return slots;
}

export async function findNextAvailableSlots(
  fromDate: string,
  durationMinutes: number,
  count = 3
): Promise<TimeSlot[]> {
  const results: TimeSlot[] = [];
  let checkDate = new Date(fromDate);

  while (results.length < count) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    const dayOfWeek = checkDate.getDay();

    // Skip Sundays (0)
    if (dayOfWeek !== 0) {
      const slots = await getAvailableSlots(dateStr, durationMinutes);
      const available = slots.filter((s) => s.available);
      results.push(...available.slice(0, count - results.length));
    }

    checkDate = addMinutes(checkDate, 24 * 60);
    if (results.length >= count) break;
  }

  return results;
}

export async function createCalendarEvent(params: {
  summary: string;
  description: string;
  date: string;
  time: string;
  durationMinutes: number;
  attendeePhone: string;
}): Promise<string> {
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const startDateTime = new Date(`${params.date}T${params.time}:00`);
  const endDateTime = addMinutes(startDateTime, params.durationMinutes);

  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: { dateTime: startDateTime.toISOString(), timeZone: 'Europe/Istanbul' },
      end: { dateTime: endDateTime.toISOString(), timeZone: 'Europe/Istanbul' },
    },
  });

  return data.id!;
}
```

- [ ] **Step 2: TypeScript hatası olmadığını doğrula**

```bash
npx tsc --noEmit
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add lib/calendar.ts
git commit -m "feat: add Google Calendar client with availability checking and event creation"
```

---

## Task 5: Claude AI Tool Tanımları

**Files:**
- Create: `lib/ai-tools.ts`

- [ ] **Step 1: Tool tanımlarını yaz**

```typescript
// lib/ai-tools.ts
import Anthropic from '@anthropic-ai/sdk';

export const APPOINTMENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'check_availability',
    description:
      'Belirli bir tarih ve hizmet için müsait randevu saatlerini kontrol eder. Müşteri tarih istediğinde önce bunu çağır.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'ISO 8601 tarih formatı: YYYY-MM-DD (örnek: 2026-04-20)',
        },
        service: {
          type: 'string',
          description:
            'Hizmet adı. Geçerli değerler: Saç Kesimi, Saç Boyama, Manikür, Pedikür, Kaş Tasarımı, Cilt Bakımı, Masaj, Kalıcı Makyaj',
        },
      },
      required: ['date', 'service'],
    },
  },
  {
    name: 'find_alternative_slots',
    description:
      'İstenen tarih müsait değilse veya belirli bir tarihten itibaren en yakın müsait slotları bulur. En az 3 alternatif döndürür.',
    input_schema: {
      type: 'object' as const,
      properties: {
        from_date: {
          type: 'string',
          description: 'Arama başlangıç tarihi: YYYY-MM-DD',
        },
        service: {
          type: 'string',
          description: 'Hizmet adı',
        },
      },
      required: ['from_date', 'service'],
    },
  },
  {
    name: 'book_appointment',
    description:
      'Randevuyu kesinleştirir. Müşteri adı, telefon, hizmet, tarih ve saat onaylandıktan sonra çağır.',
    input_schema: {
      type: 'object' as const,
      properties: {
        customer_name: { type: 'string', description: 'Müşterinin adı soyadı' },
        customer_phone: { type: 'string', description: 'Telefon numarası (5XX XXX XX XX)' },
        service: { type: 'string', description: 'Hizmet adı' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        time: { type: 'string', description: 'HH:MM (örnek: 14:30)' },
        notes: { type: 'string', description: 'Ek notlar (opsiyonel)' },
      },
      required: ['customer_name', 'customer_phone', 'service', 'date', 'time'],
    },
  },
];

export const SYSTEM_PROMPT = `Sen "Bella Güzellik Salonu"nun yapay zeka randevu asistanısın. Adın Bella.

Görevin:
1. Müşterileri sıcak ve profesyonel karşıla
2. Hangi hizmeti istediğini öğren
3. Tercih ettikleri tarih ve saati sor
4. check_availability aracıyla uygunluğu kontrol et
5. Uygunsa randevuyu onayla ve book_appointment ile kaydet
6. Uygun değilse find_alternative_slots ile alternatifler sun
7. Randevu onaylandığında tüm detayları özetle

Sunduğumuz hizmetler ve süreler:
- Saç Kesimi (45 dk)
- Saç Boyama (120 dk)
- Manikür (60 dk)
- Pedikür (60 dk)
- Kaş Tasarımı (30 dk)
- Cilt Bakımı (90 dk)
- Masaj (60 dk)
- Kalıcı Makyaj (120 dk)

Çalışma saatlerimiz: Pazartesi-Cumartesi 09:00-19:00

Kurallar:
- Her zaman Türkçe konuş
- Empati kur, samimi ol
- Telefon numarasını ve adı randevu öncesi mutlaka al
- Tarihi onaylamadan önce müsaitliği kontrol et
- Randevu onayında: tarih, saat, hizmet ve süreyi tekrar et`;
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai-tools.ts
git commit -m "feat: add Claude AI tool definitions and system prompt"
```

---

## Task 6: Chat API Route

**Files:**
- Create: `app/api/chat/route.ts`

- [ ] **Step 1: Chat API route'unu yaz**

```typescript
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
    const toolUseBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    )!;

    const toolResult = await executeTool(
      toolUseBlock.name,
      toolUseBlock.input as Record<string, string>
    );

    anthropicMessages.push({ role: 'assistant', content: response.content });
    anthropicMessages.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: toolUseBlock.id, content: toolResult }],
    });

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
```

- [ ] **Step 2: TypeScript hatası olmadığını doğrula**

```bash
npx tsc --noEmit
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat: add AI chat API route with tool execution loop"
```

---

## Task 7: Appointments API Route (Dashboard için)

**Files:**
- Create: `app/api/appointments/route.ts`

- [ ] **Step 1: Appointments route'unu yaz**

```typescript
// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listAppointments } from '@/lib/airtable';
import { AppointmentStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromDate = searchParams.get('from') ?? undefined;
  const toDate = searchParams.get('to') ?? undefined;
  const status = searchParams.get('status') as AppointmentStatus | undefined;

  const appointments = await listAppointments({ fromDate, toDate, status });
  return NextResponse.json({ appointments });
}
```

- [ ] **Step 2: TypeScript hatası olmadığını doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/api/appointments/route.ts
git commit -m "feat: add appointments GET endpoint with auth guard"
```

---

## Task 8: Chat UI Bileşenleri

**Files:**
- Create: `components/chat/MessageBubble.tsx`
- Create: `components/chat/ChatInput.tsx`
- Create: `components/chat/ChatInterface.tsx`

- [ ] **Step 1: MessageBubble bileşenini yaz**

```tsx
// components/chat/MessageBubble.tsx
'use client';
import { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          B
        </div>
      )}
      <div
        className={cn(
          'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-br-sm'
            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={cn('text-xs mt-1 opacity-60', isUser ? 'text-right' : 'text-left')}>
          {format(message.timestamp, 'HH:mm', { locale: tr })}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ChatInput bileşenini yaz**

```tsx
// components/chat/ChatInput.tsx
'use client';
import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex gap-2 p-4 bg-white border-t border-gray-100">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Mesajınızı yazın..."
        disabled={disabled}
        className="flex-1 rounded-full border-gray-200 focus-visible:ring-rose-400"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        size="icon"
        className="rounded-full bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
      >
        <Send size={16} />
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: ChatInterface bileşenini yaz**

```tsx
// components/chat/ChatInterface.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    'Merhaba! Ben Bella, Bella Güzellik Salonu\'nun randevu asistanıyım. 💇‍♀️\n\nSize nasıl yardımcı olabilirim? Hangi hizmetimizden yararlanmak istersiniz?',
  timestamp: new Date(),
};

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(text: string) {
    const userMessage: ChatMessage = { role: 'user', content: text, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages
            .filter((m) => m !== INITIAL_MESSAGE)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json() as { message: string };
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Bir hata oluştu. Lütfen tekrar deneyin.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ScrollArea className="flex-1 px-4 py-6">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {loading && (
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
              B
            </div>
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </ScrollArea>
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
```

- [ ] **Step 4: TypeScript hatası olmadığını doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add components/chat/
git commit -m "feat: add chat UI components (MessageBubble, ChatInput, ChatInterface)"
```

---

## Task 9: Dashboard Bileşenleri

**Files:**
- Create: `components/dashboard/StatsOverview.tsx`
- Create: `components/dashboard/AppointmentTable.tsx`
- Create: `components/dashboard/AppointmentCalendar.tsx`

- [ ] **Step 1: StatsOverview bileşenini yaz**

```tsx
// components/dashboard/StatsOverview.tsx
import { Appointment } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';

interface Props {
  appointments: Appointment[];
}

export function StatsOverview({ appointments }: Props) {
  const confirmed = appointments.filter((a) => a.status === 'confirmed');
  const todayCount = confirmed.filter((a) => isToday(new Date(a.date))).length;
  const weekCount = confirmed.filter((a) => isThisWeek(new Date(a.date))).length;
  const monthCount = confirmed.filter((a) => isThisMonth(new Date(a.date))).length;
  const totalCount = confirmed.length;

  const stats = [
    { label: 'Bugün', value: todayCount, icon: Clock, color: 'from-rose-500 to-pink-600' },
    { label: 'Bu Hafta', value: weekCount, icon: Calendar, color: 'from-purple-500 to-indigo-600' },
    { label: 'Bu Ay', value: monthCount, icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
    { label: 'Toplam', value: totalCount, icon: Users, color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className={`bg-gradient-to-br ${stat.color} p-4 text-white`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium opacity-90">{stat.label}</span>
                <stat.icon size={18} className="opacity-80" />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-xs opacity-75 mt-1">Onaylanmış randevu</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: AppointmentTable bileşenini yaz**

```tsx
// components/dashboard/AppointmentTable.tsx
import { Appointment } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Props {
  appointments: Appointment[];
}

const STATUS_CONFIG = {
  confirmed: { label: 'Onaylandı', variant: 'default' as const, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pending: { label: 'Bekliyor', variant: 'secondary' as const, className: 'bg-amber-100 text-amber-700 border-amber-200' },
  cancelled: { label: 'İptal', variant: 'destructive' as const, className: 'bg-red-100 text-red-700 border-red-200' },
};

export function AppointmentTable({ appointments }: Props) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">Henüz randevu bulunmuyor</p>
        <p className="text-sm mt-1">Randevular burada görünecek</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['Müşteri', 'Hizmet', 'Tarih', 'Saat', 'Süre', 'Durum'].map((h) => (
              <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => {
            const cfg = STATUS_CONFIG[appt.status];
            return (
              <tr key={appt.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{appt.customerName}</p>
                  <p className="text-xs text-gray-400">{appt.customerPhone}</p>
                </td>
                <td className="py-3 px-4 text-gray-700">{appt.service}</td>
                <td className="py-3 px-4 text-gray-700">
                  {format(new Date(appt.date), 'd MMMM yyyy', { locale: tr })}
                </td>
                <td className="py-3 px-4 text-gray-700">{appt.time}</td>
                <td className="py-3 px-4 text-gray-500">{appt.durationMinutes} dk</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
                    {cfg.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: AppointmentCalendar bileşenini yaz**

```tsx
// components/dashboard/AppointmentCalendar.tsx
import { Appointment } from '@/lib/types';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Props {
  appointments: Appointment[];
  weekStart?: Date;
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9-18

export function AppointmentCalendar({ appointments, weekStart = new Date() }: Props) {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 });
  const days = Array.from({ length: 6 }, (_, i) => addDays(start, i)); // Mon-Sat

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          <div className="text-xs text-gray-400 py-2" />
          {days.map((day) => (
            <div key={day.toISOString()} className="text-center py-2">
              <p className="text-xs text-gray-400 uppercase">{format(day, 'EEE', { locale: tr })}</p>
              <p className={`text-sm font-semibold mt-0.5 ${isSameDay(day, new Date()) ? 'text-rose-600' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        {/* Time grid */}
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-7 gap-1 min-h-[48px] border-t border-gray-50">
            <div className="text-xs text-gray-300 py-1 pr-2 text-right">{hour}:00</div>
            {days.map((day) => {
              const appts = appointments.filter((a) => {
                if (!isSameDay(new Date(a.date), day)) return false;
                const apptHour = parseInt(a.time.split(':')[0]);
                return apptHour === hour;
              });
              return (
                <div key={day.toISOString()} className="relative">
                  {appts.map((a) => (
                    <div
                      key={a.id}
                      className="absolute inset-x-0 top-0.5 mx-0.5 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded text-xs p-1 leading-tight truncate"
                      style={{ height: `${(a.durationMinutes / 60) * 48 - 4}px` }}
                    >
                      <p className="font-medium truncate">{a.customerName}</p>
                      <p className="opacity-80 truncate">{a.service}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: TypeScript hatası olmadığını doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/
git commit -m "feat: add dashboard components (StatsOverview, AppointmentTable, AppointmentCalendar)"
```

---

## Task 10: Dashboard Sayfası

**Files:**
- Create: `app/dashboard/layout.tsx`
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Dashboard layout'unu yaz (Clerk auth guard)**

```tsx
// app/dashboard/layout.tsx
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider>
  );
}
```

- [ ] **Step 2: Dashboard page'i yaz**

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { listAppointments } from '@/lib/airtable';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { AppointmentTable } from '@/components/dashboard/AppointmentTable';
import { AppointmentCalendar } from '@/components/dashboard/AppointmentCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserButton } from '@clerk/nextjs';
import { Scissors } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function DashboardContent() {
  const appointments = await listAppointments();

  return (
    <div className="space-y-6">
      <StatsOverview appointments={appointments} />

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Haftalık Takvim</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentCalendar appointments={appointments} />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Tüm Randevular</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <AppointmentTable appointments={appointments} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Scissors size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Bella Güzellik</p>
              <p className="text-xs text-gray-400">Admin Dashboard</p>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="text-gray-400 text-sm">Yükleniyor...</div>}>
          <DashboardContent />
        </Suspense>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript hatası olmadığını doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/
git commit -m "feat: add premium admin dashboard page with Clerk auth"
```

---

## Task 11: Müşteri Landing Page (Chatbot)

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Root layout'u güncelle**

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bella Güzellik Salonu — Online Randevu',
  description: 'Yapay zeka destekli randevu sistemi ile 7/24 randevu alın',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="tr">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 2: Müşteri landing page'ini yaz**

```tsx
// app/page.tsx
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Scissors, Star, Clock, Shield } from 'lucide-react';

const FEATURES = [
  { icon: Clock, text: '7/24 Randevu Alma' },
  { icon: Star, text: 'Anlık Onay' },
  { icon: Shield, text: 'Güvenli & Kolay' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm mb-6">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Scissors size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Bella Güzellik Salonu</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Güzelliğiniz için<br />
            <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              akıllı randevu
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-6">
            Yapay zeka asistanımız Bella ile saniyeler içinde randevu alın. 7/24 hizmetinizdeyiz.
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-2 text-sm text-gray-600">
                <f.icon size={16} className="text-rose-500" />
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden" style={{ height: '580px' }}>
            {/* Chat header */}
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                B
              </div>
              <div>
                <p className="text-white font-semibold">Bella</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <p className="text-white/80 text-xs">Çevrimiçi — Randevu asistanı</p>
                </div>
              </div>
            </div>
            <ChatInterface />
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            © 2026 Bella Güzellik Salonu ·{' '}
            <a href="/dashboard" className="hover:text-gray-600 transition-colors">
              Admin Paneli
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript hatası olmadığını doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Uygulamayı başlat ve test et**

```bash
npm run dev
```

Kontrol listesi:
- [ ] `http://localhost:3000` — chatbot arayüzü görünüyor mu?
- [ ] Bella'ya "Merhaba, saç kesimi yaptırmak istiyorum" yaz → yanıt veriyor mu?
- [ ] Tarih sor → availability check çalışıyor mu?
- [ ] `http://localhost:3000/dashboard` — Clerk login ekranı çıkıyor mu?
- [ ] Giriş yaptıktan sonra dashboard randevuları gösteriyor mu?

- [ ] **Step 5: Final commit**

```bash
git add app/
git commit -m "feat: add customer chatbot landing page and root layout"
```

---

## Task 12: Vercel Deploy

**Files:**
- Modify: `package.json` (build script kontrolü)

- [ ] **Step 1: Build'i doğrula**

```bash
npm run build
```

Expected: `✓ Compiled successfully` — hata yoksa devam et.

- [ ] **Step 2: Vercel'e deploy et**

```bash
npx vercel --prod
```

Vercel CLI env vars sormadan önce şunları ekle:
```bash
npx vercel env add ANTHROPIC_API_KEY production
npx vercel env add AIRTABLE_API_KEY production
npx vercel env add AIRTABLE_BASE_ID production
npx vercel env add AIRTABLE_TABLE_NAME production
npx vercel env add GOOGLE_CLIENT_EMAIL production
npx vercel env add GOOGLE_PRIVATE_KEY production
npx vercel env add GOOGLE_CALENDAR_ID production
npx vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
npx vercel env add CLERK_SECRET_KEY production
```

- [ ] **Step 3: Production URL'yi test et**

Vercel'in verdiği URL'yi aç:
- Chatbot düzgün çalışıyor mu?
- Dashboard Clerk ile korunuyor mu?
- Randevu alındığında Airtable'a kaydediliyor mu?
- Google Calendar'da event oluşuyor mu?

---

## Özet

| Aşama | Ne yapıldı |
|-------|-----------|
| Task 1 | Proje kurulumu |
| Task 2 | TypeScript tipleri |
| Task 3 | Airtable entegrasyonu |
| Task 4 | Google Calendar entegrasyonu |
| Task 5 | Claude AI tool tanımları |
| Task 6 | Chat API (tool-use döngüsü) |
| Task 7 | Appointments API (dashboard) |
| Task 8 | Chat UI bileşenleri |
| Task 9 | Dashboard bileşenleri |
| Task 10 | Admin dashboard sayfası |
| Task 11 | Müşteri landing page |
| Task 12 | Vercel deploy |

**Toplam: 12 task, ~48 commit**
