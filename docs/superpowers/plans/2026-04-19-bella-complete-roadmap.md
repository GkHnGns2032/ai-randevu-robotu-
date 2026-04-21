# Bella AI Randevu Robotu — Mükemmellik Roadmap'i

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fonksiyonel MVP seviyesindeki AI Randevu Robotu'nu, profesyonel salon yönetim sistemi seviyesine yükseltmek. Kritik bug'ları gider, eksik temel özellikleri ekle, iş yönetimi araçları getir, çoklu kanal entegrasyonu kur.

**Architecture:** Mevcut Next.js 15 App Router + Airtable + Claude + Google Calendar + Twilio stack'i korunur. Her faz bağımsız deploy edilebilir. Veritabanı migrasyonu (Airtable → Supabase/Postgres) Faz 4'te planlı. Temel prensip: önce bug'ları temizle, sonra iş mantığı, sonra kanal çeşitlendir, en son optimize et.

**Tech Stack:** Next.js 15, TypeScript, Tailwind, Claude Sonnet 4.6, Airtable, Google Calendar, Twilio, Clerk, Vercel

---

## Claude Code Model Stratejisi

Her fazda hangi model kullanılmalı:

| Model | Ne Zaman Kullan |
|-------|-----------------|
| **Claude Opus 4.7** (`claude-opus-4-7`) | Mimari kararlar, güvenlik açığı analizi, zor bug debug, veritabanı migrasyonu tasarımı, karmaşık race condition çözümleri, AI prompt tasarımı |
| **Claude Sonnet 4.6** (`claude-sonnet-4-6`) | Varsayılan — tüm implementasyon işleri, refactor, TDD, yeni özellik yazımı, component geliştirme |
| **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) | Rename, tek-dosya formatlama, import düzenleme, basit text değişiklikleri, copy-paste boilerplate |

