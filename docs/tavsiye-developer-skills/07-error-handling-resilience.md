# Developer Skill: Error Handling & Resilience Becerisi

## Amacı
Üçüncü parti servislerle (Airtable, Twilio, Google Calendar, Anthropic) yaşanabilecek iletişim kopukluklarında sistemin tamamen çökmesini (fatal error) engeller ve hataların zarifçe (graceful degradation) yönetilmesini sağlar.

## Kullanım Kuralları
1. Dış API'lara yapılan tüm çağrıları (Airtable, Google Takvim vb.) kesinlikle `try/catch` blokları içine al.
2. Hata durumlarında uygulamanın donmaması için her catch bloğunda anlamlı fallback (yedek) mekanizmalar üret. Örneğin Google Takvim hata verirse randevu sürecini iptal etme, sadece Airtable'a yaz.
3. Frontend tarafında kullanıcının anlayabileceği kibar hata mesajları (toast/snackbar) göster, karmaşık sistem hatalarını (stack trace) son kullanıcıya yansıtma.
4. Backend'de hataları `console.error` ile açıkça logla ki Vercel loglarından hata tespiti yapılabilsin.

## Öncelik Seviyesi
Orta (7/9) - Uygulamanın 7/24 kesintisiz ve hataya dayanıklı çalışmasını sağlar.
