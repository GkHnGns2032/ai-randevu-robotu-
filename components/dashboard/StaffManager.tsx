'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, User, CheckCircle2, Circle } from 'lucide-react';
import { CLIENT_CONFIG } from '@/config/client';
import type { Staff } from '@/lib/staff';

const ALL_SERVICES = CLIENT_CONFIG.services.map((s) => s.name);

const ROLE_COLOR: Record<string, string> = {
  'Kuaför': 'var(--gold)',
  'Manikürist': 'var(--sky)',
  'Estetisyen': 'var(--mint)',
  'Masör': 'var(--amber)',
};

export function StaffManager() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newStaff, setNewStaff] = useState<{ name: string; role: string; services: string[] }>({
    name: '',
    role: '',
    services: [],
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!newStaff.name.trim()) return;
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newStaff, active: true }),
    });
    if (res.ok) {
      setNewStaff({ name: '', role: '', services: [] });
      setAdding(false);
      load();
    }
  }

  async function handleToggleActive(s: Staff) {
    await fetch('/api/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, active: !s.active }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu personeli silmek istediğine emin misin?')) return;
    await fetch('/api/staff', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  }

  function toggleService(name: string) {
    setNewStaff((p) => ({
      ...p,
      services: p.services.includes(name)
        ? p.services.filter((s) => s !== name)
        : [...p.services, name],
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold)', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header row: add button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          {staff.length === 0
            ? 'Henüz personel eklenmemiş'
            : `${staff.length} personel · ${staff.filter((s) => s.active).length} aktif`}
        </p>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-opacity hover:opacity-80"
            style={{ background: 'var(--gold)', color: '#fff' }}
          >
            <Plus size={12} />
            Yeni Personel
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div
          className="rounded-xl p-4 mb-4 space-y-3 anim-up"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] tracking-[0.14em] uppercase mb-1 block" style={{ color: 'var(--text-3)' }}>
                İsim
              </label>
              <input
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                placeholder="Örn. Ayşe Yılmaz"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.14em] uppercase mb-1 block" style={{ color: 'var(--text-3)' }}>
                Rol
              </label>
              <input
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                placeholder="Kuaför, Manikürist..."
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] tracking-[0.14em] uppercase mb-1.5 block" style={{ color: 'var(--text-3)' }}>
              Hizmetler
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SERVICES.map((name) => {
                const selected = newStaff.services.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleService(name)}
                    className="px-2.5 py-1 rounded-full text-[11px] transition-colors"
                    style={{
                      background: selected ? 'color-mix(in srgb, var(--gold) 18%, transparent)' : 'var(--bg-card)',
                      border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                      color: selected ? 'var(--gold)' : 'var(--text-2)',
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => {
                setAdding(false);
                setNewStaff({ name: '', role: '', services: [] });
              }}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            >
              İptal
            </button>
            <button
              onClick={handleCreate}
              disabled={!newStaff.name.trim()}
              className="px-3 py-1.5 rounded-lg text-xs transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: 'var(--gold)', color: '#fff' }}
            >
              Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {staff.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '3rem', color: 'var(--text-3)', fontWeight: 300 }}>∅</p>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-3)' }}>Personel yok</p>
        </div>
      ) : staff.length > 0 ? (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Ad', 'Rol', 'Hizmetler', 'Durum', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left py-3 px-4 text-[10px] font-medium tracking-[0.14em] uppercase"
                    style={{ color: 'var(--text-3)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((s, i) => (
                <tr
                  key={s.id}
                  className="anim-up"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    animationDelay: `${i * 20}ms`,
                    opacity: s.active ? 1 : 0.55,
                  }}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                        style={{ background: 'color-mix(in srgb, var(--gold) 15%, transparent)', color: 'var(--gold)' }}
                      >
                        {s.name.charAt(0).toUpperCase() || <User size={12} />}
                      </div>
                      <span style={{ color: 'var(--text-1)' }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {s.role ? (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{
                          background: `color-mix(in srgb, ${ROLE_COLOR[s.role] ?? 'var(--text-3)'} 15%, transparent)`,
                          color: ROLE_COLOR[s.role] ?? 'var(--text-2)',
                        }}
                      >
                        {s.role}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-3)' }}>—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {s.services.length === 0 ? (
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>Hepsi</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {s.services.map((svc) => (
                          <span
                            key={svc}
                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: 'var(--bg-hover)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
                      style={{ color: s.active ? 'var(--mint)' : 'var(--text-3)' }}
                    >
                      {s.active ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                      {s.active ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="opacity-40 hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--rose)' }}
                      aria-label="Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
