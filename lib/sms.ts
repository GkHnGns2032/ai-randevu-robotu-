// lib/sms.ts
import twilio from 'twilio';
import { CLIENT_CONFIG } from '@/config/client';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSMS(to: string, message: string): Promise<void> {
  const phone = to.startsWith('+') ? to : `+90${to.replace(/^0/, '')}`;
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
  });
}

export function buildConfirmationMessage(params: {
  customerName: string;
  service: string;
  date: string;
  time: string;
}): string {
  const { customerName, service, date, time } = params;
  const [y, m, d] = date.split('-');
  const dateStr = `${d}.${m}.${y}`;
  return `Merhaba ${customerName}! ${CLIENT_CONFIG.businessName} randevunuz oluşturuldu: ${dateStr} saat ${time} — ${service}. İptal/değişiklik için bizi arayın. Görüşmek üzere 🌸`;
}

export function buildReminderMessage(params: {
  customerName: string;
  service: string;
  date: string;
  time: string;
}): string {
  const { customerName, service, date, time } = params;
  const [year, month, day] = date.split('-');
  const dateStr = `${day}.${month}.${year}`;
  return `Merhaba ${customerName}! ${CLIENT_CONFIG.businessName} randevu hatırlatması: Yarın ${dateStr} saat ${time}'da ${service} randevunuz bulunmaktadır. İptal veya değişiklik için lütfen bizi arayın. İyi günler 🌸`;
}
