'use client';

import { Appointment, ServiceType } from '@/lib/types';
import {
  isToday, isThisWeek, isThisMonth, parseISO, isTomorrow, isAfter,
  startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths,
  isWithinInterval,
} from 'date-fns';
import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, Pencil } from 'lucide-react';
import { SERVICE_PRICES as PRICES } from '@/lib/pricing';

interface Props { appointments: Appointment[]; }

const SVC_COLORS: Record<string, string> = {
  'Saç Kesimi':    '#D4AF6E',
  'Saç Boyama':    '#F09AA0',
  'Manikür':       '#7AB8E8',
  'Pedikür':       '#7AB8E8',
  'Kaş Tasarımı':  '#B8A0E8',
  'Cilt Bakımı':   '#7EDECE',
  'Masaj':         '#F0C870',
  'Kalıcı Makyaj': '#F0A0C0',
};

function revenue(appts: Appointment[]) {
  return appts
    .filter((a) => a.status === 'confirmed')
    .reduce((sum, a) => sum + (PRICES[a.service as ServiceType] ?? 0), 0);
}

function isLastWeek(date: Date): boolean {
  const ref = subWeeks(new Date(), 1);
  return isWithinInterval(date, {
    start: startOfWeek(ref, { weekStartsOn: 1 }),
    end:   endOfWeek(ref, { weekStartsOn: 1 }),
  });
}

function isLastMonth(date: Date): boolean {
  const ref = subMonths(new Date(), 1);
  return isWithinInterval(date, { start: startOfMonth(ref), end: endOfMonth(ref) });
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function useCountUp(target: number, delay = 0, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      if (target === 0) { setVal(0); return; }
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 4)) * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay, duration]);
  return val;
}

function fmt(n: number) {
  return new Intl.NumberFormat('tr-TR').format(n);
}

/* ── Keyframes (injected once) ───────────────────────────────── */
const KEYFRAMES = `
  @keyframes float-diamond {
    0%,100% { transform:rotate(45deg) translateY(0) scale(1); opacity:0.35; }
    50%      { transform:rotate(45deg) translateY(-14px) scale(1.3); opacity:0.85; }
  }
  @keyframes aurora {
    0%,100% { opacity:0.07; transform:translate(-50%,-50%) scale(1); }
    50%      { opacity:0.14; transform:translate(-50%,-50%) scale(1.2); }
  }
  @keyframes aurora2 {
    0%,100% { opacity:0.04; transform:translate(-50%,-50%) scale(1.1); }
    50%      { opacity:0.10; transform:translate(-50%,-50%) scale(0.9); }
  }
  @keyframes badge-in {
    from { opacity:0; transform:translateY(8px) scale(0.92); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes bar-fill {
    from { width:0%; }
  }
  @keyframes number-glow {
    0%,100% { text-shadow: 0 0 30px var(--gold-glow,#D4AF6E60), 0 0 60px var(--gold-glow,#D4AF6E30); }
    50%     { text-shadow: 0 0 60px var(--gold-glow,#D4AF6E90), 0 0 100px var(--gold-glow,#D4AF6E50), 0 0 4px var(--gold,#D4AF6E); }
  }
  @keyframes shimmer-slide {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes progress-pulse {
    0%,100% { box-shadow: 0 0 6px currentColor; }
    50%      { box-shadow: 0 0 18px currentColor; }
  }
`;

/* ── Particles config ────────────────────────────────────────── */
const DIAMONDS = [
  { top: '12%', left: '6%',   s: 5, delay: '0s',    dur: '7s'  },
  { top: '22%', right: '9%',  s: 3, delay: '1.8s',  dur: '9s'  },
  { top: '65%', left: '4%',   s: 4, delay: '3.2s',  dur: '8s'  },
  { top: '55%', right: '6%',  s: 3, delay: '0.9s',  dur: '11s' },
  { top: '80%', left: '18%',  s: 2, delay: '5s',    dur: '7s'  },
  { top: '35%', right: '22%', s: 2, delay: '2.5s',  dur: '10s' },
];

