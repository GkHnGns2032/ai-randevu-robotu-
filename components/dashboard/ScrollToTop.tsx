'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 320);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Başa dön"
      className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? `translateY(0) scale(${hovered ? 1.1 : 1})`
          : 'translateY(16px) scale(0.85)',
        pointerEvents: visible ? 'auto' : 'none',
        background: 'var(--gold-bg)',
        border: '1px solid var(--border-gold)',
        color: 'var(--gold)',
        boxShadow: hovered
          ? `0 0 30px var(--gold-bg), 0 8px 24px rgba(0,0,0,0.3)`
          : `0 4px 16px rgba(0,0,0,0.2)`,
      }}
    >
      {/* Spinning ring */}
      <div
        className="absolute inset-0 rounded-full spin-slow"
        style={{ border: '1px dashed var(--border-gold)', opacity: hovered ? 0.8 : 0.3 }}
      />
      <ArrowUp size={18} strokeWidth={2} />
    </button>
  );
}
