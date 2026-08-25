# Bella — Oturum Handoff

> En yeni kayıt en üstte. Kanonik şema: vault `GG_AI OS/Systems/Oturum Kapanış Şeması.md`.

## bella — 2026-08-24 (oturum: müşteri notu — etiketsiz not hiç eklenemiyordu)

**Ne yapıldı:** Panoda müşteriye not eklenemiyordu. Airtable'da `tag` TEK-SEÇİM alanı; `addNote`
etiket seçilmediğinde oraya BOŞ METİN yazıyordu (`tag: tag ?? ''`) ve Airtable kaydın tamamını
reddediyordu (`INVALID_MULTIPLE_CHOICE_OPTIONS`, POST 500). Gerçek kural: etiket seçersen not
ekleniyor, seçmezsen hiç eklenmiyor. Etiket boşsa alan artık Airtable'a HİÇ gönderilmiyor.

**Kararlar & neden:**
- İkinci kusur birincisi kadar önemli sayıldı: `handleAddNote`'ta `if (res.ok)` vardı, `else`
  yoktu — sunucu reddettiğinde ekranda hiçbir iz kalmıyordu. "Düğme çalışmıyor" hissinin kaynağı
  bu sessizlikti. Artık sebep formun altında görünüyor ve **yazılan metin alanda korunuyor**.
- Sınama notları Airtable'dan silindi — demo müşterisinde iz bırakılmadı.

**Durum:** tsc temiz (`npx tsc --noEmit` çıkış 0) · test — · build — · commit `efc6b14` ·
push **edildi** (`origin/main` ile senkron, ağaç temiz)

**Sırada ne var:** Aynı sessiz-başarısızlık deseni `handleDeleteNote`'ta duruyor — silme
başarısız olursa da hiçbir şey söylemiyor. Kapatılmadı.

**Açık sorular / riskler:**
- Airtable `CustomerNotes` tablosunda telefonu ve metni olmayan, yalnız `tag: Yeni` taşıyan bir
  artık kayıt var (`recQDqI6edA9lSUWx`). Hiçbir müşterinin altında görünmüyor; silinmedi.
- **Bayat sekme tuzağı:** akşam "yine bozuk" bildirimi geldi; kod ve sunucu doğruydu, sebep
  düzeltmeden önce açılmış bir sekmenin eski JS'i tutmasıydı. Demo günleri için `next dev` yerine
  derlenmiş kipte koşmak bu sınıfı tamamen kaldırır — karar verilmedi.

🔖 **Memory delta:** `dogrulamanin-raf-omru` (yeni) · `feedback-preview-fresh-state` (bayat sekme
yanlış arıza raporu üretir) — ikisi de vault memory'sine YAZILDI, köprüde tekrar işlenmesine
gerek yok.

🌉 **Köprü notu:** vault tarafına zaten işlendi (`karar-defteri/2026-08-24.md` → "Oturum 2 —
gündüz bölümü"). Bu kayıt repo tarafı içindir.

## bella — 2026-08-24 (oturum: saha turu öncesi demo tahkimi — takvim boşluğu + Airtable temizliği)

**Ne yapıldı:** Haftalık takvimde Per/Cum/Cts sütunları boştu — `YAKLASAN` yalnız `0/1/2` gün
farkını üretiyor, geçmiş ziyaretlerin en yenisi 10 gün önce. Bugün Pazartesi olduğu için görünen
pencere tam `+0..+5` idi ve üç sütun hiç doğmuyordu. `+3/+4/+5`'e 16 randevu eklendi (4·5·7,
yoğunluk cumartesiye artar). Ayrıca Airtable'da dün geceden kalma iki test kaydı silindi
(`TEST Silinecek Kayit` · `Mason Greenwood`) — tablo 8→6, kalanların hepsi Mayıs-Haziran tohumu.

**Kararlar & neden:**
- Eklenen kayıtlar **ileri tarihli ve TUTARSIZ**. Gerekçe: `CustomerList.tsx:95` ciroyu ve "tahmin
  payı"nı yalnız geçmiş randevulardan sayıyor (`!isAfter(date, today)`), dolayısıyla gelecek
  kayıtlar hesabın dışında kalır ve kümenin tek amacı olan Elif (2 ziyaret / ₺30.000) ↔ Merve
  (11 ziyaret / ₺10.350) karşıtlığı sulanmaz. Ekranda doğrulandı, çıkarımla bırakılmadı.
- **Elif Şahin'e yeni ziyaret EKLENMEDİ** — seyrek gelmesi onun hikâyesinin kendisi.
- Listedeki "%12 tahmin payı" uyarısı bu turdan gelmiyor; bugünün akşam randevularından geliyor ve
  `demo-data.ts` yorumuna göre bilinçli.
- Dev sunucusu tekilleştirildi: dün geceden kalma ikinci bir örnek 3000'i tutuyordu, aynı ağaca
  bakan iki sunucu vardı. İkisi durduruldu, tek sunucu **3000**'de (devir notundaki adres).

**Durum:** tsc temiz (`npx tsc --noEmit` çıkış 0) · test — · build — · commit ⚠ YOK
(`lib/demo-data.ts` çalışma ağacında) · push ⚠ EDİLMEDİ

**Sırada ne var:** `lib/demo-data.ts` commit edilecek. Sonra: demo Pazartesi dışında bir gün
açılırsa o haftanın GEÇMİŞ günleri hâlâ boş (en yeni geçmiş ziyaret 10 gün önce); düzeltmek ciro
hesabına dokunmayı gerektirdiği için bilinçle yapılmadı.

**Açık sorular / riskler:** Tema tercihi porta göre saklanıyor — port değişirse palet sıfırlanır,
görüşme öncesi TEMA'dan seçilmeli. Görüşmeden önce Analiz sekmesi bir kez ısıtılmalı (~10 sn).

🔖 **Memory delta:** Kartuş/kuruluma özgü **çalışma günleri** de demo verisi gibi devralınıyor —
veteriner kartuşu ÖERM'in Salı-Cumartesi'sini almış ve `kartus-calisma-gunleri.test.ts` ile
kilitli; Pazartesi demosunda ekran boş görünüyor ve **re-seed bunu çözmez** (seed hafta başını
`haftaBasiCalismaUTC(new Date())` ile hesaplıyor, aynı tarihler geri gelir). Mevcut
`demo-veri-sektor-uyumu` memory'sinin aynı sınıfı — oraya eklenmeli, yeni kayıt açılmamalı.

🌉 **Köprü notu:** Bu kayıt bella reposunun kendi turudur. Veteriner tarafının saha çıktısı vault'ta
`EFFORT/Alanlar/GunesAI/CRM/Kind Vet.md` → "Demo açılışı — hazır adres" bölümüne ZATEN yazıldı;
ayrıca işlenmesine gerek yok.

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
