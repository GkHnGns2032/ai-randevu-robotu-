// lib/calendar.ts
import { google } from 'googleapis';
import { addMinutes, parseISO } from 'date-fns';
import { TimeSlot, WORKING_HOURS } from './types';
import { CLIENT_CONFIG } from '@/config/client';
import { getAppointmentsByDate } from './airtable';
import { logger } from './logger';

function formatIstanbulTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function getCalendarClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!
  );
  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
  });
  return google.calendar({ version: 'v3', auth });
}

// Refresh token expire/revoke veya geçersiz credential durumlarını tespit eder.
// googleapis bu hataları Error.message içinde fırlatır; pattern'lar OAuth2 standard.
function isCalendarAuthError(err: unknown): boolean {
  if (!err) return false;
  const message = err instanceof Error ? err.message : String(err);
  return /invalid_grant|Token has been expired or revoked|Invalid Credentials/i.test(message);
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// staffId verildiyse Airtable tabanlı — sadece o personelin randevularıyla çakışma kontrolü.
// GCal bypass: aynı personele paralel rezervasyonu engelle, diğer personelin slotunu etkileme.
async function getStaffAwareSlots(
  date: string,
  durationMinutes: number,
  staffId: string,
): Promise<TimeSlot[]> {
  const startHour = String(WORKING_HOURS.start).padStart(2, '0');
  const endHour = String(WORKING_HOURS.end).padStart(2, '0');
  const dayStart = new Date(`${date}T${startHour}:00:00+03:00`);
  const dayEnd = new Date(`${date}T${endHour}:00:00+03:00`);

  const dayAppointments = await getAppointmentsByDate(date);
  const staffAppts = dayAppointments.filter(
    (a) => a.status !== 'cancelled' && a.staffId === staffId,
  );

  const slots: TimeSlot[] = [];
  let cursor = dayStart;

  while (addMinutes(cursor, durationMinutes) <= dayEnd) {
    const time = formatIstanbulTime(cursor);
    const slotStart = toMinutes(time);
    const slotEnd = slotStart + durationMinutes;

    const isBlocked = staffAppts.some((a) => {
      const existingStart = toMinutes(a.time);
      const existingEnd = existingStart + a.durationMinutes;
      return slotStart < existingEnd && slotEnd > existingStart;
    });

    slots.push({ date, time, available: !isBlocked });
    cursor = addMinutes(cursor, WORKING_HOURS.slotMinutes);
  }

  return slots;
}

export async function getAvailableSlots(
  date: string,
  durationMinutes: number,
  staffId?: string,
): Promise<TimeSlot[]> {
  if (staffId) {
    return getStaffAwareSlots(date, durationMinutes, staffId);
  }

  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const startHour = String(WORKING_HOURS.start).padStart(2, '0');
  const endHour = String(WORKING_HOURS.end).padStart(2, '0');
  const dayStart = new Date(`${date}T${startHour}:00:00+03:00`);
  const dayEnd = new Date(`${date}T${endHour}:00:00+03:00`);

  let busyPeriods: Array<{ start?: string | null; end?: string | null }> = [];
  try {
    const { data } = await calendar.freebusy.query({
      requestBody: {
        timeMin: dayStart.toISOString(),
        timeMax: dayEnd.toISOString(),
        items: [{ id: calendarId }],
        timeZone: 'Europe/Istanbul',
      },
    });
    busyPeriods = data.calendars?.[calendarId]?.busy ?? [];
  } catch (err) {
    if (!isCalendarAuthError(err)) throw err;
    logger.error('calendar_auth_revoked', { op: 'getAvailableSlots', date });
  }

  const slots: TimeSlot[] = [];
  let cursor = dayStart;

  while (addMinutes(cursor, durationMinutes) <= dayEnd) {
    const slotEnd = addMinutes(cursor, durationMinutes);
    const isBlocked = busyPeriods.some((busy) => {
      const busyStart = parseISO(busy.start!);
      const busyEnd = parseISO(busy.end!);
      return cursor < busyEnd && slotEnd > busyStart;
    });

    slots.push({
      date,
      time: formatIstanbulTime(cursor),
      available: !isBlocked,
    });

    cursor = addMinutes(cursor, WORKING_HOURS.slotMinutes);
  }

  return slots;
}

export async function findNextAvailableSlots(
  fromDate: string,
  durationMinutes: number,
  count = 3,
  staffId?: string,
): Promise<TimeSlot[]> {
  const results: TimeSlot[] = [];
  let checkDate = new Date(fromDate);

  while (results.length < count) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayOfWeek = checkDate.getDay();

    if (CLIENT_CONFIG.workingHours.workingDays.includes(dayOfWeek)) {
      const slots = await getAvailableSlots(dateStr, durationMinutes, staffId);
      const available = slots.filter((s) => s.available);
      results.push(...available.slice(0, count - results.length));
    }

    checkDate = addMinutes(checkDate, 24 * 60);
    if (results.length >= count) break;
  }

  return results;
}

export async function createCalendarEvent(params: {
  summary: string;
  description: string;
  date: string;
  time: string;
  durationMinutes: number;
  attendeePhone: string;
}): Promise<string | null> {
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const startDateTime = new Date(`${params.date}T${params.time}:00+03:00`);
  const endDateTime = addMinutes(startDateTime, params.durationMinutes);

  try {
    const { data } = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: params.summary,
        description: params.description,
        start: { dateTime: startDateTime.toISOString(), timeZone: 'Europe/Istanbul' },
        end: { dateTime: endDateTime.toISOString(), timeZone: 'Europe/Istanbul' },
      },
    });
    return data.id!;
  } catch (err) {
    if (!isCalendarAuthError(err)) throw err;
    logger.error('calendar_auth_revoked', { op: 'createCalendarEvent', date: params.date, time: params.time });
    return null;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;
  try {
    await calendar.events.delete({ calendarId, eventId });
  } catch (err) {
    if (!isCalendarAuthError(err)) throw err;
    logger.error('calendar_auth_revoked', { op: 'deleteCalendarEvent', eventId });
  }
}
