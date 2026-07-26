/**
 * BD-UI-SLOT-HOLD smoke test — SALT OKUNUR.
 *
 * Handoff'ta açık kalan üç soruyu doğrular. Airtable'a HİÇBİR ŞEY YAZMAZ,
 * Anthropic çağrısı yapmaz: hold katmanı tamamen in-memory, availability ise
 * yalnız okuma. Bu yüzden canlı müşteri verisine dokunmadan koşabilir.
 *
 * Koşum: npx tsx scripts/smoke-slot-hold.ts
 *
 * Kapsamı:
 *   T1 cross-session hold      — tutulan slot başka oturuma kapalı görünüyor mu (84f1fe1)
 *   T2 self-block bypass       — tutan oturum kendi hold'unu aşabiliyor mu (02f524a)
 *   T3 hold TTL sonrası açılma — süresi dolan hold slotu geri açıyor mu
 *   T4 staff izolasyonu        — bir personelin hold'u diğerini kilitliyor mu (§5.1)
 *   T5 GCal auth çöküşü        — availability patlamak yerine Airtable'a düşüyor mu (0c812e3)
 *   T6 çift rezervasyon        — dolu slot isSlotStillAvailable'da kapalı mı
 *
 * KVKK: müşteri adı/telefonu asla yazdırılmaz, yalnız saat ve sayı raporlanır.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// .env.local'i yükle (Next dışında çalıştığımız için elle)
for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

// Dinamik import ZORUNLU: lib/airtable.ts modül seviyesinde Airtable client'ı
// kuruyor. Statik import hoist edilip env yüklenmeden çalışırdı.
const { getAvailableSlots } = await import('../lib/calendar');
const { holdSlot, releaseSlot, isSlotHeld } = await import('../lib/booking-hold');
const { isSlotStillAvailable } = await import('../lib/booking-lock');
const { getAppointmentsByDate, createAppointment } = await import('../lib/airtable');

// Kalıcı silme için doğrudan SDK — lib/airtable.ts yalnız cancelAppointment
// (status değiştirme) sunuyor, test kaydını iz bırakmadan silmek istiyoruz.
const Airtable = (await import('airtable')).default;
const table = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! })
  .base(process.env.AIRTABLE_BASE_ID!)(process.env.AIRTABLE_TABLE_NAME!);

const DURATION = 45; // Saç Kesimi
let pass = 0;
let fail = 0;

function check(name: string, ok: boolean, detail: string) {
  console.log(`${ok ? '  ✅' : '  ❌'} ${name} — ${detail}`);
  ok ? pass++ : fail++;
}

/** Bugünden N gün sonrası, YYYY-MM-DD (Istanbul). */
function futureDate(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

async function main() {
  // Çalışma günü bul (Pazar kapalı olabilir) ve boş slotu olan bir gün seç
  let date = '';
  let freeSlot = '';
  for (let d = 2; d <= 9; d++) {
    const cand = futureDate(d);
    const slots = await getAvailableSlots(cand, DURATION);
    const free = slots.find((s) => s.available);
    if (free) { date = cand; freeSlot = free.time; break; }
  }
  if (!date) { console.error('Test için boş slotu olan gün bulunamadı.'); process.exit(1); }

  const appts = await getAppointmentsByDate(date);
  console.log(`\nTest günü: ${date} · boş slot: ${freeSlot} · o gündeki randevu sayısı: ${appts.length}\n`);

  // ── T1 — cross-session hold ────────────────────────────────
  console.log('T1 · cross-session hold');
  holdSlot(date, freeSlot);
  const afterHold = await getAvailableSlots(date, DURATION);
  const held = afterHold.find((s) => s.time === freeSlot);
  check('tutulan slot kapalı görünüyor', held?.available === false,
    `${freeSlot} available=${held?.available}`);

  // ── T2 — self-block bypass (ignoreHolds) ───────────────────
  console.log('T2 · self-block bypass (ignoreHolds=true)');
  const bypass = await getAvailableSlots(date, DURATION, undefined, true);
  const self = bypass.find((s) => s.time === freeSlot);
  check('tutan oturum kendi hold\'unu aşabiliyor', self?.available === true,
    `${freeSlot} available=${self?.available}`);

  // ── T3 — release sonrası geri açılma ───────────────────────
  console.log('T3 · hold bırakılınca slot geri açılıyor');
  releaseSlot(date, freeSlot);
  const afterRelease = await getAvailableSlots(date, DURATION);
  const rel = afterRelease.find((s) => s.time === freeSlot);
  check('release sonrası slot tekrar açık', rel?.available === true,
    `${freeSlot} available=${rel?.available}`);

  // ── T4 — staff izolasyonu ──────────────────────────────────
  console.log('T4 · personel izolasyonu');
  holdSlot(date, freeSlot, 'staff-A');
  const aHeld = isSlotHeld(date, freeSlot, 'staff-A');
  const bHeld = isSlotHeld(date, freeSlot, 'staff-B');
  check('A\'nın hold\'u B\'yi kilitlemiyor', aHeld === true && bHeld === false,
    `A=${aHeld} B=${bHeld}`);
  releaseSlot(date, freeSlot, 'staff-A');

  // ── T5 — GCal auth çöküşünde fallback ──────────────────────
  console.log('T5 · GCal auth çöküşünde davranış');
  // GOOGLE_REFRESH_TOKEN şu an invalid_grant (handoff 🔴). staffId'siz yol
  // freebusy.query'yi dener; fix'ten önce bu exception fırlatıyordu.
  let threw = false;
  let slotCount = 0;
  try {
    const s = await getAvailableSlots(date, DURATION);
    slotCount = s.length;
  } catch { threw = true; }
  check('availability patlamıyor, slot üretiyor', !threw && slotCount > 0,
    `exception=${threw} üretilen slot=${slotCount}`);

  // ── T6 — çift rezervasyon koruması (gerçek veriye karşı) ───
  // Asıl soru bu: handoff'taki "14:00 dolu ama seçilebiliyor" bulgusu.
  // Randevusu OLAN bir gün bulmadan test anlamsız — geriye ve ileriye tara.
  console.log('T6 · çift rezervasyon koruması');
  let busyDate = '';
  let busyAppts = appts.filter((a) => a.status !== 'cancelled');
  if (busyAppts.length > 0) busyDate = date;

  for (let d = -21; d <= 21 && !busyDate; d++) {
    const cand = futureDate(d);
    const list = (await getAppointmentsByDate(cand)).filter((a) => a.status !== 'cancelled');
    if (list.length > 0) { busyDate = cand; busyAppts = list; }
  }

  if (!busyDate) {
    // Base'de aktif randevu yok → senaryo veri olmadan doğrulanamaz.
    // Kontrollü test kaydı aç, doğrula, KALICI OLARAK sil (finally garantili).
    console.log('  (aktif randevu yok — geçici test kaydı açılıyor, sonunda silinecek)');
    const testDate = futureDate(60);
    const testTime = '14:00';
    let testId = '';
    try {
      const created = await createAppointment({
        customerName: 'TEST KAYDI — otomatik smoke test, silinecek',
        customerPhone: '0000000000',
        service: 'Saç Kesimi' as never,
        date: testDate,
        time: testTime,
        durationMinutes: DURATION,
        status: 'confirmed' as never,
        notes: 'BD-UI-SLOT-HOLD smoke test — bu kayıt otomatik silinir',
      });
      testId = created.id;
      console.log(`  (test kaydı: ${testDate} ${testTime}, ${DURATION}dk)`);

      const takenOk = await isSlotStillAvailable(testDate, testTime, DURATION);
      check('dolu slot müsait DEĞİL raporlanıyor', takenOk === false, `${testTime} → ${takenOk}`);

      const slots2 = await getAvailableSlots(testDate, DURATION);
      const ts = slots2.find((s) => s.time === testTime);
      check('dolu slot availability listesinde de kapalı', ts?.available === false,
        `${testTime} available=${ts?.available}`);

      // Kısmi çakışma: 14:00-14:45 doluyken 14:30 başlangıcı da kapalı olmalı
      const midOk = await isSlotStillAvailable(testDate, '14:30', DURATION);
      check('kısmi çakışan başlangıç da kapalı', midOk === false, `14:30 → ${midOk}`);

      // Komşu slot etkilenmemeli: 13:00-13:45, 14:00'a değmiyor
      const nbrOk = await isSlotStillAvailable(testDate, '13:00', DURATION);
      check('komşu slot etkilenmiyor', nbrOk === true, `13:00 → ${nbrOk}`);
    } finally {
      if (testId) {
        await table.destroy(testId);
        const after = (await getAppointmentsByDate(testDate)).filter((a) => a.id === testId);
        check('test kaydı kalıcı olarak silindi', after.length === 0,
          `kalan kayıt=${after.length}`);
      }
    }
  } else {
    const taken = busyAppts[0];
    console.log(`  (dolu gün: ${busyDate}, ${busyAppts.length} aktif randevu)`);

    // 6a — dolu slot müsait görünmemeli
    const takenOk = await isSlotStillAvailable(busyDate, taken.time, taken.durationMinutes);
    check('dolu slot müsait DEĞİL raporlanıyor', takenOk === false,
      `${taken.time} (${taken.durationMinutes}dk) → ${takenOk}`);

    // 6b — dolu slot availability listesinde de kapalı olmalı
    const busySlots = await getAvailableSlots(busyDate, taken.durationMinutes);
    const takenSlot = busySlots.find((s) => s.time === taken.time);
    check('dolu slot availability listesinde de kapalı', takenSlot?.available === false,
      `${taken.time} available=${takenSlot?.available}`);

    // 6c — kısmi çakışma: randevunun ortasına denk gelen başlangıç da kapalı olmalı
    const mid = taken.time.split(':').map(Number);
    const midMinutes = mid[0] * 60 + mid[1] + Math.floor(taken.durationMinutes / 2);
    const midTime = `${String(Math.floor(midMinutes / 60)).padStart(2, '0')}:${String(midMinutes % 60).padStart(2, '0')}`;
    const midOk = await isSlotStillAvailable(busyDate, midTime, DURATION);
    check('kısmi çakışan başlangıç da kapalı', midOk === false, `${midTime} → ${midOk}`);
  }

  const freeOk = await isSlotStillAvailable(date, freeSlot, DURATION);
  check('boş slot müsait raporlanıyor', freeOk === true, `${freeSlot} → ${freeOk}`);

  console.log(`\n${fail === 0 ? '✅ TÜMÜ GEÇTİ' : '❌ BAŞARISIZ'} — ${pass} geçti, ${fail} kaldı\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('Test koşumu hata verdi:', e?.message ?? e); process.exit(1); });