/* ── Comparison Badge ─────────────────────────────────────────── */
function ComparisonBadge({ label, current, previous, delay }: {
  label: string; current: number; previous: number; delay: number;
}) {
  const pct = pctChange(current, previous);
  const up = pct > 5; const dn = pct < -5;
  const color = up ? 'var(--mint)' : dn ? 'var(--rose)' : 'var(--text-3)';
  const Icon = up ? TrendingUp : dn ? TrendingDown : Minus;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{
        background: `${color}14`,
        border: `1px solid ${color}30`,
        animation: `badge-in 0.5s ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <Icon size={11} style={{ color }} strokeWidth={2.5} />
      <div>
        <p className="text-[9px] tracking-[0.14em] uppercase leading-none mb-0.5" style={{ color: 'var(--text-3)' }}>{label}</p>
        <p className="text-xs font-bold tabular-nums leading-none" style={{ color }}>
          {pct > 0 ? '+' : ''}{pct}%
          {previous > 0 && (
            <span className="ml-1 font-normal opacity-60" style={{ fontSize: '0.62rem' }}>
              ₺{fmt(previous)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ── Revenue Hero ─────────────────────────────────────────────── */
function RevenueHero({ today, week, month, lastWeek, lastMonth }: {
  today: number; week: number; month: number; lastWeek: number; lastMonth: number;
}) {
  const todayCount = useCountUp(today, 200, 1400);
  const weekCount  = useCountUp(week,  400, 1200);
  const monthCount = useCountUp(month, 600, 1200);

  const dailyAvg = week > 0 ? Math.round(week / 7) : 0;
  const trendPct = dailyAvg > 0 ? Math.round(((today - dailyAvg) / dailyAvg) * 100) : 0;
  const TrendIcon = trendPct > 5 ? TrendingUp : trendPct < -5 ? TrendingDown : Minus;
  const trendColor = trendPct > 5 ? 'var(--mint)' : trendPct < -5 ? 'var(--rose)' : 'var(--text-3)';

  return (
    <div className="relative flex flex-col items-center justify-center px-8 pt-12 pb-10 overflow-hidden">

      {/* Aurora glows — much more visible now */}
      <div className="absolute pointer-events-none" style={{ top: '50%', left: '30%', width: 320, height: 220, borderRadius: '50%', background: 'var(--gold)', filter: 'blur(70px)', animation: 'aurora 6s ease-in-out infinite', transform: 'translate(-50%,-50%)' }} />
      <div className="absolute pointer-events-none" style={{ top: '40%', left: '70%', width: 240, height: 180, borderRadius: '50%', background: 'var(--rose)', filter: 'blur(80px)', animation: 'aurora2 8s ease-in-out infinite', transform: 'translate(-50%,-50%)' }} />

      {/* Animated spinning rings */}
      <div className="absolute pointer-events-none spin-slow" style={{ width: 420, height: 420, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', border: '1px solid var(--border-gold)', borderRadius: '50%', opacity: 0.18 }} />
      <div className="absolute pointer-events-none spin-rev" style={{ width: 300, height: 300, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', border: '1px dashed var(--border-gold)', borderRadius: '50%', opacity: 0.12 }} />
      <div className="absolute pointer-events-none spin-slow" style={{ width: 180, height: 180, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', border: '1px solid var(--border-gold)', borderRadius: '50%', opacity: 0.10 }} />

      {/* Floating diamond particles */}
      {DIAMONDS.map((d, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: d.top, left: 'left' in d ? (d as {left:string}).left : undefined,
            right: 'right' in d ? (d as {right:string}).right : undefined,
            width: d.s, height: d.s,
            background: 'var(--gold)',
            transform: 'rotate(45deg)',
            animation: `float-diamond ${d.dur} ease-in-out infinite`,
            animationDelay: d.delay,
            boxShadow: '0 0 8px var(--gold)',
          }}
        />
      ))}

      {/* Label */}
      <p className="relative text-[10px] tracking-[0.32em] uppercase font-semibold mb-8" style={{ color: 'var(--text-3)' }}>
        Bugünkü Tahmini Kazanç
      </p>

      {/* Main number with shimmer glow */}
      <div className="relative flex items-start gap-2 mb-3">
        <span style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
          fontWeight: 400,
          color: 'var(--gold)',
          marginTop: '0.6rem',
          lineHeight: 1,
          opacity: 0.8,
        }}>₺</span>
        <span
          className="tabular-nums relative"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 'clamp(4.5rem, 8vw, 7rem)',
            fontWeight: 300,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            backgroundImage: 'linear-gradient(120deg, var(--gold) 20%, #fffbe6 45%, var(--gold) 55%, #c9993a 80%)',
            backgroundSize: '250% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer-slide 4s linear infinite, number-glow 3s ease-in-out infinite',
          }}
        >
          {fmt(todayCount)}
        </span>
      </div>

      {/* Trend badge */}
      <div
        className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full mb-8"
        style={{
          background: `${trendColor}18`,
          border: `1px solid ${trendColor}40`,
          backdropFilter: 'blur(4px)',
        }}
      >
        <TrendIcon size={12} style={{ color: trendColor }} strokeWidth={2.5} />
        <span className="text-[11px] font-semibold" style={{ color: trendColor }}>
          {trendPct > 0 ? '+' : ''}{trendPct}% günlük ortalamaya göre
        </span>
      </div>

      {/* Week / Month secondaries */}
      <div className="relative flex items-center gap-10 mb-8">
        <div className="text-center">
          <p className="text-[9px] tracking-[0.22em] uppercase mb-2" style={{ color: 'var(--text-3)' }}>Bu Hafta</p>
          <p className="tabular-nums" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.9rem', fontWeight: 400, color: 'var(--text-2)', lineHeight: 1 }}>
            ₺{fmt(weekCount)}
          </p>
        </div>
        <div className="w-px h-10" style={{ background: 'linear-gradient(180deg, transparent, var(--border-gold) 30%, var(--border-gold) 70%, transparent)' }} />
        <div className="text-center">
          <p className="text-[9px] tracking-[0.22em] uppercase mb-2" style={{ color: 'var(--text-3)' }}>Bu Ay</p>
          <p className="tabular-nums" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.9rem', fontWeight: 400, color: 'var(--text-2)', lineHeight: 1 }}>
            ₺{fmt(monthCount)}
          </p>
        </div>
      </div>

      {/* Period comparison badges */}
      <div className="relative flex items-center gap-3 flex-wrap justify-center">
        <ComparisonBadge label="Geçen Haftaya Göre" current={week}  previous={lastWeek}  delay={800}  />
        <ComparisonBadge label="Geçen Aya Göre"     current={month} previous={lastMonth} delay={1000} />
      </div>
    </div>
  );
}

/* ── Upcoming Revenue ─────────────────────────────────────────── */
function UpcomingRevenue({ todayRemaining, tomorrow }: { todayRemaining: number; tomorrow: number }) {
  const todayCount    = useCountUp(todayRemaining, 400);
  const tomorrowCount = useCountUp(tomorrow, 600);
  const total = todayRemaining + tomorrow;
  const [hov, setHov] = useState(false);

  return (
    <div
      className="relative flex flex-col justify-center px-7 py-7 overflow-hidden transition-all duration-300"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ background: 'radial-gradient(ellipse at 30% 50%, var(--gold)08, transparent)', opacity: hov ? 1 : 0 }} />

      <p className="text-[9px] tracking-[0.24em] uppercase font-semibold mb-5" style={{ color: 'var(--text-3)' }}>
        Yaklaşan Kazanç
      </p>

      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 rounded-full" style={{ background: 'var(--gold)', opacity: 0.3, animation: 'ping-ring 2s ease-out infinite' }} />
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)' }} />
            </div>
            <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>Bugün kalan</span>
          </div>
          <span className="tabular-nums" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', color: 'var(--gold)', fontWeight: 400 }}>
            ₺{fmt(todayCount)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 rounded-full" style={{ background: 'var(--sky)', opacity: 0.3, animation: 'ping-ring 2s ease-out infinite', animationDelay: '0.5s' }} />
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--sky)' }} />
            </div>
            <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>Yarın</span>
          </div>
          <span className="tabular-nums" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', color: 'var(--sky)', fontWeight: 400 }}>
            ₺{fmt(tomorrowCount)}
          </span>
        </div>

        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--border-gold) 60%, transparent)', opacity: 0.5 }} />

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--text-2)' }}>Toplam beklenen</span>
          <span className="tabular-nums font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.3rem', color: 'var(--text-1)' }}>
            ₺{fmt(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Monthly Goal ─────────────────────────────────────────────── */
function MonthlyGoal({ current, goal, onGoalChange }: {
  current: number; goal: number; onGoalChange: (g: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(goal));
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hov, setHov] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 800); }, []);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const pct = goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;
  const remaining = Math.max(goal - current, 0);
  const exceeded = current >= goal;
  const barColor = exceeded ? 'var(--mint)' : pct > 75 ? 'var(--gold)' : pct > 40 ? 'var(--sky)' : 'var(--lavender)';

  const save = () => {
    const n = parseInt(inputVal.replace(/\D/g, ''));
    if (n > 0) { onGoalChange(n); setInputVal(String(n)); }
    else setInputVal(String(goal));
    setEditing(false);
  };

  return (
    <div
      className="relative flex flex-col justify-center px-7 py-7 overflow-hidden transition-all duration-300"
      style={{ borderLeft: '1px solid var(--border)' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ background: `radial-gradient(ellipse at 70% 50%, ${barColor}08, transparent)`, opacity: hov ? 1 : 0 }} />

      <div className="flex items-center justify-between mb-5">
        <p className="text-[9px] tracking-[0.24em] uppercase font-semibold" style={{ color: 'var(--text-3)' }}>
          Aylık Hedef
        </p>
        <button
          onClick={() => { setInputVal(String(goal)); setEditing(true); }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
        >
          <Pencil size={9} style={{ color: 'var(--text-3)' }} />
          <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>Düzenle</span>
        </button>
      </div>

      {/* Current / goal */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="tabular-nums" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.8rem', fontWeight: 300, color: barColor, lineHeight: 1 }}>
          ₺{fmt(current)}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
          /{' '}
          {editing ? (
            <input
              ref={inputRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value.replace(/\D/g, ''))}
              onBlur={save}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setInputVal(String(goal)); } }}
              className="inline-block w-24 px-1.5 rounded text-[11px] tabular-nums"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-gold)', color: 'var(--text-1)', outline: 'none' }}
            />
          ) : (
            <span>₺{fmt(goal)}</span>
          )}
        </span>
      </div>

      {/* Progress bar with milestone dots */}
      <div className="relative mb-3">
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: mounted ? `${pct}%` : '0%',
              background: `linear-gradient(90deg, ${barColor}80, ${barColor})`,
              boxShadow: `0 0 12px ${barColor}60`,
              transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
              animation: pct > 0 ? 'progress-pulse 3s ease-in-out infinite' : 'none',
            }}
          />
        </div>
        {/* Milestone ticks */}
        {[25, 50, 75].map((m) => (
          <div
            key={m}
            className="absolute top-1/2 -translate-y-1/2 w-px h-4"
            style={{
              left: `${m}%`,
              background: pct >= m ? 'transparent' : 'var(--border)',
              opacity: 0.4,
            }}
          />
        ))}
      </div>

      {/* Milestone labels */}
      <div className="flex justify-between mb-3 px-0">
        {[25, 50, 75].map((m) => (
          <span key={m} className="text-[8px] tabular-nums" style={{ color: pct >= m ? barColor : 'var(--text-3)', opacity: pct >= m ? 0.8 : 0.4, marginLeft: m === 25 ? '20%' : m === 50 ? 0 : undefined, marginRight: m === 75 ? '20%' : undefined }}>
            %{m}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>%{pct}</span>
        <span className="text-[10px] font-medium" style={{ color: exceeded ? 'var(--mint)' : 'var(--text-3)' }}>
          {exceeded ? '✦ Hedef aşıldı!' : `₺${fmt(remaining)} kaldı`}
        </span>
      </div>
    </div>
  );
}

/* ── Service Breakdown ────────────────────────────────────────── */
function ServiceBreakdown({ data }: { data: { service: string; count: number; revenue: number }[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 400); }, []);

  const maxRev = data[0]?.revenue ?? 1;
  const totalRev = data.reduce((s, d) => s + d.revenue, 0);

  if (data.length === 0) {
    return (
      <div className="px-7 py-6 flex items-center justify-center">
        <p className="text-[11px] tracking-widest" style={{ color: 'var(--text-3)' }}>Henüz onaylı randevu yok</p>
      </div>
    );
  }

  return (
    <div className="px-7 py-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[9px] tracking-[0.24em] uppercase font-semibold" style={{ color: 'var(--text-3)' }}>
          Hizmet Bazlı Gelir
        </p>
        <span className="text-[10px] tabular-nums" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: 'var(--gold)' }}>
          ₺{fmt(totalRev)} toplam
        </span>
      </div>

      <div className="space-y-4">
        {data.map(({ service, count, revenue: rev }, i) => {
          const pct = Math.round((rev / maxRev) * 100);
          const share = totalRev > 0 ? Math.round((rev / totalRev) * 100) : 0;
          const color = SVC_COLORS[service] ?? '#D4AF6E';

          return (
            <div key={service} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="flex-shrink-0 w-2 h-2 rounded-full"
                    style={{ background: color, boxShadow: `0 0 6px ${color}80` }}
                  />
                  <span className="text-[11px] truncate" style={{ color: 'var(--text-2)' }}>{service}</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}
                  >
                    {count}×
                  </span>
                </div>
                <div className="flex items-baseline gap-3 flex-shrink-0 ml-3">
                  <span className="text-[10px] opacity-50 tabular-nums" style={{ color }}>%{share}</span>
                  <span className="tabular-nums font-medium" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color }}>
                    ₺{fmt(rev)}
                  </span>
                </div>
              </div>

              {/* Animated bar */}
              <div className="relative h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: mounted ? `${pct}%` : '0%',
                    background: `linear-gradient(90deg, ${color}50, ${color})`,
                    boxShadow: `0 0 8px ${color}70`,
                    transition: `width 1s cubic-bezier(0.16,1,0.3,1)`,
                    transitionDelay: `${i * 120}ms`,
                  }}
                />
                {/* Shimmer overlay on bar */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full pointer-events-none"
                  style={{
                    width: mounted ? `${pct}%` : '0%',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer-slide 2.5s linear infinite',
                    animationDelay: `${i * 120}ms`,
                    transition: `width 1s cubic-bezier(0.16,1,0.3,1)`,
                    transitionDelay: `${i * 120}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Payment Summary ─────────────────────────────────────────── */
function PaymentSummary({ collected, pending }: { collected: number; pending: number }) {
  const collectedCount = useCountUp(collected, 300);
  const pendingCount   = useCountUp(pending,   500);
  const total = collected + pending;
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 400); }, []);

  return (
    <div className="px-7 py-6">
      <p className="text-[9px] tracking-[0.24em] uppercase font-semibold mb-5" style={{ color: 'var(--text-3)' }}>
        Ödeme Durumu
      </p>
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--mint)' }} />
            <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>Tahsil Edilen</span>
          </div>
          <span className="tabular-nums" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', color: 'var(--mint)', fontWeight: 400 }}>
            ₺{fmt(collectedCount)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--rose)' }} />
            <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>Bekleyen</span>
          </div>
          <span className="tabular-nums" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', color: 'var(--rose)', fontWeight: 400 }}>
            ₺{fmt(pendingCount)}
          </span>
        </div>
        <div className="relative h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: mounted ? `${pct}%` : '0%',
              background: 'linear-gradient(90deg, var(--mint)80, var(--mint))',
              boxShadow: '0 0 8px var(--mint)70',
              transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--mint)' }}>%{pct} tahsil</span>
          <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>₺{fmt(total)} toplam</span>
        </div>
      </div>
    </div>
  );
}

