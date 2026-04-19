'use client';

import { useState, useEffect } from 'react';
import { Appointment } from '@/lib/types';
import {
  format, startOfWeek, addDays, isSameDay, parseISO,
  addWeeks, subWeeks, isToday, getHours, getMinutes,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props { appointments: Appointment[]; }

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

/* ── Premium service legend badge ── */
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
      {/* Animated sweep on hover */}
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

export function AppointmentCalendar({ appointments }: Props) {
  const [weekBase, setWeekBase] = useState(new Date());
  const weekStart = startOfWeek(weekBase, { weekStartsOn: 1 });
  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));
  const valid = appointments.filter((a) => a.date && a.time);

  return (
    <div className="space-y-5">
      {/* Week navigator */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: 'var(--text-2)', fontFamily: '"Cormorant Garamond", serif', letterSpacing: '0.04em' }}>
          {format(weekStart, 'd MMMM', { locale: tr })} — {format(addDays(weekStart, 5), 'd MMMM yyyy', { locale: tr })}
        </p>
        <div className="flex items-center gap-1.5">
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
                {/* Time label */}
                <div
                  className="flex items-start justify-end pt-2 pr-3"
                  style={{ color: 'var(--text-2)', fontSize: '0.8rem', fontFamily: '"Cormorant Garamond", serif', fontWeight: 500 }}
                >
                  {hour}:00
                </div>

                {days.map((day) => {
                  const appts = valid.filter((a) => {
                    if (!isSameDay(parseISO(a.date), day)) return false;
                    return parseInt(a.time.split(':')[0], 10) === hour;
                  });
                  return (
                    <div
                      key={day.toISOString()}
                      className="relative p-1"
                      style={{ borderLeft: '1px solid var(--border)' }}
                    >
                      {appts.map((a) => {
                        const c = SVC_COLORS[a.service] ?? DEFAULT_COLOR;
                        const h = Math.max((a.durationMinutes / 60) * ROW_H - 6, 38);
                        return (
                          <div
                            key={a.id}
                            className="rounded-lg px-2.5 py-2 overflow-hidden leading-snug"
                            style={{
                              background: c.bg,
                              border: `1px solid ${c.border}`,
                              color: c.text,
                              height: `${h}px`,
                              boxShadow: `0 2px 8px ${c.border}40`,
                            }}
                          >
                            <p className="font-bold truncate" style={{ fontSize: '12px' }}>
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

      {/* Service legend — premium animated badges */}
      <div className="flex flex-wrap gap-2 pt-1">
        {Object.entries(SVC_COLORS).map(([name, c]) => (
          <ServiceBadge key={name} name={name} color={c} />
        ))}
      </div>
    </div>
  );
}
