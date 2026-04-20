'use client';

import { Appointment } from '@/lib/types';
import { format, differenceInMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useEffect, useState } from 'react';

interface Props { appointments: Appointment[]; }

const SVC_COLOR: Record<string, string> = {
  'Saç Kesimi': '#D4AF6E', 'Saç Boyama': '#F08090', 'Manikür': '#7AB8E8',
  'Pedikür': '#7AB8E8', 'Kaş Tasarımı': '#B8A0E8', 'Cilt Bakımı': '#7EDECE',
  'Masaj': '#F0C870', 'Kalıcı Makyaj': '#F0A0C0',
};

export function NextAppointment({ appointments }: Props) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const next = appointments
    .filter((a) => a.date && a.time && a.status === 'confirmed')
    .map((a) => ({ ...a, dt: new Date(`${a.date}T${a.time}:00`) }))
    .filter((a) => a.dt > now)
    .sort((a, b) => a.dt.getTime() - b.dt.getTime())[0];

  if (!next) return null;

  const mins = differenceInMinutes(next.dt, now);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const countdown = h > 0 ? `${h} sa ${m} dk` : `${m} dk`;
  const accent = SVC_COLOR[next.service] ?? '#D4AF6E';

  return (
    <div
      className="grain-card relative rounded-2xl overflow-hidden anim-up"
      style={{
        animationDelay: '50ms',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Animated top border */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.7 }}
      />

      <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          {/* Pulsing colored dot — replaces the awkward icon box */}
          <div className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center">
            <div
              className="absolute w-5 h-5 rounded-full"
              style={{ background: accent, opacity: 0.25, animation: 'ping-ring 2s ease-out infinite' }}
            />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.18em] uppercase font-semibold mb-0.5" style={{ color: 'var(--text-3)' }}>
              Sıradaki Randevu
            </p>
            <p className="font-medium truncate" style={{ color: 'var(--text-1)', fontSize: '0.9rem' }}>
              {next.customerName}
              <span className="mx-2 font-light" style={{ color: 'var(--text-3)' }}>·</span>
              <span style={{ color: accent }}>{next.service}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
              {format(next.dt, 'd MMMM yyyy', { locale: tr })}
            </p>
            <p
              className="font-light tabular-nums"
              style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.3rem', lineHeight: 1.1, color: 'var(--text-1)' }}
            >
              {next.time}
            </p>
          </div>

          <div
            className="flex flex-col items-center justify-center px-4 py-2 rounded-xl"
            style={{
              background: `${accent}15`,
              border: `1px solid ${accent}40`,
              minWidth: 90,
            }}
          >
            <p className="text-[9px] tracking-[0.15em] uppercase font-semibold mb-0.5" style={{ color: `${accent}` }}>
              Kalan
            </p>
            <p className="text-sm font-semibold tabular-nums" style={{ color: accent }}>
              {countdown}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
