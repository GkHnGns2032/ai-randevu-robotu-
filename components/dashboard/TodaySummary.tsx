'use client';

import { Appointment } from '@/lib/types';
import { SERVICE_PRICES } from '@/lib/pricing';
import { useEffect, useState } from 'react';

interface Props { appointments: Appointment[] }

export function TodaySummary({ appointments }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const todayAppts = appointments
    .filter((a) => a.date === todayStr && a.status !== 'cancelled')
    .map((a) => ({ ...a, dt: new Date(`${a.date}T${a.time}:00`) }))
    .sort((a, b) => a.dt.getTime() - b.dt.getTime());

  const total = todayAppts.length;
  const completed = todayAppts.filter((a) => a.dt <= now).length;
  const upcoming = total - completed;
  const estimatedRevenue = todayAppts.reduce((sum, a) => sum + (SERVICE_PRICES[a.service] ?? 0), 0);
  const noShowRisk = todayAppts.filter((a) => a.isNoShow).length;

  return (
    <div
      className="grain-card relative rounded-2xl overflow-hidden anim-up flex-1 min-w-[280px]"
      style={{
        animationDelay: '75ms',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--mint), transparent)',
          opacity: 0.7,
        }}
      />

      <div className="px-6 py-4">
        <p className="text-[10px] tracking-[0.18em] uppercase font-semibold mb-3" style={{ color: 'var(--text-3)' }}>
          Bugün
        </p>

        {total === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            Bugün randevu yok — iyi dinlenceler.
          </p>
        ) : (
          <div className="flex items-end gap-6 flex-wrap">
            <div>
              <p
                className="font-light tabular-nums leading-none"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.6rem', color: 'var(--text-1)' }}
              >
                {total}
              </p>
              <p className="text-[10px] tracking-[0.14em] uppercase mt-1" style={{ color: 'var(--text-3)' }}>
                Randevu
              </p>
            </div>

            <div>
              <p
                className="font-light tabular-nums leading-none"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.6rem', color: 'var(--gold)' }}
              >
                ₺{estimatedRevenue.toLocaleString('tr-TR')}
              </p>
              <p className="text-[10px] tracking-[0.14em] uppercase mt-1" style={{ color: 'var(--text-3)' }}>
                Tahmini Kazanç
              </p>
            </div>

            <div>
              <p
                className="font-light tabular-nums leading-none"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.6rem', color: 'var(--mint)' }}
              >
                {upcoming}
                <span className="text-[0.9rem]" style={{ color: 'var(--text-3)' }}>/{total}</span>
              </p>
              <p className="text-[10px] tracking-[0.14em] uppercase mt-1" style={{ color: 'var(--text-3)' }}>
                Kalan
              </p>
            </div>

            {noShowRisk > 0 && (
              <div>
                <p
                  className="font-light tabular-nums leading-none"
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.6rem', color: 'var(--rose)' }}
                >
                  {noShowRisk}
                </p>
                <p className="text-[10px] tracking-[0.14em] uppercase mt-1" style={{ color: 'var(--rose)' }}>
                  Gelmedi
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
