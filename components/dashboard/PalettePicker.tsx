'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme, ThemeName } from './ThemeProvider';
import { Check, Palette } from 'lucide-react';

const PALETTES: { id: ThemeName; label: string; swatch: string; bg: string }[] = [
  { id: 'obsidian',  label: 'Obsidyen Altın',   swatch: '#D4AF6E', bg: '#09090C' },
  { id: 'ivory',     label: 'Fildişi Atölye',   swatch: '#8B5A14', bg: '#F3EDE3' },
  { id: 'rose',      label: 'Gece Gülü',        swatch: '#F07090', bg: '#0D0809' },
  { id: 'ocean',     label: 'Derin Okyanus',    swatch: '#5AAAE6', bg: '#070A10' },
  { id: 'emerald',   label: 'Zümrüt Orman',     swatch: '#3CC39B', bg: '#060A08' },
  { id: 'amethyst',  label: 'Ametist',          swatch: '#9B6EEB', bg: '#0A0810' },
  { id: 'beige',     label: 'Kahve Bej',        swatch: '#966014', bg: '#EDE5D5' },
  { id: 'midnight',  label: 'Gece Mavisi',      swatch: '#124EA5', bg: '#EEF1F8' },
];

export function PalettePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = PALETTES.find((p) => p.id === theme)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        document.documentElement.setAttribute('data-theme', theme);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [theme]);

  function previewTheme(id: ThemeName) {
    document.documentElement.setAttribute('data-theme', id);
  }
  function restoreTheme() {
    document.documentElement.setAttribute('data-theme', theme);
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Renk paleti seç"
        className="flex items-center gap-2 px-3 h-10 rounded-xl transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'var(--bg-hover)',
          border: '1px solid var(--border)',
        }}
      >
        <Palette size={13} style={{ color: 'var(--text-3)' }} />
        <span className="text-[10px] font-semibold tracking-[0.18em] uppercase hidden sm:inline" style={{ color: 'var(--text-3)' }}>
          Tema
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <div
          className="w-3.5 h-3.5 rounded-full"
          style={{
            background: current.swatch,
            boxShadow: `0 0 10px ${current.swatch}90, inset 0 0 0 1px rgba(255,255,255,0.2)`,
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-12 w-64 rounded-2xl overflow-hidden z-50"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            animation: 'pop-in 0.2s ease both',
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--text-3)' }}>
              Renk Paleti
            </p>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {PALETTES.map((p) => {
              const active = p.id === theme;
              return (
                <button
                  key={p.id}
                  onClick={() => { setTheme(p.id); setOpen(false); }}
                  onMouseEnter={() => previewTheme(p.id)}
                  onMouseLeave={restoreTheme}
                  className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.02]"
                  style={{
                    background: active ? 'var(--bg-hover)' : 'transparent',
                    border: `1px solid ${active ? p.swatch + '60' : 'var(--border)'}`,
                    boxShadow: active ? `0 0 16px ${p.swatch}25` : 'none',
                  }}
                >
                  {/* Swatch circle with bg preview */}
                  <div
                    className="relative w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: p.bg,
                      border: `2px solid ${p.swatch}`,
                      boxShadow: `0 0 10px ${p.swatch}50`,
                    }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ background: p.swatch }} />
                    {active && (
                      <div className="absolute -right-1 -top-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: p.swatch }}>
                        <Check size={9} color="#000" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium leading-tight" style={{ color: 'var(--text-2)' }}>
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
