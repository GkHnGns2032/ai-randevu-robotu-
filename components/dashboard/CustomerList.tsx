'use client';

import React, { useCallback } from 'react';
import { formatPhoneTR } from '@/lib/format';
import { Appointment } from '@/lib/types';
import { SERVICE_PRICES } from '@/lib/pricing';
import { format, parseISO, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Phone, Calendar, TrendingUp, Star, Trash2, Plus } from 'lucide-react';
import type { CustomerNote, CustomerTag } from '@/lib/customer-notes';

const TAG_CFG: Record<string, { color: string; bg: string }> = {
  VIP:    { color: 'var(--gold)',   bg: 'rgba(212,175,110,0.12)' },
  Alerji: { color: 'var(--rose)',   bg: 'rgba(240,160,168,0.12)' },
  Zor:    { color: 'var(--amber)',  bg: 'rgba(240,200,112,0.12)' },
  Yeni:   { color: 'var(--mint)',   bg: 'rgba(126,222,208,0.12)' },
  Kayıp:  { color: 'var(--text-3)', bg: 'rgba(128,128,128,0.12)' },
};

interface Props { appointments: Appointment[] }

const SVC_COLOR: Record<string, string> = {
  'Saç Kesimi': '#D4AF6E', 'Saç Boyama': '#F0A0A8', 'Manikür': '#7AB8E8',
  'Pedikür': '#7AB8E8', 'Kaş Tasarımı': '#B8A0E8', 'Cilt Bakımı': '#7EDED0',
  'Masaj': '#F0C870', 'Kalıcı Makyaj': '#F0A0C0',
};

interface CustomerRow {
  phone: string;
  name: string;
  totalVisits: number;
  cancelledCount: number;
  noShowCount: number;
  totalSpent: number;
  /** Son 12 ayın toplamı — "bu müşteri bana yılda ne kazandırıyor" sorusunun cevabı. */
  spent12m: number;
  visits12m: number;
  /** Ziyaret başına ortalama (12 aylık). Sıklık ile değeri ayıran sayı budur:
   *  yılda 2 gelip 30.000 bırakan müşteri, 10 gelip 10.000 bırakandan 15× değerlidir. */
  avgPerVisit: number;
  /** `paidAmount` taşımayan, dolayısıyla liste fiyatından TAHMİN edilen GEÇMİŞ randevu sayısı.
   *  Sıfırdan büyükse "kazandırdı" değil "yaklaşık" demek zorundayız. */
  estimatedCount: number;
  /** Ciroya giren (geçmiş, iptal olmayan) randevu sayısı — tahmin oranının paydası.
   *  `totalVisits` gelecek randevuları da içerdiği için payda olarak KULLANILAMAZ. */
  pastVisitCount: number;
  favoriteService: string;
  lastVisit: string | null;
  nextVisit: string | null;
  nextVisitTime: string | null;
}

type SortKey = 'name' | 'totalVisits' | 'totalSpent' | 'avgPerVisit' | 'lastVisit';

/** Bir randevunun GERÇEK para karşılığı.
 *
 *  `paidAmount` fiilen tahsil edilen tutardır; `SERVICE_PRICES` yalnız liste
 *  fiyatıdır ve indirim · kısmi ödeme · paket farkı yüzünden gerçekten kazanılan
 *  paradan sapar. Önceki hâl her zaman liste fiyatını topluyordu, yani ekran
 *  "kazandığın para" değil "kazanmış olman gereken para" gösteriyordu.
 *  Gerçek tutar varsa o kullanılır; yoksa liste fiyatına düşülür ve bu düşüş
 *  `estimatedCount` ile SAYILIR — görünmeyen tahmin, yanlış kesinlik üretir. */
function appointmentValue(a: Appointment): { value: number; estimated: boolean } {
  if (typeof a.paidAmount === 'number' && a.paidAmount > 0) {
    return { value: a.paidAmount, estimated: false };
  }
  return { value: SERVICE_PRICES[a.service] ?? 0, estimated: true };
}

