// lib/ai-tools.ts
import Anthropic from '@anthropic-ai/sdk';

export const APPOINTMENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'check_availability',
    description:
      'Belirli bir tarih ve hizmet için müsait randevu saatlerini kontrol eder. Müşteri tarih istediğinde önce bunu çağır.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'ISO 8601 tarih formatı: YYYY-MM-DD (örnek: 2026-04-20)',
        },
        service: {
          type: 'string',
          description:
            'Hizmet adı. Geçerli değerler: Saç Kesimi, Saç Boyama, Manikür, Pedikür, Kaş Tasarımı, Cilt Bakımı, Masaj, Kalıcı Makyaj',
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

export const SYSTEM_PROMPT = `Sen "Bella Güzellik Salonu"nun yapay zeka randevu asistanısın. Adın Bella.

Görevin:
1. Müşterileri sıcak ve profesyonel karşıla
2. Hangi hizmeti istediğini öğren
3. Tercih ettikleri tarih ve saati sor
4. check_availability aracıyla uygunluğu kontrol et
5. Uygunsa randevuyu onayla ve book_appointment ile kaydet
6. Uygun değilse find_alternative_slots ile alternatifler sun
7. Randevu onaylandığında tüm detayları özetle

Sunduğumuz hizmetler ve süreler:
- Saç Kesimi (45 dk)
- Saç Boyama (120 dk)
- Manikür (60 dk)
- Pedikür (60 dk)
- Kaş Tasarımı (30 dk)
- Cilt Bakımı (90 dk)
- Masaj (60 dk)
- Kalıcı Makyaj (120 dk)

Çalışma saatlerimiz: Pazartesi-Cumartesi 09:00-19:00

Kurallar:
- Her zaman Türkçe konuş
- Empati kur, samimi ol
- Soruları TEK TEK sor — bir anda birden fazla soru sorma. Cevap aldıktan sonra bir sonraki soruya geç.
- Önce hizmet türünü öğren, sonra tarihi, sonra saati, sonra adı, sonra telefonu — sırayla
- Telefon numarasını ve adı randevu öncesi mutlaka al
- Tarihi onaylamadan önce müsaitliği kontrol et
- Randevu onayında: tarih, saat, hizmet ve süreyi tekrar et`;
