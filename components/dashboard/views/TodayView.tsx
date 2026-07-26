'use client';

// Bugün görünümü — panelin varsayılan ekranı, "yoğunluk" yönü.
//
// İki panel: solda günün akışı, sağda karar rayı (sıradaki, gün özeti,
// personel doluluk, dikkat gerektirenler). Amaç 1440px'te boş kalan alanı
// bitirip tek ekranda daha çok karar verdirmek.
//
// Mobilde sıra TERS: ray üstte, akış altta — özet detaydan önce gelir.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Appointment, WORKING_HOURS } from '@/lib/types';
import { SERVICE_PRICES } from '@/lib/pricing';
import { serviceColor } from '@/lib/service-color';
import { AppointmentForm } from '../AppointmentForm';
import { Phone, CalendarClock, UserX, AlertTriangle, Check } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Props { appointments: Appointment[] }

type Dated = Appointment & { dt: Date };

function istanbulToday(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

export function TodayView({ appointments }: Props) {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayStr = now ? istanbulToday(now) : '';

  const today = useMemo<Dated[]>(() => {
    if (!now) return [];
    return appointments
      .filter((a) => a.date === todayStr && a.status !== 'cancelled' && a.time)
      .map((a) => ({ ...a, dt: new Date(`${a.date}T${a.time}:00`) }))
      .sort((a, b) => a.dt.getTime() - b.dt.getTime());
  }, [appointments, todayStr, now]);

  const next = useMemo<Dated | undefined>(() => {
    if (!now) return undefined;
    return appointments
      // Gelmedi işaretli randevu "sıradaki" olamaz — status confirmed kalıyor.
      .filter((a) => a.date && a.time && a.status === 'confirmed' && !a.isNoShow)
      .map((a) => ({ ...a, dt: new Date(`${a.date}T${a.time}:00`) }))
      .filter((a) => a.dt > now)
      .sort((a, b) => a.dt.getTime() - b.dt.getTime())[0];
  }, [appointments, now]);

  // Sunucu/istemci saat farkı hydration uyumsuzluğu yaratmasın — zamana
  // bağlı içerik yalnız mount sonrası çizilir.
  if (!now) return <TodaySkeleton />;

  async function markNoShow(id: string) {
    setPending(id);
    try {
      await fetch(`/api/appointments/${id}/no-show`, { method: 'POST' });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  const revenue = today.reduce((s, a) => s + (SERVICE_PRICES[a.service] ?? 0), 0);
  const done = today.filter((a) => a.dt <= now).length;
  const noShows = today.filter((a) => a.isNoShow);
  const unpaid = today.filter((a) => a.paymentStatus === 'unpaid' && a.dt <= now && !a.isNoShow);
  const unpaidTotal = unpaid.reduce((s, a) => s + (SERVICE_PRICES[a.service] ?? 0), 0);

  const staffLoad = [...new Set(today.map((a) => a.staffName ?? 'Atanmamış'))]
    .map((name) => {
      const list = today.filter((a) => (a.staffName ?? 'Atanmamış') === name);
      const booked = list.reduce((s, a) => s + a.durationMinutes, 0);
      const capacity = (WORKING_HOURS.end - WORKING_HOURS.start) * 60;
      return { name, count: list.length, pct: Math.min(100, Math.round((booked / capacity) * 100)) };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)] lg:items-start">
        {/* ── Karar rayı — mobilde ÜSTTE (özet detaydan önce gelir) ── */}
        <aside className="order-first lg:order-last flex flex-col gap-5">
          {next && (
            <Rail title="Sıradaki">
              <NextSummary appointment={next} now={now} isToday={next.date === todayStr} />
              <div className="flex gap-2 flex-wrap mt-3.5">
                {next.customerPhone && (
                  <Pill href={`tel:${next.customerPhone}`} icon={Phone} label="Ara" />
                )}
                <Pill onClick={() => setEditing(next)} icon={CalendarClock} label="Ertele" />
                <Pill
                  onClick={() => markNoShow(next.id)} icon={UserX}
                  label={pending === next.id ? '…' : 'Gelmedi'} danger disabled={pending === next.id}
                />
              </div>
            </Rail>
          )}

          <Rail title="Bugün" meta={format(now, 'd MMMM EEEE', { locale: tr })}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <Stat label="Randevu" value={String(today.length)} />
              <Stat label="Kazanç" value={`₺${revenue.toLocaleString('tr-TR')}`} accent />
              <Stat label="Tamamlanan" value={String(done)} />
              <Stat label="Kalan" value={String(Math.max(0, today.length - done))} />
            </div>
          </Rail>

          {staffLoad.length > 0 && (
            <Rail title="Personel Doluluk">
              <div className="flex flex-col gap-3">
                {staffLoad.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-baseline justify-between text-[12px] mb-1.5">
                      <span style={{ color: 'var(--text-1)' }}>{s.name}</span>
                      <span className="tabular-nums" style={{ color: 'var(--text-2)' }}>
                        %{s.pct} · {s.count} randevu
                      </span>
                    </div>
                    <div
                      role="meter" aria-valuenow={s.pct} aria-valuemin={0} aria-valuemax={100}
                      aria-label={`${s.name} doluluk oranı`}
                      style={{ height: 6, borderRadius: 3, background: 'var(--bg-hover)', overflow: 'hidden' }}
                    >
                      <div style={{ width: `${s.pct}%`, height: '100%', background: 'var(--gold)', opacity: 0.85 }} />
                    </div>
                  </div>
                ))}
              </div>
            </Rail>
          )}

          <Rail title="Dikkat">
            {/* Her kalemi tek tek listeleyen uyarı paneli her zaman dolu olur
                ve okunmaz hale gelir — sayıya indir, detayı yanında ver. */}
            <div className="flex flex-col gap-2.5">
              {noShows.length === 0 && unpaid.length === 0 ? (
                <p className="text-[12.5px] flex items-center gap-2 m-0" style={{ color: 'var(--mint)' }}>
                  <Check size={14} aria-hidden /> Bekleyen bir şey yok
                </p>
              ) : (
                <>
                  {noShows.length > 0 && (
                    <p className="text-[12.5px] flex items-start gap-2.5 m-0" style={{ color: 'var(--text-1)' }}>
                      <UserX size={15} style={{ color: 'var(--rose)', flexShrink: 0, marginTop: 2 }} aria-hidden />
                      <span>
                        <strong className="tabular-nums">{noShows.length}</strong> randevuya gelinmedi
                        <span style={{ color: 'var(--text-3)' }}> · {noShows.map((a) => a.time).join(', ')}</span>
                      </span>
                    </p>
                  )}
                  {unpaid.length > 0 && (
                    <p className="text-[12.5px] flex items-start gap-2.5 m-0" style={{ color: 'var(--text-1)' }}>
                      <AlertTriangle size={15} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} aria-hidden />
                      <span>
                        <strong className="tabular-nums">{unpaid.length}</strong> ödeme bekliyor
                        <span className="tabular-nums" style={{ color: 'var(--gold)' }}>
                          {' · ₺'}{unpaidTotal.toLocaleString('tr-TR')}
                        </span>
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
          </Rail>
        </aside>

        {/* ── Günün akışı ─────────────────────────────────── */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <header
            className="px-4 sm:px-5 py-3.5 flex items-baseline justify-between gap-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>Gün Akışı</h2>
            {today.length > 0 && (
              <span className="text-[11.5px] tabular-nums" style={{ color: 'var(--text-2)' }}>
                {done}/{today.length} tamamlandı
              </span>
            )}
          </header>

          {today.length === 0 ? (
            <p className="px-4 sm:px-5 py-10 text-sm" style={{ color: 'var(--text-3)' }}>
              Bugün randevu yok — iyi dinlenceler.
            </p>
          ) : (
            <ol>
              {today.map((a, i) => (
                <FlowRow
                  key={a.id}
                  appointment={a}
                  first={i === 0}
                  past={a.dt <= now}
                  isNext={next?.id === a.id}
                  busy={pending === a.id}
                  onReschedule={() => setEditing(a)}
                  onNoShow={() => markNoShow(a.id)}
                />
              ))}
            </ol>
          )}
        </section>
      </div>

      {editing && (
        <AppointmentForm
          appointment={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }}
        />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════ */

function FlowRow({
  appointment: a, first, past, isNext, busy, onReschedule, onNoShow,
}: {
  appointment: Dated; first: boolean; past: boolean; isNext: boolean; busy: boolean;
  onReschedule: () => void; onNoShow: () => void;
}) {
  const c = serviceColor(a.service);
  const price = SERVICE_PRICES[a.service] ?? 0;

  return (
    <li
      className="px-4 sm:px-5 py-2.5 flex items-center gap-2.5 sm:gap-3"
      style={{
        borderTop: first ? 'none' : '1px solid var(--border)',
        opacity: a.isNoShow ? 0.5 : 1,
        background: isNext ? 'var(--bg-hover)' : 'transparent',
      }}
    >
      <span
        style={{ width: 3, height: 32, borderRadius: 2, background: c, flexShrink: 0, opacity: past ? 0.45 : 1 }}
        aria-hidden
      />

      <span
        className="tabular-nums text-[13px] flex-shrink-0 w-[2.9rem]"
        style={{ color: past ? 'var(--text-3)' : 'var(--text-1)', fontWeight: past ? 400 : 600 }}
      >
        {a.time}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13px]" style={{ color: 'var(--text-1)' }}>{a.customerName}</span>
          {/* Rozet dar ekranda gizli: isim için yer bırakmıyor ve bilgi zaten
              mobilde ekranın tepesindeki "Sıradaki" kartında duruyor. */}
          {isNext && (
            <span
              className="hidden sm:inline-block text-[9px] tracking-[0.12em] uppercase px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ color: 'var(--gold)', border: '1px solid var(--border-gold)' }}
            >
              Sıradaki
            </span>
          )}
          {a.isNoShow && (
            <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--rose)' }}>gelmedi</span>
          )}
        </span>
        <span className="block truncate text-[11.5px]" style={{ color: 'var(--text-2)' }}>
          <span style={{ color: c }}>{a.service}</span>
          {a.staffName && <span style={{ color: 'var(--text-3)' }}> · {a.staffName}</span>}
        </span>
      </span>

      {/* Süre ve tutar dar ekranda gizlenir — isim ve aksiyon önce gelir */}
      <span
        className="hidden sm:block tabular-nums text-[11.5px] flex-shrink-0 w-[3rem] text-right"
        style={{ color: 'var(--text-3)' }}
      >
        {a.durationMinutes} dk
      </span>
      <span
        className="hidden md:block tabular-nums text-[12px] flex-shrink-0 w-[4.2rem] text-right"
        style={{ color: 'var(--gold)' }}
      >
        ₺{price.toLocaleString('tr-TR')}
      </span>

      <span className="flex items-center gap-0.5 flex-shrink-0">
        {a.customerPhone && (
          <IconAction href={`tel:${a.customerPhone}`} icon={Phone} label={`${a.customerName} adlı müşteriyi ara`} />
        )}
        <IconAction onClick={onReschedule} icon={CalendarClock} label={`${a.time} randevusunu ertele`} />
        {!past && !a.isNoShow && (
          <IconAction
            onClick={onNoShow} icon={UserX}
            label={`${a.time} randevusunu gelmedi işaretle`} disabled={busy} danger
          />
        )}
      </span>
    </li>
  );
}

function NextSummary({ appointment: a, now, isToday }: { appointment: Dated; now: Date; isToday: boolean }) {
  const mins = Math.max(0, Math.round((a.dt.getTime() - now.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const countdown = h > 0 ? `${h} sa ${mins % 60} dk` : `${mins} dk`;
  const c = serviceColor(a.service);

  return (
    <div>
      <div className="flex items-baseline gap-2.5 flex-wrap">
        <span
          className="tabular-nums leading-none"
          style={{ fontFamily: 'var(--c-font-serif)', fontWeight: 300, fontSize: '2rem', color: 'var(--text-1)' }}
        >
          {a.time}
        </span>
        <span className="text-[12px]" style={{ color: 'var(--text-2)' }}>
          {isToday ? `${countdown} sonra` : format(a.dt, 'd MMMM', { locale: tr })}
        </span>
      </div>
      <p className="mt-2 mb-0 text-[13.5px] font-medium truncate" style={{ color: 'var(--text-1)' }}>
        {a.customerName}
      </p>
      <p className="m-0 text-[12px] truncate" style={{ color: 'var(--text-2)' }}>
        <span style={{ color: c }}>{a.service}</span>
        {a.staffName && <span style={{ color: 'var(--text-3)' }}> · {a.staffName}</span>}
      </p>
    </div>
  );
}

/* ── Ortak parçalar ───────────────────────────────────────── */

function Rail({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      <header
        className="px-4 py-3 flex items-baseline justify-between gap-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h3 className="text-[12.5px] font-semibold" style={{ color: 'var(--text-1)' }}>{title}</h3>
        {meta && <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{meta}</span>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p
        className="tabular-nums leading-none m-0"
        style={{
          fontFamily: 'var(--c-font-serif)', fontWeight: 300, fontSize: '1.45rem',
          color: accent ? 'var(--gold)' : 'var(--text-1)',
        }}
      >
        {value}
      </p>
      <p className="text-[11px] mt-1.5 mb-0" style={{ color: 'var(--text-3)' }}>{label}</p>
    </div>
  );
}

type IconType = typeof Phone;

function Pill({
  icon: Icon, label, onClick, href, danger, disabled,
}: { icon: IconType; label: string; onClick?: () => void; href?: string; danger?: boolean; disabled?: boolean }) {
  const cls = 'inline-flex items-center gap-2 px-3 min-h-[44px] rounded-xl text-[12.5px] transition-colors disabled:opacity-40';
  const style = {
    color: danger ? 'var(--rose)' : 'var(--text-1)',
    background: 'var(--bg-hover)',
    border: '1px solid var(--border)',
  } as const;

  if (href) {
    return <a href={href} className={cls} style={style}><Icon size={14} aria-hidden />{label}</a>;
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${cls} cursor-pointer`} style={style}>
      <Icon size={14} aria-hidden />{label}
    </button>
  );
}

function IconAction({
  icon: Icon, label, onClick, href, danger, disabled,
}: { icon: IconType; label: string; onClick?: () => void; href?: string; danger?: boolean; disabled?: boolean }) {
  const cls = 'inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors disabled:opacity-40';
  const style = { color: danger ? 'var(--rose)' : 'var(--text-2)' };

  if (href) {
    return <a href={href} aria-label={label} title={label} className={cls} style={style}><Icon size={15} aria-hidden /></a>;
  }
  return (
    <button
      onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className={`${cls} cursor-pointer`} style={style}
    >
      <Icon size={15} aria-hidden />
    </button>
  );
}

function TodaySkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]" aria-hidden>
      <div
        className="rounded-2xl order-last lg:order-first"
        style={{ height: 420, background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: 0.6 }}
      />
      <div className="flex flex-col gap-5 order-first lg:order-last">
        {[150, 130, 120].map((h, i) => (
          <div
            key={i}
            className="rounded-2xl"
            style={{ height: h, background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: 0.6 }}
          />
        ))}
      </div>
    </div>
  );
}
