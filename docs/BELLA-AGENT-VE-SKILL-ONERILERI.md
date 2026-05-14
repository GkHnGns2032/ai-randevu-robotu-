# Bella — AI Randevu Robotu
## Genişletilmiş Agent (Temsilci) ve Skill (Yetenek) Önerileri Raporu

Bella'nın standart bir "randevu alan chatbot" olmaktan çıkıp, güzellik salonları için tam kapsamlı bir **Yapay Zeka İşletme Ortağına** dönüşmesini sağlayacak genişletilmiş özellik vizyonu aşağıda sunulmuştur. Bu öneriler, projeye büyük bir "Premium" hissiyatı katmak ve satış gücünü artırmak amacıyla tasarlanmıştır.

---

### 1. Çoklu Kanal Temsilcileri (Omnichannel Agents)

Müşterilerin sadece web sitesinden değil, bulundukları her platformdan Bella'ya ulaşabilmesini sağlayan asistanlar:

*   **WhatsApp & Instagram DM Asistanı:** Müşterilerin %80'inin randevu için sosyal medyayı tercih ettiği güzellik sektöründe, Bella'nın mevcut "tool-use" yeteneklerini Meta Graph API ile entegre ederek doğrudan Instagram DM ve WhatsApp üzerinde çalışmasını sağlar. 
*   **Voice (Sesli) Resepsiyonist:** Projede bulunan Twilio altyapısına *OpenAI Realtime API* veya *Retell AI* gibi ses odaklı yapay zeka modelleri eklenerek, salonu telefonla arayanlara insan doğallığında yanıt veren, randevuları saniyeler içinde Airtable'a işleyen bir çağrı merkezi ajanı.

### 2. Görsel ve Fiziksel Analiz Becerileri (Computer Vision Skills)

*   **Görsel Teşhis (Diagnosis) Agent'ı:** Müşteri randevu alırken, örneğin yıpranmış saçının veya protez yapılacak tırnağının fotoğrafını sisteme yükler. Claude 3.5 Sonnet Vision gibi görsel modellerle çalışan agent, fotoğrafı analiz eder, saçın uzunluğunu, yıpranma payını anlar.
    *   *Fayda:* İşleme ayrılması gereken süreyi hatasız hesaplar. "Saçınız yoğun işlem görmüş, size keratin bakımı da ekleyelim mi?" diyerek işlem öncesi çapraz satış (cross-sell) yapar.

### 3. Dinamik Fiyatlandırma ve Gelir Artırıcı Yetenekler (Sales & Revenue Skills)

*   **Dinamik Fiyatlandırma (Dynamic Pricing) Becerisi:** Uçak bileti veya Uber sistemine benzer çalışır. Airtable'ı analiz ederek salonun tamamen boş olduğu ölü saatleri (Örn: Salı sabah 10:00) tespit eder. Müşteri chat'e girdiğinde "Size özel Salı sabahı için Fırsat Saati! %15 indirimle randevu oluşturmak ister misiniz?" teklifi sunar. Prime-time (Cumartesi öğleden sonra) saatleri için ise indirim önermez.
*   **Proaktif Yeniden Hedefleme (Retargeting) Ajanı:** Veritabanını gece boyu tarayan bir arka plan ajanıdır. 3 haftadır protez tırnak bakımı için veya 2 aydır dip boyası için gelmeyen müşterileri tespit eder ve onlara otomatik bir SMS/WhatsApp atarak: *"Merhaba Ayşe Hanım, Bella ben! Dip boyanızın vakti gelmiş görünüyor, bu hafta içi size uygun bir saat ayarlayayım mı?"* diyerek randevu koparır.
*   **Akıllı Upsell & Cross-sell (Çapraz Satış):** Müşteri "Manikür" randevusu aldığında, sistem anında devreye girerek *"Manikür işleminiz için 14:00 uygun. Sadece 15 dakika ekstra sürer, gelmişken kalıcı oje de denemek ister misiniz?"* diyerek sepet tutarını yükseltir.

### 4. Sadakat ve Deneyim Yönetimi (Loyalty & Experience Skills)

*   **Oyunlaştırma ve Sadakat (Gamification) Asistanı:** Müşterilerin ziyaret sayılarını Airtable üzerinden takip eder. Müşterinin 5. gelişinde veya doğum günü haftasında chat üzerinden sürpriz bir kutlama animasyonu ile *"Tebrikler! Bugün VIP statüsündesiniz, bugünkü fön işleminiz bizden"* diyerek müşteri bağlılığını en üst seviyeye çeker.
*   **Akıllı Geri Bildirim ve Yorum (Review) Yöneticisi:** Randevudan 2 saat sonra çalışarak müşteriye hizmeti değerlendirmesini sorar. Müşteri 5 yıldız verirse hemen Google Haritalar linkini gönderir. Düşük puan verirse, konuyu uzatmadan özür diler ve durumu yatıştırıp işletme sahibinin telefonuna "ACİL" koduyla SMS veya WhatsApp mesajı atar.

### 5. Operasyon ve Güvenlik Becerileri (Operations & Security)

*   **No-Show Önleyici & Kapora (Deposit) Becerisi:** Sürekli randevu alıp gelmeyen veya iptal eden (Airtable'da 'Zor'/'Kayıp' etiketli) müşterileri tanır. Bu müşteriler randevu almak istediğinde Bella kibarca: *"Randevunuzu kesinleştirmek için ön ödeme/kapora almamız gerekiyor"* diyerek Stripe veya Iyzico üzerinden otomatik ödeme linki oluşturur.
*   **Stok ve Sarf Malzeme (Inventory) Asistanı:** Alınan randevulara (Örn: 15 adet saç boyama) göre tahmini malzeme kullanımını (X tüp boya) hesaplar. Stoklar azaldığında patrona anlık rapor geçerek "Küllü kumral boya siparişi vermelisiniz" uyarısı yapar.
*   **Personel Brifing Agent'ı:** Her sabah saat 08:00'de çalışan personellerin her birine kişiselleştirilmiş bir mesaj atar: *"Günaydın Zeynep! Bugün 5 müşterin var. İlk müşterin 10:00'da Ayşe Hanım, kendisi VIP müşterimiz ve kahvesini sade seviyor. Başarılar!"*

### 6. İş Zekası ve Yönetim (BI & Admin Agent)

*   **Veri Analisti (Yönetici Asistanı):** Dashboard (`/dashboard`) içine entegre edilen, sadece patronun yazıştığı gelişmiş bir ajandır. Patron doğal dille *"Geçen aya göre ciro durumumuz ne?"*, *"En çok hangi gün boş kalıyoruz?"* veya *"Ahmet adlı personelimizin müşteri tutundurma oranı nedir?"* diye sorar. Agent verileri analiz edip patronun önüne grafikler ve net özetler koyar.

---

**Sonuç ve Önceliklendirme:**
Bu özelliklerin hepsi bir araya geldiğinde Bella, sadece bir asistan değil, salonun kârını artıran bir **işletme müdürü** haline gelir. 
İlk etapta müşterileri "Vay canına" dedirtecek en çarpıcı yetenekler: **WhatsApp Entegrasyonu**, **Görsel Teşhis (Fotoğraf analizi)** ve patronların bayılacağı **Veri Analisti Agent'ı** olacaktır.
