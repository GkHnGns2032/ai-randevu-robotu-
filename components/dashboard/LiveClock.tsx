'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className="flex flex-col items-center select-none" style={{ height: 60 }} />;
  }

  const [hh, mm, ss] = format(now, 'HH:mm:ss').split(':');

  const goldGlow = { textShadow: '0 0 12px color-mix(in srgb, var(--gold) 25%, transparent)' };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Main time display */}
      <div className="flex items-baseline gap-0.5" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
        <span style={{ fontSize: '2.4rem', fontWeight: 500, color: 'var(--gold)', letterSpacing: '0.04em', lineHeight: 1, ...goldGlow }}>
          {hh}
        </span>
        <span style={{ fontSize: '2.4rem', fontWeight: 300, color: 'var(--gold)', lineHeight: 1, animation: 'pulse-dot 1s ease-in-out infinite' }}>
          :
        </span>
        <span style={{ fontSize: '2.4rem', fontWeight: 500, color: 'var(--gold)', letterSpacing: '0.04em', lineHeight: 1, ...goldGlow }}>
          {mm}
        </span>
        <span style={{ fontSize: '1.1rem', fontWeight: 300, color: 'var(--text-3)', marginLeft: 3, lineHeight: 1, alignSelf: 'flex-end', marginBottom: 3 }}>
          :{ss}
        </span>
      </div>
      {/* Date */}
      <p
        className="text-[11px] tracking-[0.22em] uppercase mt-0.5"
        style={{ color: 'color-mix(in srgb, var(--gold) 25%, var(--text-1))' }}
      >
        {format(now, 'EEEE, d MMMM yyyy', { locale: tr })}
      </p>
    </div>
  );
}
