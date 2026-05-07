# Bella — AI Randevu Robotu

Güzellik merkezleri için yapay zeka destekli randevu asistanı. Bella; müşteriyle Türkçe sohbet ederek hizmet seçimi, personel atama, müsaitlik kontrolü, randevu oluşturma, iptal ve değişiklik akışlarını otonom yürütür; arka planda Airtable + Google Calendar + Twilio SMS ile entegre çalışır. GunesAI ajansının demo / template ürünüdür. Production: https://bella-randevu-robotu.vercel.app

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript 5
- **AI:** Anthropic SDK — `claude-sonnet-4-6` (tool-use + streaming, prompt cache)
- **Veri:** Airtable (Randevular, Staff, CustomerNotes tabloları)
- **Auth:** Clerk (`/dashboard(.*)` korumalı)
- **Takvim:** Google Calendar (OAuth refresh token, freebusy + events)
- **SMS:** Twilio (onay + 2 saat öncesi hatırlatma)
- **UI:** Tailwind CSS, shadcn-style local components, lucide-react, recharts (gelir trendi & heatmap)

## Lokal Kurulum

```bash
git clone <repo-url>
cd ai-randevu-robotu
npm install
cp .env.local.example .env.local   # değerleri doldur (aşağıdaki tabloya bak)
npm run dev
```

Dev server varsayılan `http://localhost:3000`. Dashboard için `/sign-in` üzerinden Clerk hesabı gerekir.

## Environment Değişkenleri

`.env.local` dosyasında tanımlanır. **Hiçbir değer repo'ya commit'lenmemelidir.**

| Değişken | Açıklama |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Claude API anahtarı (chat + insights endpoint'leri kullanır) |
| `AIRTABLE_API_KEY` | Airtable Personal Access Token |
| `AIRTABLE_BASE_ID` | Bella base ID'si (`app...`) |
| `AIRTABLE_TABLE_NAME` | Randevular tablosunun adı (örn. `Randevular`) |
| `AIRTABLE_STAFF_TABLE` | (Opsiyonel) Staff tablosu adı — varsayılan `Staff` |
| `AIRTABLE_NOTES_TABLE` | (Opsiyonel) CustomerNotes tablosu adı — varsayılan `CustomerNotes` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (frontend) |
| `CLERK_SECRET_KEY` | Clerk secret key (backend, middleware) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in path — `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up path — `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Sign-in sonrası yönlenecek path — `/dashboard` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | Calendar erişimi için refresh token |
| `GOOGLE_CALENDAR_ID` | Hedef takvim ID'si (varsayılan `primary`) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio gönderici numara (E.164, örn. `+1...`) |
| `CRON_SECRET` | `/api/send-reminders` endpoint'ini koruyan rastgele string |

## Deploy

- **Production:** Vercel — `main` branch'e push otomatik deploy. Hotfix akışı: feature branch → PR → main merge → Vercel auto-deploy.
- **Cron — SMS hatırlatma:** `/api/send-reminders?secret=<CRON_SECRET>` endpoint'i randevudan 2 saat önce SMS gönderir (±20 dk window). Vercel Hobby planı günde 1 cron ile sınırlı olduğundan dış servis **cron-job.org** her 15–30 dakikada bir tetikler.
- **Vercel env değişkenleri:** Tüm `.env.local` değişkenleri Vercel project settings → Environment Variables altında tanımlı olmalı.

## Mimari Notlar

- **App Router yapısı:** Public sayfa `/` (Bella chat) + protected dashboard `/dashboard`. API route'ları `app/api/` altında.
- **Auth:** [middleware.ts](middleware.ts) Clerk ile `/dashboard(.*)` matcher'ını korur; API route'ları endpoint başında `auth()` ile kullanıcı kontrolü yapar (chat hariç — public).
- **Veri katmanı:**
  - [lib/airtable.ts](lib/airtable.ts) — Randevular CRUD + filter
  - [lib/staff.ts](lib/staff.ts) — Personel CRUD, hizmet bazlı filtre
  - [lib/customer-notes.ts](lib/customer-notes.ts) — Müşteri notları (VIP/Alerji/Zor/Yeni/Kayıp etiketli)
- **Chat akışı:** [app/api/chat/route.ts](app/api/chat/route.ts) — Anthropic SDK `messages.stream` üzerinde tool-use döngüsü; `text_delta` chunk'lar HTTP body'sine stream edilir; system prompt + tool tanımları `cache_control: ephemeral` ile cache'lenir.
- **Google Calendar opsiyonel sync:** [lib/calendar.ts](lib/calendar.ts) — `staffId` verilmediğinde GCal `freebusy.query` ile slot kontrolü yapar; `staffId` verildiğinde GCal bypass + Airtable bazlı çakışma kontrolü ([lib/booking-lock.ts](lib/booking-lock.ts)) çalışır. Calendar event oluşturma hatası kritik değildir, Airtable kaydı her durumda yazılır.
- **Twilio SMS:** Onay mesajı `book_appointment` başarısında, hatırlatma mesajı cron tetiklemesinde gönderilir. SMS hatası randevu akışını bloklamaz.
- **Rate limiting:** [lib/rate-limit.ts](lib/rate-limit.ts) — chat endpoint'i için IP başına 20 req/dk (in-memory bucket; Vercel multi-instance dağıtımda sınırlıdır).
- **İşletme yapılandırması:** [config/client.ts](config/client.ts) — hizmet listesi, fiyat, süre, çalışma saatleri tek dosyada. Yeni müşteriye uyarlamak için bu dosya + `.env.local` yeterli.

## İlgili Dokümantasyon

- [docs/SISTEM-REHBERI.md](docs/SISTEM-REHBERI.md) — Sistem rehberi
- [docs/MUSTERI-MULAKAT-SORULARI.md](docs/MUSTERI-MULAKAT-SORULARI.md) — Yeni müşteri keşif/onboarding mülakat soruları
- [docs/superpowers/plans/](docs/superpowers/plans/) — Faz planları, handoff notları, roadmap
