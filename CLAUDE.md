# CLAUDE.md — Bella Repo Rehberi

> Bu dosya Claude Code'un her oturumda otomatik yüklediği proje rehberidir.
> Stratejik anayasa için: **`/Users/gkhngns/Desktop/PROJECTS/GAI/vault/CLAUDE.md`** (vault — vizyon, ürün katalog, delegation, KVKK).
> Workspace anayasa için: **`/Users/gkhngns/Desktop/PROJECTS/GAI/CLAUDE.md`** (repo haritası, çalışma kuralları özeti).
> Teknik kurulum (stack, env tablosu, deploy) için: **[README.md](README.md)**.
> Bu dosya ikisini tekrarlamaz; Claude'un proje üzerinde çalışırken hızla bağlama girmesi için gereken özetleri verir.
>
> Son güncelleme: 2026-07-26 (KRİTİK: Airtable tarih filtresi fix'i §5.9 — çift rezervasyon koruması tümüyle ölüydü; ayrıca BD-UI-TOKEN token katmanı §5.8, slot-hold smoke test 11/11)

---

## 1. Oturum Açılış Checklist

Yeni oturumda Claude şu sırayı izler:

1. Bu dosyayı oku (zaten otomatik yüklendi)
2. `git status` + `git log --oneline -6` → son state, working tree temiz mi
3. `git tag --sort=-creatordate | head -5` → geri dönüş ankrajları
4. `git branch -a` → açık feature/fix branch'leri
5. Kullanıcı talimatını bekle — özellikle "BD<N>" turlarında talimat metni iskeleti getirir

Kullanıcı (Gökhan) handoff metni vermeden iş başlatma. Eski handoff dosyalarındaki "BEKLEMEDE" durumları stale olabilir — git'ten doğrula.

## 2. Stack — Tek Bakışta

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TS 5 |
| AI | Anthropic SDK `^0.96.0` — model `claude-sonnet-4-6` |
| Veri | Airtable (`Randevular`, `Staff`, `CustomerNotes`) |
| Auth | Clerk (`/dashboard(.*)` korumalı) |
| Takvim | Google Calendar (OAuth refresh token) |
| SMS | Twilio (onay + 2 saat öncesi hatırlatma) |
| UI | Tailwind, shadcn-style local components, recharts |
| Fontlar | `next/font/google` (Cormorant Garamond + DM Sans), build'de self-host + preload, `latin-ext` subset zorunlu (Türkçe karakterler) |
| Tema | Panel: 8 palet (`[data-theme]`) · Müşteri yüzeyi: `--c-*` tenant token'ları (bkz §5.8) |
| Deploy | Vercel (`main` push = auto-deploy) |

Detay env tablosu + lokal kurulum için **[README.md](README.md)** (kök).

## 3. Komutlar

```bash
npm run dev      # Dev server: http://localhost:3000
npm run build    # Production build (deploy öncesi sanity check)
npm run start    # Production server (build sonrası)
npm run lint     # ESLint (next lint)
npx tsc --noEmit # Type check (lint dışı, manuel)

# Slot/çakışma regresyon testi (T1-T5 salt okunur; T6 gerekirse geçici kayıt
# açıp finally'de kalıcı siler). Availability veya airtable.ts değişince koş.
npx tsx scripts/smoke-slot-hold.mts

# Airtable tarih filtresi teşhisi (tamamen salt okunur)
npx tsx scripts/diag-airtable-date.mts
```

Geri dönüş (rollback):
```bash
git reset --hard v1.1-bd1-temizlik   # BD3 öncesi state
git reset --hard v1.0-bd1-baseline   # BD1+BD2 öncesi state
git reset --hard v1.0-starter        # Faz 1 MVP state
```

## 4. Dizin Haritası — Kritik Dosyalar

**API rotaları** ([app/api/](app/api/)):
- [chat/route.ts](app/api/chat/route.ts) — Bella sohbet endpoint'i, Anthropic streaming + tool-use loop
- [appointments/route.ts](app/api/appointments/route.ts) — Dashboard CRUD (GET/POST), Clerk auth
- [appointments/[id]/route.ts](app/api/appointments/[id]/route.ts) — Dashboard PATCH (drag-drop) + DELETE
- [appointments/[id]/no-show/route.ts](app/api/appointments/[id]/no-show/route.ts) — No-show işaretleme
- [send-reminders/route.ts](app/api/send-reminders/route.ts) — Cron: 2 saat öncesi SMS, Vercel cron `Authorization: Bearer $CRON_SECRET` header ile auth (vercel.json crons her 30 dk)
- [insights/route.ts](app/api/insights/route.ts) — InsightsPanel için Anthropic özetleme
- [staff/route.ts](app/api/staff/route.ts) — Personel CRUD
- [customer/[phone]/notes/route.ts](app/api/customer/[phone]/notes/route.ts) — Müşteri notları
- [export/route.ts](app/api/export/route.ts) — CSV export

**Veri katmanı** ([lib/](lib/)):
- [airtable.ts](lib/airtable.ts) — Randevular CRUD, `recordToAppointment` mapper, Link/Lookup field handling
- [staff.ts](lib/staff.ts) — Personel CRUD + `listActiveStaffForService`
- [customer-notes.ts](lib/customer-notes.ts) — Etiketli notlar (VIP/Alerji/Zor/Yeni/Kayıp)
- [calendar.ts](lib/calendar.ts) — GCal availability + event CRUD; **staffId verildiyse availability bypass** (bkz §5)
- [booking-lock.ts](lib/booking-lock.ts) — Race-condition double-check (Airtable read, atomic değil)
- [rate-limit.ts](lib/rate-limit.ts) — In-memory IP bucket (chat 20 req/dk; multi-instance'ta sınırlı)
- [sms.ts](lib/sms.ts) — Twilio wrapper, hata randevuyu bloklamaz
- [ai-tools.ts](lib/ai-tools.ts) — Anthropic tool şemaları + SYSTEM_PROMPT
- [types.ts](lib/types.ts) — `Appointment`, `ServiceType`, `WORKING_HOURS`
- [brand.ts](lib/brand.ts) — tenant marka bloğunu `--c-*` CSS değişkenlerine çevirir; `app/layout.tsx` bunu `<html>` üzerine basar (bkz §5.8)

**Yapılandırma** ([config/](config/)):
- [config/clients/](config/clients/) — her tenant'ın işletme adı, asistan adı, hizmet listesi (isim/süre/fiyat), çalışma saatleri ayrı dosyada (`<slug>.ts`)
- [config/client.ts](config/client.ts) — wrapper, `NEXT_PUBLIC_CLIENT_ID` env'e göre tenant seçer, default `bella`
- **Yeni müşteri için:** `config/clients/<slug>.ts` kopyala (Bella'yı baz al) + wrapper map'e ekle + `NEXT_PUBLIC_CLIENT_ID=<slug>` Vercel build env set et (Yol A — bkz §5.2)

**Middleware** ([middleware.ts](middleware.ts)):
- Clerk `/dashboard(.*)` matcher

## 5. Mimari Kararlar — Bilmesi Gerekenler

### 5.1 Calendar Bypass (Faz 5.5 — BD3-B1-KESIF'te derinleştirildi)

**Karar:** [lib/calendar.ts:71-78](lib/calendar.ts) — `getAvailableSlots(date, duration, staffId?)` çağrısında `staffId` verildiyse GCal `freebusy.query` atlanır, yerine [getStaffAwareSlots](lib/calendar.ts) (Airtable bazlı) çalışır.

**Gerekçe:** Tek `GOOGLE_CALENDAR_ID` kullanılıyor. Ayşe'nin 14:00 randevusu GCal freebusy'de "busy" görünür → Mehmet için 14:00 slotu yanlışlıkla kapanır. Multi-staff salonda her staff'ın slot'u bağımsız olmalı, bu yüzden staff-mode'da Airtable source-of-truth.

**Önemli ayrım:** Bypass sadece **availability okuma**. `createCalendarEvent` her durumda çağrılıyor — yani GCal yazımı yapılıyor (event title'a `(staff_name)` ekleniyor sadece chat book yolunda; reschedule + dashboard yollarında staff bilgisi title'a eklenmiyor — bilinen tutarsızlık).

**Kaldırılırsa risk:** Multi-staff slot ayrımı bozulur. Kaldırma kararı multi-calendar refactor'üne bağlı (Staff başına ayrı `calendarId` field). Ayrıntı: [docs/superpowers/plans/2026-04-20-faz5.5-handoff.md:29](docs/superpowers/plans/2026-04-20-faz5.5-handoff.md#L29).

### 5.2 Multi-Tenant — Yol A Loader (Aşama 0-1)

**Karar (BD-INFRA-MT-LOADER, 2026-05-17):** [config/client.ts](config/client.ts) artık **wrapper** — `NEXT_PUBLIC_CLIENT_ID` env'e göre [config/clients/<slug>.ts](config/clients/) modülünden re-export eder. Her tenant kendi dosyasında, 12 import noktası (`@/config/client`) dokunulmadan kalır.

**Yol A felsefesi:** Tek tenant = tek deploy. Her müşteri = ayrı Vercel projesi (build-time `NEXT_PUBLIC_CLIENT_ID=<slug>` set edilir) + ayrı Airtable base + ayrı `.env.local`. Runtime'da tenant seçimi yok.

**Yapı:**
- `config/clients/bella.ts` — Bella Güzellik Salonu tenant config
- `config/client.ts` — wrapper (clients map + env switch + warning fallback)
- Default fallback: `bella` (env yokken)

**Aşama 2 (Yol C runtime migration) eşiği:** 8-10 müşteri. O zaman tek deploy + runtime tenant seçimi (subdomain veya path-based routing) gelir. Strateji dokümanı: vault `wiki/teknik/bd-infra-multitenant.md` (Aşama 2) + `bd-infra-multitenant-yol-a-onboarding.md` (Aşama 0-1).

**Önceki tasarım:** Tek `config/client.ts` direkt export — `v1.9.2-mt-loader-baseline` tag'inden önce. Rollback için bu tag'e dönülebilir.

### 5.3 Booking-Lock Atomik Değil

[lib/booking-lock.ts:1-5](lib/booking-lock.ts) — `isSlotStillAvailable` book çağrısından hemen önce Airtable'dan tekrar okur. Tam atomic değil; gerçek atomiklik için Redis/Upstash gerekli. Bella ölçeğinde (günde 10-30 randevu) yeterli kabul edilmiş, BD4+ kuyruğunda.

### 5.4 Rate Limit In-Memory

[lib/rate-limit.ts](lib/rate-limit.ts) — Vercel multi-instance dağıtımda her instance kendi bucket'ını tutar; gerçek koruma değil, abuse smoothing. Upstash Redis geçişi BD4+ kuyruğunda.

### 5.5 Streaming Chat (Faz 6)

[app/api/chat/route.ts:340-407](app/api/chat/route.ts) — `client.messages.stream` üzerinde tool-use döngüsü. `text_delta` chunk'lar ReadableStream ile HTTP body'sine yazılıyor. System prompt + tools `cache_control: ephemeral` ile cache'leniyor (5 dk TTL).

### 5.6 Saat Dilimi: Europe/Istanbul Sabit

[app/api/chat/route.ts:274-316](app/api/chat/route.ts) — UTC+3 sabit (Türkiye 2016'dan beri DST yok). Her chat çağrısında "BUGÜN BAĞLAMI" bloğu system prompt'a inject ediliyor (göreceli tarih halüsinasyonunu önlemek için).

### 5.9 Airtable Tarih Filtresi — `DATESTR()` ZORUNLU (2026-07-26)

**Kural:** Airtable formülünde tarih karşılaştırırken **asla** `{date} = "YYYY-MM-DD"` yazma. `DATESTR({date}) = "YYYY-MM-DD"` kullan.

**Neden:** `date` alanı Airtable'da **Date tipinde**. REST API kaydı okurken değeri string döndürür (`"2026-05-26"`), bu yüzden kod doğru görünür — ama formül motorunda alan bir tarih nesnesidir ve string ile eşitlik **hiçbir zaman tutmaz**. Sorgu hata vermez, sessizce **boş dizi** döner.

**Bunun maliyeti:** [getAppointmentsByDate](lib/airtable.ts) bu yüzden hiçbir randevu bulamıyordu → `isSlotStillAvailable` hiç çakışma görmüyor, `getStaffAwareSlots` her slotu boş sanıyor → **aynı saate sınırsız randevu alınabiliyordu**. GCal auth da ölü olduğu için availability zaten bu yola düşüyordu, yani koruma tümüyle devre dışıydı. Handoff'ta aylardır "14:00 dolu ama seçilebiliyor" diye duran bulgunun asıl sebebi buydu; önceki turlarda komşu davranışlar düzeltilmiş ama okuma katmanı bozuk kaldığı için bulgu kapanmamıştı.

**Etkilenmeyen:** `listAppointments` — `IS_AFTER`/`IS_BEFORE` gerçek tarih fonksiyonları, string argümanı tarihe çevirir. Panel bu yüzden randevuları görüyordu; asimetri teşhisi geciktiren şeydi.

**Regresyon testi:** `npx tsx scripts/smoke-slot-hold.mts` — T6 tam olarak bunu yakalar.

### 5.8 Müşteri Yüzeyi Token Katmanı — Tenant Markası (BD-UI-TOKEN, 2026-07-26)

**Sorun:** Panelde 460 `var(--*)` kullanımı vardı, müşteriye bakan yüzeyde (`app/page.tsx` + `components/chat/`) **sıfır** — 68 hex elle gömülüydü. Multi-tenant altyapısı vardı ama yeni müşteri Bella'nın mor-kremini almak zorundaydı.

**Karar:** İki ayrı token uzayı:
- **Panel** → `[data-theme="..."]` altındaki 8 palet. Operatör seçer, `localStorage`'da tutulur. Dokunulmadı.
- **Müşteri yüzeyi** → [globals.css](app/globals.css) `:root` altında `--c-*` seti. Kaynağı `config/clients/<slug>.ts` içindeki `brand` bloğu; [lib/brand.ts](lib/brand.ts) camelCase→`--c-kebab-case` çevirir, [layout.tsx](app/layout.tsx) `<html>` üzerine **inline** basar (ilk boyamada doğru).

**Namespace kuralı — önemli:** Inline style `<html>`'e bindiği için `[data-theme]` kurallarını ezer. Bu yüzden marka bloğundan **sadece `--c-*` basılır**, panel değişkeni (`--bg`, `--gold` …) asla. Bu ayrımı bozma.

**Font sınırı:** `fontSerif`/`fontSans` bilerek config'de yok — font yüklemesi `next/font` ile build-time. Tenant font değiştirecekse `layout.tsx`'e de satır eklenmeli.

**Kanıt:** `NEXT_PUBLIC_CLIENT_ID=demo` ([config/clients/demo.ts](config/clients/demo.ts)) → başlık, marka rengi, avatar emoji ve panel açılış paleti tümüyle değişiyor. Bella tarafında geçiş öncesi/sonrası piksel farkı 0.

**Yan kapanışlar:** panel FOUC (tema mount sonrası okunuyordu), `.theme-transition *` kalıcı transition, `Courier New`, ölü `welcomeEmoji`, tanımsız `pulse` keyframe.

### 5.7 Hatalı GCal/SMS Asla Bloklamaz

GCal create hatası, SMS gönderim hatası — yakalanır, loglanır, randevu Airtable'a yine yazılır. Tek kritik path: Airtable. Bu kasıtlı.

## 6. Faz Takvimi & Branch Durumu

| Faz | Durum | Tag | Branch |
|---|---|---|---|
| Faz 1 | Tamam (MVP+) | `v1.0-starter` | `faz-1-kritik-buglar` (origin'de, kapatılmadı) |
| Faz 5.5 | Tamam (personel entegrasyonu) | — | `faz-1-kritik-buglar` (içine merge edildi) |
| Faz 6 | Tamam (streaming + heatmap + cache + chart) | — | `faz-6-analiz` (origin'de, kapatılmadı) |
| BD1 | Tamam (3 chore commit) | `v1.0-bd1-baseline` (öncesi) → `v1.1-bd1-temizlik` (sonrası) | `bd1-temizlik` (origin'de) |
| BD2 | Tamam (.gitignore broaden) | `v1.1-bd1-temizlik` | main |
| Faz 7 | **Dormant** (strateji pivotu sonrası askıda) | — | `faz-7` (boş, plan dosyası untracked) |
| BD3 | Tamam (tek aday A1: Chat localStorage Faz 6 regression fix, prod canlı 2026-05-15) | `v1.7.1-bd3-baseline` (öncesi) → `v1.8-bd3-chat-localstorage` (sonrası) | `bd3-chat-localstorage` (merge sonrası silindi) |
| BD-INFRA-SDK | Tamam (Anthropic SDK `^0.33.1` → `^0.96.0` prod canlı 2026-05-16, 17 ay açık kapandı) | `v1.8.1-bd-infra-sdk-baseline` (öncesi) → `v1.9-bd-infra-sdk-v096` (sonrası) | `bd-infra-sdk-upgrade` (merge sonrası lokal+remote duruyor, toplu cleanup turunda silinir) |
| BD-INFRA-MT-LOADER | Tamam (multi-tenant Yol A iskelet loader prod 2026-05-17, single-tenant tasarım Aşama 0-1 Yol A'ya geçti) | `v1.9.2-mt-loader-baseline` (öncesi) → `v1.10-bd-infra-mt-loader` (sonrası) | `bd-infra-mt-loader` (merge sonrası toplu cleanup turunda silinir) |
| BD-INFRA-3-CRON-SECRET | Tamam (Vercel cron auth pattern `?secret=` query → `Authorization: Bearer` header geçişi + `vercel.json` crons array, prod canlı 2026-05-19; BD-INFRA-3 toplu askıları tümüyle kapandı) | `v1.11.1-cron-secret-baseline` (öncesi) → `v1.12-bd-infra-3-cron-secret` (sonrası) | main (feature branch'siz) |
| BD-UI-SLOT-HOLD | Tamam — smoke test 11/11 geçti, main'e merge edildi | `v1.13.1-slot-hold-baseline` (öncesi) | `BD-UI-SLOT-HOLD` (merge edildi) |
| BD-UI-TOKEN | Tamam (müşteri yüzeyi token katmanı + tenant marka, §5.8), main'e merge edildi | `v1.13.2-token-baseline` (öncesi) → `v1.14-bd-ui-token` | `BD-UI-TOKEN` (merge edildi) |
| FIX-AIRTABLE-DATE | **Kritik** — tarih filtresi hiçbir randevuyu bulamıyordu, çift rezervasyon açıktı (§5.9). main'de, **push bekliyor** | → `v1.15-airtable-date-fix` | `fix-airtable-date-filter` (merge edildi) |
| BD4+ | Deferred — bkz §7 |

**Branch akışı kuralı:** Feature/fix → ayrı branch → atomik commit'ler → onay → main merge → tag → push. Branch'ler `--merged main` olunca toplu cleanup (`git branch -d <isim>` + `git push origin --delete <isim>`).

**Bilinen aktif branch'ler (origin'de duruyor):**
- `faz-1-kritik-buglar` — eski, ana commit'leri merge edildi
- `faz-6-analiz` — Faz 6 ana branch'i, `13d54cd` ile main'e merge
- `faz-7` — boş, dormant
- `bd1-temizlik` — BD1 commit'leri, main'e merge sonrası ayrı cleanup turu için tutulmuş

Bu branch'leri silmek için **kullanıcı izni olmadan dokunma** — özellikle origin'de duran feature/faz branch'leri tarihsel kayıt olarak tutuluyor. Toplu cleanup turu açılırsa `--merged main` koşulu ile batch silinir (bkz BD3-A1 turunda `bd3-chat-localstorage` örneği: merge sonrası KRİTİK ayrı onayla local + remote tek komutta silindi).

## 7. Deferred Technical Debt (BD4+ kuyruğu)

Bunlar şu an sıra dışı — pilot 1 sözleşmesi öncesi runtime stability + multi-tenant prep + BD-UI redesign turları öncelikli (vault `wiki/urunler/bella-entegrasyon-stratejisi.md` §C pilot v1 önkoşulları). Sırayla:

1. **Build-time data collection fix** — Insights endpoint build sırasında Airtable çağırıyor mu kontrol et (statik generation hatası riski).
2. **Rate limit Upstash geçişi** — multi-instance koruma için ([lib/rate-limit.ts](lib/rate-limit.ts) replace).
3. **Booking-lock atomic** — Redis SETNX veya benzeri. Bella ölçeğinde gerekli olmayabilir, müşteri yoğunluğu artarsa öncelik kazanır.
4. **Multi-tenant Aşama 2 (Yol C migration)** — `config/client.ts` wrapper'dan runtime config-route'a dönüşüm, Airtable base/env per-tenant resolution. Aşama 0-1 (Yol A loader) BD-INFRA-MT-LOADER turunda canlandı (`v1.10-bd-infra-mt-loader`, 2026-05-17). Migration eşiği: 8-10 müşteri.
5. **Calendar bypass kaldırma** — multi-calendar (Staff.calendarId) refactor'ü gerekli, bkz §5.1 ve [docs/superpowers/plans/2026-04-20-faz5.5-handoff.md](docs/superpowers/plans/2026-04-20-faz5.5-handoff.md).
6. **Faz 7 landing entegrasyonu** — strateji pivotu sonrası askıda, kullanıcı kararına bağlı.

## 8. Çalışma Kuralları

### Dil
- **Tüm kullanıcı yazışmaları + commit mesajları + UI metinleri Türkçe.**
- Kod yorumları Türkçe veya İngilizce — proje boyunca karışık (mevcut), tutarlılık aranmıyor.
- Dosya/değişken/fonksiyon isimleri **İngilizce** (camelCase, kebab-case dosyalarda).

### Commit
- **Atomik:** Her commit tek değişiklik. Mixed commit yapma.
- **Format:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `merge:`).
- **Co-author:** `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` (HEREDOC ile, vault git-akisi.md'de tanım).
- Kullanıcı **açık onay vermeden commit etme**. Onay sonrası push da ayrı onay ister.

### Push & Merge
- Feature branch → main merge **her zaman fast-forward** veya merge commit (kullanıcı tercih ediyor).
- Tag at: turun başlangıç ve bitiş ankrajları (örn. `v1.0-bd1-baseline` → `v1.1-bd1-temizlik`).
- Branch silme: kullanıcı onayı olmadan **yapma** (özellikle origin'de olanları).
- `--no-verify` veya `-i` flag'leri **yasak**.

### Geri Dönüş
- Her tur öncesi anchor tag at. Her tur sonrası bitiş tag'i at.
- `v1.0-bd1-baseline` ve `v1.1-bd1-temizlik` BD3 boyunca dokunulmaz — geri dönüş ankrajı.

### Onay Gerektirenler (vault'tan)
- Kritik: deploy, veri, API key, silme, 3+ dosya değişikliği, DNS → **HER ZAMAN sor**
- Stratejik: kütüphane, fiyat, ton, yeni sayfa → **plan sun, onay al**
- Taktiksel: isim, CSS, küçük refactor → **yap, raporla**

Detay: vault'taki `operasyon/kurallar/delegation-detay.md`.

## 9. Güvenlik & Yasaklar

- **`.env.local` değerleri ASLA repo'ya, log'a, rapora yazılmaz.** Env değişken **isimleri** OK, değerleri yasak.
- **`.claude/` directory gitignore** (BD2 broaden); **istisna:** `.claude/skills/` track edilir (skill katmanı versiyon kontrolünde, workspace ↔ repo sync için). Diğer `.claude/*` alt-yolları local-only state.
- **Kullanıcı verisi (telefon, isim) log'a yazma** — KVKK riski. Mevcut error log'ları zaten generik mesaj kullanıyor.
- **`/api/airtable-test` BD1'de silindi** — auth'suz Airtable canlı yazıyordu. Bu pattern tekrar ortaya çıkarsa **derhal flag**.
- **Calendar bypass mantığını dokunma** — kasıtlı tasarım kararı (§5.1). Değişiklik için ayrı plan turu gerekli.

## 10. Hata Logu Pratiği

Hatalar + pattern'ler vault'taki `/Users/gkhngns/Desktop/PROJECTS/GAI/vault/operasyon/hata-logu.md` dosyasına eklenir (HL-N görev koduyla). Format:
```
- **YYYY-MM-DD** — konu — sebep — çözüm
```

**Commit politikası (2026-05-14 sonrası):** Vault artık git'te (`gunesai-vault` GitHub private repo). Hata-logu **append-only** kuralı korunur — eski kayıtlar silinmez, sadece eklenir. Haftalık retro turunda biriken HL kayıtları `docs(hata-logu): hafta NN HL kayıtları` formatında toplu commit'lenir. Vault git akışı detayı: `/Users/gkhngns/Desktop/PROJECTS/GAI/vault/operasyon/kurallar/vault-bakim-rituelleri.md` §4.

## 11. CLAUDE.md Güncelleme Tetikleyicileri

Bu dosya yaşayan dokümandır. Şu durumlarda Claude güncelleme önerir (**sormadan değiştirmez** — plan sunar, onay alır):

- **Mimari karar değişti** — özellikle §5 "Mimari Kararlar"daki bir kalemin davranışı/gerekçesi değiştiyse (calendar bypass, single-tenant, lock atomiklik, rate limit, streaming, vb.)
- **Faz tamamlandı veya yeni faz başladı** — §6 "Faz Takvimi & Branch Durumu"
- **BD turu kapandı** — yeni anchor tag, branch state değişikliği
- **Deferred kuyruktan iş işlendi** — §7 "Deferred Technical Debt"
- **Yeni kritik dosya/dizin eklendi** — §4 "Dizin Haritası" (yeni API rotası, yeni lib modülü)
- **Stack değişti** — dependency upgrade, yeni paket, model değişikliği (§2)
- **Yeni env değişkeni eklendi** — README ile beraber CLAUDE.md'de işaret
- **Branch/git konvansiyonu değişti** — §6 ve §8
- **Bilinen tutarsızlık/borç düzeltildi** — §5'te alıntı geçen bir hata fix edildi (örn. dashboard PATCH staffId-blind conflict check, GCal title staff inconsistency)
- **Frontmatter "Son güncelleme" tarihi** her güncelleme sonrası set edilir

**Drift kontrol disiplini:** Claude her oturum başında bu dosyayı okuduğunda yukarıdaki listeyi kontrol eder. Bu oturumda yaptığı bir değişiklik listedeki bir tetikleyiciye giriyorsa "CLAUDE.md güncellenmeli mi?" sorusunu açıkça flag eder.

## 12. İlgili Dokümantasyon

- **[README.md](README.md)** — teknik kurulum, env tablosu, deploy
- **[docs/SISTEM-REHBERI.md](docs/SISTEM-REHBERI.md)** — sistem rehberi
- **[docs/MUSTERI-MULAKAT-SORULARI.md](docs/MUSTERI-MULAKAT-SORULARI.md)** — yeni müşteri keşif soruları
- **[docs/superpowers/plans/](docs/superpowers/plans/)** — Faz planları + handoff'lar (özellikle Faz 5.5 ve roadmap)
- **`/Users/gkhngns/Desktop/PROJECTS/GAI/vault/CLAUDE.md`** — vault stratejik anayasa (vizyon, ürün katalog, çalışma felsefesi)
- **`/Users/gkhngns/Desktop/PROJECTS/GAI/vault/operasyon/kurallar/`** — detay kural modülleri (git-akisi, delegation-detay, hata-politikasi, KVKK, dil-politikasi, isimlendirme)
- **`/Users/gkhngns/Desktop/PROJECTS/GAI/CLAUDE.md`** — workspace anayasa (repo haritası, bağlam önceliği)
- **`/Users/gkhngns/Desktop/PROJECTS/GAI/MEMORY.md`** + `/Users/gkhngns/Desktop/PROJECTS/GAI/memory/` — workspace operasyonel memory

---

*Bu dosya yaşayan dokümandır. Mimari karar değişirse, faz tamamlanırsa, deferred kuyruk işlenirse — güncelle. Versiyon notu başta tutulur.*
