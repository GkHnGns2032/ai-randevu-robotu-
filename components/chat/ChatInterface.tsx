'use client';
import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { SlotPicker } from './SlotPicker';
import { CLIENT_CONFIG } from '@/config/client';
import { logger } from '@/lib/logger';

function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  // Canvas CSS değişkeni kabul etmez — tenant renklerini runtime'da çözüp veriyoruz.
  const rootStyle = getComputedStyle(document.documentElement);
  const colors = ['--c-confetti-1', '--c-confetti-2', '--c-confetti-3', '--c-confetti-4']
    .map((v) => rootStyle.getPropertyValue(v).trim() || '#FFFFFF');
  const particles = Array.from({ length: 27 }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * 2,
    vy: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    w: 8 + Math.random() * 8,
    h: 4 + Math.random() * 4,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.12,
    sway: Math.random() * 0.04,
    swayOffset: Math.random() * Math.PI * 2,
  }));
  const start = Date.now();
  const duration = 2500;
  let raf: number;
  function draw() {
    const elapsed = Date.now() - start;
    if (elapsed > duration) { canvas.remove(); return; }
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    const alpha = Math.max(0, 1 - elapsed / duration);
    particles.forEach((p) => {
      p.x += p.vx + Math.sin(elapsed * p.sway + p.swayOffset) * 0.5;
      p.y += p.vy;
      p.rot += p.rotSpeed;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.globalAlpha = alpha;
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx!.restore();
    });
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  setTimeout(() => { cancelAnimationFrame(raf); canvas.remove(); }, duration + 100);
}

const { assistantName, businessName, welcomeEmoji } = CLIENT_CONFIG;

const INITIAL_MESSAGE: ChatMessage = {
  id: 'initial',
  role: 'assistant',
  content: `Merhaba, ben ${assistantName} — ${businessName} randevu asistanıyım. Size nasıl yardımcı olabilirim?`,
  timestamp: new Date(),
};

const QUICK_REPLIES = ['Randevu al', 'Hizmetler', 'Çalışma saatleri'];

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [welcomeIn, setWelcomeIn] = useState(false);
  const [pendingSlots, setPendingSlots] = useState<{ date: string; staffId?: string; times: string[] } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMsgRef = useRef<HTMLDivElement>(null);
  const confettiMsgRef = useRef<string | null>(null);
  const newMsgIdsRef = useRef<Set<string>>(new Set());

  const lastMessageId = messages[messages.length - 1]?.id;
  const lastMessageRole = messages[messages.length - 1]?.role;

  useEffect(() => {
    const t = setTimeout(() => setWelcomeIn(true), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('bella-chat-history');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as ChatMessage[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (messages.length <= 1) return;
    const t = setTimeout(() => {
      localStorage.setItem('bella-chat-history', JSON.stringify(messages));
    }, 300);
    return () => clearTimeout(t);
  }, [messages]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant' || !last.id) return;
    if (last.id === confettiMsgRef.current) return;
    const c = last.content.toLowerCase();
    if (c.includes('oluşturuldu') || c.includes('randevunuz hazır')) {
      confettiMsgRef.current = last.id;
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 400);
      launchConfetti();
    }
  }, [messages]);

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
    setPendingSlots(null);
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() };
    newMsgIdsRef.current.add(userMessage.id!);
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    const assistantId = crypto.randomUUID();
    newMsgIdsRef.current.add(assistantId);
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        let chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        const markerMatch = chunk.match(/\x00SLOTS:date=([^;]+);(?:staff=([^;]*);)?times=([^\x00]+)\x00/);
        if (markerMatch) {
          setPendingSlots({
            date: markerMatch[1],
            staffId: markerMatch[2] || undefined,
            times: markerMatch[3].split(','),
          });
          chunk = chunk.replace(/\x00SLOTS:[^\x00]+\x00/g, '');
        }
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
    } catch (err) {
      logger.error('chat_send_failed', {
        component: 'ChatInterface',
        error: err instanceof Error ? err.message : String(err),
      });
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

  const showQuickReplies = messages.length === 1 && !loading;

  return (
    <div className="flex flex-col flex-1 min-h-0 relative" style={{ background: 'var(--c-surface)' }}>
      {showFlash && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'white', zIndex: 10, animation: 'flash-white 400ms ease-out both' }}
        />
      )}
      {messages.length > 1 && (
        <div className="flex justify-end px-4 pt-2">
          <button
            onClick={() => {
              setMessages([INITIAL_MESSAGE]);
              setPendingSlots(null);
              localStorage.removeItem('bella-chat-history');
            }}
            className="transition-colors hover:opacity-80"
            style={{
              fontFamily: 'var(--c-font-sans)',
              fontSize: '11px',
              fontWeight: 300,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
              color: 'var(--c-brand-subtle)',
            }}
          >
            Yeni Sohbet
          </button>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          const isInitial = m.id === 'initial';
          return (
            <div
              key={m.id ?? i}
              ref={isLast ? lastMsgRef : null}
              style={isInitial ? {
                opacity: welcomeIn ? 1 : 0,
                transform: welcomeIn ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.92)',
                transition: 'opacity 600ms cubic-bezier(0.34,1.56,0.64,1), transform 600ms cubic-bezier(0.34,1.56,0.64,1)',
              } : undefined}
            >
              <MessageBubble
                message={m}
                isNew={!isInitial && newMsgIdsRef.current.has(m.id ?? '')}
              />
            </div>
          );
        })}

        {showQuickReplies && (
          <div className="flex flex-wrap gap-2 mb-4 ml-[56px]">
            {QUICK_REPLIES.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSend(chip)}
                disabled={loading}
                className="quick-reply-chip disabled:opacity-50"
                style={{
                  fontFamily: 'var(--c-font-sans)',
                  fontSize: '12px',
                  fontWeight: 400,
                  color: 'var(--c-brand-muted)',
                  borderRadius: '20px',
                  padding: '7px 14px',
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {pendingSlots && pendingSlots.times.length > 0 && lastMessageRole === 'assistant' && !loading && (
          <div className="ml-[56px] mt-[-8px] mb-5">
            <SlotPicker
              slots={pendingSlots.times}
              onSelect={(time) => {
                const captured = pendingSlots;
                setPendingSlots(null);
                fetch('/api/hold-slot', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ date: captured.date, time, staffId: captured.staffId }),
                }).catch(() => { /* hold fail — book sirasinda isSlotStillAvailable double-check korur */ });
                handleSend(time);
              }}
            />
          </div>
        )}

        {loading && (
          <div className="flex gap-3 mb-5">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0"
              style={{
                background: 'linear-gradient(145deg, var(--c-avatar-from), var(--c-avatar-to))',
                border: '1px solid var(--c-avatar-border)',
              }}
            >
              {welcomeEmoji}
            </div>
            <div
              style={{
                padding: '13px 17px',
                background: 'var(--c-surface-raised)',
                border: '0.5px solid var(--c-border)',
                borderRadius: '20px 20px 20px 4px',
                display: 'flex',
                gap: '5px',
                alignItems: 'center',
              }}
            >
              {[0, 200, 400].map((delay) => (
                <span
                  key={delay}
                  style={{
                    width: '5px',
                    height: '5px',
                    background: 'var(--c-dots)',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'pulse-dot 1.4s ease-in-out infinite',
                    animationDelay: `${delay}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
