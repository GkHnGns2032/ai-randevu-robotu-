'use client';
import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      recognitionRef.current?.stop();
      setMicState('idle');
    } else {
      recognitionRef.current?.start();
      setMicState('listening');
    }
  }

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    if (micState === 'listening') recognitionRef.current?.stop();
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex gap-2 p-4 bg-white border-t border-gray-100">
      {micState !== 'unsupported' && (
        <button
          onClick={toggleMic}
          disabled={disabled}
          aria-label={micState === 'listening' ? 'Mikrofonu durdur' : 'Sesli yaz'}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: micState === 'listening'
              ? 'linear-gradient(135deg, #f43f5e, #e11d48)'
              : '#f3f4f6',
            color: micState === 'listening' ? '#fff' : '#9ca3af',
            animation: micState === 'listening' ? 'pulse 1.5s ease-in-out infinite' : 'none',
            boxShadow: micState === 'listening' ? '0 0 0 4px rgba(244,63,94,0.2)' : 'none',
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
        className="flex-1 rounded-full border-gray-200 focus-visible:ring-rose-400"
      />

      <Button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        size="icon"
        aria-label="Mesaj gönder"
        className="rounded-full bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
      >
        <Send size={16} />
      </Button>
    </div>
  );
}