**Faz bazında önerilen model:**
- Faz 1 (Kritik Bug'lar): **Opus 4.7** başla (güvenlik/race analizi), sonra Sonnet 4.6 ile implement et
- Faz 2-3 (Temel + Dashboard): **Sonnet 4.6** tamamı
- Faz 4 (İş Yönetimi + DB Migrasyon): **Opus 4.7** mimari, Sonnet 4.6 implement
- Faz 5 (WhatsApp/Ödeme): **Opus 4.7** Meta Business API / iyzico entegrasyon tasarımı, Sonnet 4.6 implement
- Faz 6-7 (Analiz + Gelecek): **Sonnet 4.6**

---

# FAZ 1 — KRİTİK BUG PAKETİ

**Model:** Opus 4.7 (güvenlik + race analizi), sonra Sonnet 4.6 (implement)
**Süre:** 1 gün
**Hedef:** Üretimde çalışan yanlış/riskli davranışları gider. Önce bunu yap — temelsiz her şey çöker.

## Dosya Yapısı Değişiklikleri

```
lib/
  airtable.ts          [MODIFY] — filterByFormula escape
  sms.ts               [MODIFY] — timezone-safe reminder check helper export
  pricing.ts           [CREATE] — tek fiyat kaynağı (config'den türet)
  booking-lock.ts      [CREATE] — race condition için atomic kontrol
app/api/
  send-reminders/route.ts [MODIFY] — Intl.DateTimeFormat ile İstanbul saati
  chat/route.ts        [MODIFY] — booking öncesi slot lock + Airtable double-check
components/dashboard/
  StatsOverview.tsx    [MODIFY] — PRICES kaldır, lib/pricing'den import
  CustomerList.tsx     [MODIFY] — fragment yerine Array render
```

## Task 1: Pricing Tek Kaynak Hâline Getir

**Files:**
- Create: `lib/pricing.ts`
- Modify: `components/dashboard/StatsOverview.tsx:14-23`
- Modify: `components/dashboard/CustomerList.tsx:12-14`

- [ ] **Step 1: `lib/pricing.ts` oluştur**

```ts
// lib/pricing.ts
import { CLIENT_CONFIG } from '@/config/client';
import type { ServiceName } from '@/config/client';

export const SERVICE_PRICES: Record<ServiceName, number> = Object.fromEntries(
  CLIENT_CONFIG.services.map((s) => [s.name, s.price])
) as Record<ServiceName, number>;

export function priceOf(service: string): number {
  return SERVICE_PRICES[service as ServiceName] ?? 0;
}
```

- [ ] **Step 2: StatsOverview'da hardcoded PRICES'i kaldır**

`components/dashboard/StatsOverview.tsx` içinde:
- `import { SERVICE_PRICES as PRICES } from '@/lib/pricing';` ekle
- Satır 14-23'teki `const PRICES: Record<ServiceType, number> = { ... }` bloğunu sil

- [ ] **Step 3: CustomerList'te duplikasyonu kaldır**

`components/dashboard/CustomerList.tsx` içinde:
- Satır 12-14'teki `const SERVICE_PRICES = Object.fromEntries(...)` satırlarını sil
- `import { SERVICE_PRICES } from '@/lib/pricing';` ekle

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: 0 hata

- [ ] **Step 5: Commit**

```bash
git add lib/pricing.ts components/dashboard/StatsOverview.tsx components/dashboard/CustomerList.tsx
git commit -m "refactor: pricing tek kaynak hâline getirildi (lib/pricing.ts)"
```

---

## Task 2: SMS Hatırlatma Timezone Fix

**Files:**
- Modify: `app/api/send-reminders/route.ts:15-31`

- [ ] **Step 1: İstanbul saati yardımcı fonksiyonu ekle**

`app/api/send-reminders/route.ts` en üstüne:

```ts
function istanbulNowParts(): { dateStr: string; msInIstanbul: number } {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now); // YYYY-MM-DD
  return { dateStr, msInIstanbul: now.getTime() };
}

function istanbulApptMs(date: string, time: string): number {
  return new Date(`${date}T${time}:00+03:00`).getTime();
}
```

- [ ] **Step 2: Filtre mantığını timezone-safe yap**

`GET` içindeki filtre bloğunu şununla değiştir:

```ts
const { dateStr: today, msInIstanbul: nowMs } = istanbulNowParts();
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
```

- [ ] **Step 3: Manuel test — endpoint'i çağır**

Run (kendi CRON_SECRET'inle):
```bash
curl "https://bella-randevu-robotu.vercel.app/api/send-reminders?secret=bella2026gizli"
```
Expected: `{ checked: "2026-04-19", total: N, results: [...] }` — today UTC değil İstanbul tarihi olmalı

- [ ] **Step 4: Commit**

```bash
git add app/api/send-reminders/route.ts
git commit -m "fix(sms): hatırlatma zamanını İstanbul saatine göre hesapla"
```

---

## Task 3: filterByFormula Injection Koruması

**Files:**
- Modify: `lib/airtable.ts:50-94`

- [ ] **Step 1: Escape helper ekle**

`lib/airtable.ts`'in üstüne:

```ts
function escapeFormulaString(value: string): string {
  // Airtable formülünde tırnak kaçışı — " → \"
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
```

- [ ] **Step 2: Tüm user-input formülleri escape et**

`listAppointments`, `getAppointmentsByDate`, `findAppointmentsByPhone` içindeki user string kullanımlarında:

```ts
// ÖNCE: `IS_AFTER({date}, "${options.fromDate}")`
// SONRA: `IS_AFTER({date}, "${escapeFormulaString(options.fromDate)}")`
```

Her string interpolasyonu şu kalıba çevir:
```ts
filterParts.push(`IS_AFTER({date}, "${escapeFormulaString(options.fromDate)}")`);
filterParts.push(`IS_BEFORE({date}, "${escapeFormulaString(options.toDate)}")`);
filterParts.push(`{status} = "${escapeFormulaString(options.status)}"`);
// getAppointmentsByDate:
filterByFormula: `{date} = "${escapeFormulaString(date)}"`,
// findAppointmentsByPhone:
filterByFormula: `AND({customerPhone} = "${escapeFormulaString(phone)}", {status} != "cancelled")`,
```

- [ ] **Step 3: Telefon format validasyonu server-side**

`findAppointmentsByPhone` başına:

```ts
const cleaned = phone.replace(/\D/g, '');
if (cleaned.length < 10 || cleaned.length > 15) {
  return [];
}
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: 0 hata

- [ ] **Step 5: Commit**

```bash
git add lib/airtable.ts
git commit -m "security: Airtable filterByFormula injection koruması + telefon validasyon"
```

---

## Task 4: CustomerList Fragment Fix

**Files:**
- Modify: `components/dashboard/CustomerList.tsx:191-323`

- [ ] **Step 1: Fragment yerine array döndür**

Satır 191-323 `{filtered.map((c, i) => { ... return (<> ... </>) })}` bloğunu şununla değiştir:

```tsx
{filtered.flatMap((c, i) => {
  const isExpanded = expanded === c.phone;
  const isVip = c.totalVisits >= 3;
  const customerAppts = appointments.filter((a) => a.customerPhone === c.phone);

  const rows = [
    <tr
      key={c.phone}
      onClick={() => setExpanded(isExpanded ? null : c.phone)}
      className="anim-up cursor-pointer"
      style={{
        borderBottom: isExpanded ? 'none' : '1px solid var(--border)',
        background: isExpanded ? 'var(--bg-hover)' : 'transparent',
        transition: 'background 0.15s ease',
        animationDelay: `${i * 20}ms`,
      }}
    >
      {/* ... mevcut td içerikleri ... */}
    </tr>
  ];

  if (isExpanded) {
    rows.push(
      <tr key={`${c.phone}-detail`}>
        {/* ... mevcut expanded içerik ... */}
      </tr>
    );
  }

  return rows;
})}
```

- [ ] **Step 2: Browser console'da warning yok mu kontrol et**

Run: `npm run dev`, dashboard aç, console'u kontrol et
Expected: `Warning: Each child in a list should have a unique "key" prop` yok

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/CustomerList.tsx
git commit -m "fix(CustomerList): fragment yerine düz array, React key warning giderildi"
```

---

## Task 5: Race Condition Koruması (Atomic Booking)

**Files:**
- Create: `lib/booking-lock.ts`
- Modify: `app/api/chat/route.ts:75-113` (book_appointment handler)

- [ ] **Step 1: `lib/booking-lock.ts` oluştur**

```ts
// lib/booking-lock.ts
import { listAppointments } from './airtable';
import type { Appointment } from './types';

export async function isSlotStillAvailable(
  date: string,
  time: string,
  durationMinutes: number,
): Promise<boolean> {
  const dayAppointments = await listAppointments({ fromDate: date, toDate: addOneDay(date) });
  const requestedStart = toMinutes(time);
  const requestedEnd = requestedStart + durationMinutes;

  const conflict = dayAppointments.some((a: Appointment) => {
    if (a.date !== date) return false;
    if (a.status === 'cancelled') return false;
    const existingStart = toMinutes(a.time);
    const existingEnd = existingStart + a.durationMinutes;
    return requestedStart < existingEnd && requestedEnd > existingStart;
  });

  return !conflict;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function addOneDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0];
}
```

- [ ] **Step 2: `book_appointment` handler'ında Airtable kaydından hemen önce kontrol et**

`app/api/chat/route.ts` içindeki `book_appointment` bloğunun başına:

```ts
import { isSlotStillAvailable } from '@/lib/booking-lock';
// ... existing imports

if (toolName === 'book_appointment') {
  const service = toolInput.service as ServiceType;
  const duration = SERVICE_DURATIONS[service] ?? 60;

  // Atomic double-check — başka birisi slotu aldı mı
  const stillFree = await isSlotStillAvailable(toolInput.date, toolInput.time, duration);
  if (!stillFree) {
    return JSON.stringify({
      success: false,
      error: 'conflict',
      message: 'Üzgünüm, bu slot biraz önce başka biri tarafından alındı. Lütfen başka bir saat seçin.',
    });
  }

  // ... mevcut Google Calendar + Airtable create kodu
}
```

- [ ] **Step 3: SYSTEM_PROMPT'a çakışma senaryosu ekle**

`lib/ai-tools.ts` içindeki SYSTEM_PROMPT'un "Kurallar:" bloğuna:

```
- book_appointment { success: false, error: "conflict" } dönerse → message'ı kullanıcıya söyle ve başka saat sor
```

- [ ] **Step 4: Commit**

```bash
git add lib/booking-lock.ts app/api/chat/route.ts lib/ai-tools.ts
git commit -m "feat(booking): atomic slot double-check, race condition giderildi"
```

---

## Task 6: Faz 1 Deploy + Doğrulama

- [ ] **Step 1: Build check**

Run: `npm run build`
Expected: 0 hata

- [ ] **Step 2: Kullanıcıdan deploy onayı al**

Memory kuralı: deploy öncesi onay sor.

- [ ] **Step 3: Deploy**

Run: `npx vercel --prod`
Expected: READY status

- [ ] **Step 4: Smoke test**

- https://bella-randevu-robotu.vercel.app açılıyor mu?
- Dashboard'da fiyatlar doğru mu?
- Chat randevu oluşturabiliyor mu?

---

# FAZ 2 — TEMEL EKSİKLİKLER

**Model:** Sonnet 4.6
**Süre:** 1-2 gün
**Hedef:** Kullanıcı deneyiminde en çok hissedilen eksikleri kapat: booking sonrası onay, streaming, caching, rate limit.

## Dosya Yapısı Değişiklikleri

```
lib/
  sms.ts                  [MODIFY] — buildConfirmationMessage helper ekle
  rate-limit.ts           [CREATE] — basit IP-bazlı rate limiter
  claude-client.ts        [CREATE] — prompt caching destekli singleton
app/api/
  chat/route.ts           [MODIFY] — streaming + caching + rate limit
  chat/stream/route.ts    [CREATE] — SSE endpoint
components/chat/
  ChatInterface.tsx       [MODIFY] — streaming fetch
```

## Task 1: Booking Sonrası SMS Onayı

**Files:**
- Modify: `lib/sms.ts`
- Modify: `app/api/chat/route.ts:75-113`

- [ ] **Step 1: Onay mesajı builder'ı ekle**

`lib/sms.ts` sonuna:

```ts
export function buildConfirmationMessage(params: {
  customerName: string;
  service: string;
  date: string;
  time: string;
}): string {
  const { customerName, service, date, time } = params;
  const [y, m, d] = date.split('-');
  const dateStr = `${d}.${m}.${y}`;
  return `Merhaba ${customerName}! ${CLIENT_CONFIG.businessName} randevunuz oluşturuldu: ${dateStr} saat ${time} — ${service}. İptal/değişiklik için bizi arayın. Görüşmek üzere 🌸`;
}
```

- [ ] **Step 2: `book_appointment` handler'ında Airtable başarısından sonra SMS gönder**

`app/api/chat/route.ts` içindeki `book_appointment` bloğunun Airtable başarı return'ünden önce:

```ts
// ... airtable create başarılı
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
```

- [ ] **Step 3: Import güncellemeleri**

```ts
import { sendSMS, buildConfirmationMessage } from '@/lib/sms';
```

- [ ] **Step 4: Kullanıcı ile canlı test — kendi numaranla deneme rezervasyonu yap**

- [ ] **Step 5: Commit**

```bash
git add lib/sms.ts app/api/chat/route.ts
git commit -m "feat(sms): randevu sonrası onay SMS'i eklendi"
```

---

## Task 2: Rate Limiting /api/chat

**Files:**
- Create: `lib/rate-limit.ts`
- Modify: `app/api/chat/route.ts`

- [ ] **Step 1: Basit in-memory rate limiter**

```ts
// lib/rate-limit.ts
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  existing.count++;
  return { allowed: true, remaining: limit - existing.count };
}
```

- [ ] **Step 2: POST handler başına uygula**

`app/api/chat/route.ts` içinde `POST` fonksiyonunun başına (try bloğu içine, messages parse'ından önce):

```ts
const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
const rl = rateLimit(`chat:${ip}`, 20, 60_000); // 20 req/dk
if (!rl.allowed) {
  return NextResponse.json({ error: 'Çok fazla istek. 1 dakika sonra tekrar deneyin.' }, { status: 429 });
}
```

- [ ] **Step 3: Import ekle**

```ts
import { rateLimit } from '@/lib/rate-limit';
```

- [ ] **Step 4: Not — Vercel serverless'ta in-memory map instance başına. Not yaz:**

Dosya başına yorum:
```ts
// Not: Vercel'de her instance'ın kendi buckets'ı var. Ciddi rate limit için Upstash Redis kullanılmalı (Faz 6'da).
```

- [ ] **Step 5: Commit**

```bash
git add lib/rate-limit.ts app/api/chat/route.ts
git commit -m "feat: /api/chat'e basit IP-bazlı rate limit (20 req/dk)"
```

---

## Task 3: Prompt Caching

**Files:**
- Modify: `app/api/chat/route.ts:203-236`

- [ ] **Step 1: SYSTEM_PROMPT cache marker ile gönder**

`client.messages.create` çağrılarını şu şekilde değiştir:

```ts
// ÖNCE:
system: systemWithDate,

// SONRA:
system: [
  {
    type: 'text',
    text: systemWithDate,
    cache_control: { type: 'ephemeral' },
  },
],
```

Hem ilk çağrıda hem while loop içindeki ikinci çağrıda uygula.

- [ ] **Step 2: Tools de cache'le (uzun)**

```ts
tools: APPOINTMENT_TOOLS.map((tool, idx) => {
  if (idx === APPOINTMENT_TOOLS.length - 1) {
    return { ...tool, cache_control: { type: 'ephemeral' } };
  }
  return tool;
}),
```

Not: Son tool'a cache breakpoint koyar — önceki tüm tool tanımları cache'lenir.

- [ ] **Step 3: Type güncelleme gerekiyorsa Anthropic SDK'da `Anthropic.Tool` → `Anthropic.ToolUnion` tipi kontrol et**

Run: `npx tsc --noEmit`
Expected: 0 hata (veya as cast gerekirse type assertion ile çöz)

- [ ] **Step 4: Logla ve gözlemle — ilk istek sonrası `usage.cache_read_input_tokens` > 0 olmalı**

Geçici log ekle, test et, sonra kaldır.

- [ ] **Step 5: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "perf(chat): SYSTEM_PROMPT + tools için prompt caching eklendi"
```

---

## Task 4: Streaming Chat Responses

**Files:**
- Create: `app/api/chat/stream/route.ts`
- Modify: `components/chat/ChatInterface.tsx`

- [ ] **Step 1: Streaming endpoint oluştur**

```ts
// app/api/chat/stream/route.ts
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { APPOINTMENT_TOOLS, SYSTEM_PROMPT } from '@/lib/ai-tools';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = rateLimit(`chat-stream:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return new Response('Rate limit', { status: 429 });
  }

  const { messages } = await req.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  const today = new Date().toISOString().split('T')[0];
  const systemWithDate = `${SYSTEM_PROMPT}\n\nBugünün tarihi: ${today}.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const streamRes = await client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: [{ type: 'text', text: systemWithDate, cache_control: { type: 'ephemeral' } }],
          messages,
        });

        for await (const event of streamRes) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'hata';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**NOT:** Tool use'u streaming'de yönetmek karmaşık. İlk versiyonda şunu tercih et:
- Tool gerektiğinde `/api/chat` (non-stream) çağır
- Tool gerekmiyorsa streaming

Daha basit yaklaşım: ilk response'u non-stream al, tool_use biterse final text mesajı stream et. Bu Faz 2'nin sonunda ele alınır — ilk versiyon hybrid.

**Önerilen:** Bu task'i 2 alt-task'a böl:
  - 4a: Tool-free streaming (başlangıç için basit konuşmalarda)
  - 4b: Tool + streaming kombinasyonu (client.messages.stream with tools, iterate event types)

- [ ] **Step 2: Alternatif — Daha temiz: hibrit strateji**

`/api/chat` aynen kalır, tool use var demektir. Yeni: istemci ilk `/api/chat` dener, eğer yanıt geldiyse gösterir. Sonraki mesajlarda tool kullanmıyorsa `/api/chat/stream` kullanılır. Bu optimizasyon Faz 6'ya ertelenebilir.

Pragmatik seçim: **Streaming'i Faz 6'ya ertele** — burada basit görsel "typing indicator" yeterli. Bu task'i skip et ve Task 5'e geç.

- [ ] **Step 3: Karar notu bırak**

`docs/superpowers/plans/` altına `notes-streaming.md` oluştur:

```md
# Streaming Kararı
Claude tool_use akışı streaming'de karmaşık (content_block_start → delta → stop_reason).
Tool loop'u client-side'da yönetmek state yönetimi gerektirir.
Faz 2'de basit typing indicator ile yetinildi. Faz 6'da tam streaming ele alınacak.
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/notes-streaming.md
git commit -m "docs: streaming kararı Faz 6'ya ertelendi (tool complexity)"
```

---

## Task 5: Chat Geçmişi localStorage

**Files:**
- Modify: `components/chat/ChatInterface.tsx`

- [ ] **Step 1: localStorage persist ekle**

`ChatInterface.tsx` içinde `useState<ChatMessage[]>(...)` altına:

```tsx
useEffect(() => {
  const saved = localStorage.getItem('bella-chat-history');
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as ChatMessage[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
    } catch { /* ignore */ }
  }
}, []);

useEffect(() => {
  if (messages.length <= 1) return;
  localStorage.setItem('bella-chat-history', JSON.stringify(messages));
}, [messages]);
```

- [ ] **Step 2: Temizleme butonu ekle (kullanıcı isterse)**

Chat header'ına "Sıfırla" linki:
```tsx
<button
  onClick={() => {
    setMessages([INITIAL_MESSAGE]);
    localStorage.removeItem('bella-chat-history');
  }}
  className="text-xs text-white/70 hover:text-white"
>
  Yeni Sohbet
</button>
```

- [ ] **Step 3: Commit**

```bash
git add components/chat/ChatInterface.tsx
git commit -m "feat(chat): sohbet geçmişi localStorage ile persist edildi"
```

---

## Task 6: Faz 2 Deploy

- [ ] **Step 1-3: Build, onay al, deploy**

```bash
npm run build
# kullanıcıdan onay
npx vercel --prod
```

---

# FAZ 3 — DASHBOARD EKSİKLİKLERİ

**Model:** Sonnet 4.6
**Süre:** 2-3 gün
**Hedef:** Salon sahibinin günlük kullandığı yönetim araçları. Manuel randevu yönetimi en kritik özellik.

## Dosya Yapısı Değişiklikleri

```
app/api/
  appointments/
    route.ts              [MODIFY] — POST + PATCH + DELETE ekle
    [id]/route.ts         [CREATE] — tek randevu GET/PATCH/DELETE
  export/route.ts         [CREATE] — CSV export
components/dashboard/
  AppointmentTable.tsx    [MODIFY] — arama/filtre/pagination
  AppointmentForm.tsx     [CREATE] — ekle/düzenle modal
  AppointmentActions.tsx  [CREATE] — iptal/düzenle butonları
  DashboardHeader.tsx     [CREATE] — "+Randevu Ekle" butonu
lib/
  appointment-actions.ts  [CREATE] — client-side API wrapper
```

## Task 1: Randevu CRUD API

**Files:**
- Modify: `app/api/appointments/route.ts`
- Create: `app/api/appointments/[id]/route.ts`
- Modify: `lib/airtable.ts` — `updateAppointment` helper ekle

- [ ] **Step 1: `lib/airtable.ts`'e update + delete helper**

```ts
export async function updateAppointmentFields(
  id: string,
  fields: Partial<Omit<Appointment, 'id' | 'createdAt'>> & { googleCalendarEventId?: string }
): Promise<Appointment> {
  const record = await table.update(id, fields as Airtable.FieldSet);
  return recordToAppointment(record);
}

export async function deleteAppointmentHard(id: string): Promise<void> {
  await table.destroy(id);
}
```

- [ ] **Step 2: `app/api/appointments/route.ts` POST ekle**

```ts
import { auth } from '@clerk/nextjs/server';
import { createAppointment } from '@/lib/airtable';
import { createCalendarEvent } from '@/lib/calendar';
import { SERVICE_DURATIONS } from '@/lib/types';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    customerName: string; customerPhone: string; service: string;
    date: string; time: string; notes?: string;
  };

  const duration = SERVICE_DURATIONS[body.service as keyof typeof SERVICE_DURATIONS] ?? 60;
  let eventId: string | undefined;
  try {
    eventId = await createCalendarEvent({
      summary: `${body.service} - ${body.customerName}`,
      description: `Müşteri: ${body.customerName}\nTel: ${body.customerPhone}\n${body.notes ?? ''}`,
      date: body.date, time: body.time, durationMinutes: duration,
      attendeePhone: body.customerPhone,
    });
  } catch { /* devam */ }

  const appointment = await createAppointment({
    customerName: body.customerName, customerPhone: body.customerPhone,
    service: body.service as keyof typeof SERVICE_DURATIONS,
    date: body.date, time: body.time, durationMinutes: duration,
    status: 'confirmed', notes: body.notes, googleCalendarEventId: eventId,
  });

  return NextResponse.json(appointment);
}
```

- [ ] **Step 3: `app/api/appointments/[id]/route.ts` oluştur**

```ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateAppointmentFields, cancelAppointment, deleteAppointmentHard } from '@/lib/airtable';
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/calendar';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as Partial<{
    customerName: string; customerPhone: string; service: string;
    date: string; time: string; notes: string; status: string;
  }>;

  const updated = await updateAppointmentFields(id, body as any);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await cancelAppointment(id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/appointments/ lib/airtable.ts
git commit -m "feat(api): randevu CRUD endpoint'leri (admin auth'lu)"
```

---

## Task 2: AppointmentForm Component (Ekle/Düzenle)

**Files:**
- Create: `components/dashboard/AppointmentForm.tsx`

- [ ] **Step 1: Form component'i oluştur**

```tsx
'use client';
import { useState } from 'react';
import { CLIENT_CONFIG } from '@/config/client';
import { X } from 'lucide-react';
import type { Appointment } from '@/lib/types';

interface Props {
  appointment?: Appointment;
  onClose: () => void;
  onSaved: () => void;
}

export function AppointmentForm({ appointment, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    customerName: appointment?.customerName ?? '',
    customerPhone: appointment?.customerPhone ?? '',
    service: appointment?.service ?? CLIENT_CONFIG.services[0].name,
    date: appointment?.date ?? '',
    time: appointment?.time ?? '',
    notes: appointment?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setSaving(true);
    try {
      const url = appointment ? `/api/appointments/${appointment.id}` : '/api/appointments';
      const method = appointment ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="relative w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <button onClick={onClose} className="absolute top-4 right-4" style={{ color: 'var(--text-3)' }}>
          <X size={18} />
        </button>
        <h2 className="font-light mb-5" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', color: 'var(--text-1)' }}>
          {appointment ? 'Randevuyu Düzenle' : 'Yeni Randevu'}
        </h2>
        <div className="space-y-3">
          <Field label="Müşteri Adı" value={form.customerName} onChange={(v) => setForm({ ...form, customerName: v })} />
          <Field label="Telefon" value={form.customerPhone} onChange={(v) => setForm({ ...form, customerPhone: v })} />
          <div>
            <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Hizmet</label>
            <select
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            >
              {CLIENT_CONFIG.services.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tarih" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            <Field label="Saat" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
          </div>
          <Field label="Notlar" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        </div>
        {err && <p className="text-xs mt-3" style={{ color: 'var(--rose)' }}>{err}</p>}
        <button
          onClick={submit}
          disabled={saving}
          className="w-full mt-5 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: 'var(--gold)', color: '#fff' }}
        >
          {saving ? 'Kaydediliyor...' : (appointment ? 'Güncelle' : 'Kaydet')}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/AppointmentForm.tsx
git commit -m "feat(dashboard): AppointmentForm modal (ekle/düzenle)"
```

---

## Task 3: Dashboard'a "Yeni Randevu" Butonu

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `components/dashboard/AppointmentTable.tsx` — row'lara "Düzenle" aksiyon ekle

- [ ] **Step 1: Dashboard'a "Yeni Randevu" butonu ekle**

`app/dashboard/page.tsx` içinde "Randevu Yönetimi" heading'inin yanına:

```tsx
// page heading bloğu içine ekle
<button
  onClick={() => /* modal state dışarıdan yönetilmeli, client component wrapper gerekir */}
  className="ml-auto px-4 py-2 rounded-lg text-sm"
  style={{ background: 'var(--gold)', color: '#fff' }}
>
  + Yeni Randevu
</button>
```

**NOT:** `DashboardPage` şu an server component. Modal state için wrapper client component gerekli. Çözüm:

- [ ] **Step 2: `components/dashboard/DashboardShell.tsx` client wrapper oluştur**

```tsx
'use client';
import { useState } from 'react';
import { AppointmentForm } from './AppointmentForm';
import { useRouter } from 'next/navigation';

export function NewAppointmentButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg text-sm transition-transform hover:scale-[1.02]"
        style={{ background: 'var(--gold)', color: '#fff' }}
      >
        + Yeni Randevu
      </button>
      {open && (
        <AppointmentForm
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); router.refresh(); }}
        />
      )}
    </>
  );
}
```

`app/dashboard/page.tsx` içinde import et ve heading yanına koy.

- [ ] **Step 3: AppointmentTable row'larına Düzenle/İptal butonu ekle**

`AppointmentTable.tsx`'e yeni "İşlem" kolonu ekle, "Düzenle" butonu için state + AppointmentForm aç.

```tsx
const [editing, setEditing] = useState<Appointment | null>(null);
// son th:
<th>...</th><th className="text-left py-3 px-4 text-[10px] ...">İşlem</th>
// son td:
<td className="py-4 px-4">
  <button onClick={(e) => { e.stopPropagation(); setEditing(a); }} className="text-xs" style={{ color: 'var(--gold)' }}>
    Düzenle
  </button>
</td>
// tablo sonuna:
{editing && (
  <AppointmentForm
    appointment={editing}
    onClose={() => setEditing(null)}
    onSaved={() => { setEditing(null); router.refresh(); }}
  />
)}
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/ app/dashboard/page.tsx
git commit -m "feat(dashboard): manuel randevu ekle/düzenle akışı"
```

---

## Task 4: Arama + Filtre (AppointmentTable)

**Files:**
- Modify: `components/dashboard/AppointmentTable.tsx`

- [ ] **Step 1: Search state + filter ekle**

Component başına:

```tsx
const [search, setSearch] = useState('');
const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'upcoming' | 'past'>('upcoming');

const filtered = sorted.filter((a) => {
  const q = search.toLowerCase();
  const matchesSearch = !q ||
    a.customerName.toLowerCase().includes(q) ||
    a.customerPhone.includes(q) ||
    a.service.toLowerCase().includes(q);
  const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
  const today = new Date().toISOString().split('T')[0];
  const matchesDate =
    dateFilter === 'all' ? true :
    dateFilter === 'today' ? a.date === today :
    dateFilter === 'upcoming' ? a.date >= today :
    dateFilter === 'past' ? a.date < today :
    true;
  return matchesSearch && matchesStatus && matchesDate;
});
```

- [ ] **Step 2: Filtre UI'ı tablo üzerine**

```tsx
<div className="px-5 py-3 flex flex-wrap gap-3 items-center" style={{ borderBottom: '1px solid var(--border)' }}>
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Ara: isim, telefon, hizmet..."
    className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg text-sm"
    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
  />
  <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
    <option value="upcoming">Yaklaşan</option>
    <option value="today">Bugün</option>
    <option value="past">Geçmiş</option>
    <option value="all">Hepsi</option>
  </select>
  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
    <option value="all">Tüm Durumlar</option>
    <option value="confirmed">Onaylı</option>
    <option value="pending">Bekliyor</option>
    <option value="cancelled">İptal</option>
  </select>
</div>
```

- [ ] **Step 3: `.map(sorted.map(...))` yerine `filtered.map(...)` kullan**

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/AppointmentTable.tsx
git commit -m "feat(dashboard): AppointmentTable arama + durum/tarih filtresi"
```

---

## Task 5: CSV Export

**Files:**
- Create: `app/api/export/route.ts`
- Modify: `components/dashboard/AppointmentTable.tsx` — "CSV İndir" butonu

- [ ] **Step 1: Export endpoint**

```ts
// app/api/export/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listAppointments } from '@/lib/airtable';
import { priceOf } from '@/lib/pricing';

function csvEscape(v: string | number | undefined): string {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const appointments = await listAppointments();
  const header = 'Ad,Telefon,Hizmet,Tarih,Saat,Süre,Durum,Fiyat,Not';
  const rows = appointments.map((a) => [
    csvEscape(a.customerName),
    csvEscape(a.customerPhone),
    csvEscape(a.service),
    csvEscape(a.date),
    csvEscape(a.time),
    csvEscape(a.durationMinutes),
    csvEscape(a.status),
    csvEscape(priceOf(a.service)),
    csvEscape(a.notes),
  ].join(','));

  const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM for Excel Turkish support

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="randevular-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
```

- [ ] **Step 2: Tabloya "CSV İndir" butonu**

Filtre bar'ına:

```tsx
<a href="/api/export" download className="px-3 py-1.5 rounded-lg text-sm" style={{ background: 'var(--gold)', color: '#fff' }}>
  CSV İndir
</a>
```

- [ ] **Step 3: Commit**

```bash
git add app/api/export/route.ts components/dashboard/AppointmentTable.tsx
git commit -m "feat(dashboard): CSV export (BOM + UTF-8, Excel için TR karakterler)"
```

---

## Task 6: Mobil Optimize

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `components/dashboard/AppointmentTable.tsx`
- Modify: `components/dashboard/StatsOverview.tsx`

- [ ] **Step 1: Tablo mobilde kart görünümü**

`AppointmentTable.tsx`'e `sm:hidden` kart listesi + `hidden sm:block` normal tablo:

```tsx
{/* Mobil kartlar */}
<div className="sm:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
  {filtered.map((a) => (
    <div key={a.id} className="px-4 py-3">
      <div className="flex justify-between items-start mb-1">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{a.customerName}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{a.customerPhone}</p>
        </div>
        <span className="text-xs tabular-nums" style={{ color: 'var(--text-2)' }}>{a.date} · {a.time}</span>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-2)' }}>{a.service}</p>
    </div>
  ))}
</div>

{/* Desktop tablo */}
<div className="hidden sm:block overflow-x-auto">
  {/* mevcut table */}
</div>
```

- [ ] **Step 2: StatsOverview'da büyük rakamları `clamp()` ile ölçeklendir — zaten yapılmış, dokunma**

- [ ] **Step 3: NextAppointment + VoiceSummary mobilde alt alta**

`app/dashboard/page.tsx`'teki:

```tsx
// ÖNCE: flex flex-wrap
// SONRA (zaten wrap ama gap fix):
<div className="flex flex-col md:flex-row items-stretch md:items-start justify-between gap-4">
```

- [ ] **Step 4: Test — Chrome DevTools'ta mobile modda 390px ölçü**

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/ app/dashboard/page.tsx
git commit -m "feat(dashboard): mobil kart görünümü + responsive layout"
```

---

## Task 7: Faz 3 Deploy

- [ ] Build + onay + deploy (aynı pattern)

---

# FAZ 4 — İŞ YÖNETİMİ ÖZELLİKLERİ

**Model:** Opus 4.7 (mimari + veritabanı migrasyonu tasarımı), Sonnet 4.6 (implement)
**Süre:** 3-5 gün
**Hedef:** Notlar/etiketler, personel, no-show, ödeme. Airtable alan yapısında genişleme gerekebilir; bu noktada Supabase'e migrasyon değerlendirilmeli.

## Mimari Karar Noktası

Opus 4.7 ile şunu değerlendir:
1. Airtable'da kal mı? Rate limit (5 req/sn), ilişkisel yapı zayıf
2. Supabase'e geç mi? Gerçek tablo ilişkileri, RLS, daha iyi ölçekleme

**Karar kriteri:** Müşteri sayısı < 500 → Airtable yeter. > 500 → Supabase

Bu faz Airtable ile devam eder, Supabase migrasyonu Faz 5 sonrası değerlendirilir.

## Airtable Tablo Şema Güncellemeleri

Aşağıdaki alanlar Airtable'a eklenmeli (manuel — kullanıcı yapacak):

**Randevular tablosu yeni alanlar:**
- `staffId` (Single line text) — atama yapılan personel ID'si
- `paymentStatus` (Single select: unpaid, partial, paid)
- `paymentMethod` (Single select: cash, card, transfer, —)
- `paidAmount` (Number)
- `isNoShow` (Checkbox)

**Yeni tablo: Staff**
- `name`, `role`, `services` (multi-select), `active` (checkbox)

**Yeni tablo: CustomerNotes**
- `customerPhone`, `note`, `tag` (VIP, Alerji, DifficultCustomer...), `createdAt`

## Task 1: No-Show Takibi

**Files:**
- Modify: `lib/airtable.ts` — markNoShow helper
- Modify: `components/dashboard/AppointmentTable.tsx` — "Gelmedi" butonu
- Modify: `components/dashboard/CustomerList.tsx` — no-show sayacı

- [ ] **Step 1: Helper**

```ts
// lib/airtable.ts
export async function markNoShow(id: string): Promise<void> {
  await table.update(id, { isNoShow: true, status: 'cancelled' });
}
```

- [ ] **Step 2: API endpoint**

`app/api/appointments/[id]/no-show/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { markNoShow } from '@/lib/airtable';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await markNoShow(id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Tabloya "Gelmedi" butonu (geçmiş tarihli randevularda)**

- [ ] **Step 4: Appointment type güncellemesi `lib/types.ts`**

```ts
export interface Appointment {
  // ... mevcut
  isNoShow?: boolean;
}
```

`recordToAppointment`'a ekle: `isNoShow: Boolean(f.isNoShow)`.

- [ ] **Step 5: CustomerList'e no-show sayısı göster**

`buildCustomers` fonksiyonu: `noShowCount: appts.filter((a) => a.isNoShow).length`.

Tabloda kırmızı rozet olarak göster.

- [ ] **Step 6: Commit**

---

## Task 2: Ödeme Takibi

**Files:**
- Modify: `lib/types.ts` — paymentStatus alanları
- Create: `components/dashboard/PaymentBadge.tsx`
- Modify: `components/dashboard/AppointmentTable.tsx` — ödeme kolonu + işaretleme

- [ ] **Step 1: Type'lar**

```ts
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface Appointment {
  // ... mevcut
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAmount?: number;
}
```

- [ ] **Step 2: `recordToAppointment` güncelle**

- [ ] **Step 3: PaymentBadge component**

```tsx
// components/dashboard/PaymentBadge.tsx
import type { PaymentStatus } from '@/lib/types';

const CFG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  unpaid:  { label: 'Ödenmedi',  color: 'var(--rose)',  bg: 'rgba(240,160,168,0.1)' },
  partial: { label: 'Kısmen',    color: 'var(--amber)', bg: 'rgba(240,200,112,0.1)' },
  paid:    { label: 'Ödendi',    color: 'var(--mint)',  bg: 'rgba(126,222,208,0.1)' },
};

export function PaymentBadge({ status }: { status: PaymentStatus | undefined }) {
  const cfg = CFG[status ?? 'unpaid'];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}
```

- [ ] **Step 4: AppointmentForm'a ödeme alanları ekle**

- [ ] **Step 5: StatsOverview'a "Tahsil Edilen" vs "Bekleyen" toplam ekle**

- [ ] **Step 6: Commit**

---

## Task 3: Müşteri Notları/Etiketleri

**Files:**
- Create: `lib/customer-notes.ts` — Airtable CustomerNotes tablosu
- Create: `app/api/customer/[phone]/notes/route.ts`
- Modify: `components/dashboard/CustomerList.tsx` — etiket + not gösterme

- [ ] **Step 1: CustomerNotes Airtable wrapper**

```ts
// lib/customer-notes.ts
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! })
  .base(process.env.AIRTABLE_BASE_ID!);