/* ── Bottom stat columns ─────────────────────────────────────── */
const APPT_STATS = [
  { key: 'today', label: 'Bugün',    sub: 'randevu', color: '#D4AF6E' },
  { key: 'week',  label: 'Bu Hafta', sub: 'randevu', color: '#F09AA0' },
  { key: 'month', label: 'Bu Ay',    sub: 'randevu', color: '#7AB8E8' },
  { key: 'total', label: 'Toplam',   sub: 'onaylı',  color: '#7EDECE' },
];

function StatCol({ label, sub, color, value, delay, last }: {
  label: string; sub: string; color: string; value: number; delay: number; last: boolean;
}) {
  const count = useCountUp(value, delay + 500, 1000);
  const [hov, setHov] = useState(false);

  return (
    <div className="flex items-stretch flex-1">
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="flex-1 relative flex flex-col items-center justify-center py-8 px-4 cursor-default overflow-hidden"
      >
        {/* Radial hover glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-400"
          style={{ background: `radial-gradient(ellipse 80% 90% at 50% 50%, ${color}14, transparent)`, opacity: hov ? 1 : 0 }}
        />

        {/* Animated diamond */}
        <div
          className="mb-4 transition-all duration-300"
          style={{
            width: 6, height: 6,
            background: color,
            transform: `rotate(45deg) scale(${hov ? 1.8 : 1})`,
            boxShadow: hov ? `0 0 14px ${color}, 0 0 28px ${color}60` : `0 0 6px ${color}60`,
            opacity: hov ? 1 : 0.55,
          }}
        />

        <p className="text-[9px] tracking-[0.22em] uppercase font-semibold mb-3" style={{ color: 'var(--text-3)' }}>{label}</p>

        <p
          className="tabular-nums leading-none transition-all duration-300"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 'clamp(2.6rem, 4.5vw, 3.5rem)',
            fontWeight: 300,
            color,
            textShadow: hov ? `0 0 50px ${color}60` : 'none',
          }}
        >
          {count}
        </p>

        <p className="text-[10px] mt-2" style={{ color: 'var(--text-3)' }}>{sub}</p>

        {/* Bottom slide bar */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-500"
          style={{ width: hov ? '60%' : '0%', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, boxShadow: `0 0 8px ${color}` }}
        />
      </div>

      {!last && (
        <div
          className="w-px flex-shrink-0 self-stretch my-6"
          style={{ background: 'linear-gradient(180deg, transparent, var(--border-gold) 30%, var(--border-gold) 70%, transparent)' }}
        />
      )}
    </div>
  );
}