function buildCustomers(appointments: Appointment[]): CustomerRow[] {
  const map = new Map<string, Appointment[]>();
  for (const a of appointments) {
    const key = a.customerPhone;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }

  const today = new Date();

  return Array.from(map.entries()).map(([phone, appts]) => {
    const name = appts[appts.length - 1].customerName;
    const confirmed = appts.filter((a) => a.status !== 'cancelled');
    const cancelled = appts.filter((a) => a.status === 'cancelled');
    const noShows = appts.filter((a) => a.isNoShow);

    // Ciro YALNIZ geçmiş randevulardan sayılır. Önceki hâl gelecekteki onaylı
    // randevuları da topluyordu: yarınki randevu henüz para kazandırmamıştır ve
    // ödeme kaydı da olmadığı için liste fiyatından tahmin ediliyor, yani hem
    // ciroyu şişiriyor hem "tahmin payı" uyarısını haksız yere tetikliyordu.
    // "Bu müşteri bana ne kazandırdı" sorusunun cevabı tahsil edilmiş paradır.
    // `isNoShow` de dışarıda: müşteri gelmediyse hizmet verilmemiştir, dolayısıyla
    // para da kazanılmamıştır. Önceki hâl bunları liste fiyatından sayıyordu —
    // yani gelmeyen müşteri ciroyu YÜKSELTİYORDU. Gelmeme zaten `noShowCount`
    // sütununda ayrıca görünüyor; iki kez, üstelik ters işaretle sayılmamalı.
    const gecmisZiyaretler = confirmed.filter(
      (a) => a.date && !isAfter(parseISO(a.date), today) && !a.isNoShow,
    );
    let totalSpent = 0;
    let estimatedCount = 0;
    for (const a of gecmisZiyaretler) {
      const { value, estimated } = appointmentValue(a);
      totalSpent += value;
      if (estimated) estimatedCount += 1;
    }

    // 12 aylık pencere — müşteri "yılda ne kazandırıyor" diye soruyor, "hep birlikte
    // ne kazandırdı" diye değil. Yıllar önce çok harcamış bir müşteri bugünkü kararı
    // yanıltır; pencere olmadan liste eskiyi ödüllendirir.
    const y1Cutoff = new Date(today);
    y1Cutoff.setFullYear(y1Cutoff.getFullYear() - 1);
    let spent12m = 0;
    let visits12m = 0;
    for (const a of confirmed) {
      if (!a.date) continue;
      const d = parseISO(a.date);
      if (isAfter(d, y1Cutoff) && !isAfter(d, today)) {
        spent12m += appointmentValue(a).value;
        visits12m += 1;
      }
    }
    const avgPerVisit = visits12m > 0 ? Math.round(spent12m / visits12m) : 0;

    const svcCount: Record<string, number> = {};
    for (const a of confirmed) svcCount[a.service] = (svcCount[a.service] ?? 0) + 1;
    const favoriteService = Object.entries(svcCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    const pastVisits = confirmed
      .filter((a) => a.date && !isAfter(parseISO(a.date), today))
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    const futureVisits = confirmed
      .filter((a) => a.date && isAfter(parseISO(a.date), today))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    return {
      phone,
      name,
      // Ziyaret sayısı = GERÇEKLEŞMİŞ ziyaretler. Önceki hâl gelecekteki randevuyu
      // da sayıyordu ve ekranda tutarsızlık üretiyordu: "3 ziyaret · ₺30.000"
      // yazıp yanında "ziyaret başına ₺15.000" demek (30.000/2) birbirini tutmuyor.
      // Yaklaşan randevu zaten "Sonraki" sütununda görünüyor.
      totalVisits: gecmisZiyaretler.length,
      cancelledCount: cancelled.length,
      noShowCount: noShows.length,
      totalSpent,
      spent12m,
      visits12m,
      avgPerVisit,
      estimatedCount,
      pastVisitCount: gecmisZiyaretler.length,
      favoriteService,
      lastVisit: pastVisits[0]?.date ?? null,
      nextVisit: futureVisits[0]?.date ?? null,
      nextVisitTime: futureVisits[0]?.time ?? null,
    };
  });
}

export function CustomerList({ appointments }: Props) {
  const [search, setSearch] = useState('');
  // Varsayılan sıralama DEĞERE göre, sıklığa göre değil (2026-08-23).
  // Önceki varsayılan `totalVisits`'ti ve listeyi en sık geleni tepeye koyuyordu —
  // yılda 2 gelip 30.000 bırakan müşteri, 10 gelip 10.000 bırakanın altında kalıyordu.
  // Saha geri bildirimi bunu birebir tarif etti: "çok gelen değil, çok kazandıran kim?"
  const [sortKey, setSortKey] = useState<SortKey>('totalSpent');
  const [sortAsc, setSortAsc] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [notes, setNotes] = useState<Record<string, CustomerNote[]>>({});
  const [noteLoading, setNoteLoading] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState<CustomerTag | ''>('');

  const loadNotes = useCallback(async (phone: string) => {
    setNoteLoading(phone);
    try {
      const res = await fetch(`/api/customer/${encodeURIComponent(phone)}/notes`);
      const data = await res.json();
      setNotes((prev) => ({ ...prev, [phone]: data }));
    } finally {
      setNoteLoading(null);
    }
  }, []);

  useEffect(() => {
    if (expanded) loadNotes(expanded);
  }, [expanded, loadNotes]);

  async function handleAddNote(phone: string) {
    if (!newNote.trim()) return;
    const res = await fetch(`/api/customer/${encodeURIComponent(phone)}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: newNote.trim(), tag: newTag || undefined }),
    });
    if (res.ok) {
      setNewNote('');
      setNewTag('');
      loadNotes(phone);
    }
  }

  async function handleDeleteNote(phone: string, id: string) {
    await fetch(`/api/customer/${encodeURIComponent(phone)}/notes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    loadNotes(phone);
  }

  const customers = useMemo(() => buildCustomers(appointments), [appointments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .sort((a, b) => {
        let va: string | number = 0, vb: string | number = 0;
        if (sortKey === 'name') { va = a.name; vb = b.name; }
        else if (sortKey === 'totalVisits') { va = a.totalVisits; vb = b.totalVisits; }
        else if (sortKey === 'totalSpent') { va = a.totalSpent; vb = b.totalSpent; }
        else if (sortKey === 'avgPerVisit') { va = a.avgPerVisit; vb = b.avgPerVisit; }
        else if (sortKey === 'lastVisit') { va = a.lastVisit ?? ''; vb = b.lastVisit ?? ''; }
        if (va < vb) return sortAsc ? -1 : 1;
        if (va > vb) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [customers, search, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(false); }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
    ) : null;

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '3rem', color: 'var(--text-3)', fontWeight: 300 }}>∅</p>
        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-3)' }}>Henüz müşteri bulunmuyor</p>
      </div>
    );
  }

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.totalVisits > 0).length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);

  // "En değerli 5 müşteri cironun yüzde kaçı" — listenin tek cümlelik özeti.
  // Sayı yüksekse (tipik olarak öyledir) işletmenin geliri birkaç kişiye bağlıdır
  // ve o kişileri ADIYLA bilmek, ortalama müşteriyi bilmekten daha önemlidir.
  const top5 = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  const top5Phones = new Set(top5.map((c) => c.phone));
  const top5Revenue = top5.reduce((s, c) => s + c.totalSpent, 0);
  const top5Share = totalRevenue > 0 ? Math.round((top5Revenue / totalRevenue) * 100) : 0;

  // Tahmin payı: tutarların kaçı gerçek tahsilat değil liste fiyatı.
  // Görünmeyen tahmin yanlış kesinlik üretir — pay yüksekse ekranda söylenir.
  const estimatedTotal = customers.reduce((s, c) => s + c.estimatedCount, 0);
  const visitsTotal = customers.reduce((s, c) => s + c.pastVisitCount, 0);
  const estimatedShare = visitsTotal > 0 ? Math.round((estimatedTotal / visitsTotal) * 100) : 0;

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Toplam Müşteri', value: totalCustomers, icon: '👥' },
          { label: 'Aktif Müşteri', value: activeCustomers, icon: '✅' },
          { label: 'İlk 5 Müşteri · Ciro Payı', value: `%${top5Share}`, icon: '⭐' },
          { label: 'Toplam Ciro', value: `₺${totalRevenue.toLocaleString('tr-TR')}`, icon: '💰' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            <p className="text-lg mb-0.5">{s.icon}</p>
            <p className="text-lg font-semibold tabular-nums" style={{ color: 'var(--text-1)', fontFamily: '"Cormorant Garamond", serif' }}>
              {s.value}
            </p>
            <p className="text-[10px] tracking-wider uppercase" style={{ color: 'var(--text-3)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tutarların ne kadarı gerçek tahsilat, ne kadarı liste fiyatı tahmini.
          Sessiz tahmin, yanlış kesinlik üretir — pay varsa açıkça yazılır. */}
      {estimatedShare > 0 && (
        <p className="text-[11px] mb-4 -mt-2" style={{ color: 'var(--text-3)' }}>
          Tutarların <span className="tabular-nums" style={{ color: 'var(--amber)' }}>%{estimatedShare}</span>
          {"'i "}ödeme kaydı olmadığı için liste fiyatından hesaplandı — gerçek tahsilat değil, yaklaşık değer.
        </p>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setListOpen((p) => !p)}
        className="w-full mb-4 flex items-center justify-between px-4 min-h-[44px] rounded-xl text-sm transition-colors hover:opacity-80"
        style={{
          background: 'var(--bg-hover)',
          border: '1px solid var(--border)',
          color: 'var(--text-2)',
        }}
      >
        <span className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.16em] uppercase" style={{ color: 'var(--text-3)' }}>
            {listOpen ? 'Listeyi Gizle' : 'Tüm Listeyi Göster'}
          </span>
          <span className="tabular-nums text-xs" style={{ color: 'var(--text-3)' }}>
            ({totalCustomers} müşteri)
          </span>
        </span>
        {listOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Search */}
      {listOpen && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya telefon ara..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)',
            }}
          />
        </div>
      )}

      {/* Table */}
      {listOpen && (
      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <thead style={{ position: 'sticky', top: 0, background: 'color-mix(in srgb, var(--gold) 7%, var(--bg-card))', zIndex: 10 }}>
            <tr style={{ borderBottom: '1.5px solid color-mix(in srgb, var(--gold) 35%, transparent)' }}>
              {[
                { key: 'name' as SortKey, label: 'Müşteri' },
                { key: 'totalVisits' as SortKey, label: 'Ziyaret' },
                { key: 'totalSpent' as SortKey, label: 'Harcama' },
                { key: 'avgPerVisit' as SortKey, label: 'Ziyaret Başına' },
                { key: 'lastVisit' as SortKey, label: 'Son Ziyaret' },
              ].map(({ key, label }, idx) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="text-left py-3 px-4 text-[10px] font-semibold tracking-[0.2em] uppercase cursor-pointer select-none"
                  style={{ color: sortKey === key ? 'var(--gold)' : 'color-mix(in srgb, var(--gold) 75%, var(--text-2))', fontFamily: '"Courier New", monospace', animation: `th-in 0.35s ease ${idx * 40}ms both` }}
                >
                  <span className="flex items-center gap-1">
                    {label} <SortIcon k={key} />
                  </span>
                </th>
              ))}
              <th className="text-left py-3 px-4 text-[10px] font-semibold tracking-[0.2em] uppercase"
                style={{ color: 'color-mix(in srgb, var(--gold) 75%, var(--text-2))', fontFamily: '"Courier New", monospace', animation: 'th-in 0.35s ease 160ms both' }}>
                Sonraki
              </th>
            </tr>
          </thead>
          <style>{`@keyframes th-in { from { opacity:0; transform:translateY(-5px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <tbody>
            {filtered.map((c, i) => {
              const isExpanded = expanded === c.phone;
              // Yıldız artık SIKLIKTAN değil DEĞERDEN geliyor. Eski ölçüt
              // `totalVisits >= 3` idi: sık gelen ama az bırakan müşteriyi
              // ödüllendiriyor, yılda iki kez gelip en çok parayı bırakanı
              // işaretsiz bırakıyordu. VIP = ciroya en çok katkı veren ilk 5.
              const isVip = top5Phones.has(c.phone);
              const customerAppts = appointments.filter((a) => a.customerPhone === c.phone);

              return (
                <React.Fragment key={c.phone}>
                  <tr
                    onClick={() => setExpanded(isExpanded ? null : c.phone)}
                    className="anim-up cursor-pointer"
                    style={{
                      borderBottom: isExpanded ? 'none' : '1px solid var(--border)',
                      background: isExpanded ? 'var(--bg-hover)' : i % 2 === 1 ? 'color-mix(in srgb, var(--bg-hover) 35%, transparent)' : 'transparent',
                      transition: 'background 0.15s ease',
                      animationDelay: `${i * 20}ms`,
                    }}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                          style={{ background: 'color-mix(in srgb, var(--gold) 15%, transparent)', color: 'var(--gold)' }}
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: 'var(--text-1)' }}>{c.name}</span>
                            {isVip && <Star size={10} fill="currentColor" style={{ color: 'var(--gold)' }} />}
                          </div>
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                            <Phone size={10} />{formatPhoneTR(c.phone)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={12} style={{ color: 'var(--mint)' }} />
                        <span className="tabular-nums font-medium" style={{ color: 'var(--text-1)', fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem' }}>
                          {c.totalVisits}
                        </span>
                        {c.cancelledCount > 0 && (
                          <span className="text-[10px]" style={{ color: 'var(--rose)' }}>
                            ({c.cancelledCount} iptal)
                          </span>
                        )}
                        {c.noShowCount > 0 && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(240,160,168,0.15)', color: 'var(--rose)' }}
                          >
                            {c.noShowCount}× gelmedi
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: SVC_COLOR[c.favoriteService] ?? 'var(--gold)' }} />
                        <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{c.favoriteService}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="tabular-nums" style={{ color: 'var(--text-1)', fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem' }}>
                        ₺{c.totalSpent.toLocaleString('tr-TR')}
                      </span>
                      {c.spent12m > 0 && c.spent12m !== c.totalSpent && (
                        <div className="text-[11px] tabular-nums" style={{ color: 'var(--text-3)' }}>
                          son 12 ay: ₺{c.spent12m.toLocaleString('tr-TR')}
                        </div>
                      )}
                    </td>
                    {/* Sıklık ile değeri ayıran sütun. Dar ekranda gizlenir —
                        repo kuralı: mobilde isim ve aksiyon önceliklidir. */}
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      {c.avgPerVisit > 0 ? (
                        <>
                          <span className="tabular-nums" style={{ color: 'var(--gold)', fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem' }}>
                            ₺{c.avgPerVisit.toLocaleString('tr-TR')}
                          </span>
                          <div className="text-[11px] tabular-nums" style={{ color: 'var(--text-3)' }}>
                            {c.visits12m} ziyaret / yıl
                          </div>
                        </>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.lastVisit ? (
                        <span className="text-sm" style={{ color: 'var(--text-2)' }}>
                          {format(parseISO(c.lastVisit), 'd MMMM yyyy', { locale: tr })}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.nextVisit ? (
                        <div>
                          <div className="flex items-center gap-1">
                            <Calendar size={11} style={{ color: 'var(--mint)' }} />
                            <span className="text-xs" style={{ color: 'var(--mint)' }}>
                              {format(parseISO(c.nextVisit), 'd MMMM yyyy', { locale: tr })}
                            </span>
                          </div>
                          <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-3)' }}>{c.nextVisitTime}</span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>Yok</span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                        <div className="px-4 pb-4">
                          {/* Randevu Geçmişi */}
                          <p className="text-[10px] tracking-[0.16em] uppercase mb-2" style={{ color: 'var(--text-3)' }}>
                            Randevu Geçmişi
                          </p>
                          <div className="space-y-1.5 mb-4">
                            {customerAppts
                              .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
                              .map((a) => (
                                <div
                                  key={a.id}
                                  className="flex items-center justify-between rounded-lg px-3 py-2"
                                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: SVC_COLOR[a.service] ?? 'var(--gold)' }} />
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>{a.service}</span>
                                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                                      {a.date ? format(parseISO(a.date), 'd MMMM yyyy', { locale: tr }) : '—'} · {a.time}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs tabular-nums" style={{ color: 'var(--text-2)' }}>
                                      ₺{SERVICE_PRICES[a.service]?.toLocaleString('tr-TR') ?? '—'}
                                    </span>
                                    <span
                                      className="text-[10px] px-2 py-0.5 rounded-full"
                                      style={{
                                        background: a.status === 'confirmed' ? 'rgba(126,222,208,0.1)' : a.status === 'cancelled' ? 'rgba(240,160,168,0.1)' : 'rgba(240,200,112,0.1)',
                                        color: a.status === 'confirmed' ? 'var(--mint)' : a.status === 'cancelled' ? 'var(--rose)' : 'var(--amber)',
                                      }}
                                    >
                                      {a.status === 'confirmed' ? 'Onaylandı' : a.status === 'cancelled' ? 'İptal' : 'Bekliyor'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>

                          {/* Müşteri Notları */}
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                            <p className="text-[10px] tracking-[0.16em] uppercase mb-2" style={{ color: 'var(--text-3)' }}>
                              Notlar & Etiketler
                            </p>

                            {/* Mevcut notlar */}
                            {noteLoading === c.phone ? (
                              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Yükleniyor...</p>
                            ) : (notes[c.phone] ?? []).length === 0 ? (
                              <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>Henüz not yok.</p>
                            ) : (
                              <div className="space-y-1.5 mb-2">
                                {(notes[c.phone] ?? []).map((n) => {
                                  const tagCfg = n.tag ? TAG_CFG[n.tag] : null;
                                  return (
                                    <div
                                      key={n.id}
                                      className="flex items-start justify-between rounded-lg px-3 py-2 gap-3"
                                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                    >
                                      <div className="flex items-start gap-2 min-w-0">
                                        {tagCfg && (
                                          <span
                                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                                            style={{ background: tagCfg.bg, color: tagCfg.color }}
                                          >
                                            {n.tag}
                                          </span>
                                        )}
                                        <span className="text-xs" style={{ color: 'var(--text-2)' }}>{n.note}</span>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteNote(c.phone, n.id)}
                                        className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
                                        style={{ color: 'var(--rose)' }}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Not ekleme formu */}
                            <div className="flex items-center gap-2 mt-2">
                              <select
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value as CustomerTag | '')}
                                className="px-2 py-1.5 rounded-lg text-xs flex-shrink-0"
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                              >
                                <option value="">Etiket</option>
                                {(['VIP', 'Alerji', 'Zor', 'Yeni', 'Kayıp'] as CustomerTag[]).map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              <input
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(c.phone); }}
                                placeholder="Not ekle..."
                                className="flex-1 px-3 py-1.5 rounded-lg text-xs"
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                              />
                              <button
                                onClick={() => handleAddNote(c.phone)}
                                className="flex-shrink-0 p-1.5 rounded-lg transition-opacity hover:opacity-70"
                                style={{ background: 'var(--gold)', color: '#fff' }}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-3)' }}>Sonuç bulunamadı</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