const NOTES_TABLE = process.env.AIRTABLE_NOTES_TABLE ?? 'CustomerNotes';
const notesTable = base(NOTES_TABLE);

export type CustomerTag = 'VIP' | 'Alerji' | 'Zor' | 'Yeni' | 'Kayıp' | string;

export interface CustomerNote {
  id: string;
  customerPhone: string;
  note: string;
  tag?: CustomerTag;
  createdAt: string;
}

export async function getNotesForCustomer(phone: string): Promise<CustomerNote[]> {
  const records = await notesTable.select({
    filterByFormula: `{customerPhone} = "${phone.replace(/"/g, '\\"')}"`,
    sort: [{ field: 'createdAt', direction: 'desc' }],
  }).all();

  return records.map((r) => ({
    id: r.id,
    customerPhone: r.fields.customerPhone as string,
    note: r.fields.note as string,
    tag: r.fields.tag as string | undefined,
    createdAt: r.fields.createdAt as string,
  }));
}

export async function addNote(phone: string, note: string, tag?: string) {
  await notesTable.create({
    customerPhone: phone,
    note,
    tag: tag ?? '',
    createdAt: new Date().toISOString(),
  });
}

export async function deleteNote(id: string) {
  await notesTable.destroy(id);
}
```

- [ ] **Step 2: API endpoints**

GET + POST + DELETE for `/api/customer/[phone]/notes/`.

- [ ] **Step 3: CustomerList expanded row'una notlar ekle**

Her etiket rozet olarak, yeni not formu ile.

- [ ] **Step 4: AI'ya müşteri notları feed et**

`find_appointment` tool'u geliştir: müşteri bulunduğunda notları da döndür, AI alerjileri hatırlasın.

- [ ] **Step 5: Commit**

---

## Task 4: Personel Yönetimi

**Files:**
- Create: `lib/staff.ts`
- Create: `app/api/staff/route.ts`
- Create: `components/dashboard/StaffManager.tsx`
- Modify: `config/client.ts` — staff disabled/enabled flag

- [ ] **Step 1: Airtable Staff tablosu wrapper**

```ts
// lib/staff.ts
export interface Staff {
  id: string;
  name: string;
  role: string;
  services: string[];
  active: boolean;
}

