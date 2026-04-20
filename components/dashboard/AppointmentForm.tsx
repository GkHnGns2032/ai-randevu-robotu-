'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CLIENT_CONFIG } from '@/config/client';
import { X } from 'lucide-react';
import type { Appointment, ServiceType, PaymentStatus, PaymentMethod } from '@/lib/types';

interface StaffOption { id: string; name: string; services: string[]; active: boolean; }

interface Props {
  appointment?: Appointment;
  onClose: () => void;
  onSaved: () => void;
}

export function AppointmentForm({ appointment, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    customerName: appointment?.customerName ?? '',
    customerPhone: appointment?.customerPhone ?? '',
    service: appointment?.service ?? CLIENT_CONFIG.services[0].name,
    date: appointment?.date ?? '',
    time: appointment?.time ?? '',
    notes: appointment?.notes ?? '',
    paymentStatus: (appointment?.paymentStatus ?? 'unpaid') as PaymentStatus,
    paymentMethod: (appointment?.paymentMethod ?? '') as PaymentMethod | '',
    paidAmount: appointment?.paidAmount?.toString() ?? '',
    staffId: appointment?.staffId ?? '',
  });
  const [allStaff, setAllStaff] = useState<StaffOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/staff')
      .then((r) => r.ok ? r.json() : [])
      .then((data: StaffOption[]) => setAllStaff(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const availableStaff = allStaff.filter(
    (s) => s.active && (s.services.length === 0 || s.services.includes(form.service)),
  );

  async function submit() {
    setErr(null);
    setSaving(true);
    try {
      const url = appointment ? `/api/appointments/${appointment.id}` : '/api/appointments';
      const method = appointment ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          paidAmount: form.paidAmount ? Number(form.paidAmount) : undefined,
          paymentMethod: form.paymentMethod || undefined,
          staffId: form.staffId || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <button onClick={onClose} className="absolute top-4 right-4" style={{ color: 'var(--text-3)' }}>
          <X size={18} />
        </button>
        <h2 className="font-light mb-5" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', color: 'var(--text-1)' }}>
          {appointment ? 'Randevuyu Düzenle' : 'Yeni Randevu'}
        </h2>
        <div className="space-y-3">
          <Field label="Müşteri Adı" value={form.customerName} onChange={(v) => setForm({ ...form, customerName: v })} />
          <Field label="Telefon" value={form.customerPhone} onChange={(v) => setForm({ ...form, customerPhone: v })} />
          <div>
            <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Hizmet</label>
            <select
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value as ServiceType, staffId: '' })}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            >
              {CLIENT_CONFIG.services.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Personel (opsiyonel)</label>
            <select
              value={form.staffId}
              onChange={(e) => setForm({ ...form, staffId: e.target.value })}
              disabled={availableStaff.length === 0}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            >
              <option value="">— Fark etmez —</option>
              {availableStaff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {availableStaff.length === 0 && (
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>
                Bu hizmet için aktif personel atanmamış. (Airtable → Staff tablosunda bu hizmetin `services` alanına eklenmiş aktif kayıt gerekli.)
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tarih" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            <Field label="Saat" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
          </div>
          <Field label="Notlar" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />

          {/* Ödeme */}
          <div className="pt-1" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Ödeme</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Durum</label>
                <select
                  value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                >
                  <option value="unpaid">Ödenmedi</option>
                  <option value="partial">Kısmen Ödendi</option>
                  <option value="paid">Ödendi</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Yöntem</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod | '' })}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                >
                  <option value="">—</option>
                  <option value="cash">Nakit</option>
                  <option value="card">Kart</option>
                  <option value="transfer">Havale</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <Field
                label="Ödenen Tutar (₺)"
                type="number"
                value={form.paidAmount}
                onChange={(v) => setForm({ ...form, paidAmount: v })}
              />
            </div>
          </div>
        </div>
        {err && <p className="text-xs mt-3" style={{ color: 'var(--rose)' }}>{err}</p>}
        <button
          onClick={submit}
          disabled={saving}
          className="w-full mt-5 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: 'var(--gold)', color: '#fff' }}
        >
          {saving ? 'Kaydediliyor...' : (appointment ? 'Güncelle' : 'Kaydet')}
        </button>
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
      />
    </div>
  );
}
