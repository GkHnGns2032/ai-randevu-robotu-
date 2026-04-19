'use client';
import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Appointment } from '@/lib/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CLIENT_CONFIG } from '@/config/client';

interface Props { appointments: Appointment[] }

function buildScript(appointments: Appointment[]): string {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayList = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  const dayLabel = format(new Date(), 'd MMMM yyyy, EEEE', { locale: tr });

  if (todayList.length === 0) {
    return `${dayLabel}. ${CLIENT_CONFIG.businessName} için bugün hiç randevu bulunmuyor. İyi dinlenceler.`;
  }

  const lines = todayList.map((a, i) => {
    const [h, m] = a.time.split(':');
    const timeStr = m === '00' ? `saat ${h}` : `saat ${h} ${m}`;
    return `${i + 1}. randevu: ${timeStr}. ${a.customerName} — ${a.service}.`;
  });

  return [
    `${dayLabel}.`,
    `${CLIENT_CONFIG.businessName} için bugün ${todayList.length} randevunuz var.`,
    ...lines,
    'Hepsi bu kadar. İyi günler.',
  ].join(' ');
}

type State = 'idle' | 'speaking' | 'unsupported';

export function VoiceSummary({ appointments }: Props) {
  const [state, setState] = useState<State>('idle');
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.speechSynthesis) {
      setState('unsupported');
    }
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  function speak() {
    if (state === 'speaking') {
      window.speechSynthesis.cancel();
      setState('idle');
      return;
    }

    const script = buildScript(appointments);
    const utt = new SpeechSynthesisUtterance(script);
    utt.lang = 'tr-TR';
    utt.rate = 0.92;
    utt.pitch = 1.05;

    // Türkçe ses varsa seç
    const voices = window.speechSynthesis.getVoices();
    const trVoice = voices.find((v) => v.lang.startsWith('tr'));
    if (trVoice) utt.voice = trVoice;

    utt.onstart = () => setState('speaking');
    utt.onend = () => setState('idle');
    utt.onerror = () => setState('idle');

    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
    setState('speaking');
  }

  if (state === 'unsupported') return null;

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayCount = appointments.filter((a) => a.date === today).length;

  return (
    <button
      onClick={speak}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        background: state === 'speaking' ? 'var(--rose)' : 'var(--gold-bg)',
        border: `1px solid ${state === 'speaking' ? 'color-mix(in srgb, var(--rose) 60%, transparent)' : 'var(--border-gold)'}`,
        color: state === 'speaking' ? '#fff' : 'var(--gold)',
      }}
      title={state === 'speaking' ? 'Durdur' : 'Bugünü sesli dinle'}
    >
      {state === 'speaking' ? (
        <>
          <VolumeX size={14} strokeWidth={1.5} />
          <span>Durdur</span>
          <span
            className="flex gap-0.5 items-end"
            style={{ height: 14 }}
          >
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-0.5 rounded-full"
                style={{
                  background: '#fff',
                  animation: `sound-bar 0.8s ease-in-out ${delay}ms infinite alternate`,
                  height: 8,
                }}
              />
            ))}
          </span>
        </>
      ) : (
        <>
          <Volume2 size={14} strokeWidth={1.5} />
          <span>Bugünü Dinle</span>
          {todayCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
              style={{ background: 'var(--gold)', color: '#fff' }}
            >
              {todayCount}
            </span>
          )}
        </>
      )}
      <style>{`
        @keyframes sound-bar {
          from { height: 4px; opacity: 0.6; }
          to   { height: 14px; opacity: 1; }
        }
      `}</style>
    </button>
  );
}