export async function listStaff(): Promise<Staff[]> { /* ... */ }
export async function createStaff(data: Omit<Staff, 'id'>): Promise<Staff> { /* ... */ }
export async function updateStaff(id: string, data: Partial<Staff>): Promise<Staff> { /* ... */ }
```

- [ ] **Step 2: Dashboard'a "Personel" bölümü ekle**

Yeni `Section title="Personel"` — tablo: ad, rol, hizmetler, aktif durumu.

- [ ] **Step 3: AppointmentForm'da personel seçici (opsiyonel)**

- [ ] **Step 4: AppointmentCalendar — personel filtresi (dropdown)**

- [ ] **Step 5: AI tool'a staff parametresi ekle (opsiyonel — Faz 5'te)**

- [ ] **Step 6: Commit**

---

## Task 5: Faz 4 Deploy

- [ ] Build + Airtable şema güncellendi mi check + onay + deploy

---

# FAZ 5 — KANALLAR VE ÖDEME

**Model:** Opus 4.7 (WhatsApp Business API mimari + iyzico güvenlik), Sonnet 4.6 (implement)
**Süre:** 5-7 gün
**Hedef:** Çoklu kanal + online ödeme. WhatsApp salon işletmelerinde en önemli kanal. Kapora/ödeme no-show'u azaltır.

## Task 1: WhatsApp Entegrasyonu

**Not:** İki yol var:
- **Twilio WhatsApp** (kolay, pahalı — sandbox ücretsiz, prod için onay gerekli)
- **Meta WhatsApp Business Cloud API** (ucuz, daha zor kurulum)

**Önerilen:** Meta Cloud API (uzun vadede ucuz). İlk versiyonda Twilio sandbox ile POC.

**Files:**
- Create: `lib/whatsapp.ts`
- Create: `app/api/whatsapp/webhook/route.ts`
- Modify: `lib/sms.ts` → `lib/messaging.ts` (SMS + WhatsApp unifier)

- [ ] **Step 1: Meta Business account + WhatsApp Business Cloud kur**

**Manuel adımlar (kullanıcı):**
1. https://business.facebook.com → WhatsApp Business Platform
2. Test number al
3. Access token + Phone Number ID not et
4. Webhook URL: `https://bella-randevu-robotu.vercel.app/api/whatsapp/webhook`
5. Verify token belirle (rastgele string)

