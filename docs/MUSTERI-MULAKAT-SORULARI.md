# Müşteri Mülakatı — Kişiselleştirme Soruları

> **Bu doküman ne işe yarar?** Yeni bir işletmeye (müşteriye) sistemi kurarken, onun **iş yapış biçimini**, **politikalarını** ve **tonunu** doğru kavramak için kullanılır. Yanlış varsayımla kurulan bir bot, ilk haftada gerçek müşteriyi küstürür. Bu nedenle kurulumdan önce mutlaka bu mülakatı yap.
> **Nasıl kullanılır?** Müşteriyle 60–90 dakikalık bir toplantı yap (yüz yüze veya görüntülü). Cevapları bu dosyanın sonundaki "cevap kâğıdı" kısmına not et. Belirsiz veya çelişkili cevap alırsan durma, "emin değilim" dediği yeri de net anlayana kadar devam et.
> **Soru sınırı yok.** Tam anlayana kadar sor. Her "ama genelde şöyle…" cevabının altında gizli bir kural var, onu çıkar.

---

## İçindekiler

1. [İşletme Kimliği ve Felsefe](#1-işletme-kimliği-ve-felsefe)
2. [Hizmetler ve Fiyat Politikası](#2-hizmetler-ve-fiyat-politikası)
3. [Randevu Politikası](#3-randevu-politikası)
4. [İptal, Değişiklik, Gelmeme (No-Show)](#4-iptal-değişiklik-gelmeme-no-show)
5. [Çalışma Saatleri ve Takvim](#5-çalışma-saatleri-ve-takvim)
6. [Personel](#6-personel)
7. [Müşteri İletişimi ve Ton](#7-müşteri-iletişimi-ve-ton)
8. [Ödeme, Depozito, Fatura](#8-ödeme-depozito-fatura)
9. [Özel Durumlar ve İstisnalar](#9-özel-durumlar-ve-i̇stisnalar)
10. [Kapasite ve Yoğunluk](#10-kapasite-ve-yoğunluk)
11. [Marka ve Görsel Kimlik](#11-marka-ve-görsel-kimlik)
12. [Teknik ve Operasyonel Tercihler](#12-teknik-ve-operasyonel-tercihler)
13. [Yasal ve Gizlilik](#13-yasal-ve-gizlilik)
14. [Büyüme, Hedef, Beklenti](#14-büyüme-hedef-beklenti)
15. [Kritik Senaryolar — Canlı Simülasyon](#15-kritik-senaryolar--canlı-simülasyon)
16. [Cevap Kâğıdı Şablonu](#16-cevap-kâğıdı-şablonu)

---

## 1. İşletme Kimliği ve Felsefe

1. İşletmenin tam resmi adı nedir? (fatura, vergi levhası, sosyal medya farklı olabiliyor — hangisi bota koyulsun?)
2. Asistana ne isim verilmesini istersin? (örn. Bella, Ayşe, Luna). Bu isim markanla uyumlu mu?
3. Asistanın cinsiyeti / hitap tarzı nasıl olsun? (kadın / erkek / nötr, "siz" mi "sen" mi?)
4. Markanın duygu tonu ne? (lüks, samimi, genç-dinamik, profesyonel-mesafeli, şakacı)
5. "Müşterim şunu hissederse mutluyum" dediğin 3 duygu nedir? (örn. özel, dinlenmiş, güvende)
6. Rakiplerinden seni ayıran en büyük şey ne? (fiyat, hız, kalite, atmosfer, uzmanlık)
7. Müşterin çoğunlukla hangi yaş aralığında? Cinsiyet dağılımı?
8. Müşterilerin çoğu ne iş yapıyor? (çalışan, ev hanımı, öğrenci, emekli)
9. Sosyal medya hesapların neler? Orada nasıl konuşuyorsun — örneği ver.
10. Kendini 3 kelimeyle tarif et — işletmen değil, **sen** sahibi olarak.

---

## 2. Hizmetler ve Fiyat Politikası

### Hizmet listesi

11. Tüm hizmetlerin listesi — ad, süre (dakika), fiyat (₺). Eksik bırakma.
12. Bu listede "sadece özel müşteriye açık" veya "sorulunca söylediğin" gizli hizmet var mı?
13. Kampanyalı / indirimli varyasyonları var mı? (örn. "öğrenciye %20")
14. Paket hizmet var mı? (örn. "cilt bakımı + masaj = 900₺ yerine 800₺")
15. Kombinasyonu özel süre gerektiren var mı? (örn. "saç boyama + kesim aynı seansta 2 saat 30 dk")
16. Erkek / kadın için ayrı fiyat var mı?
17. Saç uzunluğuna göre fiyat değişiyor mu? Nasıl belirliyorsun — müşteri söyleyince mi, gelince mi?
18. Marka fark eder mi? (örn. "Loreal boya X, Wella boya Y lira")
19. Ek ürün satıyor musun? (bakım kremi, şampuan) — sistem bunları da önersin mi?
20. Yeni müşteriye özel indirimin var mı? Bot bunu otomatik teklif etsin mi?

### Fiyat esnekliği

21. Müşteri "pazarlık" ederse ne yapılır? Bot asla pazarlık etmesin mi, yoksa "Sahibime danışayım" mı desin?
22. Fiyat listesi sık değişiyor mu? Ne sıklıkla?
23. Enflasyon/döviz kuruna göre fiyat güncellemen var mı?
24. Gelen müşteriye fiyatı önden mi söylersin, sonra mı?

---

## 3. Randevu Politikası

### Randevu alma kuralları

25. En erken kaç gün sonrasına randevu veriyorsun? (örn. "bugün için kabul etmem", "en erken yarın")
26. En geç kaç gün ilerisi için randevu veriyorsun? (örn. "3 aydan ilerisine veremem")
27. Aynı gün randevu kabul ediyor musun? Saat sınırı var mı?
28. Bir müşteri aynı gün birden fazla randevu alabilir mi?
29. Farklı hizmetler için peş peşe randevu verir misin? (örn. "hem manikür hem pedikür hem saç")
30. Randevular arası mola / tampon süresi var mı? (örn. "her randevu arası 15 dk boşluk")
31. Gün sonunda son kabul edilen randevu saati nedir? (kapanış – hizmet süresi?)

### Öncelik kuralları

32. VIP müşteriye özel saat ayırıyor musun?
33. Düzenli gelen müşterinin her hafta/ay aynı saate sabit randevusu var mı?
34. Yeni müşteriye farklı davranış var mı? (örn. "ilk randevu daha uzun tutulur")

### Özel durumlar

35. Çocuk + anne gibi çift randevu alıyor musun? Bot bunu nasıl işlesin?
36. Arkadaş grubu (3-4 kişi birlikte) geldiğinde ayrı ayrı mı kaydedelim?

---

## 4. İptal, Değişiklik, Gelmeme (No-Show)

37. İptal için en az kaç saat önceden haber bekliyorsun?
38. Geç iptalde ceza / depozito alıyor musun? Nasıl?
39. Müşteri hiç gelmezse (no-show) ne yapıyorsun? Bir daha kabul ediyor musun?
40. Kaç kez no-show olan müşteri kara listeye alınır?
41. Randevu değişikliğinde kural farklı mı? (örn. "aynı gün değişiklik olur, iptal olmaz")
42. Geç kalma toleransın ne? (örn. "15 dk'dan fazla geç kalana hizmet vermem")
43. Bot iptal edildiğinde sana haber versin mi? Nasıl?
44. Bot müşteri kara listedeyse randevu vermesin mi? Böyle bir kural olsun mu?

---

## 5. Çalışma Saatleri ve Takvim

45. Açılış ve kapanış saati nedir? Öğle arası var mı?
46. Hafta içi ve hafta sonu saatler aynı mı?
47. Çalıştığın günler — Pazartesi–Cumartesi mi, Pazar dahil mi?
48. Ayda bir kapalı gün var mı? (örn. "her ayın 1'i kapalıyız")
49. Resmi tatillerde çalışır mısın? Hangi tatillerde kesin kapalı?
50. Bayramlarda özel saatler olur mu?
51. Yıllık izin planlamand var mı? Ne zaman kapatıyorsun? (bu takvime işlenmeli)
52. Salonu birden fazla yerde mi işletiyorsun? (şubeler)
53. Sezonluk çalışıyor musun? (yazlık işletme gibi)
54. Saat dilimi her zaman İstanbul (Türkiye) mi, yurt dışından müşteri alır mısın?

---

## 6. Personel

55. Kaç personelin var? Adlarını ve uzmanlık alanlarını ver.
56. Her personel her hizmeti yapabiliyor mu, yoksa uzmanlıklar ayrı mı?
57. Müşteri personel seçimi yapabilir mi, yoksa atama sen mi yapıyorsun?
58. "Favori personel" kavramın var mı? (müşteri hep aynı kişiyi istiyor mu?)
59. Personel mesaileri aynı mı? (örn. Ayşe Pzt-Çar, Fatma Çar-Cmt)
60. Personel izni olduğunda bot otomatik mi fark etmeli, manuel mi giriyorsun?
61. Personel başına farklı fiyat var mı? (örn. "kıdemli stilist daha pahalı")
62. Yeni personel işe alındığında/çıktığında ne kadar hızlı güncellenmesi lazım?

---

## 7. Müşteri İletişimi ve Ton

### Dil ve ton

63. Bot müşteriyle "siz" mi "sen" mi kullansın?
64. Emoji kullansın mı? Ne kadar — hiç yok / ara sıra / sık?
65. Şaka yapsın mı, ciddi mi olsun?
66. Müşteri agresif / kaba olduğunda bot ne yapsın? (sakin kalıp yanıtlasın / sahibine yönlendirsin)
67. Bot hatalı anlaşıldığında nasıl özür dilesin? Örnek cümle ver.
68. Rakip işletmeyi soran müşteriye ne desin? ("Bilmem" / "Biz daha iyiyiz" / yönlendirmesin)

### SMS / mesaj stili

69. Hatırlatma SMS'inde nasıl bir ton olsun? (resmi / samimi / kısa bilgilendirme)
70. SMS imzasında işletme adı mı, senin adın mı, asistanın adı mı olsun?
71. Onay SMS'i + 2 saat önce hatırlatma yeterli mi, yoksa bir gün önce de eklensin mi?
72. Randevu sonrası "Nasıl geçti?" mesajı atılsın mı? (şu an yok, eklenebilir)
73. Doğum günü mesajı gönderilsin mi? Kampanyayla mı kuru kuruya mı?

### Kanallar

74. SMS yeterli mi, WhatsApp entegrasyonu da şart mı? (Whatsapp sonradan eklenebilir)
75. Müşteri cevap yazarsa SMS'e — bu cevap nereye gelsin? (şu an boşa gidiyor)
76. Email ile iletişim istiyor musun? (şu an yok)

---

## 8. Ödeme, Depozito, Fatura

77. Ödeme ne zaman alınıyor — randevu alınırken mi, geldikten sonra mı?
78. Online ödeme kabul ediyor musun? (şu an entegre değil, istersen eklenir)
79. Depozito alıyor musun? Ne kadar, iade şartı?
80. Ödeme yöntemleri — kart, nakit, havale, IBAN, TR karekod?
81. Fatura kesiyor musun? Otomatik mi manuel mi?
82. Kampanyalı fiyatta ödeme farklı mı?
83. Müşteri çocuğu/eşi adına ödeme yaparsa fatura kimin adına?
84. Bot "ödeme" konusunu nereye kadar işlesin? (sadece tutarı söylesin / IBAN versin / hiç değinmesin)

---

## 9. Özel Durumlar ve İstisnalar

85. VIP müşteriye özel ne yapıyorsun? Bot VIP'yi fark etsin mi? Nasıl?
86. "Abonelik" sistemin var mı? (örn. ayda 4 randevu paketi)
87. Hediye çeki satıyor musun? Bot bunu hatırlatsın mı?
88. Engelli erişimi için özel not gerekiyor mu?
89. Alerji / sağlık koşulu soruyor musun randevu öncesi? (örn. "boyaya alerji var mı")
90. Hamile / emziren müşteri için kısıtlama var mı?
91. Süt çocuğu ile gelen anneler için bilgi vermek gerekiyor mu?
92. Grup indirimi / kurumsal anlaşma var mı?

---

## 10. Kapasite ve Yoğunluk

93. Aynı anda kaç müşteri hizmet alabilir? (kaç koltuk / kabin)
94. En yoğun saatler hangileri? (hafta içi 18:00 sonrası, Cumartesi öğle vs.)
95. En sakin saatler hangileri? Bot buralarda indirim önersin mi?
96. Haftada ortalama kaç randevu alıyorsun?
97. Günde en fazla kaç randevu kabul edebilirsin?
98. Yoğun dönemlerde (düğün sezonu, bayram öncesi) kapasite artırıyor musun?

---

## 11. Marka ve Görsel Kimlik

99. Logon var mı? Yüksek çözünürlüklü dosyasını verebilir misin? (PNG + SVG ideal)
100. Ana rengin nedir? Tam renk kodu? (örn. `#E91E63`)
101. İkincil renk / vurgu rengi?
102. Kullandığın font var mı? (Instagram'da, afişlerde)
103. Hazır fotoğrafların var mı — mekândan, hizmetlerden?
104. Arka plan görseli istiyor musun?
105. Mevcut bir web siten var mı? URL ver.
106. Bu sisteme domain bağlamak ister misin? (örn. `randevu.isletme.com`)
107. Mobil uygulama hissi mi istiyorsun, web sitesi hissi mi?

---

## 12. Teknik ve Operasyonel Tercihler

108. Şu an randevuları nasıl tutuyorsun? (defter, Excel, WhatsApp, başka yazılım)
109. Geçmiş randevu verilerini aktaralım mı? (varsa formatı?)
110. Müşteri bilgisi listesi var mı? Telefon + ad bilgisi?
111. Google Takvim kullanıyor musun? Hangi hesabı bağlayalım?
112. Birden fazla kişi dashboard'a girecek mi? (sahip + muhasebeci + resepsiyon)
113. Hangi cihazdan dashboard'a bakacaksın — telefon, tablet, masaüstü?
114. SMS atarken kullanılacak numara — yeni mi alalım, mevcut numarayı mı kullanalım?
115. Bildirim tercihin — yeni randevu geldiğinde sana SMS mi, email mi, sadece dashboard mu yetsin?

---

## 13. Yasal ve Gizlilik

116. KVKK aydınlatma metnin var mı? Yoksa biz mi hazırlatalım?
117. Müşteri "beni silin" derse kaç günde silmeli? (KVKK 30 gün diyor)
118. Vergi levhan / işletme türün ne? (şahıs / LTD / AŞ)
119. Sigorta kaydın var mı? Müşteri zarar görürse kim sorumlu?
120. Reşit olmayan müşteri (18 altı) kabul ediyor musun? Veli onayı?
121. Çekiliş / kampanya düzenliyor musun? KVKK'ya uygun metin var mı?

---

## 14. Büyüme, Hedef, Beklenti

122. Bu sistemden ay sonunda en çok ne beklersin? (zaman tasarrufu / ciro artışı / prestij)
123. Bu sistemle hangi sorunun çözülmesini istiyorsun? (en çok canını sıkan şey)
124. 6 ay sonra sistemden ne isterdin — bugün olmayan bir şey?
125. 1 yıl içinde şube açma planın var mı? Sistem ona hazır olmalı mı?
126. Sistem sorun çıkarırsa öncelik neyin çalışması? (randevu mu / SMS mi / dashboard mu)
127. Benden ne kadar desteğe ihtiyacın olur düşünüyorsun — aylık bakım mı, sadece kurulum mu?
128. Sistemi "bitti" olarak ne zaman kabul edersin? Hangi 3 şey çalışırsa tamamdır dersin?

---

## 15. Kritik Senaryolar — Canlı Simülasyon

> Bu bölüm anket değil. Her senaryoyu müşteriye oku, "sen olsan ne yapardın?" diye sor. Aldığın cevap, bot için yazılacak kurala dönüşecek.

### Senaryo 1 — Doluluk
"Müşteri, 'Yarın 14:00 saç boyama istiyorum' diyor ama o saat dolu. Sen ona ne söylerdin?"
— Alternatif saatler mi önerirsin, farklı gün mü, yoksa 'dolu' deyip bırakır mısın?

### Senaryo 2 — Belirsiz istek
"Müşteri 'Bu hafta sonu müsait bir ara' diyor. Sen nasıl daraltırsın?"

### Senaryo 3 — İptal
"Müşteri randevudan 1 saat önce iptal istiyor. Sen ne yaparsın? Bu sefer kabul eder, bir daha uyarır mısın? Yoksa ceza mı?"

### Senaryo 4 — Hiç gelmeme
"Geçen hafta randevu aldı, gelmedi. Şimdi tekrar randevu istiyor. Ne yaparsın?"

### Senaryo 5 — Kaba müşteri
"Müşteri 'Senin fiyatların fahiş!' diye saldırıyor. Bot nasıl cevap versin?"

### Senaryo 6 — Bilgi dışı soru
"Müşteri 'Saçıma hangi boya uyar?' diye danışmanlık istiyor. Bot buna cevap versin mi, sana mı yönlendirsin?"

### Senaryo 7 — Hizmet dışı istek
"Müşteri 'Botoks da yapıyor musunuz?' diyor, siz yapmıyorsunuz. Bot ne desin?"

### Senaryo 8 — Grup randevusu
"3 kişi 'aynı anda' hizmet istiyor ama kapasiten 2. Nasıl çözersin?"

### Senaryo 9 — Aceleci müşteri
"Müşteri '20 dakika sonra oradayım, saç kesimi yaptırabilir miyim?' diyor. Bot hemen kabul mü etsin, sana mı sorsun?"

### Senaryo 10 — Fiyat pazarlığı
"Müşteri '500 değil 400 olsa gelirim' diyor. Bot ne yapsın?"

### Senaryo 11 — Yanlış bilgi
"Müşteri randevu aldı ama yanlış gün belirtti. Fark ettiğinde ne yaparsın?"

### Senaryo 12 — Rakip sorma
"Müşteri 'Şu salonla arasında fark ne?' diye soruyor. Bot yorum yapsın mı?"

### Senaryo 13 — Özel personel isteği
"Müşteri 'Hep Ayşe'ye yaptırıyorum, başka kimseye yaptırmam' diyor ama Ayşe o gün izinli. Bot nasıl çözsün?"

### Senaryo 14 — Depozito itirazı
"Müşteri depozito istemene 'Ben sizi tanıyorum, güvenin bana' diyor. Bot istisna yapsın mı?"

### Senaryo 15 — Şikâyet
"Müşteri geçen gelen hizmetten memnun kalmamış, şikâyet ediyor. Bot ne yapmalı?"

---

## 16. Cevap Kâğıdı Şablonu

> Mülakat sırasında aşağıdaki alanları doldur. Sistemi kurarken referans olur.

```
MÜŞTERİ ADI: ____________________
MÜLAKAT TARİHİ: _______________
MÜLAKATI YAPAN: _______________

── İŞLETME KİMLİĞİ ──
Ad: ____________________
Asistan adı: __________
Ton: □ Resmi  □ Samimi  □ Lüks  □ Şakacı
Hitap: □ Siz  □ Sen
Emoji: □ Hiç  □ Az  □ Sık

── HİZMETLER (ad | süre dk | fiyat ₺) ──
1. ______________ | ____ | ____
2. ______________ | ____ | ____
3. ______________ | ____ | ____
... (gerekli kadar uzat)

── ÇALIŞMA ──
Açılış: ____    Kapanış: ____
Günler: Pzt □ Sal □ Çar □ Per □ Cum □ Cmt □ Paz □
Öğle arası: _______________
Slot uzunluğu: ____ dakika

── PERSONEL ──
1. Ad: ______ | Uzmanlık: ______ | Mesai: ______
2. Ad: ______ | Uzmanlık: ______ | Mesai: ______

── POLİTİKA ──
En erken randevu: _______
En geç randevu: _______
İptal min: _____ saat önce
No-show cezası: _______________
Geç kalma toleransı: _____ dk
Depozito: □ Yok  □ Var, %___

── İLETİŞİM ──
Onay SMS'i: □ Evet  □ Hayır
2 saat önce hatırlatma: □ Evet  □ Hayır
1 gün önce hatırlatma: □ Evet  □ Hayır
Sonrası teşekkür: □ Evet  □ Hayır
Doğum günü: □ Evet  □ Hayır

── MARKA ──
Ana renk: #________
İkincil renk: #________
Logo dosyası: □ var  □ yok
Domain: __________________

── KRİTİK KURAL ──
(Mülakatta en çok vurgu yapılan tek cümle)
_______________________________________________________

── RİSK UYARILARI ──
(Müşterinin "ama genelde şöyle…" dediği belirsizlikler)
1. ____________________
2. ____________________
3. ____________________
```

---

## Mülakatı Nasıl Yönetirsin — İpucu

- **Yazarak yap.** Müşteri konuşurken not al — sonradan hatırlamazsın.
- **"Şu durumda ne yapıyorsun?"** diye sor, "ne yapılması gerekir" sorusundan kaçın. Gerçek davranışı istiyorsun, ideali değil.
- **Çelişkiye takıl.** "Biraz önce 'iptal kabul etmem' dedin, ama az önce 'bazen esneklik gösteririm' dedin. Hangisi?" — gerçek politika belirsizliğin altında.
- **Sus ve dinle.** Soru sordukça cevap kısalır. Bazı sorulardan sonra 3 saniye bekle, müşteri kendisi detaylandırır.
- **Gerçek örnek iste.** "Son ay böyle bir durum oldu mu? Anlat." — hikâye, kuraldan daha aydınlatıcı.
- **Kelimelerini not et.** Müşterinin kullandığı özgün ifadeleri (örn. "tatlı tatlı söyleyerek", "abla gibi") bot'un dilinde tekrarla.

---

**Bu mülakat bittiğinde:**

1. `docs/SISTEM-REHBERI.md` → Bölüm 10'daki `config/client.ts` örneğini müşteriye özel doldur.
2. `lib/ai-tools.ts` içindeki SYSTEM_PROMPT'u buraya topladığın politikalara göre özelleştir.
3. SMS metinlerini (`lib/sms.ts`) müşterinin tonuna göre uyarla.
4. Bu dokümanın doldurulmuş halini müşterinin klasöründe sakla — 6 ay sonra "niye böyle kurmuştuk?" sorusunun cevabı orada olur.
