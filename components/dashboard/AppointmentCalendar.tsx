'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Appointment } from '@/lib/types';
import {
  format, startOfWeek, addDays, isSameDay, parseISO,
  addWeeks, subWeeks, isToday, getHours, getMinutes,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

interface Props { appointments: Appointment[]; }
interface StaffOption { id: string; name: string; active: boolean; }

const HOURS = Array.from({ length: 11 }, (_, i) => i + 9);
const ROW_H = 72;

const SVC_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Saç Kesimi':    { bg: 'rgba(212,175,110,0.92)', text: '#1A0E00', border: '#C9A96E' },
  'Saç Boyama':    { bg: 'rgba(240,130,145,0.92)', text: '#280008', border: '#E86070' },
  'Manikür':       { bg: 'rgba(90,170,230,0.92)',  text: '#00101E', border: '#3A90C8' },
  'Pedikür':       { bg: 'rgba(90,170,230,0.80)',  text: '#00101E', border: '#3A90C8' },
  'Kaş Tasarımı':  { bg: 'rgba(170,130,230,0.92)', text: '#100020', border: '#9060C8' },
  'Cilt Bakımı':   { bg: 'rgba(60,200,180,0.92)',  text: '#002018', border: '#20B090' },
  'Masaj':         { bg: 'rgba(240,190,80,0.92)',  text: '#1E1000', border: '#D0A030' },
  'Kalıcı Makyaj': { bg: 'rgba(230,100,150,0.92)', text: '#280010', border: '#C05080' },
};
const DEFAULT_COLOR = { bg: 'rgba(212,175,110,0.92)', text: '#1A0E00', border: '#C9A96E' };

function CurrentTimeLine() {
  const [pos, setPos] = useState<number | null>(null);

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const h = getHours(now);
      const m = getMinutes(now);
      if (h < 9 || h >= 20) { setPos(null); return; }
      setPos(((h - 9) + m / 60) * ROW_H);
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, []);

  if (pos === null) return null;

  return (
    <div className="absolute left-0 right-0 z-10 flex items-center pointer-events-none" style={{ top: pos }}>
      <div className="w-16 flex justify-end pr-1">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--rose)', boxShadow: '0 0 8px var(--rose)' }} />
      </div>
      <div className="flex-1 h-[1.5px]" style={{ background: 'linear-gradient(90deg, var(--rose), transparent 80%)', opacity: 0.8 }} />
    </div>
  );
}

