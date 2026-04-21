# Bella Randevu Robotu — Sistem Rehberi

> **Bu doküman nedir?** Sistemin nasıl çalıştığını, nelere dikkat edilmesi gerektiğini, bir şey patladığında nereye bakılacağını ve yeni bir müşteriye nasıl uyarlanacağını anlatır.
> **Nasıl kullanılır?** Bir şey ters gittiğinde önce [Panik Butonu](#6-panik-butonu--sorun-cozum-tablosu) bölümüne bak. Aylık rutinler için [Sağlıklı Kalmak](#8-sistemin-sağlıklı-kalması-için-rutinler) kısmına. Yeni müşteri için [Kişiselleştirme](#10-yeni-müşteriye-uyarlama--en-kolay-yol) kısmına.
> **Son güncelleme:** 2026-04-20

---

## İçindekiler

1. [Sistem Bir Bakışta](#1-sistem-bir-bakışta)
2. [İş Akışı — Kim, Ne Zaman, Nereye](#2-iş-akışı--kim-ne-zaman-nereye)
3. [Kullanılan Araçlar ve Üyelikler](#3-kullanılan-araçlar-ve-üyelikler)
4. [Aylık Maliyet Tablosu](#4-aylık-maliyet-tablosu)
5. [Sistem Neyi Kime Bildiriyor](#5-sistem-neyi-kime-bildiriyor)
6. [Panik Butonu — Sorun Çözüm Tablosu](#6-panik-butonu--sorun-cozum-tablosu)
7. [Olası Problemler ve Önlem Planı](#7-olası-problemler-ve-önlem-planı)
8. [Sistemin Sağlıklı Kalması İçin Rutinler](#8-sistemin-sağlıklı-kalması-için-rutinler)
9. [Yedekleme Planı](#9-yedekleme-planı)
10. [Yeni Müşteriye Uyarlama — En Kolay Yol](#10-yeni-müşteriye-uyarlama--en-kolay-yol)
11. [Sıfırdan Yeni İşletme Kurulumu Checklist'i](#11-sıfırdan-yeni-işletme-kurulumu-checklisti)
12. [Şunu SAKIN Yapma Listesi](#12-şunu-sakin-yapma-listesi)
13. [KVKK / Gizlilik Notu](#13-kvkk--gizlilik-notu)
14. [Hızlı Referans — Nereye Bakılır](#14-hızlı-referans--nereye-bakılır)

---

## 1. Sistem Bir Bakışta

Bella, bir güzellik salonu için **yapay zekâ destekli randevu robotu**. Müşteri salonun web sitesine girer, asistanla (chat penceresi) yazışarak veya konuşarak randevu alır, iptal eder veya değiştirir. Bot arka planda takvimi kontrol eder, randevuyu kaydeder, Google Takvim'e düşer, saatten 2 saat önce müşteriye SMS hatırlatma gider. Salon sahibi ayrı bir panelden (dashboard) tüm randevuları, müşterileri ve istatistikleri görür.

**Ana bileşenler:**

| Bileşen | Ne işe yarar | Nerede çalışır |
|---|---|---|
| **Müşteri chat** | Ziyaretçiyle konuşan AI asistan | Ana sayfa (sol panel) |
| **Dashboard** | Salon sahibinin kontrol paneli | `/dashboard` — şifreli |
| **AI beyni** | Konuşmayı anlayan ve karar veren kısım | Claude Sonnet 4.6 |
| **Veritabanı** | Randevuların, müşterilerin, personelin saklandığı yer | Airtable |
| **Takvim** | Randevuların görsel olarak görüldüğü ajanda | Google Calendar |
| **SMS servisi** | Hatırlatma ve onay mesajları | Twilio |
| **Zaman tetikleyici** | "Şu an hatırlatma gönderme zamanı mı?" sorusunu soran | cron-job.org |
| **Giriş kontrolü** | Dashboard'a kimin girebileceğini kontrol eden | Clerk |
| **Barındırma** | Tüm kodun yayınlandığı yer | Vercel |

**Canlı adres:** https://bella-randevu-robotu.vercel.app
**Dashboard:** https://bella-randevu-robotu.vercel.app/dashboard
**Kod deposu:** https://github.com/GkHnGns2032/ai-randevu-robotu-

---

## 2. İş Akışı — Kim, Ne Zaman, Nereye

### 2.1 Müşteri randevu alırken ne oluyor (adım adım)

```
[1] Müşteri siteye girer
       ↓
[2] "Yarın saat 14'te saç boyama istiyorum" yazar veya mikrofona söyler
       ↓
[3] AI (Bella) mesajı anlar → Airtable'a sorar: "O saat boş mu?"
       ↓
[4] Boşsa: ad-soyad ve telefon ister
       ↓
[5] Müşteri bilgilerini verir
       ↓
[6] AI onay ister → "Onaylıyor musunuz?"
       ↓
[7] Müşteri "evet" der
       ↓
[8] AI eş zamanlı şunları yapar:
     → Airtable'a randevuyu kaydeder
     → Google Takvim'e etkinlik ekler
     → Müşteriye onay SMS'i yollar
       ↓
[9] Randevudan 2 saat önce otomatik hatırlatma SMS'i gider
```

### 2.2 Arka plandaki sessiz iş — SMS hatırlatma

- **cron-job.org** her 30 dakikada bir bizim sistemimizdeki bir adresi çağırır (`/api/send-reminders`).
- O adres Airtable'ı okur, "şu an itibarıyla 2 saat sonra başlayacak ve hatırlatması gönderilmemiş" randevuları bulur.
- Bulduğu her randevuya Twilio üzerinden SMS gönderir, sonra "gönderildi" işareti koyar.
- Böylece aynı SMS iki kere gitmez, unutulan da kalmaz.

**Neden dış bir servis (cron-job.org)?** Vercel'in ücretsiz planında otomatik tetikleyici günde sadece 1 kere çalışabiliyor. Biz 30 dakikada bir istediğimiz için dışarıdan bedava tetikleyen bir servis kullanıyoruz.

### 2.3 Salon sahibi (sen) ne yapıyor

1. **Giriş:** `/sign-in` adresinden Clerk hesabıyla giriyorsun.
2. **Anasayfa — Dashboard:**
   - Bugünün özeti (toplam randevu, bugünkü ciro, VIP sayısı)
   - Sıradaki randevu
   - Haftalık hedef + ilerleme çubuğu
   - Takvim görünümü
   - Tüm randevular tablosu (arama, filtre, CSV dışa aktarma)
   - Müşteri listesi (CRM — kim kaç kere gelmiş, ne kadar harcamış)
   - Personel listesi
   - AI içgörü paneli (haftanın yorumu)
   - Sesli günlük özet (isteğe bağlı)
3. **Manuel işlem:** "Yeni Randevu" butonuyla kendin de randevu ekleyebiliyorsun (telefonla arayan müşteriler için).

---

## 3. Kullanılan Araçlar ve Üyelikler

| # | Servis | Ne için | Plan / Ücret | Hesap sahibi |
|---|---|---|---|---|
| 1 | **Vercel** | Sitenin yayınlandığı yer | Hobby (ücretsiz) | Sen |
| 2 | **GitHub** | Kodun saklandığı yer | Ücretsiz | Sen (GkHnGns2032) |
| 3 | **Anthropic** | AI beyni (Claude) | Kullandıkça öde | Sen |
| 4 | **Airtable** | Veritabanı (randevular, müşteriler, personel) | Free plan (1200 kayıt) | Sen |
| 5 | **Google Cloud** | Google Takvim API erişimi | Ücretsiz (kota dahilinde) | Sen |
| 6 | **Twilio** | SMS gönderimi | Trial ($15 kredi) | Sen |
| 7 | **Clerk** | Dashboard giriş sistemi | Free plan (10.000 kullanıcıya kadar) | Sen |
| 8 | **cron-job.org** | SMS hatırlatma tetikleyici | Ücretsiz | Sen |

### 3.1 Her servisin kısa tanımı

- **Vercel:** Siteyi internette yayınlayan ev sahibi. Kodu GitHub'a atınca, Vercel alıp canlıya dikiyor.
- **Anthropic / Claude:** Müşteriyle konuşan, "yarın" gibi belirsiz kelimeleri tarihe çeviren, hangi aracı ne zaman kullanacağına karar veren akıl.
- **Airtable:** Excel gibi ama internette duran ve kod tarafından okunup yazılabilen bir tablo. Randevuların, müşterilerin, personelin asıl tutulduğu yer.
- **Google Calendar:** Airtable'daki randevunun bir de takvim üzerinde görünmesi için bağladığımız görsel ajanda.
- **Twilio:** SMS atan Amerikan servis. Şu an "trial" hesap olduğu için sadece önceden doğrulanmış bir telefona SMS atabiliyor (bkz. [Olası Problemler](#7-olası-problemler-ve-önlem-planı)).
- **Clerk:** Dashboard'a rastgele birinin girmemesi için şifreli giriş koyan sistem.
- **cron-job.org:** "Her 30 dakikada bir şu adresi ziyaret et" diye talimat verdiğimiz bedava saat servisi.

---

## 4. Aylık Maliyet Tablosu

Şu an (trial / free planlarda) **aylık yaklaşık ücret: 0 ₺'ye yakın**. Ama sistem gerçek müşteriyle çalışmaya başlayınca bazı kalemler devreye girer. Tahminler:

| Servis | Serbest kota | Aşım durumu | Tahmini aylık (orta yoğun salon) |
|---|---|---|---|
| Vercel Hobby | 100 GB trafik, 100 saat compute | Aşılırsa Pro $20/ay | 0 ₺ |
| Anthropic Claude | Yok, kullandıkça öde | ~100 konuşma/gün için aylık $5–15 | ~200–500 ₺ |
| Airtable Free | 1200 kayıt / base | Aşılırsa Team $20/ay/kişi | 0–800 ₺ |
| Twilio SMS | $15 trial kredi (tek seferlik) | Türkiye'ye SMS ~$0.05/adet | ~150–400 ₺ |
| Clerk | 10.000 kullanıcı | Aşılırsa Pro $25/ay | 0 ₺ |
| Google Calendar API | Ücretsiz | — | 0 ₺ |
| cron-job.org | Ücretsiz | — | 0 ₺ |
| GitHub | Ücretsiz | — | 0 ₺ |

**Beklenen ortalama aylık maliyet (gerçek kullanım):** yaklaşık **400–900 ₺** (ağırlıklı SMS + Claude API).

**Önemli:**

- **Twilio trial'dan production'a geçince** kart eklemen istenecek. Ondan önce işletmenin SMS hacmini hesapla.
- **Claude API** kullanımı konuşma başı yaklaşık 0.01–0.05 $. Yoğun kullanımda gözle.
- **Airtable** 1200 kayıt sınırını randevu sayısı aşarsa ücretli plana geçmek gerekebilir (tek salon için zor aşılır).

---

## 5. Sistem Neyi Kime Bildiriyor

| Ne | Kime | Ne zaman | Hangi kanal |
|---|---|---|---|
| Randevu onay mesajı | Müşteriye | Randevu alındığı anda | SMS (Twilio) |
| 2 saat önce hatırlatma | Müşteriye | Randevudan 2 saat önce | SMS (Twilio) |
| Dashboard bildirimleri | Salon sahibine | Dashboard açıkken | Ekranda |
| — | — | — | — |

**Şu an eksik olan (eklenebilir):**

- Yeni randevu alındığında sana Email/SMS/WhatsApp ile bildirim (şu an yok, sadece dashboard'a bakınca görüyorsun).
- Randevu iptal edildiğinde sana uyarı (yok).
- No-show (gelmeyen müşteri) uyarısı (yok — manuel işaretliyorsun).

---

## 6. Panik Butonu — Sorun Çözüm Tablosu

**En sık yaşanan şikâyetler ve ilk bakılacak yer:**

| Şikâyet / Belirti | İlk bakılacak yer | Olası sebep | Hızlı çözüm |
|---|---|---|---|
| "Bot cevap vermiyor" | Ana sayfayı yenile | Claude API limiti veya anahtar bitti | Anthropic panelinde bakiyeye bak |
| "SMS gelmiyor" | Twilio panel → Logs | Trial hesap limiti, numara doğrulanmamış, kredi bitmiş | Twilio bakiye + numara doğrulama kontrolü |
| "Hatırlatma SMS'i gelmedi" | cron-job.org → geçmiş çalışmalar | Cron tetiklenmemiş veya endpoint hata verdi | Son çalışma logunu oku |
| "Takvimde randevu görünmüyor" | Google Calendar + Airtable | Takvim ID yanlış / refresh token süresi dolmuş | `.env` içindeki `GOOGLE_*` değerleri, Vercel env kontrol |
| "Dashboard açılmıyor / boş" | Tarayıcı konsolu (F12) | Cache bozulmuş veya Clerk oturumu düştü | Ctrl+Shift+R, tekrar giriş yap |
| "Sayılar 0 görünüyor, butonlar tepkisiz" | — | Dev server cache'i bozulmuş (sadece geliştirme sırasında) | `.next` klasörünü sil, `npm run dev` yeniden başlat |
| "Randevu aldı ama kaydolmamış" | Airtable + Vercel logs | API hatası, race condition, takvim çakışması | Vercel → Logs → ilgili isteği bul |
| "Site açılıyor ama chat kapalı" | Vercel → Deployments | Son deploy patlamış | Önceki çalışan deploy'a "rollback" |
| "Aynı saate 2 randevu girdi" | Airtable | Race condition — aynı anda iki kişi aldıysa | `lib/booking-lock.ts` koruması var, kontrol et |
| "Bot yanlış fiyat söylüyor" | `config/client.ts` | Fiyat config'den alınır | `config/client.ts` → services → güncelle → deploy |

### 6.1 Panik anı — 60 saniyelik rutin

1. **Canlı site ayakta mı?** → https://bella-randevu-robotu.vercel.app aç.
2. **Dashboard giriyor mu?** → /dashboard aç.
3. **Vercel logs?** → vercel.com → project → Logs → son 1 saat.
4. **Hangi servis kırmızı?** → Anthropic / Twilio / Airtable / Google panellerinden sırayla bakiyeye ve hata oranına bak.

---

## 7. Olası Problemler ve Önlem Planı

### 7.1 Şu an bildiğimiz sınırlamalar

| Problem | Neden | Ne zaman can sıkar | Kalıcı çözüm |
|---|---|---|---|
| Twilio trial | Gerçek müşteriye SMS gitmiyor, sadece doğrulanmış numaraya | İlk gerçek müşteri alındığında | Twilio'da kart ekle, production'a geç |
| Vercel cron günde 1 kere | Ücretsiz plan kısıtı | — | cron-job.org ile çözüldü, dert değil |
| Airtable 1200 kayıt sınırı | Free plan | Yıllar sonra | Team planına geç veya eski randevuları arşivle |
| Rate limit tek sunucuda tutuluyor | Sunucu yeniden başlarsa sıfırlanır | Kötü niyetli bot saldırısı | Upstash Redis ile kalıcılaştır (Faz 6'da planlandı) |
| Google refresh token süresi dolabilir | Google güvenlik politikası | 6 ay hiç kullanılmazsa | Yeni refresh token al (OAuth akışı) |
| Claude API anahtarı sızarsa | Sızıntı | Faturaya sürpriz | Anthropic'te anahtarı iptal et, yeni oluştur, Vercel'e koy |
| Cron-job.org düşerse | 3. parti bağımlılık | Nadiren | Backup olarak başka bir cron servisi ekle (örn. EasyCron) |

### 7.2 Gözle görülmeyen ama iyi bilmen gerekenler

- **Timezone (saat dilimi) tuzağı:** Sunucu UTC'de, Türkiye UTC+3. Tüm saat hesapları `Europe/Istanbul` sabiti üzerinden yapılıyor. Herhangi bir yere saat ekleyeceksen `new Date()` kullanmadan önce bu dokümanı gösterip sor.
- **Aynı saate iki randevu alma ihtimali:** `lib/booking-lock.ts` bunu önlüyor ama koruma tam rock-solid değil — aşırı yoğun ana bağlı. Normal salon trafiği için yeterli.
- **Clerk şifre sıfırlama:** Unutursan, hesaba bağlı email üzerinden sıfırlama yapabilirsin. Email'i Clerk'e kendin belirlediğin için erişimin olduğundan emin ol.

---

## 8. Sistemin Sağlıklı Kalması İçin Rutinler

### Günlük (2 dakika)

- Dashboard'a gir, bugün alınan randevu sayısına bak.
- En az bir "test müşteri" ile chat'i dene — hâlâ cevap veriyor mu?

### Haftalık (10 dakika)

- Vercel → Logs → son 7 gün hata oranına bak. "500 Error" sayısı sıfır olmalı, olmazsa sebebe bak.
- Twilio → Usage → bu hafta kaç SMS gitmiş, ne kadar tutmuş.
- Anthropic → Usage → bu hafta harcama.
- Airtable → randevu sayısı (1200'e yakınlaşıyor muyuz?).

### Aylık (30 dakika)

- **Airtable yedeği:** Airtable'dan CSV indir (bkz. [Yedekleme Planı](#9-yedekleme-planı)).
- **Tüm servislerin bakiyesi ve planı:** kredi kartı yenilendi mi, otomatik ödeme çalışıyor mu?
- **Env değişkenleri:** Vercel dashboard → Settings → Environment Variables → her şey hâlâ dolu mu?
- **Paket güncellemeleri:** İstemiyorsan yapma ama 3 ayda bir `npm outdated` kontrolü iyi fikir.

### 6 ayda bir

- **Google refresh token yenileme:** Takvim entegrasyonu hâlâ çalışıyor mu, test randevusu oluştur.
- **API anahtarları rotasyonu:** Anthropic ve Airtable anahtarlarını yeniden üret (güvenlik).
- **Tam sistem yedekleme:** Kod (GitHub zaten yedekliyor) + Airtable export + env değişkenler (şifreli bir yerde).

---

## 9. Yedekleme Planı

**Ne yedeklenmeli?**

| Varlık | Nerede | Nasıl yedeklenir | Sıklık |
|---|---|---|---|
| Kod | GitHub | Otomatik (her commit) | Sürekli |
| Randevu verisi | Airtable | Airtable → tablo → Download CSV | Ayda 1 |
| Müşteri listesi | Airtable | Aynı CSV içinde | Ayda 1 |
| Env değişkenler | Vercel | Vercel → Settings → Env → bir not defterine yaz | Değişince |
| Google refresh token | `.env.local` | Yerelde yedekli tut | Bir kere üretildikten sonra |
| Claude prompt'u | `lib/ai-tools.ts` | Git zaten tutuyor | Sürekli |
| `config/client.ts` | Kod içinde | Git zaten tutuyor | Sürekli |

**Önerilen tek dosya yedekleme klasörü:**

```
Belgelerim/bella-yedekler/
  ├─ 2026-04-randevular.csv
  ├─ 2026-04-musteriler.csv
  ├─ 2026-04-personel.csv
  └─ env-keys.txt   (sadece değişken isimleri, değerler şifre yöneticisinde)
```

**Env değerlerini** asla düz not defterine yazma — **1Password, Bitwarden** gibi bir şifre yöneticisine at.

---

## 10. Yeni Müşteriye Uyarlama — En Kolay Yol

Aynı sistemi başka bir işletmeye (berber, diş kliniği, veteriner, oto yıkama, psikolog) satacaksan, **çoğu şey için sadece bir dosyayı değiştirmen yeterli**.

> **Önce mülakat yap.** Kurulumdan önce `docs/MUSTERI-MULAKAT-SORULARI.md` dosyasındaki soruları müşteriyle bir masaya otur ve tek tek doldur. Yanlış varsayımla kurulan bot, ilk hafta gerçek müşteriyi küstürür. 60–90 dakika ayır, not al, 16. bölümdeki cevap kâğıdını doldur. Kurulum o kâğıttan bakılarak yapılır.

### 10.1 Tek dosyayı değiştirerek yapılanlar

**Dosya:** `config/client.ts`

Burada işletme adı, asistan adı, hizmet listesi, süre, fiyat, çalışma saatleri, çalışma günleri var. Tek dosyayı güncellemek:

```ts
// Örnek: Diş Kliniği'ne uyarla
export const CLIENT_CONFIG = {
  businessName: 'Dr. Ayşe Kaya Diş Kliniği',
  assistantName: 'Ayşe',
  welcomeEmoji: '🦷',

  services: [
    { name: 'Kontrol Muayenesi', duration: 30, price: 500 },
    { name: 'Temizlik',          duration: 45, price: 1200 },
    { name: 'Dolgu',             duration: 60, price: 2500 },
    // ... vs
  ],

  workingHours: {
    start: 10,
    end: 18,
    slotMinutes: 30,
    workingDays: [1, 2, 3, 4, 5],        // Pzt-Cuma
    workingDaysLabel: 'Pazartesi-Cuma',
  },
};
```

**Bu dosyayı değiştirince otomatik güncellenen yerler:**

- Chat'te Bella'nın kendini tanıtması
- Hizmet listesi ve fiyatlar
- Müsait saat hesabı
- Dashboard başlığı
- SMS metinleri
- Ana sayfa kahraman bölümü

### 10.2 Görsel değişiklikler (renk, tema)

Şu an salon için pembe-gül tonları ağırlıklı. Dashboard'a renk seçici (PalettePicker) var — üstten tıklayarak tema değiştirilebilir. Farklı sektör için kalıcı renk:

**Dosya:** `app/globals.css` ve `tailwind.config.ts`

Geliştirici lazım olur (çok dosya etkilenmez ama CSS değişkenleri birkaç yerde). Hızlı yol: Dashboard'daki PalettePicker ile müşteriye kendi renklerini seçtir.

### 10.3 Değişmemesi gereken şeyler

- `lib/` klasöründeki dosyalar — genel mantık, dokunma.
- `app/api/` klasöründeki endpoint'ler — API mantığı, dokunma.
- Airtable şeması — alan adları kodda sabit referansla geçiyor.

### 10.4 Her müşteri için YENİSİ üretilmesi gerekenler

| Kalem | Ne yapılır |
|---|---|
| Airtable base | Yeni base aç, mevcut tabloları kopyala |
| Google Calendar | Yeni takvim oluştur, OAuth bağla |
| Twilio numarası | Aynı numara birden fazla müşteri için kullanılabilir (trial hariç); ideal: her müşteriye ayrı numara |
| Clerk uygulaması | Yeni Clerk app aç |
| Vercel projesi | Yeni proje olarak deploy et |
| Domain | Müşterinin tercihine göre `isletme.com` veya `randevu.isletme.com` bağla |

**Tahmini kurulum süresi:** Bir müşteri için sıfırdan (tüm hesaplar dahil) **2–4 saat**.

---

## 11. Sıfırdan Yeni İşletme Kurulumu Checklist'i

Adım sırası. Her birini yaparken yanına tarih + bitti işareti koy.

### Hazırlık

- [ ] Müşteriden al: işletme adı, asistan için istenen isim, hizmet listesi (ad + süre + fiyat), çalışma saatleri, tercih ettiği renk, domain varsa
- [ ] Müşteriden al: kredi kartı bilgilerini TOPLAMA — her servisi kendi adına açtır, sadece yardım et

### Hesap açma

- [ ] GitHub repo fork veya template clone
- [ ] Airtable yeni base aç, mevcut şemayı kopyala (Appointments, Staff tabloları)
- [ ] Google Cloud projesi aç → Calendar API etkinleştir → OAuth client oluştur → refresh token al
- [ ] Anthropic hesap aç, API key üret
- [ ] Twilio hesap aç, numara al, doğrula
- [ ] Clerk yeni uygulama aç, API anahtarlarını al
- [ ] cron-job.org'da yeni job oluştur
- [ ] Vercel'de yeni proje aç, GitHub'a bağla

### Kod tarafı

- [ ] `config/client.ts` güncelle (hizmetler, saatler, isim)
- [ ] `.env.local`'a tüm anahtarları koy
- [ ] Yerelde `npm run dev` ile test et
- [ ] Gerçek müşteriyle deneme randevusu al
- [ ] Vercel'e `npx vercel --prod` ile deploy et
- [ ] Vercel dashboard → Env → tüm değişkenleri ekle
- [ ] Domain bağla

### Teslim

- [ ] Müşteriye dashboard kullanımını göster (15 dakika eğitim)
- [ ] Clerk hesabını müşterinin emailine devret
- [ ] Acil durumda nasıl ulaşacağını söyle
- [ ] Bu dokümanın bir kopyasını müşteri klasörüne koy

---

## 12. Şunu SAKIN Yapma Listesi

**Geri dönüşü zor hatalar:**

| Yapma | Neden |
|---|---|
| `.env.local` dosyasını GitHub'a pushlama | Tüm anahtarların public olur, fatura patlar. Zaten `.gitignore`'da ama uyanık ol. |
| Airtable tablo adını değiştirme | Kod `Randevular` / `Staff` isimlerine bağlı, değiştirirsen sistem kırılır. Önce `.env.local`'da `AIRTABLE_TABLE_NAME`'i değiştir, sonra tabloyu yeniden adlandır, sonra deploy. |
| Airtable alan isimlerini değiştirme | Kod `customerName`, `customerPhone` gibi alan adlarına göre okuyor. |
| Twilio numarasını silme | Geri almak mümkün değil, numara havuzuna geri döner. |
| Google refresh token'ı silme | OAuth akışını baştan yapman gerekir. |
| `main` branch'e onaysız merge | Üretim canlı sistem — kırarsan müşteri kaybeder. |
| `git push --force` main'e | Commit geçmişi siler, geri alınamaz. |
| Clerk → Applications → Delete | Dashboard girişi anında ölür. |
| Vercel env değişkenini silip kaydetmek | Anında deploy bozulur. Önce kopyala, sonra dokun. |
| Kodu test etmeden prod'a deploy | Kural: deploy öncesi `npm run build` temiz geçmeli. |

---

## 13. KVKK / Gizlilik Notu

Sistem müşterinin **ad-soyad** ve **telefon numarası**nı saklıyor. Bu, KVKK kapsamında **kişisel veri**.

**Yapılması gerekenler:**

1. **Aydınlatma metni:** Ana sayfada ve randevu alırken "verileriniz randevu amacıyla saklanır, SMS hatırlatma için kullanılır" tipi kısa bir metin. Şu an eksik.
2. **Veri silme hakkı:** Müşteri "beni silin" derse → Airtable'dan o telefon numarasının tüm kayıtlarını silmek zorundasın.
3. **Veri sorumlusu:** Kayıtlı veriler senin ve işletmenin sorumluluğunda.
4. **Yurt dışı aktarım:** Airtable (ABD), Twilio (ABD), Anthropic (ABD) ve Google (ABD) ABD'de barındırıldığı için veriler yurt dışına çıkıyor. Aydınlatma metninde bunu belirtmek gerekiyor.
5. **Süre:** Randevu tamamlanınca verilerin ne kadar süre saklanacağı belirlenmeli (genelde 2 yıl yeterli).

**Not:** Bu alan yasal, bir avukat veya KVKK danışmanına tek seferlik bir aydınlatma metni yazdırmak 2000–5000 ₺ civarı. Müşteriye satmadan önce bunu çözmek iyi olur.

---

## 14. Hızlı Referans — Nereye Bakılır

### Kod tarafı

| Ne arıyorsan | Hangi dosyada |
|---|---|
| İşletme adı / hizmetler / fiyatlar | `config/client.ts` |
| AI'nin kişiliği / kuralları | `lib/ai-tools.ts` (SYSTEM_PROMPT) |
| Airtable okuma-yazma | `lib/airtable.ts` |
| Google Takvim | `lib/calendar.ts` |
| SMS gönderme | `lib/sms.ts` |
| Hatırlatma cron | `app/api/send-reminders/route.ts` |
| Chat endpoint | `app/api/chat/route.ts` |
| Dashboard sayfası | `app/dashboard/page.tsx` |
| Giriş koruması | `middleware.ts` |
| Tüm ortam değişkenleri | `.env.local` (yerel) + Vercel dashboard (canlı) |

### Dış servis panelleri

| Servis | Adres |
|---|---|
| Vercel | https://vercel.com/dashboard |
| GitHub | https://github.com/GkHnGns2032/ai-randevu-robotu- |
| Anthropic | https://console.anthropic.com |
| Airtable | https://airtable.com |
| Google Cloud | https://console.cloud.google.com |
| Twilio | https://console.twilio.com |
| Clerk | https://dashboard.clerk.com |
| cron-job.org | https://console.cron-job.org |

### Önemli komutlar

```bash
# Yerel geliştirme sunucusu başlat
npm run dev

# Derleme (deploy öncesi test)
npm run build

# Canlıya deploy
npx vercel --prod

# Cache temizleme (bir şey bozulunca)
# PowerShell:
Remove-Item -Recurse -Force .next
npm run dev
```

### Sabitler (ezbere bilmen gerekenler)

- **CRON_SECRET:** `bella2026gizli`
- **Cron endpoint:** `/api/send-reminders?secret=bella2026gizli`
- **Canlı URL:** https://bella-randevu-robotu.vercel.app
- **Repo:** https://github.com/GkHnGns2032/ai-randevu-robotu-
- **Ana branch:** `main`
- **Deploy yöntemi:** Manuel `npx vercel --prod` (GitHub webhook düzgün tetiklemiyor)

---

## Son Söz

Bu doküman **değişken** — sistem büyüdükçe bu dosyayı da güncelle. Yeni bir servis eklediğinde, bir problem çözdüğünde, yeni bir rutine başladığında **ilk buraya not düş**. Böylece 6 ay sonra "ben bunu nasıl çözmüştüm ya?" sorusu yaşamazsın.

**Son güncelleme:** 2026-04-20
**Sonraki yenileme:** Yeni büyük özellik veya servis değişikliğinde.
