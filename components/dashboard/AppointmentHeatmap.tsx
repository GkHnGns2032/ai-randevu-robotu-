'use client';
import { Appointment } from '@/lib/types';
import { CLIENT_CONFIG } from '@/config/client';

interface Props { appointments: Appointment[] }

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon-first, 0=Sun at end

export function AppointmentHeatmap({ appointments }: Props) {
  const { start, end } = CLIENT_CONFIG.workingHours;
  const hours = Array.from({ length: end - start }, (_, i) => start + i);

  // matrix[dayIdx][hourIdx] = count
  const matrix: number[][] = Array.from({ length: 7 }, () =>
    Array(hours.length).fill(0)
  );

  appointments.forEach((a) => {
    if (a.status === 'cancelled' || !a.date || !a.time) return;
    const dow = new Date(a.date + 'T00:00:00Z').getUTCDay();
    const hour = parseInt(a.time.split(':')[0], 10);
    const dIdx = DAY_ORDER.indexOf(dow);
    const hIdx = hour - start;
    if (dIdx >= 0 && hIdx >= 0 && hIdx < hours.length) matrix[dIdx][hIdx]++;
  });

  const maxCount = Math.max(1, ...matrix.flat());
  const total = matrix.flat().reduce((s, n) => s + n, 0);

  if (total === 0) {
    return (
      <p className="text-xs text-center py-8" style={{ color: 'var(--text-3)' }}>
        Henüz yeterli randevu verisi yok.
      </p>
    );
  }

  return (
    <div>
      {/* Gün başlıkları */}
      <div className="grid mb-1.5" style={{ gridTemplateColumns: '36px repeat(7, 1fr)', gap: 3 }}>
        <div />
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[9px] font-semibold tracking-[0.12em] uppercase"
            style={{ color: 'color-mix(in srgb, var(--sky) 75%, var(--text-2))', fontFamily: '"Courier New", monospace' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Saat satırları */}
      {hours.map((h, hIdx) => (
        <div key={h} className="grid mb-0.5" style={{ gridTemplateColumns: '36px repeat(7, 1fr)', gap: 3 }}>
          <div
            className="text-right pr-2 text-[9px] tabular-nums flex items-center justify-end"
            style={{ color: 'var(--text-3)', fontFamily: '"Courier New", monospace' }}
          >
            {String(h).padStart(2, '0')}:00
          </div>
          {matrix.map((dayCol, dIdx) => {
            const count = dayCol[hIdx];
            const intensity = count / maxCount;
            // Boş: nötr bg. Dolu: sky %20 (az) → %100 (max) — geniş aralık
            const skyPct = count === 0 ? 0 : Math.round(intensity * 80 + 20);
            return (
              <div
                key={dIdx}
                className="rounded group relative cursor-default transition-transform duration-100 hover:scale-110 hover:z-10"
                style={{
                  height: 22,
                  background: count === 0
                    ? 'color-mix(in srgb, var(--bg-hover) 60%, transparent)'
                    : `color-mix(in srgb, var(--sky) ${skyPct}%, var(--bg-card))`,
                  border: `1px solid ${count > 0 ? `color-mix(in srgb, var(--sky) ${Math.min(skyPct + 15, 100)}%, transparent)` : 'var(--border)'}`,
                }}
              >
                {count > 0 && (
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: intensity > 0.55 ? '#fff' : 'var(--text-1)' }}
                  >
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend + özet */}
      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>
          Toplam {total} randevu analiz edildi
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>Az</span>
          {[20, 35, 55, 75, 100].map((p) => (
            <div
              key={p}
              className="rounded-sm"
              style={{
                width: 14,
                height: 10,
                background: `color-mix(in srgb, var(--sky) ${p}%, var(--bg-hover))`,
                border: '1px solid var(--border)',
              }}
            />
          ))}
          <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>Çok</span>
        </div>
      </div>
    </div>
  );
}
