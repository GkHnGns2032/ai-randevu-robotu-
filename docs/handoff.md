# Bella — Oturum Handoff

> En yeni kayıt en üstte. Kanonik şema: vault `GG_AI OS/Systems/Oturum Kapanış Şeması.md`.

## bella — 2026-08-24 (oturum: müşteri değeri görünümü + demo kipi + hukuk-buro temaları)

**Ne yapıldı:** 23 Ağu Eryaman saha turundan doğan iş. Müşteri listesi artık sıklığa
değil DEĞERE göre sıralanıyor ve gerçek tahsilatı (`paidAmount`) kullanıyor; saha
görüşmeleri için `?demo=1` örnek veri kipi kuruldu (Airtable'a yalnız okuma) ve örnek
veri canlı kayıtlarla BİRLEŞİYOR — robottan alınan randevu panoda gerçek olarak
görünüyor. hukuk-buro'nun iki tasarım dünyası dört palet olarak taşındı (Endeks
Gündüz/Gece · Vitrin Gündüz/Gece). Uçtan uca test yapıldı: robot → Airtable → pano ✅

**Kararlar & neden:**
- **Demo Airtable'a YAZMAZ, yalnız okur.** İlk sürüm hiç okumuyordu da; o zaman
  "robottan randevu al, panoda göster" imkânsızdı (dolu ekran ile canlı kayıt
  birbirini dışlıyordu). Birleşim bu yüzden.
- **Örnek veri gizlenmez.** Kalıcı rozet: "ÖRNEK VERİ + CANLI KAYIT".
- **Ekleme yapan tema kolay, çıkarma yapan tema pahalı.** Vitrin (kart+gölge) Bella'nın
  mevcut yapısıyla çakışmadığı için birebir oturdu; Endeks (kart YOK) yapı kaldırmayı
  gerektirdi ve her yüzeye ayrı uygulanana kadar "sadece renk" gibi göründü.
- **Tasarım dilinin kaynağı token değil ÜRÜNÜN KENDİSİ.** Endeks ilk turda yanlış
  taşındı çünkü yalnız CSS değişkenleri okundu; doğrusu prototip dosyasını
  (`hukuk-buro/docs/prototip/yon/endeks-belge.html`) açıp görmekti.
- **Rakamlar sayfanın ana unsuru.** Bu ekran müşteriye gösteriliyor; 10-12px etiketler
  masa başında bile zor. Ölçek tüm paletlerde yükseltildi (tema-özel değil).
- Bella vault'ta `status: parkta` ve dönüş tetiği (ilk ödeyen ÖERM pilotu) ATEŞLEMEDİ.
  Bu tur tek görüşmeliktir; buradan bir yapım hattı açılacaksa ayrı R0 gerekir.

**Durum:** tsc temiz · lint temiz · build ok · test — (repoda test paketi yok) ·
commit `547311c 777df25 f051fbb 9911f2f 0c376bb 3e4a3af 96f7e7f 0ee4d26 eda1634`
(dal) + merge `24fdcf6` + `e3da231 717085a 8326600` (main) ·
push **⚠ 1 commit EDİLMEDİ** (`8326600`, main origin'in 1 önünde)

**Sırada ne var:**
1. `8326600` push edilecek.
2. Airtable'daki test kayıtları silinecek: `TEST Silinecek Kayit · 0555 000 00 00 ·
   25 Ağu 14:00` (+ Gökhan'ın kendi testi). Silinmezse demo sırasında listede görünür.
3. Bugünkü (24 Ağu) saha turunda demo kullanılacak — açılış: `npm run dev` →
   robot `localhost:3000/` · pano `localhost:3000/dashboard?demo=1`.

**Açık sorular / riskler:**
- **Deploy YOK.** Instagram'a "randevu al" linki için gerekli: 17 env değişkeni +
  her müşteriye AYRI Vercel projesi (repo kararı §5.2 "Yol A"; tek deploy + runtime
  tenant seçimi 8-10 müşteride). Ayrıca sohbet her mesajda Anthropic API'sine gidiyor
  → Instagram trafiği faturayı hacme bağlar, önce üst sınır konuşulmalı.
- **Sohbet geçmişi `localStorage`'da**, sunucuda değil. Temizlemenin tek yolu sohbet
  penceresinin sağ üstündeki "YENİ SOHBET" düğmesi.
- Akıllı Analiz model çağrısı ~10 sn sürüyor (30 dk önbellekli) — görüşmeden önce
  Analiz sekmesi bir kez açılmalı.
- Gece yarısından sonra robota "yarın" denmemeli; tarih açık söylenmeli.
- **BAŞKA REPO:** `~/Desktop/PROJECTS/agentic-os` → `fix/pinecone-durum-ayrimi` dalında
  `fbe8e61` duruyor, **merge/push EDİLMEDİ**. O repodaki `docs/handoff.md`'de Gökhan'dan
  kalma commit'siz değişiklik var, dokunulmadı.

🔖 **Memory delta:**
- **Demo kipi canlı veriyi DIŞLAMAMALI.** Saha demosunun can alıcı anı "az önce
  aldığınız randevu, işte burada" demektir; örnek veri ile canlı kaydı birbirini
  dışlayan iki kip yapmak o anı imkânsız kılar. Birleştir, ve örnek olduğunu rozetle
  söyle — gizlemek ilk yalandır.
- **`next dev` + `next build` aynı `.next`i paylaşırsa demo günü çöker.** Build koşan
  dev sunucusunun varlıklarını siler; sayfa 200 döner, konsol temizdir, ama stilsiz
  açılır — "ürün bozuldu" sanılır. Ayrım: `NEXT_DIST_DIR=.next-dev` (bella'da yapıldı).
  İkiz semptom: eski sunucu portu tutarsa yenisi başka porta çıkar ve yanlış kapıya
  bakılır — cevap dev log'unun İLK satırındadır.
- **Tasarım dili token'dan değil üründen okunur.** Bir temayı "birebir taşıdım" demeden
  önce kaynak ürünü aç ve gör; renk değişkenleri dilin yalnız yarısıdır (yarıçap,
  gölge, kart var/yok, tipografi rejimi diğer yarısı).

🌉 **Köprü notu:** Cowork bunu `Session Handoff` v-bloğuna + `EFFORT/Projeler/Güzellik
Salonu (Bella)/Güzellik Salonu (Bella).md` altına işlesin (park durumu DEĞİŞMEDİ — not
düşülsün: 23-24 Ağu'da saha demosu için tek turluk çalışma yapıldı, tetik ateşlemedi).
ROUTER satırı: "Bella demo kipi + hukuk-buro temaları · 24 Ağu 2026". Memory delta'daki
üç madde ayrı memory dosyalarına.
