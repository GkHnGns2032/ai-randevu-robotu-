'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const [hh, mm, ss] = format(now, 'HH:mm:ss').split(':');

  return (
    <div className="flex flex-col items-center select-none">
      {/* Main time display */}
      <div className="flex items-baseline gap-0.5" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 500, color: 'var(--text-1)', letterSpacing: '0.04em', lineHeight: 1 }}>
          {hh}
        </span>
        <span style={{ fontSize: '1.6rem', fontWeight: 300, color: 'var(--gold)', lineHeight: 1, animation: 'pulse-dot 1s ease-in-out infinite' }}>
          :
        </span>
        <span style={{ fontSize: '1.6rem', fontWeight: 500, color: 'var(--text-1)', letterSpacing: '0.04em', lineHeight: 1 }}>
          {mm}
        </span>
        <span style={{ fontSize: '1rem', fontWeight: 300, color: 'var(--text-3)', marginLeft: 3, lineHeight: 1, alignSelf: 'flex-end', marginBottom: 2 }}>
          :{ss}
        </span>
      </div>
      {/* Date */}
      <p
        className="text-[10px] tracking-[0.18em] uppercase mt-0.5"
        style={{ color: 'var(--text-3)' }}
      >
        {format(now, 'EEEE, d MMM', { locale: tr })}
      </p>
    </div>
  );
}