`.env.local` ekle:
```
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=bella-whatsapp-verify-2026
```

- [ ] **Step 2: WhatsApp mesajlaşma lib**

```ts
// lib/whatsapp.ts
const GRAPH_URL = 'https://graph.facebook.com/v20.0';

export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const phone = to.replace(/\D/g, '').replace(/^0/, '90'); // TR +90
  const res = await fetch(`${GRAPH_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: text },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp error: ${await res.text()}`);
}
```

- [ ] **Step 3: Webhook — inbound mesajları karşıla + AI'ya yönlendir**

```ts
// app/api/whatsapp/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import Anthropic from '@anthropic-ai/sdk';
import { APPOINTMENT_TOOLS, SYSTEM_PROMPT } from '@/lib/ai-tools';
// ... executeTool import from chat route (refactor: lib/chat-executor.ts olarak extract et)

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Meta webhook payload parse
  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const message = change?.value?.messages?.[0];
  if (!message || message.type !== 'text') {
    return NextResponse.json({ ok: true });
  }

  const from = message.from; // "905551234567"
  const text = message.text.body;

  // Stateless approach: WhatsApp conversation context'ini Airtable'da sakla
  // Ya da kısa vade: her mesaj bağımsız (AI iyi olunca kabul edilebilir)
  // İdeal: ConversationState tablosu — phone → messages[]

  // Basit başlangıç: tek-mesaj yanıt
  const reply = await runChatLoop([{ role: 'user', content: text }]);
  await sendWhatsAppMessage(from, reply);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Conversation state — Airtable'da `WhatsAppSessions` tablosu**

Kullanıcı telefonu → son N mesaj, son güncelleme zamanı. 30 dk sessizlikte yeni sohbet.

- [ ] **Step 5: Webhook verify + test**

Meta business'ta webhook doğrula, test mesajı gönder.

- [ ] **Step 6: Booking onayı WhatsApp üzerinden gönder (SMS yerine isterse)**

`lib/messaging.ts` unifier:
```ts
export async function sendMessage(phone: string, text: string, channel: 'sms' | 'whatsapp' = 'sms') {
  if (channel === 'whatsapp') return sendWhatsAppMessage(phone, text);
  return sendSMS(phone, text);
}
```

- [ ] **Step 7: Commit**

---

## Task 2: Online Ödeme (iyzico Kapora)

**Not:** Türkiye'de iyzico yaygın. Stripe TR'de daha kısıtlı. İyzico = en iyi seçim.

**Files:**
- Create: `lib/iyzico.ts`
- Create: `app/api/payment/create/route.ts`
- Create: `app/api/payment/callback/route.ts`
- Modify: `app/api/chat/route.ts` — kapora akışı

- [ ] **Step 1: iyzico hesap + API key**

Manuel: https://merchant.iyzipay.com → Sandbox hesap → API key + Secret key

- [ ] **Step 2: iyzico SDK kur**

```bash
npm install iyzipay
```

- [ ] **Step 3: Ödeme link oluşturma**

```ts
// lib/iyzico.ts
import Iyzipay from 'iyzipay';

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY!,
  secretKey: process.env.IYZICO_SECRET_KEY!,
  uri: process.env.IYZICO_URI ?? 'https://sandbox-api.iyzipay.com',
});

