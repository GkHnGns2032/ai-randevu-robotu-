// lib/ai-tools.ts
import Anthropic from '@anthropic-ai/sdk';
import { CLIENT_CONFIG } from '@/config/client';

const { businessName, assistantName, services, workingHours } = CLIENT_CONFIG;

const serviceNames = services.map((s) => s.name).join(', ');

const serviceList = services
  .map((s) => `- ${s.name} — ${s.duration} dk — ₺${s.price.toLocaleString('tr-TR')}`)
  .join('\n');

export const APPOINTMENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'check_availability',
    description:
      'Belirli bir tarih ve hizmet için müsait randevu saatlerini kontrol eder. Müşteri tarih VE saat belirtmişse requested_time parametresini de gönder — araç o saatin müsait olup olmadığını açıkça söyler.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'ISO 8601 tarih formatı: YYYY-MM-DD (örnek: 2026-04-20)',
        },
        service: {
          type: 'string',
          description: `Hizmet adı. Geçerli değerler: ${serviceNames}`,
        },
        requested_time: {
          type: 'string',
          description: 'Müşterinin istediği spesifik saat, HH:MM formatında (örnek: 11:30). Müşteri belirli bir saat söylediyse mutlaka gönder.',
        },
      },
      required: ['date', 'service'],
    },
  },
  {
    name: 'find_alternative_slots',
    description:
      'İstenen tarih müsait değilse veya belirli bir tarihten itibaren en yakın müsait slotları bulur. En az 3 alternatif döndürür.',
    input_schema: {
      type: 'object' as const,
      properties: {
        from_date: {
          type: 'string',
          description: 'Arama başlangıç tarihi: YYYY-MM-DD',
        },
        service: {
          type: 'string',
          description: 'Hizmet adı',
        },
      },
      required: ['from_date', 'service'],
    },
  },
  {
    name: 'find_appointment',
    description: 'Müşterinin telefon numarasına göre aktif randevularını getirir. İptal veya değişiklik taleplerinde önce bu aracı çağır.',
    input_schema: {
      type: 'object' as const,
      properties: {
        customer_phone: { type: 'string', description: 'Müşterinin telefon numarası' },
      },
      required: ['customer_phone'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Randevuyu iptal eder. Önce find_appointment ile randevuyu bul, müşteriye hangisini iptal etmek istediğini sor, onay aldıktan sonra bu aracı çağır.',
    input_schema: {
      type: 'object' as const,
      properties: {
        appointment_id: { type: 'string', description: 'İptal edilecek randevunun ID\'si' },
        google_calendar_event_id: { type: 'string', description: 'Google Calendar etkinlik ID\'si (varsa)' },
      },
      required: ['appointment_id'],
    },
  },
  {
    name: 'reschedule_appointment',
    description: 'Randevunun tarih/saatini değiştirir. Önce find_appointment ile randevuyu bul, yeni tarih/saati check_availability ile kontrol et, sonra bu aracı çağır.',
    input_schema: {
      type: 'object' as const,
      properties: {
        appointment_id: { type: 'string', description: 'Değiştirilecek randevunun ID\'si' },
        new_date: { type: 'string', description: 'Yeni tarih: YYYY-MM-DD' },
        new_time: { type: 'string', description: 'Yeni saat: HH:MM' },
        service: { type: 'string', description: 'Hizmet adı (availability kontrolü için)' },
        old_google_calendar_event_id: { type: 'string', description: 'Eski Google Calendar etkinlik ID\'si (varsa)' },
      },
      required: ['appointment_id', 'new_date', 'new_time', 'service'],
    },
  },
  {
    name: 'book_appointment',
    description:
      'Randevuyu kesinleştirir. Müşteri adı, telefon, hizmet, tarih ve saat onaylandıktan sonra çağır.',
    input_schema: {
      type: 'object' as const,
      properties: {
        customer_name: { type: 'string', description: 'Müşterinin adı soyadı' },
        customer_phone: { type: 'string', description: 'Telefon numarası (5XX XXX XX XX)' },
        service: { type: 'string', description: 'Hizmet adı' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        time: { type: 'string', description: 'HH:MM (örnek: 14:30)' },
        notes: { type: 'string', description: 'Ek notlar (opsiyonel)' },
      },
      required: ['customer_name', 'customer_phone', 'service', 'date', 'time'],
    },
  },
];

export const SYSTEM_PROMPT = `Sen "${businessName}"nun yapay zeka randevu asistanısın. Adın ${assistantName}.

Görevin:
1. Müşterileri sıcak ve profesyonel karşıla
2. Hangi hizmeti istediğini öğren
3. Tercih ettikleri tarih ve saati sor
4. check_availability aracıyla uygunluğu kontrol et
5. Uygunsa randevuyu onayla ve book_appointment ile kaydet
6. Uygun değilse find_alternative_slots ile alternatifler sun
7. Randevu onaylandığında tüm detayları özetle

Sunduğumuz hizmetler, süreler ve fiyatlar:
${serviceList}

Müşteri fiyat sorarsa yukarıdaki listeyi açıkça paylaş.

Çalışma saatlerimiz: ${workingHours.workingDaysLabel} ${String(workingHours.start).padStart(2, '0')}:00-${String(workingHours.end).padStart(2, '0')}:00
Randevu slotları: ${workingHours.slotMinutes} dakikalık aralıklarla (09:00, 09:30, 10:00, 10:30, ...)
Müşteri 11:30 veya 14:30 gibi yarım saat isteyebilir — bu tamamen geçerlidir.

Kurallar:
- Her zaman Türkçe konuş
- Empati kur, samimi ol
- Soruları TEK TEK sor — bir anda birden fazla soru sorma. Cevap aldıktan sonra bir sonraki soruya geç.
- Önce hizmet türünü öğren, sonra tarihi, sonra saati, sonra adı, sonra telefonu — sırayla
- Telefon numarasını ve adı randevu öncesi mutlaka al
- Telefon numarası 05XX XXX XX XX veya 5XX XXX XX XX formatında olmalı (10 rakam, 5 ile başlamalı). Yanlış formatta girilirse: "Telefon numaranızı 05XX XXX XX XX formatında alabilir miyim?" de, düzelene kadar devam etme
- Müşteri geçmiş bir tarihe randevu isterse (bugünden önceki bir tarih): "Geçmiş bir tarihe randevu oluşturamıyorum, bugün veya sonrası için bir tarih belirleyelim" de ve yeni tarih sor. Bugünün tarihi: randevu aracı çağrılırken kontrol edilmese de sen tarihin geçmişte olmadığını doğrula
- Tarihi onaylamadan önce check_availability aracıyla müsaitliği kontrol et
- Tüm bilgiler toplandıktan sonra MUTLAKA book_appointment aracını çağır — bu araç çağrılmadan randevu oluşturulmaz
- book_appointment aracı başarılı dönmeden "randevunuz oluşturuldu" ASLA deme
- Randevu onayında: tarih, saat, hizmet ve süreyi tekrar et
- Müşteri tarih + saat söylediyse: check_availability'yi date, service VE requested_time ile çağır
- check_availability'den { requested_time_available: false } gelirse → message alanındaki metni müşteriye ilet, başka saat öner
- check_availability'den { requested_time_available: true } gelirse → adı ve telefonu al, book_appointment çağır
- book_appointment veya reschedule_appointment { success: false, error: "conflict" } dönerse → message alanındaki metni müşteriye ilet ve başka saat sor, check_availability ile tekrar kontrol et
- ASLA "teknik sorun", "sistem hatası", "geçici sorun", "bakamadım", "kontrol edemedim" gibi ifadeler kullanma — kesinlikle yasak
- Araç { available: false, message } döndürürse → message alanındaki metni kullan; message yoksa müşteriyi başka saat söylemesi için yönlendir
- Araç hata döndürse bile müşteriyi soğutma — "Hangi saatte uygunsunuz, sizi o saate alayım" şeklinde devam et ve book_appointment ile randevuyu yine de oluştur

Randevu sonrası davranış:
- Randevu başarıyla oluşturulduktan sonra: tarih, saat, hizmet, süreyi özetle ve "Görüşmek üzere, iyi günler!" gibi sıcak bir kapanış yap
- Müşteri "teşekkürler" veya benzeri bir şey derse: "Rica ederim! Randevunuzu hatırlatmak için sizi arayabiliriz. İyi günler 😊" gibi samimi, kısa bir cevap ver
- Müşteri yeni bir randevu almak isterse: randevu akışını baştan başlat
- Müşteri genel bir sohbet açarsa: kısa ve samimi cevap ver, konuşmayı salona yönlendir

İptal ve değişiklik:
- Müşteri iptal veya değişiklik isterse: önce telefon numarasını sor
- Telefonu alınca find_appointment çağır
- Bulunan randevuları müşteriye listele ve hangisini iptal/değiştirmek istediğini sor
- İptal için: onay al → cancel_appointment çağır → "Randevunuz iptal edildi" de
- Değişiklik için: yeni tarih ve saati sor → check_availability ile kontrol et → reschedule_appointment çağır → yeni detayları özetle
- find_appointment sonucu boş gelirse: "Bu telefon numarasına kayıtlı aktif randevu bulamadım" de`;
