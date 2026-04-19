// lib/airtable.ts
import Airtable from 'airtable';
import { Appointment, ServiceType, AppointmentStatus } from './types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! })
  .base(process.env.AIRTABLE_BASE_ID!);

const table = base(process.env.AIRTABLE_TABLE_NAME!);

function escapeFormulaString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function recordToAppointment(record: Airtable.Record<Airtable.FieldSet>): Appointment {
  const f = record.fields as Record<string, unknown>;
  return {
    id: record.id,
    customerName: f.customerName as string,
    customerPhone: f.customerPhone as string,
    service: f.service as ServiceType,
    date: f.date as string,
    time: f.time as string,
    durationMinutes: f.durationMinutes as number,
    status: f.status as AppointmentStatus,
    notes: f.notes as string | undefined,
    createdAt: f.createdAt as string,
    isNoShow: Boolean(f.isNoShow),
  };
}

export async function createAppointment(
  data: Omit<Appointment, 'id' | 'createdAt'> & { googleCalendarEventId?: string }
): Promise<Appointment> {
  const record = await table.create({
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    service: data.service,
    date: data.date,
    time: data.time,
    durationMinutes: data.durationMinutes,
    status: data.status,
    notes: data.notes ?? '',
    googleCalendarEventId: data.googleCalendarEventId ?? '',
  });
  return recordToAppointment(record);
}

export async function listAppointments(options?: {
  fromDate?: string;
  toDate?: string;
  status?: AppointmentStatus;
}): Promise<Appointment[]> {
  const filterParts: string[] = [];

  if (options?.fromDate) {
    filterParts.push(`IS_AFTER({date}, "${escapeFormulaString(options.fromDate)}")`);
  }
  if (options?.toDate) {
    filterParts.push(`IS_BEFORE({date}, "${escapeFormulaString(options.toDate)}")`);
  }
  if (options?.status) {
    filterParts.push(`{status} = "${escapeFormulaString(options.status)}"`);
  }

  const filterByFormula =
    filterParts.length > 0
      ? filterParts.length === 1
        ? filterParts[0]
        : `AND(${filterParts.join(',')})`
      : '';

  const records = await table
    .select({
      sort: [{ field: 'date', direction: 'asc' }, { field: 'time', direction: 'asc' }],
      ...(filterByFormula ? { filterByFormula } : {}),
    })
    .all();

  return records.map(recordToAppointment);
}

export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  const records = await table
    .select({
      filterByFormula: `{date} = "${escapeFormulaString(date)}"`,
      sort: [{ field: 'time', direction: 'asc' }],
    })
    .all();
  return records.map(recordToAppointment);
}

export async function findAppointmentsByPhone(phone: string): Promise<Appointment[]> {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10 || cleaned.length > 15) {
    return [];
  }
  const records = await table
    .select({
      filterByFormula: `AND({customerPhone} = "${escapeFormulaString(phone)}", {status} != "cancelled")`,
      sort: [{ field: 'date', direction: 'asc' }, { field: 'time', direction: 'asc' }],
    })
    .all();
  return records.map(recordToAppointment);
}

export async function cancelAppointment(id: string): Promise<void> {
  await table.update(id, { status: 'cancelled' });
}

export async function markNoShow(id: string): Promise<void> {
  await table.update(id, { isNoShow: true, status: 'cancelled' });
}

export async function markReminderSent(id: string): Promise<void> {
  await table.update(id, { reminderSent: true });
}

export async function updateAppointmentFields(
  id: string,
  fields: Partial<Omit<Appointment, 'id' | 'createdAt'>> & { googleCalendarEventId?: string }
): Promise<Appointment> {
  const record = await table.update(id, fields as Airtable.FieldSet);
  return recordToAppointment(record);
}

export async function rescheduleAppointment(
  id: string,
  date: string,
  time: string,
  googleCalendarEventId?: string
): Promise<Appointment> {
  const record = await table.update(id, {
    date,
    time,
    status: 'confirmed',
    ...(googleCalendarEventId !== undefined ? { googleCalendarEventId } : {}),
  });
  return recordToAppointment(record);
}
