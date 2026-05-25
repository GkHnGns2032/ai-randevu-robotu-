# Slot Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bella randevu akışında müsait saatleri tıklanabilir grid kart olarak göster; seçilen saat otomatik gönderilsin.

**Architecture:** `route.ts` check_availability slotları döndürdüğünde streame gizli bir `\x00SLOTS:...\x00` marker enjekte eder. `ChatInterface.tsx` bu marker'ı stream'den yakalar, `pendingSlots` state'e yazar ve son asistan mesajının altında `SlotPicker` grid kart bileşenini render eder. Kullanıcı tıkladığında `handleSend(time)` tetiklenir.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, DM Sans (inline style — Tailwind kullanılmıyor bu bileşende)

---

## Dosya Haritası

| Eylem | Dosya | Ne değişiyor |
|---|---|---|
| Ekle | `.gitignore` | `.superpowers/` satırı |
| Yarat | `components/chat/SlotPicker.tsx` | Yeni grid kart bileşeni |
| Değiştir | `lib/ai-tools.ts` | SYSTEM_PROMPT — saatleri metin yazma kuralı |
| Değiştir | `app/api/chat/route.ts` | check_availability sonrası marker enjeksiyonu |
| Değiştir | `components/chat/ChatInterface.tsx` | pendingSlots state, stream parse, render, Yeni Sohbet fix |

---

## Task 1: .gitignore güncelle

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: `.superpowers/` satırını ekle**

`.gitignore` dosyasındaki `# local tooling state` bloğuna ekle:

```
# local tooling state
.claude/*
!.claude/skills/
!.claude/skills/**
/.remember/
.superpowers/
```

- [ ] **Step 2: Doğrula**

```bash
cd /Users/gkhngns/Documents/GAI/repos/bella
git status --short | grep superpowers
```

Beklenen çıktı: `.superpowers/` klasörü git'te görünmüyor (zaten tracked değil, artık ignore'lu).

---

## Task 2: SlotPicker bileşeni

**Files:**
- Create: `components/chat/SlotPicker.tsx`

- [ ] **Step 1: Dosyayı oluştur**

```tsx
'use client';
import { useState } from 'react';

interface SlotPickerProps {
  slots: string[];
  onSelect: (time: string) => void;
}

export function SlotPicker({ slots, onSelect }: SlotPickerProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleClick(time: string) {
    if (selected) return;
    setSelected(time);
    onSelect(time);
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '0.5px solid #DDD0F0',
        borderRadius: '14px',
        padding: '14px',
        boxShadow: '0 1px 6px rgba(107,80,128,0.07)',
      }}
    >
      <p
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0.3px',
          textTransform: 'uppercase' as const,
          color: '#8B7B95',
          margin: '0 0 10px 0',
        }}
      >
        Bir saat seçin
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}
      >
        {slots.map((time) => (
          <button
            key={time}
            onClick={() => handleClick(time)}
            disabled={!!selected}
            style={{
              background: selected === time ? '#EBE2F5' : '#FDFCF9',
              border: `1px solid ${selected === time ? '#C9ADE0' : '#DDD0F0'}`,
              color: '#6B3FA0',
              padding: '11px 10px',
              borderRadius: '8px',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              cursor: selected ? 'default' : 'pointer',
              opacity: selected !== null && selected !== time ? 0.45 : 1,
              transition: 'background 0.12s, border-color 0.12s, opacity 0.12s',
            }}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
cd /Users/gkhngns/Documents/GAI/repos/bella && npx tsc --noEmit 2>&1 | head -20
```

Beklenen çıktı: Hata yok (boş çıktı ya da sadece `next-env.d.ts` uyarısı).

---

## Task 3: System prompt kuralı

**Files:**
- Modify: `lib/ai-tools.ts`

- [ ] **Step 1: SYSTEM_PROMPT `Kurallar:` bölümüne kural ekle**

`lib/ai-tools.ts` içinde `Kurallar:` başlığından sonraki ilk maddenin hemen ÜSTÜNe şu satırı ekle:

```
- check_availability { available: true, slots } döndüğünde saatleri ASLA metin olarak listeleme. Sadece "Yarın için müsait saatler aşağıda 👇" gibi kısa tek satır yaz — arayüz saatleri kutucuk olarak gösterir.
```