export async function createDepositPayment(params: {
  appointmentId: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  callbackUrl: string;
}): Promise<{ paymentPageUrl: string; token: string }> {
  return new Promise((resolve, reject) => {
    iyzipay.checkoutFormInitialize.create({
      locale: 'tr',
      conversationId: params.appointmentId,
      price: params.amount.toFixed(2),
      paidPrice: params.amount.toFixed(2),
      currency: 'TRY',
      basketId: params.appointmentId,
      callbackUrl: params.callbackUrl,
      buyer: {
        id: params.customerPhone,
        name: params.customerName.split(' ')[0],
        surname: params.customerName.split(' ').slice(1).join(' ') || '-',
        gsmNumber: `+90${params.customerPhone.replace(/^0/, '')}`,
        email: params.customerEmail,
        identityNumber: '11111111111',
        registrationAddress: 'N/A',
        city: 'Istanbul',
        country: 'Turkey',
      },
      basketItems: [{
        id: params.appointmentId,
        name: 'Randevu Kaporası',
        category1: 'Hizmet',
        itemType: 'VIRTUAL',
        price: params.amount.toFixed(2),
      }],
    } as any, (err: any, res: any) => {
      if (err || res.status !== 'success') reject(err ?? res);
      else resolve({ paymentPageUrl: res.paymentPageUrl, token: res.token });
    });
  });
}
```

- [ ] **Step 4: POST /api/payment/create — randevu için kapora linki üret**

- [ ] **Step 5: Callback endpoint — ödeme başarılıysa Airtable güncelle**

- [ ] **Step 6: Booking flow'a kapora seçeneği ekle**

AI tool'a: `require_deposit` parametresi. Pahalı hizmetlerde (> 500₺) otomatik kapora iste.

- [ ] **Step 7: Commit**

---

## Task 3: Email Bildirimleri

**Files:**
- Create: `lib/email.ts` (Resend ile)

Resend = en kolay email provider. 100/gün ücretsiz.

- [ ] **Step 1: Resend kur**

```bash
npm install resend
```

`.env.local`: `RESEND_API_KEY=re_...`

- [ ] **Step 2: Email template + sender**

```ts
// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendConfirmationEmail(params: {
  to: string;
  customerName: string;
  service: string;
  date: string;
  time: string;
}): Promise<void> {
  await resend.emails.send({
    from: 'Bella Güzellik <randevu@bella-randevu-robotu.vercel.app>',
    to: params.to,
    subject: `Randevu Onayı — ${params.date} ${params.time}`,
    html: `
      <h2>Merhaba ${params.customerName}!</h2>
      <p>Randevunuz oluşturuldu:</p>
      <ul>
        <li><b>Hizmet:</b> ${params.service}</li>
        <li><b>Tarih:</b> ${params.date}</li>
        <li><b>Saat:</b> ${params.time}</li>
      </ul>
      <p>Görüşmek üzere 🌸</p>
    `,
  });
}
```

- [ ] **Step 3: AI tool'a email parametresi ekle (opsiyonel)**

Müşteri email verirse hem SMS hem email gönder.

- [ ] **Step 4: Commit**

---

## Task 4: Faz 5 Deploy

- [ ] Build + test (ödeme sandbox'ta dene) + deploy

---

# FAZ 5.5 — PERSONEL ENTEGRASYONU (Bot + Takvim)

**Model:** Opus 4.7 (AI prompt akışı), Sonnet 4.6 (UI + Airtable)
**Süre:** 1 gün
**Hedef:** Personel artık sadece bir liste değil — randevulara bağlanır. Bot rezervasyon yaparken müşteriye favori çalışan sorar, seçilen personelin takvimini kontrol eder, ona göre slot önerir.

**Neden gerekli:** Salon müşterilerinin çoğu favori çalışanı tercih eder. Bu olmadan bot "rastgele atama" yapıyor algısı veriyor, profesyonellik düşük.

**Önkoşul:** Faz 4 Task 4 (Personel listesi) tamamlanmış olmalı.

## Task 1: Veri Modeli & Backend

**Files:**
- Modify: Airtable şema (manuel) — `Appointments` tablosuna `staffId` Link field
- Modify: `lib/types.ts`, `lib/airtable.ts`, `lib/calendar.ts`

- [ ] **Step 1: Airtable şema (manuel kullanıcı adımı)**

`Appointments` tablosuna yeni alan:
- **Field name:** `staffId`
- **Type:** Link to another record → `Staff` tablosu
- **Allow linking to multiple records:** ❌ (single)

Mevcut randevular boş kalır — geriye uyumlu.

- [ ] **Step 2: `lib/types.ts` — Appointment interface**

```ts
export interface Appointment {
  // ...mevcut alanlar
  staffId?: string;        // Airtable record id of Staff
  staffName?: string;      // denormalized — UI/AI hızı için
}
```

- [ ] **Step 3: `lib/airtable.ts` — staffId desteği**

- `createAppointment`: `staffId` parametresi alır, link olarak yazar
- `listAppointments`: lookup ile `staffName` getirir (Airtable formula veya 2. fetch)
- Yeni helper: `listAppointmentsByStaff(staffId, dateRange?)`

- [ ] **Step 4: `lib/calendar.ts` — personel-aware availability**

```ts
// İmza güncellemesi
getAvailableSlots(date: string, service: string, staffId?: string): TimeSlot[]
```

Davranış:
- `staffId` verilirse: sadece o personelin müsait slotları
- `staffId` yoksa (eski davranış): en az bir personelin müsait olduğu slotlar
- Personel hiç yoksa: oda kapasitesi mantığına düş (mevcut)

## Task 2: AI Bot Akışı

**Files:**
- Modify: `lib/ai-tools.ts` (tool şemaları + SYSTEM_PROMPT)
- Modify: `app/api/chat/route.ts` (tool executor — yeni tool için case)

- [ ] **Step 1: Yeni tool — `list_staff_for_service`**

```ts
{
  name: 'list_staff_for_service',
  description: 'Belirli bir hizmeti veren AKTİF personelleri listeler. Müşteri randevu sürecine girince, hizmet seçtikten sonra mutlaka çağır — favori çalışan tercihini sorabilmek için.',
  input_schema: {
    type: 'object',
    properties: {
      service: { type: 'string', description: 'Hizmet adı (örn. "Saç Kesimi")' }
    },
    required: ['service']
  }
}
```

Implementation: `listStaff()` çağır → `active === true` && (`services.length === 0 || services.includes(service)`).

- [ ] **Step 2: Mevcut tool'lara `staffId` parametresi**

`check_availability` ve `create_appointment` schema'larına opsiyonel `staffId` ekle. Description'a yaz: "Eğer müşteri belirli bir personel istiyorsa staffId ver."

- [ ] **Step 3: SYSTEM_PROMPT akış güncellemesi**

Yeni akış kuralı:
```
1. Müşteri hizmet seçtiğinde → list_staff_for_service çağır
2. Eğer 2+ personel varsa → "Tercih ettiğiniz çalışanımız var mı?" diye sor + listele + "Fark etmez" seçeneği ekle
3. Eğer 1 personel varsa → otomatik seç, sorma
4. Eğer 0 personel (hiç yok) → eski akışa düş
5. "Fark etmez" denirse → staffId boş bırak (sistem ilk müsait olana atar)
6. Personel seçildikten sonra → check_availability(service, staffId) çağır
7. Müşteri saat seçince → create_appointment(..., staffId) ile oluştur
```

- [ ] **Step 4: Edge cases prompt'a**

- "Ayşe X hizmetini vermiyor" → "Ayşe bu hizmeti vermiyor, [alternatif liste]"
- Personel pasifse → listeden gizle
- Personel silinmişse → randevuda staffName göster ama atama yapma

- [ ] **Step 5: app/api/chat/route.ts executor**

Yeni `list_staff_for_service` case ekle. Mevcut `check_availability` ve `create_appointment` executor'larına `staffId` parametre geçişi.

## Task 3: Dashboard UI

**Files:**
- Modify: `components/dashboard/AppointmentForm.tsx`
- Modify: `components/dashboard/AppointmentCalendar.tsx`
- Modify: `components/dashboard/AppointmentTable.tsx`

- [ ] **Step 1: AppointmentForm — personel seçici**

Hizmet seçildikten sonra dropdown çıksın: "Personel (opsiyonel)". `listStaff` API'sinden çekilir, hizmet filtresi uygulanır.

- [ ] **Step 2: AppointmentCalendar — personel filtresi**

Üst sağda dropdown: "Tüm personel / Ayşe / Mehmet...". Seçilince calendar sadece o kişinin randevularını gösterir. URL state veya useState yeterli.

- [ ] **Step 3: AppointmentTable — Personel kolonu**

Yeni kolon: "Personel" (staffName). Atanmamışsa "—".

## Task 4: Test + Commit

- [ ] **Step 1: Manuel test senaryoları**

1. Bot ile randevu: "saç kesimi yapıtırmak istiyorum" → personel listesi gelmeli
2. "Ayşe ile" → Ayşe'nin müsait saatleri
3. "Fark etmez" → herhangi bir personelle oluşmalı
4. Aynı personele aynı saate 2 randevu çakışma engellenmeli
5. Pasif personel listede gözükmemeli
6. Dashboard'da personel filtresi çalışmalı

- [ ] **Step 2: Commit (onay sonrası)**

`feat(faz5.5): personel-aware booking — bot soruyor, takvim filtreliyor`

---

# FAZ 6 — ANALİZ + OPTİMİZASYON

**Model:** Sonnet 4.6
**Süre:** 2-3 gün
**Hedef:** Görsel iş analizi + performans. InsightsPanel caching, trend grafikleri, heatmap.

## Task 1: InsightsPanel Caching

**Files:**
- Modify: `app/api/insights/route.ts`
- Create: `lib/cache.ts` (basit in-memory TTL cache)

- [ ] **Step 1: TTL cache**

```ts
// lib/cache.ts
type Entry<T> = { value: T; expiresAt: number };
const cache = new Map<string, Entry<unknown>>();

