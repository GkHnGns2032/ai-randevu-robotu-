'use client';
import { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          B
        </div>
      )}
      <div
        className={cn(
          'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-br-sm'
            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={cn('text-xs mt-1 opacity-60', isUser ? 'text-right' : 'text-left')}>
          {format(message.timestamp, 'HH:mm', { locale: tr })}
        </p>
      </div>
    </div>
  );
}