function ServiceBadge({ name, color }: { name: string; color: { bg: string; text: string; border: string } }) {
  return (
    <div
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-full overflow-hidden group cursor-default"
      style={{
        background: color.bg.replace('0.92', '0.12'),
        border: `1px solid ${color.border}55`,
        transition: 'all 0.25s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = color.border;
        (e.currentTarget as HTMLElement).style.background = color.bg.replace('0.92', '0.22');
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = color.border + '55';
        (e.currentTarget as HTMLElement).style.background = color.bg.replace('0.92', '0.12');
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${color.border}20, transparent)` }}
      />
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color.border, boxShadow: `0 0 6px ${color.border}80` }} />
      <span className="text-[11px] font-medium relative z-10" style={{ color: color.text === '#1A0E00' ? 'var(--text-2)' : 'var(--text-2)' }}>
        {name}
      </span>
    </div>
  );
}

type Toast = { kind: 'success' | 'error'; message: string } | null;

export function AppointmentCalendar({ appointments }: Props) {
  const router = useRouter();
  const [weekBase, setWeekBase] = useState(new Date());
  const [localAppts, setLocalAppts] = useState(appointments);
  const [staffFilter, setStaffFilter] = useState('');
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ date: string; hour: number } | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setLocalAppts(appointments); }, [appointments]);

  useEffect(() => {
    fetch('/api/staff')
      .then((r) => r.ok ? r.json() : [])
      .then((data: StaffOption[]) => setStaffOptions(Array.isArray(data) ? data.filter((s) => s.active !== false) : []))
      .catch(() => {});
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = (kind: 'success' | 'error', message: string) => {
    setToast({ kind, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const weekStart = startOfWeek(weekBase, { weekStartsOn: 1 });
  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));
  const valid = localAppts.filter((a) => {
    if (!a.date || !a.time) return false;
    if (staffFilter && a.staffId !== staffFilter) return false;
    return true;
  });

  const isPastSlot = (day: Date, hour: number) => {
    const now = new Date();
    if (day.toDateString() !== now.toDateString()) return day < new Date(now.toDateString());
    return hour < now.getHours();
  };

  const hasConflict = (date: string, hour: number, excludeId: string, duration: number) => {
    const start = hour * 60;
    const end = start + duration;
    return valid.some((a) => {
      if (a.id === excludeId) return false;
      if (a.status === 'cancelled') return false;
      if (a.date !== date) return false;
      const [h, m] = a.time.split(':').map(Number);
      const aStart = h * 60 + m;
      const aEnd = aStart + a.durationMinutes;
      return start < aEnd && end > aStart;
    });
  };

  const canDrop = (day: Date, hour: number): boolean => {
    if (!draggingId) return false;
    const appt = valid.find((a) => a.id === draggingId);
    if (!appt) return false;
    if (isPastSlot(day, hour)) return false;
    const dateStr = format(day, 'yyyy-MM-dd');
    if (hasConflict(dateStr, hour, draggingId, appt.durationMinutes)) return false;
    return true;
  };

  const onDragStart = (e: React.DragEvent, appt: Appointment) => {
    if (appt.status === 'cancelled') { e.preventDefault(); return; }
    setDraggingId(appt.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appt.id);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const onDragOver = (e: React.DragEvent, day: Date, hour: number) => {
    if (!draggingId) return;
    if (!canDrop(day, hour)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dateStr = format(day, 'yyyy-MM-dd');
    if (!dropTarget || dropTarget.date !== dateStr || dropTarget.hour !== hour) {
      setDropTarget({ date: dateStr, hour });
    }
  };

  const onDragLeave = (e: React.DragEvent, day: Date, hour: number) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    if (dropTarget?.date === dateStr && dropTarget?.hour === hour) {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDropTarget(null);
      }
    }
  };

  const onDrop = async (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const appt = localAppts.find((a) => a.id === id);
    setDraggingId(null);
    setDropTarget(null);
    if (!appt) return;
    if (!canDrop(day, hour)) return;

    const newDate = format(day, 'yyyy-MM-dd');
    const newTime = `${String(hour).padStart(2, '0')}:00`;
    if (appt.date === newDate && appt.time === newTime) return;

    const prev = localAppts;
    setLocalAppts((curr) => curr.map((a) => a.id === id ? { ...a, date: newDate, time: newTime } : a));

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, time: newTime, ...(appt.staffId ? { staffId: appt.staffId } : {}) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || 'Taşınamadı');
      }
      showToast('success', `Randevu ${format(day, 'd MMMM', { locale: tr })} ${newTime}'a taşındı`);
      router.refresh();
    } catch (err) {
      setLocalAppts(prev);
      showToast('error', err instanceof Error ? err.message : 'Taşınamadı');
    }
  };

  return (
    <div className="space-y-5 relative">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-[200] px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{
            background: toast.kind === 'success' ? 'rgba(60,200,140,0.95)' : 'rgba(230,80,90,0.95)',
            color: '#fff',
            backdropFilter: 'blur(6px)',
            animation: 'fadeInRight 0.25s ease',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Week navigator */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-medium" style={{ color: 'var(--text-2)', fontFamily: '"Cormorant Garamond", serif', letterSpacing: '0.04em' }}>
          {format(weekStart, 'd MMMM', { locale: tr })} — {format(addDays(weekStart, 5), 'd MMMM yyyy', { locale: tr })}
        </p>
        <div className="flex items-center gap-1.5 ml-auto">
          {staffOptions.length > 0 && (
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="h-9 px-3 rounded-xl text-xs"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            >
              <option value="">Tüm personel</option>
              {staffOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button
            onClick={() => setWeekBase((d) => subWeeks(d, 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => setWeekBase(new Date())}
            className="h-9 px-4 rounded-xl text-xs font-semibold tracking-widest uppercase transition-all hover:scale-105 active:scale-95"
            style={{ background: 'var(--gold-bg)', border: '1px solid var(--border-gold)', color: 'var(--gold)' }}
          >
            Bugün
          </button>
          <button
            onClick={() => setWeekBase((d) => addWeeks(d, 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)' }}>
        <div style={{ minWidth: 700 }}>
          {/* Day headers */}
          <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="py-4" />
            {days.map((day) => (
              <div key={day.toISOString()} className="py-4 text-center">
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--text-3)' }}>
                  {format(day, 'EEE', { locale: tr })}
                </p>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center mx-auto font-semibold transition-all"
                  style={
                    isToday(day)
                      ? { background: 'var(--gold)', color: '#0A0800', fontSize: '0.95rem', boxShadow: '0 0 20px rgba(212,175,110,0.5)' }
                      : { color: 'var(--text-1)', fontSize: '0.9rem' }
                  }
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time rows */}
          <div className="relative">
            <CurrentTimeLine />
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-7"
                style={{ borderBottom: '1px solid var(--border)', minHeight: ROW_H }}
              >
                <div
                  className="flex items-start justify-end pt-2 pr-3"
                  style={{ color: 'var(--text-2)', fontSize: '0.8rem', fontFamily: '"Cormorant Garamond", serif', fontWeight: 500 }}
                >
                  {hour}:00
                </div>

                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const appts = valid.filter((a) => {
                    if (!isSameDay(parseISO(a.date), day)) return false;
                    return parseInt(a.time.split(':')[0], 10) === hour;
                  });
                  const isDropTarget = dropTarget?.date === dateStr && dropTarget?.hour === hour;
                  const isInvalidTarget = draggingId && !canDrop(day, hour);
                  const draggingAppt = draggingId ? valid.find((a) => a.id === draggingId) : null;

                  return (
                    <div
                      key={day.toISOString()}
                      className="relative p-1"
                      style={{
                        borderLeft: '1px solid var(--border)',
                        background: isDropTarget ? 'rgba(212,175,110,0.12)' : 'transparent',
                        outline: isDropTarget ? '2px dashed var(--gold)' : 'none',
                        outlineOffset: '-2px',
                        transition: 'background 0.12s ease',
                        opacity: draggingId && isInvalidTarget ? 0.55 : 1,
                      }}
                      onDragOver={(e) => onDragOver(e, day, hour)}
                      onDragLeave={(e) => onDragLeave(e, day, hour)}
                      onDrop={(e) => onDrop(e, day, hour)}
                    >
                      {/* Ghost preview */}
                      {isDropTarget && draggingAppt && (
                        <div
                          className="pointer-events-none rounded-lg px-2.5 py-2"
                          style={{
                            background: (SVC_COLORS[draggingAppt.service] ?? DEFAULT_COLOR).bg.replace('0.92', '0.35'),
                            border: `1px dashed ${(SVC_COLORS[draggingAppt.service] ?? DEFAULT_COLOR).border}`,
                            color: (SVC_COLORS[draggingAppt.service] ?? DEFAULT_COLOR).text,
                            height: Math.max((draggingAppt.durationMinutes / 60) * ROW_H - 6, 38),
                            opacity: 0.7,
                          }}
                        >
                          <p className="font-bold truncate" style={{ fontSize: '12px' }}>
                            {draggingAppt.customerName}
                          </p>
                          <p className="truncate font-medium" style={{ fontSize: '10px', opacity: 0.7 }}>
                            önizleme
                          </p>
                        </div>
                      )}

                      {appts.map((a) => {
                        const c = SVC_COLORS[a.service] ?? DEFAULT_COLOR;
                        const h = Math.max((a.durationMinutes / 60) * ROW_H - 6, 38);
                        const isDraggable = a.status !== 'cancelled';
                        const isBeingDragged = draggingId === a.id;
                        return (
                          <div
                            key={a.id}
                            draggable={isDraggable}
                            onDragStart={(e) => onDragStart(e, a)}
                            onDragEnd={onDragEnd}
                            className="group relative rounded-lg px-2.5 py-2 overflow-hidden leading-snug"
                            style={{
                              background: c.bg,
                              border: `1px solid ${c.border}`,
                              color: c.text,
                              height: `${h}px`,
                              boxShadow: `0 2px 8px ${c.border}40`,
                              cursor: isDraggable ? 'grab' : 'default',
                              opacity: isBeingDragged ? 0.4 : 1,
                              transition: 'opacity 0.15s ease, transform 0.15s ease',
                            }}
                          >
                            {isDraggable && (
                              <div
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-70 transition-opacity pointer-events-none"
                                style={{ color: c.text }}
                              >
                                <GripVertical size={12} />
                              </div>
                            )}
                            <p className="font-bold truncate pr-3" style={{ fontSize: '12px' }}>
                              {a.customerName}
                            </p>
                            {h > 42 && (
                              <p className="truncate font-medium" style={{ fontSize: '11px', opacity: 0.8 }}>
                                {a.service}
                              </p>
                            )}
                            {h > 56 && (
                              <p className="font-medium" style={{ fontSize: '10px', opacity: 0.65 }}>
                                {a.time} · {a.durationMinutes}dk
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service legend */}
      <div className="flex flex-wrap gap-2 pt-1">
        {Object.entries(SVC_COLORS).map(([name, c]) => (
          <ServiceBadge key={name} name={name} color={c} />
        ))}
      </div>

      <style jsx>{`
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
