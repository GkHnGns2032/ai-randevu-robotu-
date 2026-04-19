'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

const DARK_THEMES = ['obsidian', 'ocean', 'midnight', 'amethyst'];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dark = DARK_THEMES.includes(theme);
  const toggle = () => setTheme(dark ? 'ivory' : 'obsidian');

  return (
    <button
      onClick={toggle}
      aria-label="Tema değiştir"
      className="relative flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
      style={{
        background: 'var(--bg-hover)',
        border: '1px solid var(--border)',
        color: 'var(--text-2)',
      }}
    >
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: dark
            ? 'radial-gradient(circle at 70% 30%, rgba(212,175,110,0.12), transparent 60%)'
            : 'radial-gradient(circle at 30% 70%, rgba(139,90,20,0.08), transparent 60%)',
        }}
      />
      <div className="relative transition-transform duration-300" style={{ color: 'var(--gold)' }}>
        {dark ? <Moon size={16} strokeWidth={1.5} /> : <Sun size={16} strokeWidth={1.5} />}
      </div>
    </button>
  );
}