export async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const existing = cache.get(key) as Entry<T> | undefined;
  if (existing && existing.expiresAt > Date.now()) {
    return existing.value;
  }
  const value = await fetcher();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}
```

- [ ] **Step 2: InsightsPanel endpoint'i cache'le**

```ts
// app/api/insights/route.ts
import { cached } from '@/lib/cache';

export async function GET() {
  const insights = await cached('insights', 30 * 60 * 1000, async () => {
    // ... mevcut logic + Claude çağrısı
    return { capacityRate, popularService, /* ... */ };
  });
  return NextResponse.json(insights);
}
```

30 dk cache. Dashboard açılışı ücretsizleşir, sadece ilk açılışta Claude çağrılır.

- [ ] **Step 3: Manuel refresh butonu hâlâ çalışıyor mu test et**

InsightsPanel zaten "yenile" butonu var. Cache skipping için `?force=1` query param ekle, buton oraya gönder.

- [ ] **Step 4: Commit**

---

## Task 2: Gelir Trend Grafiği

**Files:**
- Create: `components/dashboard/RevenueTrendChart.tsx`

- [ ] **Step 1: Recharts kur**

```bash
npm install recharts
```

- [ ] **Step 2: Son 30 gün gelir grafiği**

```tsx
'use client';
import { Appointment } from '@/lib/types';
import { priceOf } from '@/lib/pricing';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props { appointments: Appointment[] }

