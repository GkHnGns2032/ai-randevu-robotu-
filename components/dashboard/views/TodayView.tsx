'use client';

// Bugün görünümü — panelin varsayılan ekranı.
// Salon sahibinin günlük işi "sırada kim var, bugün ne var". Önceden bu bilgiye
// ulaşmak için gelir grafiği, AI analiz ve ısı haritasını geçmek gerekiyordu.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Appointment } from '@/lib/types';
import { SERVICE_PRICES } from '@/lib/pricing';
import { serviceColor } from '@/lib/service-color';
import { AppointmentForm } from '../AppointmentForm';
import { Phone, CalendarClock, UserX, Check, Circle, Dot } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Props {
  appointments: Appointment[];
}

function istanbulToday(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

export function TodayView({ appointments }: Props) {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [noShowPending, setNoShowPending] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayStr = now ? istanbulToday(now) : '';

  const today = useMemo(() => {
    if (!now) return [];
    return appointments
      .filter((a) => a.date === todayStr && a.status !== 'cancelled' && a.time)
      .map((a) => ({ ...a, dt: new Date(`${a.date}T${a.time}:00`) }))
      .sort((a, b) => a.dt.getTime() - b.dt.getTime());
  }, [appointments, todayStr, now]);

  const next = useMemo(() => {
    if (!now) return undefined;
    return appointments
      // Gelmedi işaretli randevu "sıradaki" olamaz — status hâlâ confirmed
      // kaldığı için ayrıca elenmeli.
      .filter((a) => a.date && a.time && a.status === 'confirmed' && !a.isNoShow)
      .map((a) => ({ ...a, dt: new Date(`${a.date}T${a.time}:00`) }))
      .filter((a) => a.dt > now)
      .sort((a, b) => a.dt.getTime() - b.dt.getTime())[0];
  }, [appointments, now]);

  // Sunucu ve istemci saatleri farklı olabilir — hydration uyumsuzluğunu
  // önlemek için zaman bağımlı içerik yalnız mount sonrası çizilir.
  if (!now) return <TodaySkeleton />;

  const revenue = today.reduce((sum, a) => sum + (SERVICE_PRICES[a.service] ?? 0), 0);
  const done = today.filter((a) => a.dt <= now).length;

  async function markNoShow(id: string) {
    setNoShowPending(id);
    try {
      await fetch(`/api/appointments/${id}/no-show`, { method: 'POST' });
      router.refresh();
    } finally {
      setNoShowPending(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Sıradaki randevu ───────────────────────────────── */}
      {next ? (
        <NextCard
          appointment={next}
          minutesAway={differenceInMinutes(next.dt, now)}
          isToday={next.date === todayStr}
          onReschedule={() => setEditing(next)}
          onNoShow={() => markNoShow(next.id)}
          noShowBusy={noShowPending === next.id}
        />
      ) : (
        <EmptyPanel
          title="Yaklaşan randevu yok"
          detail="Yeni randevu eklemek için sağ üstteki düğmeyi kullanabilirsiniz."
        />
      )}

      {/* ── Bugünün özeti + zaman çizelgesi ─────────────────── */}
      <section
        className="grain-card relative rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <header
          className="px-5 sm:px-6 py-4 flex items-baseline justify-between gap-3 flex-wrap"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-baseline gap-3">
            <h2 className="text-[11px] font-semibold tracking-[0.22em] uppercase" style={{ color: 'var(--text-2)' }}>
              Bugün
            </h2>
            <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-3)' }}>
              {format(now, 'd MMMM EEEE', { locale: tr })}
            </span>
          </div>

          {today.length > 0 && (
            <div className="flex items-center gap-4 sm:gap-5 text-[11px] tabular-nums" style={{ color: 'var(--text-2)' }}>
              <span><strong className="font-semibold" style={{ color: 'var(--text-1)' }}>{today.length}</strong> randevu</span>
              <span><strong className="font-semibold" style={{ color: 'var(--text-1)' }}>{done}</strong> tamamlandı</span>
              <span style={{ color: 'var(--gold)' }}>
                <strong className="font-semibold">₺{revenue.toLocaleString('tr-TR')}</strong>
              </span>
            </div>
          )}
        </header>

        {today.length === 0 ? (
          <p className="px-5 sm:px-6 py-8 text-sm" style={{ color: 'var(--text-3)' }}>
            Bugün randevu yok — iyi dinlenceler.
          </p>
        ) : (
          <ol className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {today.map((a) => (
              <TimelineRow
                key={a.id}
                appointment={a}
                past={a.dt <= now}
                onReschedule={() => setEditing(a)}
                onNoShow={() => markNoShow(a.id)}
                noShowBusy={noShowPending === a.id}
              />
            ))}
          </ol>
        )}
      </section>

      {editing && (
        <AppointmentForm
          appointment={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */

function NextCard({
  appointment: a, minutesAway, isToday, onReschedule, onNoShow, noShowBusy,
}: {
  appointment: Appointment & { dt: Date };
  minutesAway: number;
  isToday: boolean;
  onReschedule: () => void;
  onNoShow: () => void;
  noShowBusy: boolean;
}) {
  const accent = serviceColor(a.service);
  const h = Math.floor(minutesAway / 60);
  const m = minutesAway % 60;
  const countdown = h > 0 ? `${h} sa ${m} dk` : `${m} dk`;

  return (
    <section
      className="grain-card relative rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      aria-label="Sıradaki randevu"
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.7 }}
      />

      <div className="px-5 sm:px-6 py-5">
        <p className="text-[10px] tracking-[0.2em] uppercase font-semibold mb-3" style={{ color: 'var(--text-3)' }}>
          Sıradaki
        </p>

        {/* Mobilde dikey yığın: aksiyonlar bilgiyi sıkıştırmasın.
            sm+ genişlikte bilgi solda, aksiyonlar sağda. */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 sm:flex-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span
                className="font-light tabular-nums leading-none"
                style={{ fontFamily: 'var(--c-font-serif)', fontSize: 'clamp(1.9rem, 5vw, 2.6rem)', color: 'var(--text-1)' }}
              >
                {a.time}
              </span>
              <span className="text-sm whitespace-nowrap" style={{ color: 'var(--text-3)' }}>
                {isToday ? `${countdown} sonra` : format(a.dt, 'd MMMM', { locale: tr })}
              </span>
            </div>

            <p className="mt-2 font-medium truncate" style={{ color: 'var(--text-1)', fontSize: '1rem' }}>
              {a.customerName}
            </p>
            <p className="mt-0.5 text-sm flex items-center gap-1.5 flex-wrap">
              <span style={{ color: accent }}>{a.service}</span>
              {a.staffName && (
                <>
                  <Dot size={12} style={{ color: 'var(--text-3)' }} aria-hidden />
                  <span style={{ color: 'var(--text-2)' }}>{a.staffName}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:flex-shrink-0">
            {a.customerPhone && (
              <ActionButton href={`tel:${a.customerPhone}`} icon={Phone} label="Ara" />
            )}
            <ActionButton onClick={onReschedule} icon={CalendarClock} label="Ertele" />
            <ActionButton onClick={onNoShow} icon={UserX} label={noShowBusy ? '…' : 'Gelmedi'} danger disabled={noShowBusy} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineRow({
  appointment: a, past, onReschedule, onNoShow, noShowBusy,
}: {
  appointment: Appointment & { dt: Date };
  past: boolean;
  onReschedule: () => void;
  onNoShow: () => void;
  noShowBusy: boolean;
}) {
  const accent = serviceColor(a.service);

  return (
    <li className="px-5 sm:px-6 py-3 flex items-start gap-3 sm:gap-4" style={{ opacity: a.isNoShow ? 0.55 : 1 }}>
      {/* Durum göstergesi — renk TEK başına anlam taşımıyor, ikon da var */}
      <span className="flex-shrink-0 w-5 flex justify-center pt-2.5" aria-hidden>
        {a.isNoShow
          ? <UserX size={14} style={{ color: 'var(--rose)' }} />
          : past
            ? <Check size={14} style={{ color: 'var(--mint)' }} />
            : <Circle size={9} style={{ color: accent, fill: accent }} />}
      </span>

      <span
        className="tabular-nums text-sm flex-shrink-0 w-[3.2rem] pt-2.5"
        style={{ color: past ? 'var(--text-3)' : 'var(--text-1)', fontWeight: past ? 400 : 500 }}
      >
        {a.time}
      </span>

      {/* Mobilde isim tam genişlik alsın, aksiyonlar alt satıra insin */}
      <span className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
        <span className="min-w-0 sm:flex-1 pt-1.5 sm:pt-0">
          <span className="block truncate text-sm" style={{ color: 'var(--text-1)' }}>
            {a.customerName}
            {a.isNoShow && <span className="ml-2 text-[11px]" style={{ color: 'var(--rose)' }}>gelmedi</span>}
          </span>
          <span className="block truncate text-[12px]" style={{ color: 'var(--text-2)' }}>
            <span style={{ color: accent }}>{a.service}</span>
            {a.staffName && <span style={{ color: 'var(--text-3)' }}> · {a.staffName}</span>}
          </span>
        </span>

        <span className="flex items-center gap-1 flex-shrink-0 -ml-2 sm:ml-0">
          {a.customerPhone && (
            <IconAction href={`tel:${a.customerPhone}`} icon={Phone} label={`${a.customerName} adlı müşteriyi ara`} />
          )}
          <IconAction onClick={onReschedule} icon={CalendarClock} label={`${a.time} randevusunu ertele`} />
          {!past && !a.isNoShow && (
            <IconAction onClick={onNoShow} icon={UserX} label={`${a.time} randevusunu gelmedi işaretle`} disabled={noShowBusy} danger />
          )}
        </span>
      </span>
    </li>
  );
}

/* ── Ortak aksiyon düğmeleri (dokunma hedefi ≥44px) ────────── */

type IconType = typeof Phone;

function ActionButton({
  icon: Icon, label, onClick, href, danger, disabled,
}: {
  icon: IconType; label: string; onClick?: () => void; href?: string; danger?: boolean; disabled?: boolean;
}) {
  const color = danger ? 'var(--rose)' : 'var(--text-2)';
  const cls = 'inline-flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl text-[13px] transition-colors disabled:opacity-40';
  const style = {
    color,
    background: 'var(--bg-hover)',
    border: '1px solid var(--border)',
  } as const;

  if (href) {
    return (
      <a href={href} className={cls} style={style}>
        <Icon size={15} aria-hidden />
        {label}
      </a>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${cls} cursor-pointer`} style={style}>
      <Icon size={15} aria-hidden />
      {label}
    </button>
  );
}

function IconAction({
  icon: Icon, label, onClick, href, danger, disabled,
}: {
  icon: IconType; label: string; onClick?: () => void; href?: string; danger?: boolean; disabled?: boolean;
}) {
  const cls = 'inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors disabled:opacity-40';
  // --text-3 (obsidian'da %25 opaklık) ikon kontrastı için fazla soluktu;
  // --text-2 UI glifleri için 3:1 eşiğini karşılıyor.
  const style = { color: danger ? 'var(--rose)' : 'var(--text-2)' };

  if (href) {
    return (
      <a href={href} aria-label={label} title={label} className={cls} style={style}>
        <Icon size={16} aria-hidden />
      </a>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className={`${cls} cursor-pointer`} style={style}>
      <Icon size={16} aria-hidden />
    </button>
  );
}

function EmptyPanel({ title, detail }: { title: string; detail: string }) {
  return (
    <section
      className="grain-card rounded-2xl px-5 sm:px-6 py-8"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{title}</p>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--text-3)' }}>{detail}</p>
    </section>
  );
}

function TodaySkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      {[128, 320].map((h, i) => (
        <div
          key={i}
          className="rounded-2xl"
          style={{ height: h, background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: 0.6 }}
        />
      ))}
    </div>
  );
}
