import type { PaymentStatus } from '@/lib/types';

const CFG: Record<PaymentStatus, { label: string; color: string; bg: string; border: string }> = {
  unpaid:  { label: 'Ödenmedi', color: 'var(--rose)',  bg: 'rgba(240,160,168,0.08)', border: 'rgba(240,160,168,0.2)' },
  partial: { label: 'Kısmen',   color: 'var(--amber)', bg: 'rgba(240,200,112,0.08)', border: 'rgba(240,200,112,0.2)' },
  paid:    { label: 'Ödendi',   color: 'var(--mint)',  bg: 'rgba(126,222,208,0.08)', border: 'rgba(126,222,208,0.2)' },
};

export function PaymentBadge({ status }: { status: PaymentStatus | undefined }) {
  const cfg = CFG[status ?? 'unpaid'];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}
