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


/**
 * Yükleme iskeleti — açılış görünümünün ("Bugün") şeklini taklit eder.
 * Önceden eski tek-scroll düzenini çiziyordu (StatsOverview hero + 5 bölüm);
 * yeni yapı yüklendiğinde belirgin bir layout kayması oluyordu.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Görünüm sekmeleri */}
      <div className="grid grid-cols-5 gap-1 sm:flex sm:gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl sm:w-28"
            style={{ height: 52, background: 'var(--bg-card)', opacity: 0.5 }}
          />
        ))}
      </div>

      {/* Sıradaki randevu kartı */}
      <Card minHeight={150} delay={0}>
        <div className="p-5 sm:p-6 space-y-3">
          <Bar w={80} h={10} />
          <Bar w="45%" h={34} />
          <Bar w="60%" h={14} />
          <Bar w="40%" h={12} />
        </div>
      </Card>

      {/* Bugünün zaman çizelgesi */}
      <Card minHeight={340} delay={100}>
        <div className="p-5 sm:p-6 space-y-4">
          <Bar w={140} h={12} />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 pt-1">
              <Bar w={48} h={14} />
              <div className="flex-1 space-y-1.5">
                <Bar w="45%" h={13} />
                <Bar w="30%" h={11} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
