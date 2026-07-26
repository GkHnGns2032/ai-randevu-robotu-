'use client';

// Panelin görünüm kabuğu.
// Önceden panel 8 bölümlük tek bir scroll'du ve sırası sunum sırasıydı
// (gelir → AI analiz → ısı haritası → takvim). Günlük iş "bugün ne var"
// olduğu için o bilgiye ulaşmak üç analitik bölümü geçmeyi gerektiriyordu.
// Artık iş türüne göre beş görünüm var ve aktif görünüm URL'de tutuluyor
// (?g=takvim) — link paylaşılabilir, tarayıcı geri tuşu çalışır, veri
// tek seferde çekilir (route bölmeye göre daha ucuz).

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Appointment } from '@/lib/types';
import type { Staff } from '@/lib/staff';
import { CalendarCheck, CalendarRange, Users, Scissors, ChartNoAxesColumn } from 'lucide-react';

import { TodayView } from './views/TodayView';
import { AppointmentCalendar } from './AppointmentCalendar';
import { AppointmentTable } from './AppointmentTable';
import { CustomerList } from './CustomerList';
import { StaffManager } from './StaffManager';
import { StatsOverview } from './StatsOverview';
import { RevenueChart } from './RevenueChart';
import { AppointmentHeatmap } from './AppointmentHeatmap';
import { InsightsPanel } from './InsightsPanel';
import { VoiceSummary } from './VoiceSummary';

const VIEWS = [
  { id: 'bugun',      label: 'Bugün',      icon: CalendarCheck },
  { id: 'takvim',     label: 'Takvim',     icon: CalendarRange },
  { id: 'musteriler', label: 'Müşteriler', icon: Users },
  { id: 'ekip',       label: 'Ekip',       icon: Scissors },
  { id: 'analiz',     label: 'Analiz',     icon: ChartNoAxesColumn },
] as const;

type ViewId = (typeof VIEWS)[number]['id'];
const DEFAULT_VIEW: ViewId = 'bugun';

function isViewId(v: string | null): v is ViewId {
  return !!v && VIEWS.some((x) => x.id === v);
}

interface Props {
  appointments: Appointment[];
  staff: Staff[];
}

export function DashboardShell({ appointments, staff }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const raw = params.get('g');
  const active: ViewId = isViewId(raw) ? raw : DEFAULT_VIEW;

  const go = useCallback(
    (id: ViewId) => {
      const q = id === DEFAULT_VIEW ? '' : `?g=${id}`;
      router.replace(`${pathname}${q}`, { scroll: false });
    },
    [router, pathname],
  );

  return (
    <>
      {/* Mobilde 5'li ızgara (ikon üstte, etiket altta) — yatay kaydırma
          gerektirmez, hiçbir görünüm ekran dışında kalmaz. sm+ genişlikte
          klasik yatay sekme şeridi. */}
      <nav aria-label="Panel görünümleri" className="mb-6">
        <ul className="grid grid-cols-5 gap-1 sm:flex sm:items-center">
          {VIEWS.map(({ id, label, icon: Icon }) => {
            const on = id === active;
            return (
              <li key={id} className="sm:flex-none">
                <button
                  onClick={() => go(id)}
                  aria-current={on ? 'page' : undefined}
                  className="w-full flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1 sm:px-3.5 py-2 sm:py-0 min-h-[52px] sm:min-h-[44px] rounded-xl transition-colors cursor-pointer"
                  style={{
                    color: on ? 'var(--text-1)' : 'var(--text-3)',
                    background: on ? 'var(--bg-hover)' : 'transparent',
                    border: `1px solid ${on ? 'var(--border-gold)' : 'transparent'}`,
                    fontWeight: on ? 500 : 400,
                  }}
                >
                  <Icon size={16} aria-hidden className="flex-shrink-0" />
                  <span className="text-[10px] sm:text-[13px] leading-none whitespace-nowrap">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div key={active} className="anim-in">
        {active === 'bugun' && <TodayView appointments={appointments} />}

        {active === 'takvim' && (
          <div className="space-y-6">
            <Panel title="Haftalık Takvim">
              <AppointmentCalendar appointments={appointments} />
            </Panel>
            <Panel title="Tüm Randevular" flush>
              <AppointmentTable appointments={appointments} />
            </Panel>
          </div>
        )}

        {active === 'musteriler' && (
          <Panel title="Müşteriler" flush>
            <CustomerList appointments={appointments} />
          </Panel>
        )}

        {active === 'ekip' && (
          <Panel title="Personel">
            <StaffManager initialStaff={staff} />
          </Panel>
        )}

        {active === 'analiz' && (
          <div className="space-y-6">
            <StatsOverview appointments={appointments} />
            <div className="flex items-start gap-4 flex-wrap">
              <VoiceSummary appointments={appointments} />
            </div>
            <Panel title="Gelir Trendi">
              <RevenueChart appointments={appointments} />
            </Panel>
            <Panel title="Akıllı Analiz">
              <InsightsPanel />
            </Panel>
            <Panel title="Randevu Yoğunluğu">
              <AppointmentHeatmap appointments={appointments} />
            </Panel>
          </div>
        )}
      </div>
    </>
  );
}

/** Bölüm kabuğu — eski Section ile aynı görünüm, mono başlık token'a bağlı. */
function Panel({ title, children, flush }: { title: string; children: React.ReactNode; flush?: boolean }) {
  return (
    <section
      className="grain-card relative rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div
        className="px-5 sm:px-6 pt-5 pb-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h2
          className="text-[11px] font-semibold tracking-[0.22em] uppercase"
          style={{ color: 'color-mix(in srgb, var(--amber) 80%, var(--gold))', fontFamily: 'var(--c-font-mono)' }}
        >
          {title}
        </h2>
        <div
          className="h-px flex-1 mx-4"
          style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--amber) 35%, transparent), transparent)' }}
        />
      </div>
      <div className={flush ? '' : 'p-5 sm:p-6'}>{children}</div>
    </section>
  );
}
