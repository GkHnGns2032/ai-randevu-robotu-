# Handoff — Pre-Faz 6 UX Polishing (yeni session başlangıcı)

**Tarih:** 2026-04-21
**Durum:** Faz 5.5 canlıda, stabil. **Faz 5 (Kanallar + Ödeme) ertelendi — atlanmadı, sonraya**. Faz 6'ya geçmeden önce kullanıcı 7 adet polishing task istedi.
**Branch:** `faz-1-kritik-buglar` (devam — Faz 6 başlangıcında main'e merge + yeni branch)
**Production:** https://bella-randevu-robotu.vercel.app
**Son commit:** `2f947eb` (push + deploy `dpl_J9zykZ5ejesMUrxN6Z4ZfCkyry3c` READY)

---

## Plan — Onaylandı (kullanıcı), Sonnet 4.6 ile adım adım

### Sıra: 1 → 2 → 3+4 (birlikte) → 6 → 7 → 5 (en riskli en sonda)

Her task bittikten sonra **dur, onay al**, sonraki task'e geç. Her task commit öncesi **mutlaka onay**.

---

### Task 1 — Robot tarih/saat farkındalığı
**Hedef:** Müşteri "yarın", "öbür gün", "hafta sonu", "gelecek pazartesi" dediğinde bot doğru tarihi yorumlayabilsin.

**Dosyalar:**
- [app/api/chat/route.ts:274-289](app/api/chat/route.ts#L274-L289) — `today` inject'ini genişlet
- [lib/ai-tools.ts:120-186](lib/ai-tools.ts#L120-L186) — SYSTEM_PROMPT'a relative date parsing rehberi

**Yapılacak:**
- `Europe/Istanbul` TZ ile hesapla: bugünkü tarih (21 Nisan 2026 Salı), şu an saati (HH:MM), yarın, öbür gün, bu hafta sonu (Cumartesi 25 Nisan, Pazar 26 Nisan), gelecek pazartesi/salı/... listesi
- SYSTEM_PROMPT bölümüne "TARİH ANLAMA REHBERİ" ekle: "yarın → ...", "bu hafta sonu → ...", "pazartesi → en yakın pazartesi" örnekleri ile
- Bugünün tarihi + saati dinamik olarak prompt'a gelsin

**Risk:** düşük (sadece prompt/string)

---

### Task 2 — Randevu öncesi onay adımı (bot özet + onay iste)
**Hedef:** Bot `book_appointment` çağırmadan önce randevu bilgilerini özet halinde göstersin, müşteri net onay verdikten sonra aracı çağırsın.

**Dosya:** [lib/ai-tools.ts:156-158](lib/ai-tools.ts#L156-L158) (SYSTEM_PROMPT kuralları)

**Yapılacak:**
- SYSTEM_PROMPT'a sert kural: "book_appointment ÇAĞIRMADAN ÖNCE özeti formatla:
  ```
  📋 Randevu Özeti:
  • Ad Soyad: ...
  • Telefon: ...
  • Hizmet: ...
  • Tarih: ...
  • Saat: ...
  • Personel: ...

  Onaylıyor musunuz?
  ```
  Müşteri NET onay vermeden (evet, tamam, onaylıyorum) book_appointment ÇAĞIRMA. 'Belki', 'düşüneyim' gibi belirsiz cevaplarda tekrar sor."

**Not:** UI-level onay kartı (structured confirmation component) daha sonra — önce prompt seviyesinde hızlı kazanım. Kullanıcı isterse UI'ya geçeriz.

**Risk:** düşük (sadece prompt)

---

### Task 3 + 4 — Bugünü Dinle: saat farkındalığı + doğru Türkçe okuma
**Hedef:**
- (3) Script şu ana göre dinamik olsun: tamamlanmış / sıradaki / sonraki ayırımı
- (4) TTS `11:00` → "saat on birinci" değil, "saat on bir" okusun

**Dosya:** [components/dashboard/VoiceSummary.tsx:11-35](components/dashboard/VoiceSummary.tsx#L11-L35) (`buildScript`)

**Yapılacak:**
- `buildScript`'te `now` al, `today` randevularını `past` / `current` / `upcoming` ayır
- Yeni script şablonu: "Bugün 21 Nisan 2026. Toplam 4 randevunuz var. Şu ana kadar 2'si tamamlandı. Sıradaki saat 14:00 Gökhan Güneş, saç kesimi. Sonra saat 15:00 Ahmet, cilt bakımı."
- Türkçe sayı-yazı helper: `11` → "on bir", `14` → "on dört", `11:30` → "saat on bir otuz" (veya "buçuk"). Saat stringi TTS'e "saat X" veya "saat X Y" şeklinde boşluklu verilince ordinal okuma kırılır — ama önce kelime ile yaz, emin ol
- Edge case: saat değeri tek haneli ("9" → "dokuz") ve dakika "00" (hiç söyleme, sadece saat)

**Risk:** düşük (tek dosya, saf logic)

---

### Task 6 — Telefon formatı xxx.xxx.xx.xx
**Hedef:** AppointmentTable ve CustomerList'te telefon numaraları `5551234567` yerine `555.123.45.67` şeklinde gösterilsin.

**Dosyalar:**
- Yeni: `lib/format.ts` → `formatPhoneTR(phone: string): string`
- [components/dashboard/AppointmentTable.tsx:170](components/dashboard/AppointmentTable.tsx#L170)
- [components/dashboard/CustomerList.tsx:298](components/dashboard/CustomerList.tsx#L298)

**Yapılacak:**
```ts
// lib/format.ts
export function formatPhoneTR(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // 5551234567 → 555.123.45.67
  // 05551234567 → 0555.123.45.67
  if (digits.length === 10) {
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,8)}.${digits.slice(8,10)}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${digits.slice(0,4)}.${digits.slice(4,7)}.${digits.slice(7,9)}.${digits.slice(9,11)}`;
  }
  return phone; // format çözümlenemezse raw döndür
}
```
- Airtable'daki raw değeri değiştirme, sadece display'de kullan

**Risk:** düşük

---

### Task 7 — Canlı saat daha görünür
**Dosya:** [components/dashboard/LiveClock.tsx](components/dashboard/LiveClock.tsx)

**Yapılacak:**
- Saat font size: `1.6rem` → **`2.4rem`**
- Saniyeler: 1rem → `1.1rem`
- Ana rakamlar: `var(--text-1)` → **`var(--gold)`** (iki nokta zaten gold, pulse korunacak)
- Subtle glow: `text-shadow: 0 0 12px color-mix(in srgb, var(--gold) 25%, transparent)`
- Tarih satırı: `10px` → `11px`, letter-spacing hafif artır
- Header dikey alanı biraz büyüyecek — diğer header elemanlarıyla dengele

**Risk:** düşük-orta (layout sapması için ilk testte göz at)

---

### Task 5 — Tablo UI premium (EN SON, en riskli)
**Hedef:** Müşteriler, Personel, Tüm Randevular tabloları daha premium + okunur.

**Dosyalar:**
- [components/dashboard/AppointmentTable.tsx](components/dashboard/AppointmentTable.tsx)
- [components/dashboard/CustomerList.tsx](components/dashboard/CustomerList.tsx)
- [components/dashboard/StaffManager.tsx](components/dashboard/StaffManager.tsx)

**Ortak iyileştirmeler:**
- Sticky header (scroll'da kaybolmasın) — `position: sticky; top: 0; background: var(--bg-card); z-index: 10`
- Sütun genişliklerini dengele (gerekirse `table-layout: fixed` + açık `width`)
- Satır yüksekliği tutarlı, satır-içi hiyerarşi (birincil/ikincil text)
- Zebra stripe çok hafif: `nth-child(even)` → `var(--bg-hover)` %40 opacity
- Hover: mevcut davranışı bozmadan ek focus ring
- Başlık typography: monospace + tracking hafif artır

**DİKKAT:** Kural — mevcut çalışan davranışları BOZMA. Her tablo için:
1. Mevcut screenshot al (kullanıcıdan iste VEYA dev server'dan manuel doğrula)
2. Değişikliği uygula
3. Kullanıcıya önce/sonra göster
4. Onay al, sonra commit

**3 dosyayı TEK TEK** yap. Toplu değişiklik = regresyon riski.

**Risk:** orta-yüksek (visual regresyon)

---

## Kritik Kurallar (tekrar)

1. **Her task bittikten sonra onay al, sonraki task'e otomatik geçme.**
2. **Commit/push/deploy öncesi mutlaka onay.**
3. **Mevcut çalışan davranışları bozma — bozulacaksa önce sor.**
4. **2 denemede çözülemeyen sorunda Opus 4.7 öner.**
5. **Görsel regresyon riskli task'lerde (özellikle Task 5 ve 7) önce-sonra manuel doğrula.**
6. **`.next` cache bozulması → ilk önce `Remove-Item -Recurse -Force .next` öner.**

---

## Session Başlangıç Checklist

1. `git log --oneline -5` → son commit `2f947eb` olmalı
2. `git status` → temiz
3. `npx tsc --noEmit` → temiz
4. Memory: [project_state.md](C:\Users\gokha\.claude\projects\d--masa-st---gg-ai-randevu-robotu\memory\project_state.md) + [feedback.md](C:\Users\gokha\.claude\projects\d--masa-st---gg-ai-randevu-robotu\memory\feedback.md) oku
5. Bu handoff'u oku
6. Kullanıcıya: **"Task 1 ile başlayalım mı? Sonnet 4.6 ile devam."**

---

## Sonraki (Pre-Faz6 bittikten sonra)

- Main'e merge + yeni branch (`faz-6-analiz`)
- **Faz 6 — Analiz + Optimizasyon:** InsightsPanel caching, gelir trend grafiği, yoğunluk heatmap, streaming chat (ertelenmişti)
- **Faz 5 — Kanallar + Ödeme (ertelendi, atlanmadı):** WhatsApp (Meta Cloud), iyzico kapora, email — daha sonraki sprint
