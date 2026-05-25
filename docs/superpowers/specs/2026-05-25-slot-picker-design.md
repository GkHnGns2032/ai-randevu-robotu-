# Slot Picker — Tasarım Spec

**Tarih:** 2026-05-25  
**Konu:** Bella randevu akışında müsait saatlerin tıklanabilir grid kart olarak gösterilmesi  
**Durum:** Onaylı

---

## Özet

Bella `check_availability` tool'u çalıştırdığında müsait saatleri şu an metin olarak listeler. Bu özellik, saatleri tıklanabilir kutucuklara (grid kart) çevirir. Müşteri bir saate tıkladığında o saat otomatik olarak gönderilir ve Bella randevu akışına devam eder.

---

## Kullanıcı Tercihleri (Brainstorm Çıktısı)

| Soru | Karar |
|---|---|
| Yerleşim | Grid kart (Seçenek B) — mesaj altında, balon hizasında |
| Tıklama davranışı | Otomatik gönder — `handleSend(time)` tetiklenir |
| Bella'nın metin çıktısı | Saatleri metin olarak listeleme — sadece kısa giriş cümlesi |
| Slot sayısı | Tümü gösterilir |

---

## Mimari

Değişecek dosyalar:
- `app/api/chat/route.ts` — marker enjeksiyonu
- `lib/ai-tools.ts` — system prompt kuralı
- `components/chat/ChatInterface.tsx` — stream parse + state + render
- `components/chat/SlotPicker.tsx` — **YENİ bileşen**

---

## Bölüm 1: Backend — `route.ts`

`check_availability` tool sonucu `{ available: true, slots: [...] }` döndüğünde, bir sonraki Anthropic stream başlamadan önce streame gizli bir marker enjekte edilir.

**Enjeksiyon noktası:** `toolResults` Promise.all içinde, `check_availability` branch'ine ek olarak:

```ts
if (block.name === 'check_availability') {
  const parsed = JSON.parse(result);
  if (parsed.available === true && parsed.slots?.length > 0) {
    controller.enqueue(
      encoder.encode(`\x00SLOTS:${parsed.slots.join(',')}\x00`)
    );
  }
}
```

**Tetiklenme koşulları:**
- `available === true` VE `slots.length > 0` → marker gönderilir
- `requested_time_available` kontrolü (tek saat) → marker GÖNDERİLMEZ
- `available === false` → marker GÖNDERİLMEZ

---

## Bölüm 2: System Prompt — `ai-tools.ts`

Bella saatleri metin olarak yazmayacak. `SYSTEM_PROMPT` kurallar bölümüne eklenir:

```
- check_availability { available: true, slots } döndüğünde saatleri ASLA metin 
  olarak listeleme. Sadece "Yarın için müsait saatler aşağıda 👇" gibi tek satır 
  yaz — arayüz saatleri kutucuk olarak gösterir.
```

---

## Bölüm 3: Frontend — `ChatInterface.tsx`

### 3.1 Yeni state

```ts
const [pendingSlots, setPendingSlots] = useState<string[]>([]);
```

### 3.2 Stream okurken marker parse

Mevcut chunk işleme koduna ek (hem `started` hem `!started` branch'leri için):

```ts
let displayChunk = chunk;
const markerMatch = chunk.match(/\x00SLOTS:([^\x00]+)\x00/);
if (markerMatch) {
  setPendingSlots(markerMatch[1].split(','));
  displayChunk = chunk.replace(/\x00SLOTS:[^\x00]+\x00/, '');
}
if (!displayChunk) continue; // marker-only chunk ise mesaja ekleme
```

### 3.3 "Yeni Sohbet" butonunda sıfırlama

`setMessages([INITIAL_MESSAGE])` çağrıldığında `setPendingSlots([])` de çağrılmalı:

```ts
onClick={() => {
  setMessages([INITIAL_MESSAGE]);
  setPendingSlots([]);
  localStorage.removeItem('bella-chat-history');
}}
```

### 3.4 SlotPicker render

Son asistan mesajı bittikten sonra, loading değilken:

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

---

## Bölüm 4: Yeni Bileşen — `SlotPicker.tsx`

**Dosya:** `components/chat/SlotPicker.tsx`

### Props

```ts
interface SlotPickerProps {
  slots: string[];
  onSelect: (time: string) => void;
}
```

### Görsel

- Kart: `background:#FFFFFF`, `border:0.5px solid #DDD0F0`, `border-radius:14px`, `padding:14px`
- Üst etiket: "Bir saat seçin" — 11px, uppercase, `#8B7B95`
- Grid: `grid-template-columns: 1fr 1fr`, `gap:8px`
- Buton normal: `background:#FDFCF9`, `border:1px solid #DDD0F0`, `color:#6B3FA0`
- Buton hover: `background:#EBE2F5`, `border-color:#C9ADE0`
- Font: DM Sans 13px weight 500
- `border-radius:8px`, `padding:11px 10px`

### Davranış

- Tıklanınca `onSelect(time)` çağrılır
- Tıklama sonrası tüm butonlar `disabled` olur (çift gönderimi önler)
- `onSelect` üst component'te `setPendingSlots([])` + `handleSend(time)` çağırır

---

## Kapsam Dışı

- `find_alternative_slots` (farklı tarih+saat kombinasyonları) — bu spec'te YOK
- `reschedule_appointment` slot picker — YOK
- Mobil özel layout değişikliği — YOK (2 sütun mobilde de çalışır)

---

## Test Planı

1. Belirli bir tarih söyle → Bella `check_availability` çağırsın → grid kart çıksın
2. Grid'de bir saate tıkla → kullanıcı balonu olarak o saat gönderilsin → Bella adı sorsun
3. `requested_time` belirt (tarih + saat birlikte söyle) → grid ÇIKMAMALI, Bella direkt devam etmeli
4. Müsait saat yok durumu → grid ÇIKMAMALI
5. "Yeni Sohbet" butonuna tıklayınca `pendingSlots` sıfırlanmalı — grid kaybolmalı
