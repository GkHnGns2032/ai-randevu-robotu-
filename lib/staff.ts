import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! })
  .base(process.env.AIRTABLE_BASE_ID!);

const STAFF_TABLE = process.env.AIRTABLE_STAFF_TABLE ?? 'Staff';
const staffTable = base(STAFF_TABLE);

export interface Staff {
  id: string;
  name: string;
  role: string;
  services: string[];
  active: boolean;
}

function toStaff(record: Airtable.Record<Airtable.FieldSet>): Staff {
  const services = record.fields.services;
  return {
    id: record.id,
    name: (record.fields.name as string) ?? '',
    role: (record.fields.role as string) ?? '',
    services: Array.isArray(services) ? (services as string[]) : [],
    active: (record.fields.active as boolean) ?? false,
  };
}

export async function listStaff(): Promise<Staff[]> {
  const records = await staffTable
    .select({ sort: [{ field: 'name', direction: 'asc' }] })
    .all();
  return records.map(toStaff);
}

export async function createStaff(data: Omit<Staff, 'id'>): Promise<Staff> {
  const record = await staffTable.create({
    name: data.name,
    role: data.role,
    services: data.services,
    active: data.active,
  });
  return toStaff(record);
}

export async function updateStaff(id: string, data: Partial<Omit<Staff, 'id'>>): Promise<Staff> {
  const fields: Partial<Airtable.FieldSet> = {};
  if (data.name !== undefined) fields.name = data.name;
  if (data.role !== undefined) fields.role = data.role;
  if (data.services !== undefined) fields.services = data.services;
  if (data.active !== undefined) fields.active = data.active;
  const record = await staffTable.update(id, fields);
  return toStaff(record);
}

export async function deleteStaff(id: string): Promise<void> {
  await staffTable.destroy(id);
}

export async function listActiveStaffForService(service: string): Promise<Staff[]> {
  const all = await listStaff();
  return all.filter(
    (s) => s.active && (s.services.length === 0 || s.services.includes(service)),
  );
}

export async function getStaffById(id: string): Promise<Staff | null> {
  try {
    const record = await staffTable.find(id);
    return toStaff(record);
  } catch {
    return null;
  }
}
