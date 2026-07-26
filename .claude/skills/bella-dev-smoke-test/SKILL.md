---
name: bella-dev-smoke-test
description: Use after ANY Bella code change before committing, pushing, or merging — bug fixes, refactors, new features, dependency updates, config changes. Triggers when bella-bug-fix-cycle reaches step 7, or when Gökhan says "test edelim", "dev'de aç", "smoke test", "doğrula", "kırıldı mı bak", "lint çek". Runs lint + typecheck + dev server + golden-path UI verification + API health pings. Distinct from generic verification-before-completion — this skill knows Bella's specific endpoints, env requirements, common breakage points (Anthropic streaming, Airtable race, Clerk session, calendar bypass), and what to watch for in DevTools/server logs. NEVER skip this step after code changes — memory recall ("muhtemelen çalışır") is not verification.
---

# Bella Dev Smoke Test

## Amaç

Bella'da kod değişikliğinden sonra commit/push/merge öncesi **gerçek doğrulama** yap. Lint + typecheck sessiz başarısızlıkları yakalar; dev server golden-path runtime kırılmalarını yakalar; DevTools + server log'ları yan etkileri yakalar.

**Neden:** Hata-logu 2026Q2'de "doğrulama atlama pattern'i" #2 nedendi. BD-UI-1-K1.5'te 22 gün fark edilmemiş localStorage regresyonu örneği — smoke test atlanmasaydı 22 gün değil 1 saat içinde yakalanırdı. "Memory'den hatırladığım bilgi" doğrulama yerine geçmez (2026-05-11 pattern).

## Tetikleyici Cümleler

- "Test edelim" / "dev'de aç bakalım" / "doğrula"
- "Smoke test çalıştır" / "kırıldı mı bak"
- "Lint çek" / "typecheck yap"
- "Commit etmeden önce kontrol et"
- `bella-bug-fix-cycle` Adım 7'sinde otomatik tetiklenir
- Herhangi bir Bella kod değişikliğinden sonra commit/push/merge ÖNCESI

## Tetikleyici DEĞİL

- Dokümantasyon değişikliği (markdown, comment) — opsiyonel
- Vault dosyası değişikliği — bu skill Bella için
- Read-only inceleme (kullanıcı sadece bakıyor)

## Smoke Test Akışı — 7 Aşama

### Aşama 1: Statik Kontroller (paralel çalıştır)

```bash
cd /Users/gkhngns/Desktop/PROJECTS/GAI/repos/bella

npm run lint
npx tsc --noEmit
```

**Beklenen:** Exit 0 her ikisi için.

**Hata aksiyonu:**
- Lint warning → değerlendir (kritik mi format mı)
- Lint error → DUR, düzelt, tekrar çalıştır
- TS error → DUR, düzelt (any cast yasak — root cause)

### Aşama 2: Dev Server Başlat (background)

Port 3000 önce temiz mi check et:

```bash
# Windows (PowerShell tool kullan)
netstat -ano | findstr :3000
```

Eğer kullanılıyorsa Gökhan'a sor (eski dev server çalışıyor olabilir, kapatma).

Temizse:
```bash
npm run dev  # background, run_in_background=true
```

Dev server hazır olana kadar bekle (~5-15s). Output'ta `Ready in <ms>ms` görünene kadar Monitor ile takip et.

### Aşama 3: .env.local Doğrulaması (read-only)

```bash
# .env.local dosyasının VARLIĞINI doğrula (içeriği OKUMA)
ls -la .env.local
```

**Yoksa:** Smoke test ilerlemez. Bitwarden'dan secret transfer pending (memory `project_bella_secrets_bitwarden_pending.md`). Gökhan'a bildir.

**Varsa:** İçeriği **asla** stdout'a basma, log'a yazma, rapora koyma. `.env*` değer yasağı (vault `kvkk-ve-musteri-verisi.md` + `delegation-detay.md`).

### Aşama 4: API Health Pings (golden path)

