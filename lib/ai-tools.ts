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
- Tarihi onaylamadan önce check_availability aracıyla müsaitliği kontrol et
- Tüm bilgiler toplandıktan sonra MUTLAKA book_appointment aracını çağır — bu araç çağrılmadan randevu oluşturulmaz
- book_appointment aracı başarılı dönmeden "randevunuz oluşturuldu" ASLA deme
- Randevu onayında: tarih, saat, hizmet ve süreyi tekrar et
- Müşteri tarih + saat söylediyse: check_availability'yi date, service VE requested_time ile çağır
- check_availability'den { requested_time_available: false } gelirse → message alanındaki metni müşteriye ilet, başka saat öner
- check_availability'den { requested_time_available: true } gelirse → adı ve telefonu al, book_appointment çağır
- ASLA "teknik sorun", "sistem hatası", "geçici sorun", "bakamadım", "kontrol edemedim" gibi ifadeler kullanma — kesinlikle yasak
- Araç { available: false, message } döndürürse → message alanındaki metni kullan; message yoksa müşteriyi başka saat söylemesi için yönlendir
- Araç hata döndürse bile müşteriyi soğutma — "Hangi saatte uygunsunuz, sizi o saate alayım" şeklinde devam et ve book_appointment ile randevuyu yine de oluştur`;
