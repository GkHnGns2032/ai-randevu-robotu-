import { Suspense } from 'react';
import { listAppointments } from '@/lib/airtable';
import { listStaff } from '@/lib/staff';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { AppointmentTable } from '@/components/dashboard/AppointmentTable';
import { AppointmentCalendar } from '@/components/dashboard/AppointmentCalendar';
import { NextAppointment } from '@/components/dashboard/NextAppointment';
import { TodaySummary } from '@/components/dashboard/TodaySummary';
import { InsightsPanel } from '@/components/dashboard/InsightsPanel';
import { VoiceSummary } from '@/components/dashboard/VoiceSummary';
import { CustomerList } from '@/components/dashboard/CustomerList';
import { StaffManager } from '@/components/dashboard/StaffManager';
import { ThemeProvider } from '@/components/dashboard/ThemeProvider';
import { PalettePicker } from '@/components/dashboard/PalettePicker';
import { ScrollToTop } from '@/components/dashboard/ScrollToTop';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { NewAppointmentButton } from '@/components/dashboard/NewAppointmentButton';
import { UserButton } from '@clerk/nextjs';
import { Scissors } from 'lucide-react';

export const dynamic = 'force-dynamic';

function Section({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
  return (
    <div
      className="grain-card relative rounded-2xl overflow-hidden anim-up"
      style={{
        animationDelay: `${delay}ms`,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--text-3)' }}>
          {title}
        </h2>
        <div className="h-px flex-1 mx-4" style={{ background: 'linear-gradient(90deg, var(--border), transparent)' }} />
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

async function DashboardContent() {
  const [appointments, staff] = await Promise.all([listAppointments(), listStaff()]);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 flex-wrap">
        <NextAppointment appointments={appointments} />
        <TodaySummary appointments={appointments} />
        <VoiceSummary appointments={appointments} />
      </div>

      <div className="anim-up" style={{ animationDelay: '100ms' }}>
        <StatsOverview appointments={appointments} />
      </div>

      <Section title="Akıllı Analiz" delay={200}>
        <InsightsPanel />
      </Section>

      <Section title="Haftalık Takvim" delay={300}>
        <AppointmentCalendar appointments={appointments} />
      </Section>

      <Section title="Müşteriler" delay={400}>
        <CustomerList appointments={appointments} />
      </Section>

      <Section title="Personel" delay={450}>
        <StaffManager initialStaff={staff} />
      </Section>

      <Section title="Tüm Randevular" delay={500}>
        <div className="-mx-6 -mb-6">
          <AppointmentTable appointments={appointments} />
        </div>
      </Section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ThemeProvider>
      <ScrollToTop />
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="orb-a absolute rounded-full blur-[120px]"
          style={{ width: 700, height: 700, background: 'var(--gold)', opacity: 'var(--orb-op)', top: '-15%', left: '-10%' }}
        />
        <div
          className="orb-b absolute rounded-full blur-[100px]"
          style={{ width: 500, height: 500, background: 'var(--rose)', opacity: 'var(--orb-op)', bottom: '5%', right: '-8%' }}
        />
        <div
          className="orb-a absolute rounded-full blur-[140px]"
          style={{ width: 400, height: 400, background: 'var(--sky)', opacity: 'var(--orb-op)', bottom: '40%', left: '50%', animationDelay: '-6s' }}
        />
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative w-11 h-11 flex items-center justify-center">
              <div className="spin-slow absolute inset-0 rounded-full" style={{ border: '1px solid var(--border-gold)', opacity: 0.6 }} />
              <div className="spin-rev absolute rounded-full" style={{ inset: 3, border: '1px dashed var(--border-gold)', opacity: 0.35 }} />
              <div className="spin-med absolute rounded-full" style={{ inset: 7, border: '1px solid var(--border-gold)', opacity: 0.2 }} />
              <div
                className="relative w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--gold), color-mix(in srgb, var(--gold) 60%, #000))' }}
              >
                <Scissors size={12} className="text-white" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <p className="font-light tracking-[0.06em]" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: 'var(--text-1)' }}>
                Bella Güzellik
              </p>
              <p className="text-[9px] tracking-[0.22em] uppercase" style={{ color: 'var(--text-3)' }}>
                Admin Panel
              </p>
            </div>
          </div>

          {/* Center: live clock */}
          <div className="flex-1 flex justify-center">
            <LiveClock />
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Live badge */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
            >
              <div className="relative w-1.5 h-1.5">
                <div className="absolute inset-0 rounded-full" style={{ background: 'var(--mint)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                <div className="absolute inset-0 rounded-full" style={{ background: 'var(--mint)', animation: 'ping-ring 2s ease-out infinite' }} />
              </div>
              <span className="text-[9px] font-medium tracking-[0.18em] uppercase" style={{ color: 'var(--text-3)' }}>Canlı</span>
            </div>

            <PalettePicker />

            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-9 h-9 ring-1 ring-offset-2',
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Page heading */}
        <div className="mb-8 anim-up flex items-center justify-between gap-4">
          <div>
            <h1
              className="font-light leading-tight"
              style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2rem, 4vw, 3rem)' }}
            >
              <span className="gold-shimmer">Randevu Yönetimi</span>
            </h1>
            <p className="text-xs tracking-wider mt-1" style={{ color: 'var(--text-3)' }}>
              Bella Güzellik Salonu · Genel Bakış
            </p>
          </div>
          <NewAppointmentButton />
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="relative w-14 h-14">
                <div className="spin-slow absolute inset-0 rounded-full" style={{ border: '1px solid var(--border-gold)' }} />
                <div className="spin-rev absolute rounded-full" style={{ inset: 4, border: '1px dashed var(--border-gold)', opacity: 0.5 }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </main>
    </ThemeProvider>
  );
}
