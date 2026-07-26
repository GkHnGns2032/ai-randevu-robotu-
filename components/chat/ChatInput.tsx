'use client';
import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

interface SpeechRec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

type MicState = 'idle' | 'listening' | 'unsupported';

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const [micState, setMicState] = useState<MicState>('idle');
  const [rippleActive, setRippleActive] = useState(false);
  const recognitionRef = useRef<SpeechRec | null>(null);

  useEffect(() => {
    const w = window as Window & { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Rec = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!Rec) { setMicState('unsupported'); return; }

    const rec = new Rec();
    rec.lang = 'tr-TR';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? '';
      if (transcript) setValue((prev) => (prev ? prev + ' ' + transcript : transcript));
    };
    rec.onend = () => setMicState('idle');
    rec.onerror = () => setMicState('idle');

    recognitionRef.current = rec;
  }, []);

  function toggleMic() {
    if (micState === 'listening') {
      try { recognitionRef.current?.stop(); } catch { /* zaten durmuş */ }
      setMicState('idle');
    } else {
      try {
        recognitionRef.current?.start();
      } catch { /* zaten başlamış — state'i yine de listening yap */ }
      setMicState('listening');
    }
  }

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    if (micState === 'listening') recognitionRef.current?.stop();
    onSend(trimmed);
    setValue('');
    setRippleActive(true);
    setTimeout(() => setRippleActive(false), 400);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex gap-2 p-4" style={{ background: 'var(--c-page-to)' }}>
      {micState !== 'unsupported' && (
        <button
          onClick={toggleMic}
          disabled={disabled}
          aria-label={micState === 'listening' ? 'Mikrofonu durdur' : 'Sesli yaz'}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: micState === 'listening' ? 'var(--c-brand)' : 'var(--c-chip-bg)',
            color: micState === 'listening' ? 'var(--c-surface-raised)' : 'var(--c-brand-muted)',
            border: '1px solid var(--c-chip-border)',
            animation: micState === 'listening' ? 'pulse 1.5s ease-in-out infinite' : 'none',
            boxShadow: micState === 'listening' ? '0 0 0 4px rgba(123,94,167,0.18)' : 'none',
          }}
        >
          {micState === 'listening' ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      )}

      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={micState === 'listening' ? 'Dinliyorum...' : 'Mesajınızı yazın...'}
        disabled={disabled}
        className="flex-1 rounded-[24px] border-[color:var(--c-border)] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[color:var(--c-brand)] focus-visible:shadow-[0_0_0_4px_rgba(var(--c-brand-rgb),0.15)] transition-[border-color,box-shadow] duration-200"
        style={{
          fontFamily: 'var(--c-font-sans)',
          fontSize: '13.5px',
          color: 'var(--c-brand-ink)',
          background: 'var(--c-surface-raised)',
          padding: '0 18px',
          height: '40px',
        }}
      />

      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Mesaj gönder"
        className="relative overflow-hidden flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full disabled:opacity-40"
        style={{
          background: 'var(--c-brand)',
          color: 'var(--c-surface-raised)',
          border: 'none',
          cursor: disabled || !value.trim() ? 'default' : 'pointer',
          transition: 'transform 180ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 180ms ease',
        }}
        onMouseEnter={e => { if (!disabled && value.trim()) { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.12)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(123,94,167,0.45)'; } }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
        onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)'; }}
        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.12)'; }}
      >
        <Send size={16} />
        {rippleActive && (
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: 'white', animation: 'ripple-out 450ms ease-out both' }}
          />
        )}
      </button>
    </div>
  );
}
