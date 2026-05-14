# Developer Skill: Twilio TwiML & Webhook Architect

## Amacı
Bu skill, Sesli (Voice) Resepsiyonist ve SMS/WhatsApp entegrasyonlarını kodlarken, Next.js App Router üzerinde Twilio webhook'larının nasıl güvenli ve standartlara uygun bir şekilde oluşturulacağını belirler.

## Kullanım Kuralları
1. Twilio Webhook'ları her zaman `app/api/.../route.ts` formatında, standart POST handler'ları olarak yazılmalıdır.
2. TwiML (Twilio Markup Language) yanıtları dönerken, response objesinde `Content-Type: text/xml` başlığı (header) kesinlikle ayarlanmalıdır.
3. Twilio SDK `twilio.twiml.VoiceResponse()` veya `MessagingResponse()` sınıfları kullanılarak XML güvenli bir şekilde oluşturulmalı, string birleştirme yöntemlerinden kaçınılmalıdır.
4. Gelen isteklerin gerçekten Twilio'dan geldiğini doğrulamak için Twilio signature validation adımı koda eklenmelidir.

## Öncelik Seviyesi
Çok Yüksek (2/9) - Dış dünya iletişimini (Ses, SMS, WhatsApp) sağladığı için kritik öneme sahiptir.