/* ── Divider ─────────────────────────────────────────────────── */
function GoldDivider() {
  return (
    <div className="mx-8" style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--border-gold) 15%, var(--gold) 50%, var(--border-gold) 85%, transparent)', opacity: 0.55 }} />
  );
}

/* ── Main export ─────────────────────────────────────────────── */
export function StatsOverview({ appointments }: Props) {
  const [monthlyGoal, setMonthlyGoal] = useState(30000);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('bella-monthly-goal');
    if (saved) setMonthlyGoal(parseInt(saved));
    setNow(new Date());
  }, []);

  const saveGoal = (g: number) => {
    setMonthlyGoal(g);
    localStorage.setItem('bella-monthly-goal', String(g));
  };

  if (!now) {
    return (
      <div
        className="grain-card relative w-full rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
          minHeight: 680,
        }}
      />
    );
  }

  const confirmed = appointments.filter((a) => a.status === 'confirmed' && a.date);

  const todayAppts     = confirmed.filter((a) => isToday(parseISO(a.date)));
  const weekAppts      = confirmed.filter((a) => isThisWeek(parseISO(a.date), { weekStartsOn: 1 }));
  const monthAppts     = confirmed.filter((a) => isThisMonth(parseISO(a.date)));
  const lastWeekAppts  = confirmed.filter((a) => isLastWeek(parseISO(a.date)));
  const lastMonthAppts = confirmed.filter((a) => isLastMonth(parseISO(a.date)));

  const todayRemaining = confirmed.filter(
    (a) => isToday(parseISO(a.date)) && a.time && isAfter(new Date(`${a.date}T${a.time}:00`), now)
  );
  const tomorrowAppts = confirmed.filter((a) => isTomorrow(parseISO(a.date)));

  const serviceRevenue = Object.entries(PRICES)
    .map(([service, price]) => {
      const appts = confirmed.filter((a) => a.service === service);
      return { service, count: appts.length, revenue: appts.length * price };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const values: Record<string, number> = {
    today: todayAppts.length,
    week:  weekAppts.length,
    month: monthAppts.length,
    total: confirmed.length,
  };

  const allAppts = appointments.filter((a) => a.status === 'confirmed');
  const collected = allAppts.reduce((s, a) => s + (a.paidAmount ?? 0), 0);
  const pending = allAppts
    .filter((a) => a.paymentStatus !== 'paid')
    .reduce((s, a) => {
      const price = PRICES[a.service as ServiceType] ?? 0;
      return s + (price - (a.paidAmount ?? 0));
    }, 0);

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div
        className="grain-card relative w-full rounded-2xl overflow-hidden anim-up"
        style={{
          animationDelay: '100ms',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Animated top gold line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] z-10"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--border-gold) 15%, var(--gold) 50%, var(--border-gold) 85%, transparent)',
            animation: 'shimmer-slide 5s linear infinite',
            backgroundSize: '200% 100%',
          }}
        />

        {/* 1 — Revenue hero */}
        <RevenueHero
          today={revenue(todayAppts)}
          week={revenue(weekAppts)}
          month={revenue(monthAppts)}
          lastWeek={revenue(lastWeekAppts)}
          lastMonth={revenue(lastMonthAppts)}
        />

        <GoldDivider />

        {/* 2 — Upcoming + Monthly goal */}
        <div className="grid grid-cols-2">
          <UpcomingRevenue
            todayRemaining={revenue(todayRemaining)}
            tomorrow={revenue(tomorrowAppts)}
          />
          <MonthlyGoal
            current={revenue(monthAppts)}
            goal={monthlyGoal}
            onGoalChange={saveGoal}
          />
        </div>

        <GoldDivider />

        {/* 3 — Service breakdown */}
        <ServiceBreakdown data={serviceRevenue} />

        <GoldDivider />

        {/* 4 — Payment summary */}
        <PaymentSummary collected={collected} pending={Math.max(pending, 0)} />

        <GoldDivider />

        {/* 4 — Appointment stat columns */}
        <div className="flex items-stretch relative z-10">
          {APPT_STATS.map((s, i) => (
            <StatCol
              key={s.key}
              label={s.label}
              sub={s.sub}
              color={s.color}
              value={values[s.key]}
              delay={i * 80}
              last={i === APPT_STATS.length - 1}
            />
          ))}
        </div>

        {/* Animated bottom gold line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--border-gold) 15%, var(--gold) 50%, var(--border-gold) 85%, transparent)',
            opacity: 0.4,
          }}
        />
      </div>
    </>
  );
}
