import { Suspense } from 'react';
import { listAppointments } from '@/lib/airtable';
import { listStaff } from '@/lib/staff';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { ThemeProvider } from '@/components/dashboard/ThemeProvider';
import { PalettePicker } from '@/components/dashboard/PalettePicker';
import { ScrollToTop } from '@/components/dashboard/ScrollToTop';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { NewAppointmentButton } from '@/components/dashboard/NewAppointmentButton';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { CLIENT_CONFIG } from '@/config/client';
import { UserButton } from '@clerk/nextjs';
import { Scissors } from 'lucide-react';

export const dynamic = 'force-dynamic';

// DEMO KİPİ (?demo=1) — saha görüşmelerinde panelin ne anlattığını göstermek için.
// Airtable'a HİÇ dokunmaz: ne okur ne yazar, veri tamamen yereldir. Canlı tabanda
// 6 test müşterisi / ₺2.050 var ve o veriyle panel doğru çalışsa da hiçbir şey
// anlatmıyor. Kip açıkken ekranda kalıcı bir rozet durur — örnek veri olduğunu
// gizlemek, ilk yalandır ve geri dönüşü yoktur.
async function DashboardContent({ demo }: { demo: boolean }) {
  if (demo) {
    const { buildDemoAppointments, DEMO_STAFF } = await import('@/lib/demo-data');
    return <DashboardShell appointments={buildDemoAppointments()} staff={DEMO_STAFF} demo />;
  }
  const [appointments, staff] = await Promise.all([listAppointments(), listStaff()]);
  return <DashboardShell appointments={appointments} staff={staff} />;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const demo = (await searchParams).demo === '1';
  return (
    <ThemeProvider>
      <ScrollToTop />

      {/* Ambient orb'lar — dekoratif. Operasyon ekranında yoğunluğu
          bozmasın diye mobilde kapalı (ayrıca blur maliyeti yüksek). */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden md:block" aria-hidden>
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

      <header
        className="sticky top-0 z-50"
        style={{
          background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
              <div className="spin-slow absolute inset-0 rounded-full" style={{ border: '1px solid var(--border-gold)', opacity: 0.6 }} />
              <div className="spin-rev absolute rounded-full" style={{ inset: 3, border: '1px dashed var(--border-gold)', opacity: 0.35 }} />
              <div
                className="relative w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--gold), color-mix(in srgb, var(--gold) 60%, #000))' }}
              >
                <Scissors size={12} className="text-white" strokeWidth={1.5} aria-hidden />
              </div>
            </div>
            <div className="min-w-0">
              <p
                className="font-light tracking-[0.06em] truncate"
                style={{ fontFamily: 'var(--c-font-serif)', fontSize: '0.95rem', color: 'var(--text-1)' }}
              >
                {CLIENT_CONFIG.businessName}
              </p>
              <p className="text-[9px] tracking-[0.22em] uppercase" style={{ color: 'var(--text-3)' }}>
                Yönetim Paneli
              </p>
            </div>
          </div>

          {/* Saat yalnız geniş ekranda — dar ekranda logo ve kontrolleri sıkıştırıyordu */}
          <div className="hidden lg:flex flex-1 justify-center">
            <LiveClock />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <PalettePicker />
            <UserButton appearance={{ elements: { avatarBox: 'w-9 h-9 ring-1 ring-offset-2' } }} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h1
            className="font-light leading-tight"
            style={{ fontFamily: 'var(--c-font-serif)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}
          >
            <span className="gold-shimmer">Randevu Yönetimi</span>
          </h1>
          <NewAppointmentButton />
        </div>

        {demo && (
          <div
            className="mb-5 px-4 py-2.5 rounded-xl text-[11px] tracking-wide"
            style={{
              background: 'color-mix(in srgb, var(--amber) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--amber) 40%, transparent)',
              color: 'var(--amber)',
            }}
          >
            <b>ÖRNEK VERİ</b> — bu ekrandaki müşteriler ve randevular gerçek değildir,
            sistemin ne gösterdiğini anlatmak için hazırlanmıştır.
          </div>
        )}

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent demo={demo} />
        </Suspense>
      </main>
    </ThemeProvider>
  );
}
