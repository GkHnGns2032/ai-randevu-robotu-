'use client';
import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { CLIENT_CONFIG } from '@/config/client';

const { assistantName, businessName, welcomeEmoji } = CLIENT_CONFIG;

const INITIAL_MESSAGE: ChatMessage = {
  id: 'initial',
  role: 'assistant',
  content: `Merhaba! Ben ${assistantName}, ${businessName}'nun randevu asistanıyım. ${welcomeEmoji}\n\nSize nasıl yardımcı olabilirim? Hangi hizmetimizden yararlanmak istersiniz?`,
  timestamp: new Date(),
};

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMsgRef = useRef<HTMLDivElement>(null);

  const lastMessageId = messages[messages.length - 1]?.id;
  const lastMessageRole = messages[messages.length - 1]?.role;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (lastMessageRole === 'assistant' && lastMsgRef.current) {
      // Bot mesajı: mesajın başını göster (sadece ilk eklendiğinde, stream sırasında tekrarlama yok)
      const top = lastMsgRef.current.offsetTop - 12;
      container.scrollTo({ top, behavior: 'smooth' });
    } else {
      // Kullanıcı mesajı veya loading: en alta git
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [lastMessageId, lastMessageRole, loading]);

  async function handleSend(text: string) {
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    const assistantId = crypto.randomUUID();
    let started = false;

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

      if (!res.ok || !res.body) {
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        if (!started) {
          started = true;
          setLoading(false);
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: 'assistant', content: chunk, timestamp: new Date() },
          ]);
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
          );
        }
      }

      if (!started) {
        // Stream boş geldi — yedek mesaj
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: 'Bir hata oluştu. Lütfen tekrar deneyin.', timestamp: new Date() },
        ]);
      }
    } catch {
      if (!started) {
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: 'Bir hata oluştu. Lütfen tekrar deneyin.', timestamp: new Date() },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50">
      {messages.length > 1 && (
        <div className="flex justify-end px-4 pt-2">
          <button
            onClick={() => setMessages([INITIAL_MESSAGE])}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Yeni Sohbet
          </button>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          return (
            <div key={m.id ?? i} ref={isLast ? lastMsgRef : null}>
              <MessageBubble message={m} />
            </div>
          );
        })}
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
      </div>
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
