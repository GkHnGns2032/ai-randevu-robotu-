const SHIMMER_BG = `linear-gradient(
  90deg,
  color-mix(in srgb, var(--border) 40%, transparent) 0%,
  color-mix(in srgb, var(--border) 70%, transparent) 50%,
  color-mix(in srgb, var(--border) 40%, transparent) 100%
)`;

function Bar({ w, h = 12, className = '' }: { w: string | number; h?: number; className?: string }) {
  return (
    <div
      className={`rounded-md ${className}`}
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: h,
        background: SHIMMER_BG,
        backgroundSize: '300% 100%',
        animation: 'shimmer 2.2s ease-in-out infinite',
      }}
    />
  );
}

function Card({ children, minHeight, delay = 0 }: { children?: React.ReactNode; minHeight: number; delay?: number }) {
  return (
    <div
      className="grain-card relative rounded-2xl overflow-hidden anim-up"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        minHeight,
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function SectionCard({ title, delay, minBody }: { title: string; delay: number; minBody: number }) {
  return (
    <Card minHeight={minBody + 60} delay={delay}>
      <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--text-3)' }}>
          {title}
        </span>
        <div className="h-px flex-1 mx-4" style={{ background: 'linear-gradient(90deg, var(--border), transparent)' }} />
      </div>
      <div className="p-6 space-y-3">
        <Bar w="85%" h={14} />
        <Bar w="70%" h={14} />
        <Bar w="55%" h={14} />
      </div>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top row: NextAppointment + TodaySummary + VoiceSummary */}
      <div className="flex items-start gap-4 flex-wrap">
        <Card minHeight={120} delay={0}>
          <div className="p-6 space-y-3">
            <Bar w={80} h={10} />
            <Bar w="60%" h={28} />
            <Bar w="40%" h={12} />
          </div>
        </Card>
        <Card minHeight={120} delay={50}>
          <div className="p-6 space-y-3">
            <Bar w={80} h={10} />
            <div className="flex gap-6 pt-2">
              <Bar w={60} h={32} />
              <Bar w={60} h={32} />
              <Bar w={60} h={32} />
            </div>
          </div>
        </Card>
      </div>

      {/* StatsOverview hero */}
      <Card minHeight={680} delay={100}>
        <div className="flex flex-col items-center justify-center py-16 gap-5">
          <Bar w={160} h={10} />
          <Bar w={260} h={64} />
          <Bar w={180} h={24} />
          <div className="flex gap-10 pt-4">
            <div className="flex flex-col items-center gap-2">
              <Bar w={70} h={10} />
              <Bar w={110} h={30} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Bar w={70} h={10} />
              <Bar w={110} h={30} />
            </div>
          </div>
        </div>
      </Card>

      <SectionCard title="Akıllı Analiz" delay={200} minBody={120} />
      <SectionCard title="Haftalık Takvim" delay={300} minBody={260} />
      <SectionCard title="Müşteriler" delay={400} minBody={180} />
      <SectionCard title="Personel" delay={450} minBody={100} />
      <SectionCard title="Tüm Randevular" delay={500} minBody={240} />
    </div>
  );
}
