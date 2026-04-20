'use client';
import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Appointment } from '@/lib/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CLIENT_CONFIG } from '@/config/client';

interface Props { appointments: Appointment[] }

function numToTR(n: number): string {
  const ones = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
  const tens = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli'];
  if (n === 0) return 'sıfır';
  if (n < 10) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o === 0 ? tens[t] : `${tens[t]} ${ones[o]}`;
}

function timeToTR(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  return m === 0 ? `saat ${numToTR(h)}` : `saat ${numToTR(h)} ${numToTR(m)}`;
}

function buildScript(appointments: Appointment[]): string {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const dayLabel = format(now, 'd MMMM yyyy, EEEE', { locale: tr });

  const todayList = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  if (todayList.length === 0) {
    return `${dayLabel}. ${CLIENT_CONFIG.businessName} için bugün hiç randevu bulunmuyor. İyi dinlenceler.`;
  }

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  const past = todayList.filter((a) => toMin(a.time) < nowMin);
  const upcoming = todayList.filter((a) => toMin(a.time) >= nowMin);

  const parts: string[] = [
    `${dayLabel}.`,
    `${CLIENT_CONFIG.businessName} için bugün toplam ${numToTR(todayList.length)} randevunuz var.`,
  ];

  if (past.length > 0) {
    parts.push(`Şu ana kadar ${numToTR(past.length)} tanesi tamamlandı.`);
  }

  if (upcoming.length === 0) {
    parts.push('Bugünkü tüm randevular tamamlandı.');
  } else {
    const [next, ...rest] = upcoming;
    parts.push(`Sıradaki ${timeToTR(next.time)}, ${next.customerName}, ${next.service}.`);
    for (const a of rest) {
      parts.push(`Sonra ${timeToTR(a.time)}, ${a.customerName}, ${a.service}.`);
    }
  }

  parts.push('Hepsi bu kadar. İyi günler.');
  return parts.join(' ');
}

type State = 'idle' | 'speaking' | 'unsupported';

export function VoiceSummary({ appointments }: Props) {
  const [state, setState] = useState<State>('idle');
  const [mounted, setMounted] = useState(false);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setMounted(true);
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

  if (state === 'unsupported' || !mounted) return null;

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
