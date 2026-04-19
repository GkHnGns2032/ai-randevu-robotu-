// lib/booking-lock.ts
// Race condition koruması: LLM konuşma süresi boyunca (saniyeler) oluşabilecek
// çift rezervasyonu engellemek için book_appointment'tan hemen önce Airtable'dan
// tekrar kontrol eder. Tam atomic değil — gerçek atomiklik için external lock
// (Redis/Upstash) gerekir; bu çözüm Bella ölçeğinde (günde 10-30 randevu) yeterli.

import { getAppointmentsByDate } from './airtable';
import type { Appointment } from './types';

export async function isSlotStillAvailable(
  date: string,
  time: string,
  durationMinutes: number,
  excludeAppointmentId?: string,
): Promise<boolean> {
  const dayAppointments = await getAppointmentsByDate(date);
  const requestedStart = toMinutes(time);
  const requestedEnd = requestedStart + durationMinutes;

  const conflict = dayAppointments.some((a: Appointment) => {
    if (a.status === 'cancelled') return false;
    if (excludeAppointmentId && a.id === excludeAppointmentId) return false;
    const existingStart = toMinutes(a.time);
    const existingEnd = existingStart + a.durationMinutes;
    return requestedStart < existingEnd && requestedEnd > existingStart;
  });

  return !conflict;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
