'use client';
import { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Props {
  message: ChatMessage;
  isNew?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderContent(text: string, isUser: boolean): string {
  const escaped = escapeHtml(text);
  if (isUser) return escaped.replace(/\n/g, '<br/>');
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export function MessageBubble({ message, isNew }: Props) {
  const isUser = message.role === 'user';
  const lower = message.content.toLowerCase();
  const isSuccess = !isUser && (lower.includes('oluşturuldu') || lower.includes('randevunuz hazır'));

  return (
    <div className={cn('flex gap-3 mb-5', isNew && 'msg-enter', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0"
          style={{
            background: 'linear-gradient(145deg, #F0E8F5, #F7E2EC)',
            border: '1px solid #EDD8E8',
          }}
        >
          🌸
        </div>
      )}
      <div className={cn('flex flex-col max-w-[75%] group', isUser ? 'items-end' : 'items-start')}>
        <div
          dangerouslySetInnerHTML={{ __html: renderContent(message.content, isUser) }}
          className={isSuccess ? 'success-bubble' : undefined}
          style={{
            padding: '13px 17px',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '13.5px',
            fontWeight: 400,
            lineHeight: 1.6,
            color: '#3A2855',
            background: isUser ? '#EBE2F5' : '#FFFFFF',
            border: isSuccess ? '1px solid #9EC9A8' : isUser ? 'none' : '0.5px solid #EDE4DA',
            borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          }}
        />
        <p
          suppressHydrationWarning
          className="mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '10px',
            fontWeight: 300,
            color: '#C8BAB0',
          }}
        >
          {format(message.timestamp, 'HH:mm', { locale: tr })}
        </p>
      </div>
    </div>
  );
}