Değişiklik sonrası ilgili bölüm şöyle görünmeli:

```ts
export const SYSTEM_PROMPT = `...

Kurallar:
- check_availability { available: true, slots } döndüğünde saatleri ASLA metin olarak listeleme. Sadece "Yarın için müsait saatler aşağıda 👇" gibi kısa tek satır yaz — arayüz saatleri kutucuk olarak gösterir.
- Her zaman Türkçe konuş
...
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
cd /Users/gkhngns/Documents/GAI/repos/bella && npx tsc --noEmit 2>&1 | head -20
```

Beklenen çıktı: Hata yok.

---

## Task 4: Route marker enjeksiyonu

**Files:**
- Modify: `app/api/chat/route.ts`

- [ ] **Step 1: `toolResults` Promise.all içine marker enjeksiyonunu ekle**

`app/api/chat/route.ts` içinde şu mevcut kodu bul (satır ~398-409):

```ts
const toolResults = await Promise.all(
  toolUseBlocks.map(async (block: Anthropic.ToolUseBlock) => {
    const input = Object.fromEntries(
      Object.entries(block.input as Record<string, unknown>)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => [k, String(v)])
    );
    const result = await executeTool(block.name, input);
    return { type: 'tool_result' as const, tool_use_id: block.id, content: result };
  })
);
```

Şununla değiştir:

```ts
const toolResults = await Promise.all(
  toolUseBlocks.map(async (block: Anthropic.ToolUseBlock) => {
    const input = Object.fromEntries(
      Object.entries(block.input as Record<string, unknown>)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => [k, String(v)])
    );
    const result = await executeTool(block.name, input);

    if (block.name === 'check_availability') {
      const parsed = JSON.parse(result) as { available?: boolean; slots?: string[] };
      if (parsed.available === true && Array.isArray(parsed.slots) && parsed.slots.length > 0) {
        controller.enqueue(encoder.encode(`\x00SLOTS:${parsed.slots.join(',')}\x00`));
      }
    }

    return { type: 'tool_result' as const, tool_use_id: block.id, content: result };
  })
);
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
cd /Users/gkhngns/Documents/GAI/repos/bella && npx tsc --noEmit 2>&1 | head -20
```

Beklenen çıktı: Hata yok.

---

## Task 5: ChatInterface.tsx — tam wiring

**Files:**
- Modify: `components/chat/ChatInterface.tsx`

- [ ] **Step 1: `SlotPicker` import ve `pendingSlots` state ekle**

Dosyanın başındaki import bloğuna ekle:

```ts
import { SlotPicker } from './SlotPicker';
```

`useState` satırlarına ekle (diğer state'lerin yanına):

```ts
const [pendingSlots, setPendingSlots] = useState<string[]>([]);
```

- [ ] **Step 2: `handleSend` başına `setPendingSlots([])` ekle**

`async function handleSend(text: string) {` satırının hemen altına:

```ts
async function handleSend(text: string) {
  setPendingSlots([]);
  const userMessage: ChatMessage = { ... // mevcut kod devam
```

- [ ] **Step 3: Stream while döngüsünde marker parse ekle**

`handleSend` içindeki stream while döngüsünde mevcut chunk işleme kodu:

```ts
const chunk = decoder.decode(value, { stream: true });
if (!chunk) continue;
```

Bunu şununla değiştir:

```ts
let chunk = decoder.decode(value, { stream: true });
if (!chunk) continue;

const markerMatch = chunk.match(/\x00SLOTS:([^\x00]+)\x00/);
if (markerMatch) {
  setPendingSlots(markerMatch[1].split(','));
  chunk = chunk.replace(/\x00SLOTS:[^\x00]+\x00/, '');
}
if (!chunk && started) continue;
```

- [ ] **Step 4: "Yeni Sohbet" butonuna `setPendingSlots([])` ekle**

Mevcut "Yeni Sohbet" onClick:

```ts
onClick={() => {
  setMessages([INITIAL_MESSAGE]);
  localStorage.removeItem('bella-chat-history');
}}
```

Şununla değiştir:

```ts
onClick={() => {
  setMessages([INITIAL_MESSAGE]);
  setPendingSlots([]);
  localStorage.removeItem('bella-chat-history');
}}
```

- [ ] **Step 5: SlotPicker render — loading spinner'dan hemen ÖNCE ekle**

Mevcut `{loading && (` bloğunun hemen üstüne:

```tsx
{pendingSlots.length > 0 && lastMessageRole === 'assistant' && !loading && (
  <div className="ml-[56px] mt-[-8px] mb-5">
    <SlotPicker
      slots={pendingSlots}
      onSelect={(time) => {
        setPendingSlots([]);
        handleSend(time);
      }}
    />
  </div>
)}
```

- [ ] **Step 6: TypeScript + lint kontrolü**

```bash
cd /Users/gkhngns/Documents/GAI/repos/bella && npx tsc --noEmit 2>&1 | head -20 && npm run lint 2>&1 | tail -10
```

Beklenen çıktı: TS hatası yok, lint hatası yok.

---

## Task 6: Manuel test + commit

**Files:** Tüm değişmiş dosyalar

- [ ] **Step 1: Dev server başlat**

```bash
cd /Users/gkhngns/Documents/GAI/repos/bella && npm run dev
```

`http://localhost:3000` adresini aç.

- [ ] **Step 2: Test 1 — grid kart çıkıyor mu?**

Chat'te şunu yaz: `"Yarın saç boyama için randevu almak istiyorum"`

Beklenen: Bella hizmet/personel akışını geçip tarihi aldıktan sonra `check_availability` çağırır → grid kart belirir, saatler listelenir.

- [ ] **Step 3: Test 2 — tıklama auto-send ediyor mu?**

Grid'den bir saate tıkla.

Beklenen: O saat kullanıcı balonu olarak gönderilir, grid kaybolur, Bella adı/telefonu sormaya devam eder.

- [ ] **Step 4: Test 3 — tek saat belirtince grid ÇIKMAMALI**

Chat'te: `"Yarın 14:00'da saç boyama istiyorum"`

Beklenen: Bella 14:00 müsait mi kontrol eder (`requested_time` path), grid ÇIKMAZ.

- [ ] **Step 5: Test 4 — Yeni Sohbet grid'i temizliyor mu?**

Grid açıkken "Yeni Sohbet" butonuna tıkla.

Beklenen: Grid kaybolur, sohbet sıfırlanır.

- [ ] **Step 6: Commit**

```bash
cd /Users/gkhngns/Documents/GAI/repos/bella
git add .gitignore components/chat/SlotPicker.tsx lib/ai-tools.ts app/api/chat/route.ts components/chat/ChatInterface.tsx docs/superpowers/specs/2026-05-25-slot-picker-design.md docs/superpowers/plans/2026-05-25-slot-picker.md
git commit -m "feat(chat): slot picker — available times as clickable grid card

check_availability sonucu slotları stream marker ile iletilir,
ChatInterface pendingSlots state'te tutar, SlotPicker bileşeni
2-sütun grid olarak render eder. Seçilen saat auto-send edilir.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review Notları

**Spec coverage:**
- ✅ Grid kart yerleşimi (Task 2)
- ✅ Otomatik gönder davranışı (Task 5 Step 5)
- ✅ Bella saatleri metin yazmıyor (Task 3)
- ✅ Tüm slotlar gösterilir (Task 2 — `slots.map` tam liste)
- ✅ Yeni Sohbet grid sıfırlama (Task 5 Step 4)
- ✅ `requested_time` path'inde grid çıkmıyor (Task 4 — `available === true && slots.length > 0` koşulu)

**Tip tutarlılığı:**
- `SlotPickerProps.onSelect: (time: string) => void` — Task 2'de tanımlı, Task 5'te `(time) => { ...; handleSend(time) }` ile eşleşiyor ✅
- `pendingSlots: string[]` — Task 5 Step 1'de tanımlı, Task 5 Step 5'te `<SlotPicker slots={pendingSlots}` ile geçiliyor ✅
- `encoder` ve `controller` route.ts Task 4'te — her ikisi de mevcut `ReadableStream` closure'ında tanımlı ✅