Her endpoint'i `curl` veya WebFetch ile test et (response status + body shape kontrolü):

| Endpoint | Method | Beklenen | Not |
|---|---|---|---|
| `http://localhost:3000/` | GET | 200, HTML chat UI | Ana sayfa render |
| `http://localhost:3000/api/staff` | GET | 200, staff list JSON | Airtable bağlantı kontrolü |
| `http://localhost:3000/api/appointments?date=YYYY-MM-DD` | GET | 200, appointment array | Airtable read |
| `http://localhost:3000/dashboard` | GET | 200 veya 302 sign-in | Clerk auth aktif mi |
| `http://localhost:3000/api/chat` | POST (örnek payload) | 200, streaming response | Anthropic API + tool use |

**Chat endpoint için örnek payload:**
```json
{
  "messages": [{"role": "user", "content": "merhaba"}],
  "sessionId": "smoke-test-<timestamp>"
}
```

Streaming response geliyorsa (data chunk'lar) → OK. Hata 500/429/401 → server log'a bak.

### Aşama 5: Browser-Side Smoke (UI etkileşim)

Eğer UI/component değişikliği yapıldıysa, Gökhan'a browser'da manuel test çağrısı yap:

```markdown
🔍 Browser smoke test gerek — http://localhost:3000 aç ve:
1. Chat'i başlat → "merhaba, randevu almak istiyorum" yaz
2. Asistan cevabı geliyor mu? Streaming chunk'lar görünüyor mu?
3. Tarih + saat + hizmet seç → "randevu oluştur" buton flow
4. DevTools (F12) > Console: kırmızı error var mı?
5. DevTools > Network: failed request var mı?

Sonucu söyle: tamam / şu hata var.
```

**Sen (Claude Code) browser'a erişemezsin.** Manuel adımları Gökhan yapar, sen rapor bekle.

### Aşama 6: Server Log Gözlemi

Dev server background'da çalışırken, BashOutput / Monitor ile son log'ları çek:

```
- Anthropic API hata? (429 rate limit, 401 auth, 500 server)
- Airtable hata? (404 base/table not found, 401 API key)
- Clerk session hata? (`auth() called without ClerkProvider`)
- Calendar bypass mesajları? (lib/calendar.ts:73 `staffId` log'u — beklenen)
- Unhandled rejection? React hydration warning?
```

**Beklenen:** İlk istek sonrası temiz log (sadece compile/ready mesajları + istek log'ları). Stack trace = DUR.

### Aşama 7: Cleanup + Rapor

Smoke test bittiğinde:

```bash
# Dev server'ı KillBash veya manuel Ctrl+C
# (Gökhan'a sor — eğer dev server'ı açık tutmak istiyorsa kapatma)
```

**Final rapor şablonu:**

```markdown
## Smoke Test Sonucu — [tarih, değişiklik özeti]

### ✅ Geçen
- Lint: clean
- TS typecheck: clean
- Dev server: Ready in <ms>ms
- API pings: 5/5 OK
- Server log: temiz

### 🟡 Dikkat
- [Warning/şüphe maddeleri, kritik değil ama bilinmesi gereken]

### 🔴 Başarısız
- [Eğer varsa: hangi adım, ne hata, kanıt]

### Sonraki adım
- Tüm ✅ → commit'e devam (`bella-bug-fix-cycle` Adım 8)
- 🔴 varsa → fix turu açılır, smoke test baştan
```

## Yaygın Bella Kırılma Noktaları (Bunlara Özel Dikkat)

| Senaryo | Belirti | Çözüm yolu |
|---|---|---|
| **Anthropic streaming kırıldı** | Chat response 500 / kesintili | `app/api/chat/route.ts` stream loop, API key, cache_control config |
| **Airtable rate limit** | 429 / timeout | Production'da gerçek yük yok ama smoke test'te 5+ req/saniye çakarsa belirti |
| **Clerk session boş** | Dashboard 302 → sign-in loop | `ClerkProvider` layout'ta var mı, env `NEXT_PUBLIC_CLERK_*` |
| **Calendar bypass devre dışı** | Multi-staff slot çakışması | `lib/calendar.ts:71-78` `staffId` koşulu, mimari karar — **dokunma** |
| **Booking-lock race** | Aynı slot iki kez book | `lib/booking-lock.ts` atomik değil (kabul), smoke test'te tek istek atılırsa görünmez |
| **Rate limit reset** | 20 req/dk aştın | Test sırasında bucket dolduysa, dev server restart |
| **TZ kayması** | Randevu saati 3 saat farkla görünür | `app/api/chat/route.ts:274-316` Europe/Istanbul sabit, .env.local TZ değişikliği yasak |
| **localStorage chat history regress** | Refresh sonrası geçmiş kayboldu | BD-UI-1-K1.5'te düzeltildi, regresyon için F12 > Application > localStorage `bella-chat-history` |

## Davranış Kuralları

### Lint warning'i kritik gibi muamele
"Sadece warning" deyip atlamak hata-logu pattern'i. Her warning rapora yazılır, değerlendirme Gökhan'a bırakılır.

### `any` cast TS hatasını "düzeltmez"
TS error'a `as any` yapıştırıp geçmek yasak (vault kuralı + writing skills patterns). Root cause düzelt.

### Browser test → Gökhan yapar
Sen browser'a erişemezsin. UI smoke test adımlarını **listele**, sonuç bekle. "Muhtemelen çalışır" deme.

### .env değer yasağı — istisna yok
Smoke test sırasında .env içeriği görmen GEREKMEZ. Varlık kontrolü yeter. İçerik okuma talebi → DUR, vault `kvkk-ve-musteri-verisi.md` kuralı.

### Smoke test atlama yasak (mentor disiplini)
Memory'den "geçen sefer çalışıyordu" denilemez. Her code değişikliği sonrası smoke test geçer. "Hızlı düzeltme, smoke test atla" → red flag, durduruluyor.

### Dev server background discipline
Dev server background'da kalıyorsa, smoke test bitiminde **Gökhan'a sor** kapatayım mı diye. Otomatik kill etme — Gökhan başka iş için kullanıyor olabilir.

## Anti-Pattern'ler

| Pattern | Neden kötü | Doğrusu |
|---|---|---|
| `npm run dev` çalıştır, output kontrol etme | Dev server hata verirse görünmez | Monitor ile Ready mesajını bekle |
| API pings sadece status code → 200 OK demek yeter | Response body shape bozulmuş olabilir | Body JSON parse + key kontrolü |
| Server log'a bakmamak | Sessiz hata (yakalanan exception, log'lanmış ama yan etkili) | `tail` veya BashOutput ile son 50 satır |
| Smoke test'i yapmadan "muhtemelen çalışır" | Memory drift + doğrulama atlama pattern | "Yapılmadıysa yapılmamıştır" — atlama yok |
| Browser smoke test'i Claude yapacak sanmak | Browser yok, çalışmaz | Gökhan'a görev listesi sun |

## Bella-Özel Bağlam

- **Repo:** `/Users/gkhngns/Desktop/PROJECTS/GAI/repos/bella/`
- **Dev URL:** `http://localhost:3000`
- **API base:** `/api/<endpoint>`
- **Auth:** Clerk (dashboard sayfaları korunur, public chat değil)
- **Dış servisler:** Anthropic API, Airtable, Google Calendar, Twilio
- **Mimari kararları:** memory `project_bella_mimari_kararlari.md` — calendar bypass + 6 diğer kasıtlı karar, **dokunma**

## İlgili Skill'ler

- `bella-bug-fix-cycle` — Adım 7 bu skill'i otomatik tetikler
- `bella-onay-gateway` — smoke test geçtikten sonra commit/push onayı için
- `vault-hl-kayit` — smoke test'te bir kırılma çıktıysa anlamlı+ hata kaydı
