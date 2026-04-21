'use client';
import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Appointment } from '@/lib/types';
import { priceOf } from '@/lib/pricing';

interface Props { appointments: Appointment[] }

function revenueOf(a: Appointment): number {
  if (a.paidAmount && a.paidAmount > 0) return a.paidAmount;
  if (a.paymentStatus === 'paid') return priceOf(a.service);
  return 0;
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().split('T')[0];
}

function labelDay(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d}/${m}`;
}

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
};

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', color: 'var(--text-1)' }}
    >
      <p style={{ color: 'var(--text-3)', marginBottom: 2 }}>{label}</p>
      <p style={{ color: 'var(--gold)', fontWeight: 600 }}>₺{payload[0].value.toLocaleString('tr-TR')}</p>
    </div>
  );
}

export function RevenueChart({ appointments }: Props) {
  const data = useMemo(() => {
    const nowUTC = new Date();
    const todayISO = new Date(nowUTC.getTime() + 3 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Son 30 gün
    const days = Array.from({ length: 30 }, (_, i) => addDays(todayISO, i - 29));

    const byDate: Record<string, number> = {};
    days.forEach((d) => (byDate[d] = 0));

    appointments.forEach((a) => {
      if (!a.date || a.status === 'cancelled') return;
      const rev = revenueOf(a);
      if (rev > 0 && byDate[a.date] !== undefined) byDate[a.date] += rev;
    });

    return days.map((iso) => ({ date: labelDay(iso), gelir: byDate[iso] }));
  }, [appointments]);

  const total = data.reduce((s, d) => s + d.gelir, 0);
  const hasData = total > 0;

  if (!hasData) {
    return (
      <p className="text-xs text-center py-8" style={{ color: 'var(--text-3)' }}>
        Son 30 günde ödeme kaydı bulunamadı.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-4">
        <span
          className="font-light"
          style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.8rem', color: 'var(--text-1)' }}
        >
          ₺{total.toLocaleString('tr-TR')}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>son 30 günde tahsil edilen</span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-3)', fontSize: 9, fontFamily: '"Courier New", monospace' }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fill: 'var(--text-3)', fontSize: 9, fontFamily: '"Courier New", monospace' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v === 0 ? '0' : `₺${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="gelir"
            stroke="var(--gold)"
            strokeWidth={1.5}
            fill="url(#goldGrad)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--gold)', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