export function RevenueTrendChart({ appointments }: Props) {
  const end = new Date();
  const start = subDays(end, 29);
  const days = eachDayOfInterval({ start, end });

  const data = days.map((d) => {
    const dateStr = format(d, 'yyyy-MM-dd');
    const revenue = appointments
      .filter((a) => a.date === dateStr && a.status === 'confirmed')
      .reduce((sum, a) => sum + priceOf(a.service), 0);
    return {
      date: format(d, 'd MMM', { locale: tr }),
      gelir: revenue,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 10 }} />
        <YAxis tick={{ fill: 'var(--text-3)', fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
          labelStyle={{ color: 'var(--text-2)' }}
        />
        <Line type="monotone" dataKey="gelir" stroke="var(--gold)" strokeWidth={2} dot={{ fill: 'var(--gold)' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: Dashboard'a ekle**

`Section title="Gelir Trendi"` içine `<RevenueTrendChart appointments={appointments} />`.

- [ ] **Step 4: Commit**

---

## Task 3: Yoğunluk Heatmap

**Files:**
- Create: `components/dashboard/BookingHeatmap.tsx`

- [ ] **Step 1: Gün × saat 2D grid**

```tsx
'use client';
import { Appointment } from '@/lib/types';

interface Props { appointments: Appointment[] }

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function BookingHeatmap({ appointments }: Props) {
  const hours = Array.from({ length: 11 }, (_, i) => i + 9); // 9-19
  const grid: Record<string, number> = {};

  for (const a of appointments) {
    if (a.status === 'cancelled' || !a.date || !a.time) continue;
    const day = new Date(a.date).getDay(); // 0=Paz ... 6=Cmt
    const dayIdx = (day + 6) % 7; // Pzt=0 ... Paz=6
    const hour = parseInt(a.time.split(':')[0]);
    const key = `${dayIdx}-${hour}`;
    grid[key] = (grid[key] ?? 0) + 1;
  }

  const max = Math.max(1, ...Object.values(grid));

  return (
    <div className="inline-block">
      <div className="grid grid-cols-[auto_repeat(11,minmax(0,1fr))] gap-1">
        <div />
        {hours.map((h) => <div key={h} className="text-[9px] text-center" style={{ color: 'var(--text-3)' }}>{h}</div>)}
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="contents">
            <div className="text-[10px] pr-2 py-1" style={{ color: 'var(--text-3)' }}>{day}</div>
            {hours.map((h) => {
              const count = grid[`${dayIdx}-${h}`] ?? 0;
              const intensity = count / max;
              return (
                <div
                  key={h}
                  className="aspect-square rounded-sm flex items-center justify-center text-[8px]"
                  style={{
                    background: count > 0 ? `color-mix(in srgb, var(--gold) ${intensity * 80}%, transparent)` : 'var(--bg-hover)',
                    color: intensity > 0.5 ? '#fff' : 'var(--text-3)',
                  }}
                  title={`${DAYS[dayIdx]} ${h}:00 — ${count} randevu`}
                >
                  {count > 0 ? count : ''}
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

- [ ] **Step 2: Dashboard'a ekle**

- [ ] **Step 3: Commit**

---

## Task 4: Streaming Chat (ertelenmişti)

**Files:**
- Modify: `app/api/chat/route.ts` — stream mode
- Modify: `components/chat/ChatInterface.tsx` — SSE oku

- [ ] **Step 1: `client.messages.stream()` ile tool loop**

```ts
// chat/route.ts — stream version
const stream = client.messages.stream({ /* params */ });

let toolUses = [];
let currentText = '';

for await (const event of stream) {
  if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
    toolUses.push({ ...event.content_block, input: '' });
  } else if (event.type === 'content_block_delta') {
    if (event.delta.type === 'text_delta') {
      // Client'a text chunk gönder
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
    } else if (event.delta.type === 'input_json_delta') {
      toolUses[toolUses.length - 1].input += event.delta.partial_json;
    }
  } else if (event.type === 'message_stop') {
    // Tool use varsa execute et, sonra yeni stream aç
    // ... recursive tool loop
  }
}
```

Bu karmaşık — detaylı tasarım Opus 4.7 ile yap.

- [ ] **Step 2: Typing indicator yerine gerçek token-by-token**

- [ ] **Step 3: Commit**

---

## Task 5: Faz 6 Deploy

---

# FAZ 7 — GELECEK ÖZELLİKLER

**Model:** Sonnet 4.6
**Süre:** 3-5 gün
**Hedef:** Nice-to-have'lar. Proje stabilize olduktan sonra.

## Task 1: PWA — Salon Sahibi Ekrana Yerleştirsin

**Files:**
- Create: `public/manifest.json`
- Create: `app/sw.ts` (service worker — next-pwa yerine kendi basit)
- Modify: `app/layout.tsx` — manifest link

- [ ] **Step 1: Manifest**

```json
{
  "name": "Bella Güzellik Admin",
  "short_name": "Bella",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0e0e0e",
  "theme_color": "#d4af6e",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Icon'lar oluştur (Scissors + altın gradient)**

- [ ] **Step 3: `app/layout.tsx`'e manifest link**

```tsx
<head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#d4af6e" />
</head>
```

- [ ] **Step 4: Commit**

---

## Task 2: Web Push Notification

**Files:**
- Create: `app/api/push/subscribe/route.ts`
- Create: `public/sw.js` (service worker)

- [ ] **Step 1: VAPID key üret**

```bash
npx web-push generate-vapid-keys
```

`.env.local`:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

- [ ] **Step 2: web-push kur**

```bash
npm install web-push
```

- [ ] **Step 3: Subscribe endpoint + cron entegrasyonu**

Yeni randevu oluştuğunda admin'e push bildirim (salon sahibi telefonunda).

- [ ] **Step 4: Service worker**

- [ ] **Step 5: Commit**

---

## Task 3: Çoklu Dil (İngilizce)

**Files:**
- Create: `lib/i18n.ts`
- Modify: her component — t() helper

- [ ] **Step 1: next-intl kur**

```bash
npm install next-intl
```

- [ ] **Step 2: Dil dosyaları `messages/tr.json`, `messages/en.json`**

- [ ] **Step 3: SYSTEM_PROMPT'u da dil-aware yap — müşteri İngilizce yazarsa İngilizce cevapla**

- [ ] **Step 4: Commit**

---

## Task 4: Gelişmiş Kayıp Müşteri Kampanyası

**Files:**
- Create: `app/api/campaigns/winback/route.ts`

60 gündür randevu almamış müşterilere otomatik SMS/WhatsApp ile indirim teklifi.

- [ ] **Step 1: Cron endpoint (günde bir)**

- [ ] **Step 2: Kampanya şablonu + kullanıcıdan indirim kodu al**

- [ ] **Step 3: cron-job.org'a yeni tetik ekle**

- [ ] **Step 4: Commit**

---

## Task 5: Review/Rating Toplama

**Files:**
- Create: `app/review/[token]/page.tsx`
- Create: `app/api/review/route.ts`

Randevu sonrası 1 gün sonra otomatik SMS: "Hizmetimizi değerlendirin: [link]"

- [ ] **Step 1: Token-bazlı public review sayfası**

- [ ] **Step 2: Review tablosu Airtable'da**

- [ ] **Step 3: Dashboard'a review ortalaması + son yorumlar**

- [ ] **Step 4: Commit**

---

## Task 6: Audit Log

**Files:**
- Create: `lib/audit.ts`
- Modify: Tüm API endpoint'leri — audit log çağır

Kim ne zaman neyi değiştirdi. Airtable'da `AuditLog` tablosu.

- [ ] **Step 1: Log helper + her mutation'da çağır**

- [ ] **Step 2: Dashboard'a "Aktivite" sekmesi**

- [ ] **Step 3: Commit**

---

## Task 7: Faz 7 Deploy

---

# SELF-REVIEW CHECKLIST

Her faz sonunda:

**1. Spec coverage:**
- [ ] Tüm kritik bug'lar kapatıldı mı?
- [ ] Dashboard'dan manuel randevu ekle/düzenle/sil çalışıyor mu?
- [ ] WhatsApp test mesajı alınıyor mu?
- [ ] Ödeme sandbox'ta başarılı mı?
- [ ] Export Excel'de düzgün açılıyor mu?

**2. Güvenlik:**
- [ ] Tüm admin endpoint'lerde `auth()` kontrolü var mı?
- [ ] filterByFormula escape edilmiş mi?
- [ ] Rate limit çalışıyor mu?
- [ ] CRON_SECRET leak yok mu?

**3. Performance:**
- [ ] Prompt caching hit rate > %80 mı?
- [ ] InsightsPanel ilk açılış < 2s mi?
- [ ] Dashboard load time < 3s mi?

**4. UX:**
- [ ] Mobil cihazda kullanılabilir mi?
- [ ] Booking akışı sorunsuz çalışıyor mu?
- [ ] Hata mesajları Türkçe + anlamlı mı?

**5. Memory güncelle:**
- [ ] `project_state.md` her faz sonunda güncellenmeli
- [ ] `tech_stack.md` yeni servisler eklendikçe güncellenmeli

---

# TOPLAM ZAMAN TAHMİNİ

| Faz | Süre | Zorluk |
|-----|------|--------|
| 1 — Kritik Bug'lar | 1 gün | Orta |
| 2 — Temel Eksiklikler | 1-2 gün | Kolay-Orta |
| 3 — Dashboard | 2-3 gün | Orta |
| 4 — İş Yönetimi | 3-5 gün | Orta-Zor |
| 5 — Kanallar + Ödeme | 5-7 gün | Zor |
| 6 — Analiz + Streaming | 2-3 gün | Orta |
| 7 — Gelecek | 3-5 gün | Orta |
| **Toplam** | **~3-4 hafta** | — |

---

# ÖNERİLEN AKIŞ

1. **Faz 1 hemen başla** (Opus 4.7 güvenlik, sonra Sonnet 4.6 implement)
2. Her faz sonunda deploy + onay
3. Kullanıcı testi — salon gerçek kullanımında ne eksik görüyor
4. Geri bildirime göre Faz 4-5-6 sıralamasını değiştirebiliriz
5. Faz 7 opsiyonel — 6 biter bitmez karar verilir

**Şimdi ne yapmak istersin:**
- A) Faz 1'i subagent-driven execute et (fresh agent her task için)
- B) Faz 1'i inline execute et (bu session'da sırayla)
- C) Plan'ı gözden geçir, öncelik değişikliği öner
