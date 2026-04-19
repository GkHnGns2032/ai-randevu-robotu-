// lib/calendar.ts
import { google } from 'googleapis';
import { format, addMinutes, parseISO } from 'date-fns';
import { TimeSlot, WORKING_HOURS } from './types';
import { CLIENT_CONFIG } from '@/config/client';

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

export async function getAvailableSlots(
  date: string,
  durationMinutes: number
): Promise<TimeSlot[]> {
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const startHour = String(WORKING_HOURS.start).padStart(2, '0');
  const endHour = String(WORKING_HOURS.end).padStart(2, '0');
  const dayStart = new Date(`${date}T${startHour}:00:00+03:00`);
  const dayEnd = new Date(`${date}T${endHour}:00:00+03:00`);

  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      items: [{ id: calendarId }],
      timeZone: 'Europe/Istanbul',
    },
  });

  const busyPeriods = data.calendars?.[calendarId]?.busy ?? [];

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
      time: format(cursor, 'HH:mm'),
      available: !isBlocked,
    });

    cursor = addMinutes(cursor, WORKING_HOURS.slotMinutes);
  }

  return slots;
}

export async function findNextAvailableSlots(
  fromDate: string,
  durationMinutes: number,
  count = 3
): Promise<TimeSlot[]> {
  const results: TimeSlot[] = [];
  let checkDate = new Date(fromDate);

  while (results.length < count) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    const dayOfWeek = checkDate.getDay();

    if (CLIENT_CONFIG.workingHours.workingDays.includes(dayOfWeek)) {
      const slots = await getAvailableSlots(dateStr, durationMinutes);
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
}): Promise<string> {
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const startDateTime = new Date(`${params.date}T${params.time}:00`);
  const endDateTime = addMinutes(startDateTime, params.durationMinutes);

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
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;
  await calendar.events.delete({ calendarId, eventId });
}
