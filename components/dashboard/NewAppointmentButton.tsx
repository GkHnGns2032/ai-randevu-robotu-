'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppointmentForm } from './AppointmentForm';

export function NewAppointmentButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg text-sm transition-transform hover:scale-[1.02]"
        style={{ background: 'var(--gold)', color: '#fff' }}
      >
        + Yeni Randevu
      </button>
      {open && (
        <AppointmentForm
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); router.refresh(); }}
        />
      )}
    </>
  );
}
