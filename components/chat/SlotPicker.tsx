'use client';
import { useState } from 'react';

interface SlotPickerProps {
  slots: string[];
  onSelect: (time: string) => void;
}

export function SlotPicker({ slots, onSelect }: SlotPickerProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleClick(time: string) {
    if (selected) return;
    setSelected(time);
    onSelect(time);
  }

  if (slots.length === 0) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '0.5px solid #DDD0F0',
          borderRadius: '14px',
          padding: '14px',
          boxShadow: '0 1px 6px rgba(107,80,128,0.07)',
        }}
      >
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: '#8B7B95', margin: 0 }}>
          Müsait saat bulunamadı.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '0.5px solid #DDD0F0',
        borderRadius: '14px',
        padding: '14px',
        boxShadow: '0 1px 6px rgba(107,80,128,0.07)',
      }}
    >
      <p
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0.3px',
          textTransform: 'uppercase' as const,
          color: '#8B7B95',
          margin: '0 0 10px 0',
        }}
      >
        Bir saat seçin
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}
      >
        {slots.map((time, i) => (
          <button
            key={`${time}-${i}`}
            onClick={() => handleClick(time)}
            disabled={!!selected}
            aria-pressed={selected === time}
            style={{
              background: selected === time ? '#EBE2F5' : '#FDFCF9',
              border: `1px solid ${selected === time ? '#C9ADE0' : '#DDD0F0'}`,
              color: '#6B3FA0',
              padding: '11px 10px',
              borderRadius: '8px',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              cursor: selected ? 'not-allowed' : 'pointer',
              opacity: selected !== null && selected !== time ? 0.45 : 1,
              transition: 'background 0.12s, border-color 0.12s, opacity 0.12s',
            }}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  );
}
