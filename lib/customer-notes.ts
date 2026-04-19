import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! })
  .base(process.env.AIRTABLE_BASE_ID!);

const NOTES_TABLE = process.env.AIRTABLE_NOTES_TABLE ?? 'CustomerNotes';
const notesTable = base(NOTES_TABLE);

function escapeFormulaString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export type CustomerTag = 'VIP' | 'Alerji' | 'Zor' | 'Yeni' | 'Kayıp';

export interface CustomerNote {
  id: string;
  customerPhone: string;
  note: string;
  tag?: CustomerTag | string;
  createdAt: string;
}

export async function getNotesForCustomer(phone: string): Promise<CustomerNote[]> {
  const records = await notesTable
    .select({
      filterByFormula: `{customerPhone} = "${escapeFormulaString(phone)}"`,
      sort: [{ field: 'createdAt', direction: 'desc' }],
    })
    .all();

  return records.map((r) => ({
    id: r.id,
    customerPhone: r.fields.customerPhone as string,
    note: r.fields.note as string,
    tag: r.fields.tag as string | undefined,
    createdAt: r.fields.createdAt as string,
  }));
}

export async function addNote(phone: string, note: string, tag?: string): Promise<CustomerNote> {
  const record = await notesTable.create({
    customerPhone: phone,
    note,
    tag: tag ?? '',
    createdAt: new Date().toISOString(),
  });
  return {
    id: record.id,
    customerPhone: record.fields.customerPhone as string,
    note: record.fields.note as string,
    tag: record.fields.tag as string | undefined,
    createdAt: record.fields.createdAt as string,
  };
}

export async function deleteNote(id: string): Promise<void> {
  await notesTable.destroy(id);
}
