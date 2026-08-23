// lib/demo-data.ts
//
// SAHA DEMOSU İÇİN ÖRNEK VERİ — Airtable'a hiç dokunmaz.
//
// Neden var: canlı Airtable tabanında 6 test müşterisi, toplam ₺2.050 ve
// herkeste tek ziyaret vardı. Ekran teknik olarak doğru çalışıyordu ama
// anlatacak hikâyesi yoktu — üstelik "ziyaret başına" sütunu, her müşterinin
// tek ziyareti olduğu için "harcama" ile birebir aynı çıkıyor, yani sütunun
// var olma sebebi olan ayrım görünmüyordu.
//
// Bu veri kümesi 23 Ağu 2026 saha turunda bir kadın kuaförünün kendi
// kelimeleriyle tarif ettiği ayrımı taşır:
//
//   "Bir müşteri yılda 10 kere geliyor, 10 bin kazandırıyor; bir müşteri
//    2 kez geliyor, 30 bin kazandırıyor. Benim ikinci müşteriyi bilip
//    ona göre davranmam gerek."
//
// Elif Şahin (gelin paketi) = 2 ziyaret / ₺30.000 · Merve Aydın = 10 ziyaret
// / ₺10.000. Değere göre sıralandığında Elif tepede; ZİYARET sütununa
// tıklanınca sıra terse döner ve panelin eski varsayılanının neyi kaçırdığı
// tek hamlede görünür.
//
// Kurallar:
//  · Tarihler "bugüne" göre üretilir — veri bayatlamaz, yarın da doğrudur.
//  · Tutarlar `paidAmount` olarak yazılır (liste fiyatı tahmini DEĞİL), böylece
//    ekrandaki "yaklaşık değer" uyarısı demo modunda haklı olarak susar.
//  · Rastgelelik YOK: aynı gün aynı çıktı (sunucu/istemci farkı doğurmaz).

import type { Appointment } from './types';
import type { Staff } from './staff';
import type { ServiceName } from '@/config/client';

const gun = 86_400_000;

