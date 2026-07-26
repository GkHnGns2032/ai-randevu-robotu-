/**
 * TEŞHİS — SALT OKUNUR. Hiçbir kayıt yazmaz/silmez/değiştirmez.
 *
 * Sorusu: getAppointmentsByDate() neden çakışma bulamıyor?
 * Hipotez: Airtable'daki `date` alanı Date tipinde; `{date} = "YYYY-MM-DD"`
 *          string karşılaştırması hiç eşleşmiyor → fonksiyon hep boş dönüyor.
 *
 * KVKK: müşteri adı/telefonu ASLA yazdırılmaz. Yalnız alan adları, tipler,
 * tarih biçimi ve sayılar raporlanır.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const Airtable = (await import('airtable')).default;
const table = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! })
  .base(process.env.AIRTABLE_BASE_ID!)(process.env.AIRTABLE_TABLE_NAME!);

const { getAppointmentsByDate } = await import('../lib/airtable');

// 1) Filtresiz oku — base gerçekten boş mu?
const all = await table.select({ maxRecords: 200 }).all();
console.log(`\nFiltresiz toplam kayıt: ${all.length}`);

if (all.length === 0) {
  console.log('Base gerçekten boş — teşhis buradan ilerleyemez.');
  process.exit(0);
}

// 2) date alanının ham biçimi (yalnız tarih — kişisel veri değil)
const sample = all[0];
console.log(`\nAlan adları: ${Object.keys(sample.fields).join(', ')}`);
const rawDates = all.slice(0, 8).map((r) => {
  const v = (r.fields as Record<string, unknown>).date;
  return `${JSON.stringify(v)} (${typeof v})`;
});
console.log(`\nİlk 8 kaydın ham 'date' değeri:`);
rawDates.forEach((d) => console.log(`  ${d}`));

const rawTimes = all.slice(0, 4).map((r) => JSON.stringify((r.fields as Record<string, unknown>).time));
console.log(`\nİlk 4 kaydın ham 'time' değeri: ${rawTimes.join(', ')}`);

// 3) Aynı tarihi üç farklı formülle sorgula — hangisi tutuyor?
const target = String((sample.fields as Record<string, unknown>).date);
const dateOnly = target.slice(0, 10);
console.log(`\nHedef tarih: ${target}  (ilk 10 karakter: ${dateOnly})`);

async function countBy(label: string, formula: string) {
  try {
    const recs = await table.select({ filterByFormula: formula }).all();
    console.log(`  ${recs.length > 0 ? '✅' : '❌'} ${label}: ${recs.length} kayıt`);
  } catch (e) {
    console.log(`  ⚠️  ${label}: HATA — ${(e as Error).message}`);
  }
}

console.log(`\nFormül karşılaştırması:`);
await countBy('{date} = "…"           (ESKİ, bozuk)', `{date} = "${dateOnly}"`);
await countBy('DATESTR({date}) = "…"  (kullanılan)', `DATESTR({date}) = "${dateOnly}"`);
await countBy('IS_SAME({date}, DATETIME_PARSE(…), "day")',
  `IS_SAME({date}, DATETIME_PARSE("${dateOnly}", 'YYYY-MM-DD'), 'day')`);

// 4) Uygulamanın gerçek fonksiyonu ne döndürüyor?
const viaLib = await getAppointmentsByDate(dateOnly);
console.log(`\ngetAppointmentsByDate("${dateOnly}") → ${viaLib.length} kayıt`);
console.log(viaLib.length === 0
  ? "  ❌ O güne kayıt VAR ama fonksiyon boş dönüyor — çakışma tespiti tümüyle ölü."
  : "  ✅ Fonksiyon kayıtları görüyor.");

// 5) Smoke testte açılıp silinen kaydın gerçekten gittiğini bağımsız doğrula
const leftovers = all.filter((r) =>
  String((r.fields as Record<string, unknown>).customerName ?? '').startsWith('TEST KAYDI'));
console.log(`\nBase'de kalan otomatik test kaydı: ${leftovers.length}`);
if (leftovers.length > 0) {
  console.log('  ⚠️ Temizlenmemiş test kaydı var, id: ' + leftovers.map((r) => r.id).join(', '));
}
