'use client';

import { Appointment } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppointmentForm } from './AppointmentForm';

interface Props { appointments: Appointment[]; }

const STATUS = {
  confirmed: { label: 'Onaylandı', color: 'var(--mint)',     bg: 'rgba(126,222,208,0.08)', border: 'rgba(126,222,208,0.2)' },
  pending:   { label: 'Bekliyor',  color: 'var(--amber)',    bg: 'rgba(240,200,112,0.08)', border: 'rgba(240,200,112,0.2)' },
  cancelled: { label: 'İptal',     color: 'var(--rose)',     bg: 'rgba(240,160,168,0.08)', border: 'rgba(240,160,168,0.2)' },
};

const SVC_DOT: Record<string, string> = {
  'Saç Kesimi': '#D4AF6E', 'Saç Boyama': '#F0A0A8', 'Manikür': '#7AB8E8',
  'Pedikür': '#7AB8E8', 'Kaş Tasarımı': '#B8A0E8', 'Cilt Bakımı': '#7EDED0',
  'Masaj': '#F0C870', 'Kalıcı Makyaj': '#F0A0C0',
};

export function AppointmentTable({ appointments }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('upcoming');
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];

  const sorted = [...appointments].sort((a, b) => {
    const aKey = `${a.date ?? '9999-12-31'}T${a.time ?? '23:59'}`;
    const bKey = `${b.date ?? '9999-12-31'}T${b.time ?? '23:59'}`;
    return aKey.localeCompare(bKey);
  });

  const filtered = sorted.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      a.customerName.toLowerCase().includes(q) ||
      a.customerPhone.includes(q) ||
      a.service.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesDate =
      dateFilter === 'all' ? true :
      dateFilter === 'today' ? a.date === today :
      dateFilter === 'upcoming' ? a.date >= today :
      a.date < today;
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '3rem', color: 'var(--text-3)', fontWeight: 300 }}>
          ∅
        </p>
        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-3)' }}>
          Henüz randevu bulunmuyor
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Filtreler — overflow-x-auto dışında, select'ler kesilmesin */}
      <div className="px-5 py-3 flex flex-wrap gap-3 items-center" style={{ borderBottom: '1px solid var(--border)' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ara: isim, telefon, hizmet..."
          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg text-sm"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
        />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
        >
          <option value="upcoming">Yaklaşan</option>
          <option value="today">Bugün</option>
          <option value="past">Geçmiş</option>
          <option value="all">Hepsi</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
        >
          <option value="all">Tüm Durumlar</option>
          <option value="confirmed">Onaylı</option>
          <option value="pending">Bekliyor</option>
          <option value="cancelled">İptal</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left py-3 px-5 text-[10px] font-medium tracking-[0.14em] uppercase w-8" style={{ color: 'var(--text-3)' }}>#</th>
              {['Müşteri', 'Hizmet', 'Tarih & Saat', 'Süre', 'Durum', 'İşlem'].map((h) => (
                <th key={h} className="text-left py-3 px-4 text-[10px] font-medium tracking-[0.14em] uppercase" style={{ color: 'var(--text-3)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-3)' }}>Sonuç bulunamadı</p>
                </td>
              </tr>
            ) : filtered.map((a, i) => {
              const cfg = STATUS[a.status] ?? STATUS.pending;
              const dot = SVC_DOT[a.service] ?? '#D4AF6E';
              const isHov = hovered === a.id;
              return (
                <tr
                  key={a.id}
                  onMouseEnter={() => setHovered(a.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="anim-up"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: isHov ? 'var(--bg-hover)' : 'transparent',
                    transition: 'background 0.15s ease',
                    animationDelay: `${i * 25}ms`,
                  }}
                >
                  <td className="py-4 px-5">
                    <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-3)', fontFamily: '"Cormorant Garamond", serif' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-medium" style={{ color: 'var(--text-1)' }}>{a.customerName}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{a.customerPhone}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
                      <span style={{ color: 'var(--text-2)' }}>{a.service}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {a.date ? (
                      <>
                        <p style={{ color: 'var(--text-1)' }}>{format(parseISO(a.date), 'd MMMM yyyy', { locale: tr })}</p>
                        <p className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--text-3)', fontFamily: '"Cormorant Garamond", serif' }}>
                          {a.time}
                        </p>
                      </>
                    ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td className="py-4 px-4">
                    <span style={{ color: 'var(--text-3)' }}>{a.durationMinutes} dk</span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(a); }}
                      className="text-xs transition-opacity hover:opacity-70"
                      style={{ color: 'var(--gold)' }}
                    >
                      Düzenle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>{/* overflow-x-auto */}

      {editing && (
        <AppointmentForm
          appointment={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }}
        />
      )}
    </>
  );
}