function tarih(base: Date, gunFarki: number): string {
  const d = new Date(base.getTime() + gunFarki * gun);
  const ay = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${ay}-${g}`;
}

interface Gecmis {
  ad: string;
  tel: string;
  /** [kaç gün önce, hizmet, ödenen tutar] */
  ziyaretler: [number, ServiceName, number][];
  noShow?: number;
}

// ── 12 aylık geçmiş ────────────────────────────────────────────────────────
// Sıralama bilinçli: değer ekseni ile sıklık ekseni BİRBİRİNİ KESMELİ,
// yoksa iki sütun aynı şeyi söyler ve demo hiçbir şey öğretmez.
const GECMIS: Gecmis[] = [
  {
    // Az gelir, en çok bırakır — gelin paketi. Sıklığa göre sıralamada
    // listenin ortasında kaybolur; değere göre sıralamada birinci.
    ad: 'Elif Şahin', tel: '05321114455',
    ziyaretler: [[152, 'Saç Boyama', 8000], [138, 'Kalıcı Makyaj', 22000]],
  },
  {
    // Çok gelir, az bırakır — eski varsayılan sıralamanın birincisi.
    ad: 'Merve Aydın', tel: '05322225566',
    ziyaretler: [
      [340, 'Saç Kesimi', 1000], [305, 'Kaş Tasarımı', 1000], [270, 'Manikür', 1000],
      [238, 'Saç Kesimi', 1000], [205, 'Kaş Tasarımı', 1000], [170, 'Manikür', 1000],
      [136, 'Saç Kesimi', 1000], [102, 'Kaş Tasarımı', 1000], [68, 'Manikür', 1000],
      [34, 'Saç Kesimi', 1000],
    ],
  },
  {
    ad: 'Zeynep Korkmaz', tel: '05323336677',
    ziyaretler: [
      [300, 'Saç Boyama', 1300], [240, 'Saç Boyama', 1300], [180, 'Cilt Bakımı', 1300],
      [120, 'Saç Boyama', 1300], [60, 'Cilt Bakımı', 1300], [12, 'Saç Boyama', 1300],
    ],
  },
  {
    ad: 'Pınar Doğan', tel: '05324447788',
    ziyaretler: [
      [330, 'Manikür', 800], [280, 'Pedikür', 800], [230, 'Manikür', 800],
      [180, 'Pedikür', 800], [130, 'Manikür', 800], [80, 'Pedikür', 800],
      [25, 'Manikür', 800],
    ],
  },
  {
    // Nadiren gelir ama her gelişi pahalı — ikinci "gizli değerli" örnek.
    ad: 'Deniz Yılmaz', tel: '05325558899',
    ziyaretler: [[260, 'Saç Boyama', 1650], [150, 'Kalıcı Makyaj', 1650], [40, 'Saç Boyama', 1650]],
  },
  {
    ad: 'Ayça Demir', tel: '05326669900',
    ziyaretler: [
      [320, 'Kaş Tasarımı', 420], [275, 'Kaş Tasarımı', 420], [230, 'Kaş Tasarımı', 420],
      [185, 'Kaş Tasarımı', 420], [140, 'Kaş Tasarımı', 420], [95, 'Kaş Tasarımı', 420],
      [50, 'Kaş Tasarımı', 420], [10, 'Kaş Tasarımı', 420],
    ],
  },
  {
    // 8 aydır uğramıyor — "geri kazanılabilir müşteri" hikâyesinin kanıtı.
    ad: 'Ceren Öztürk', tel: '05327770011',
    ziyaretler: [
      [355, 'Cilt Bakımı', 580], [330, 'Masaj', 580], [305, 'Cilt Bakımı', 580],
      [280, 'Masaj', 580], [248, 'Cilt Bakımı', 580],
    ],
  },
  { ad: 'Buse Kaya', tel: '05328881122', ziyaretler: [[95, 'Kalıcı Makyaj', 1600]] },
  {
    ad: 'Gamze Arslan', tel: '05329992233',
    ziyaretler: [[210, 'Saç Kesimi', 950], [75, 'Saç Boyama', 950]], noShow: 2,
  },
  { ad: 'Selin Aksoy', tel: '05330003344', ziyaretler: [[190, 'Manikür', 600], [145, 'Pedikür', 600], [100, 'Manikür', 600], [55, 'Pedikür', 600]] },
];

// ── Bugün · yarın · öbür gün ───────────────────────────────────────────────
// [gün farkı (0=bugün), saat, ad, tel, hizmet, süre, durum, tahsil edilen tutar?]
// Bugünün TAMAMLANMIŞ randevularına tutar yazılır; akşamki ikisi henüz
// gerçekleşmediği için tutarsız kalır — panelin "tahmin payı" uyarısı da
// böylece gerçek bir durumu göstererek çalışır, süslenmiş bir sıfırı değil.
const YAKLASAN: [number, string, string, string, ServiceName, number, Appointment['status'], number?][] = [
  [0, '10:00', 'Zeynep Korkmaz', '05323336677', 'Saç Boyama',    120, 'confirmed', 1300],
  [0, '13:00', 'Ayça Demir',     '05326669900', 'Kaş Tasarımı',   30, 'confirmed',  420],
  [0, '14:30', 'Pınar Doğan',    '05324447788', 'Manikür',        60, 'confirmed',  800],
  [0, '19:00', 'Merve Aydın',    '05322225566', 'Saç Kesimi',     45, 'confirmed'],
  [0, '20:00', 'Selin Aksoy',    '05330003344', 'Pedikür',        60, 'pending'],

  [1, '09:30', 'Elif Şahin',     '05321114455', 'Saç Boyama',    120, 'confirmed'],
  [1, '11:00', 'Deniz Yılmaz',   '05325558899', 'Kalıcı Makyaj', 120, 'confirmed'],
  [1, '14:00', 'Buse Kaya',      '05328881122', 'Cilt Bakımı',    90, 'confirmed'],
  [1, '16:00', 'Merve Aydın',    '05322225566', 'Kaş Tasarımı',   30, 'pending'],
  [1, '17:30', 'Gamze Arslan',   '05329992233', 'Saç Kesimi',     45, 'confirmed'],

  [2, '10:00', 'Pınar Doğan',    '05324447788', 'Pedikür',        60, 'confirmed'],
  [2, '12:00', 'Zeynep Korkmaz', '05323336677', 'Cilt Bakımı',    90, 'confirmed'],
  [2, '15:00', 'Ayça Demir',     '05326669900', 'Manikür',        60, 'pending'],
  [2, '18:00', 'Ceren Öztürk',   '05327770011', 'Masaj',          60, 'confirmed'],
];

const PERSONEL = ['Sema Yurt', 'Nazlı Tekin', 'Derya Ak'];

export const DEMO_STAFF: Staff[] = PERSONEL.map((name, i) => ({
  id: `demo-staff-${i + 1}`,
  name,
  role: i === 0 ? 'Kuaför' : i === 1 ? 'Güzellik Uzmanı' : 'Manikürist',
  services: [],
  active: true,
}));

/** Demo randevu kümesi. `base` verilmezse bugünden üretilir. */
export function buildDemoAppointments(base: Date = new Date()): Appointment[] {
  const out: Appointment[] = [];
  let n = 0;

  for (const m of GECMIS) {
    m.ziyaretler.forEach(([gunOnce, service, tutar], i) => {
      const d = tarih(base, -gunOnce);
      out.push({
        id: `demo-g-${++n}`,
        customerName: m.ad,
        customerPhone: m.tel,
        service,
        date: d,
        time: ['10:00', '11:30', '14:00', '16:00', '17:30'][i % 5],
        durationMinutes: 60,
        status: 'confirmed',
        createdAt: `${tarih(base, -gunOnce - 3)}T09:00:00.000Z`,
        paymentStatus: 'paid',
        paymentMethod: i % 3 === 0 ? 'cash' : 'card',
        paidAmount: tutar,
        staffName: PERSONEL[i % PERSONEL.length],
      });
    });

    // Gelmediği randevular — ciroya girmez, ziyaret sayısını da şişirmez.
    for (let k = 0; k < (m.noShow ?? 0); k++) {
      out.push({
        id: `demo-n-${++n}`,
        customerName: m.ad,
        customerPhone: m.tel,
        service: 'Saç Kesimi',
        date: tarih(base, -(120 + k * 45)),
        time: '15:00',
        durationMinutes: 45,
        status: 'confirmed',
        createdAt: `${tarih(base, -(125 + k * 45))}T09:00:00.000Z`,
        isNoShow: true,
        paymentStatus: 'unpaid',
        staffName: PERSONEL[k % PERSONEL.length],
      });
    }
  }

  YAKLASAN.forEach(([gunFarki, time, ad, tel, service, sure, status, tutar], i) => {
    out.push({
      id: `demo-y-${++n}`,
      customerName: ad,
      customerPhone: tel,
      service,
      date: tarih(base, gunFarki),
      time,
      durationMinutes: sure,
      status,
      createdAt: `${tarih(base, -4)}T12:00:00.000Z`,
      paymentStatus: tutar ? 'paid' : 'unpaid',
      ...(tutar ? { paymentMethod: 'card' as const, paidAmount: tutar } : {}),
      staffName: PERSONEL[i % PERSONEL.length],
    });
  });

  return out;
}
