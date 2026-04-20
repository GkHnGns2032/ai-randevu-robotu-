'use client';
import { useEffect, useState, useCallback } from 'react';
import { Brain, TrendingUp, Clock, Star, RefreshCw, Sparkles } from 'lucide-react';

function cacheStatus(iso: string): { label: string; color: string; dot: string } {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1)  return { label: 'Az önce güncellendi', color: 'var(--mint)', dot: 'var(--mint)' };
  if (diffMin < 20) return { label: `${diffMin} dk önce güncellendi`, color: 'var(--mint)', dot: 'var(--mint)' };
  if (diffMin < 28) return { label: `${diffMin} dk önce güncellendi`, color: 'var(--amber)', dot: 'var(--amber)' };
  return { label: `${diffMin} dk önce — yenilemeyi düşün`, color: 'var(--rose)', dot: 'var(--rose)' };
}

function CacheAge({ generatedAt }: { generatedAt: string }) {
  const { label, color, dot } = cacheStatus(generatedAt);
  return (
    <p className="flex items-center gap-1.5 text-[9px] mt-3">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
      <span style={{ color }}>{label}</span>
    </p>
  );
}

interface Insights {
  capacityRate: number;
  popularService: { name: string; count: number };
  peakHours: { hour: string; count: number }[];
  monthRevenue: number;
  projectedRevenue: number;
  thisWeekCount: number;
  thisMonthCount: number;
  recommendation: string;
  generatedAt: string;
  error?: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="relative rounded-xl p-4 flex flex-col gap-2 overflow-hidden"
      style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: accent ?? 'var(--gold-bg)', color: 'var(--gold)' }}
        >
          <Icon size={14} strokeWidth={1.5} />
        </div>
        <span className="text-[9px] font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--text-3)' }}>
          {label}
        </span>
      </div>
      <p className="text-xl font-light" style={{ color: 'var(--text-1)', fontFamily: '"Cormorant Garamond", serif' }}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{sub}</p>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0,1,2,3].map((i) => (
          <div key={i} className="h-24 rounded-xl" style={{ background: 'var(--bg-hover)' }} />
        ))}
      </div>
      <div className="h-28 rounded-xl" style={{ background: 'var(--bg-hover)' }} />
    </div>
  );
}

export function InsightsPanel() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const load = useCallback(async () => {
    setSpinning(true);
    setLoading(!data);
    try {
      const res = await fetch('/api/insights');
      const json = await res.json() as Insights;
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, [data]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);

  if (loading) return <Skeleton />;
  if (!data || data.error) return (
    <p className="text-sm text-center py-8" style={{ color: 'var(--text-3)' }}>
      Analiz yüklenemedi.
    </p>
  );

  const capacityColor = data.capacityRate >= 80
    ? 'color-mix(in srgb, #22c55e 20%, transparent)'
    : data.capacityRate >= 50
    ? 'color-mix(in srgb, var(--gold) 20%, transparent)'
    : 'color-mix(in srgb, #f43f5e 20%, transparent)';

  const peakStr = data.peakHours.length > 0
    ? data.peakHours.map((h) => h.hour).join(', ')
    : '—';

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Haftalık Doluluk"
          value={`%${data.capacityRate}`}
          sub={`${data.thisWeekCount} randevu bu hafta`}
          accent={capacityColor}
        />
        <StatCard
          icon={Star}
          label="En Popüler"
          value={data.popularService.name}
          sub={`${data.popularService.count} randevu`}
        />
        <StatCard
          icon={Clock}
          label="Yoğun Saatler"
          value={peakStr}
          sub="en çok randevu alınan"
        />
        <StatCard
          icon={TrendingUp}
          label="Ay Sonu Tahmini"
          value={`₺${data.projectedRevenue.toLocaleString('tr-TR')}`}
          sub={`Gerçekleşen: ₺${data.monthRevenue.toLocaleString('tr-TR')}`}
        />
      </div>

      {/* AI Recommendation */}
      <div
        className="relative rounded-xl p-5 overflow-hidden"
        style={{ background: 'var(--gold-bg)', border: '1px solid var(--border-gold)' }}
      >
        {/* Glow */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'var(--gold)', opacity: 0.15 }}
        />
        <div className="relative flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'var(--gold)', color: '#fff' }}
          >
            <Brain size={15} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--gold)' }}>
                AI Öneri
              </span>
              <Sparkles size={10} style={{ color: 'var(--gold)', opacity: 0.7 }} />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>
              {data.recommendation}
            </p>
            <CacheAge generatedAt={data.generatedAt} />
          </div>
          <button
            onClick={load}
            disabled={spinning}
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-medium transition-opacity hover:opacity-70"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-2)', whiteSpace: 'nowrap' }}
            title="Analizi yenile"
          >
            <RefreshCw size={10} style={{ animation: spinning ? 'spin 1s linear infinite' : 'none' }} />
            {spinning ? 'Yükleniyor…' : 'Yenile'}
          </button>
        </div>
      </div>
    </div>
  );
}
