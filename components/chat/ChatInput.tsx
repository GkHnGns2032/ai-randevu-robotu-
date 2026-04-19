'use client';
import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
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
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Mesajınızı yazın..."
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
