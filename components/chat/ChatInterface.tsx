'use client';
import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'initial',
  role: 'assistant',
  content: 'Merhaba! Ben Bella, Bella Güzellik Salonu\'nun randevu asistanıyım. 💇‍♀️\n\nSize nasıl yardımcı olabilirim? Hangi hizmetimizden yararlanmak istersiniz?',
  timestamp: new Date(),
};

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(text: string) {
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages
            .filter((m) => m !== INITIAL_MESSAGE)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json() as { message: string };
      const reply = data.message ?? 'Bir hata oluştu. Lütfen tekrar deneyin.';
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: reply, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: 'Bir hata oluştu. Lütfen tekrar deneyin.', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ScrollArea className="flex-1 px-4 py-6">
        {messages.map((m, i) => (
          <MessageBubble key={m.id ?? i} message={m} />
        ))}
        {loading && (
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
              B
            </div>
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </ScrollArea>
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
