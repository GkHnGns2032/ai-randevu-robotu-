'use client';

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="text-center py-16 text-gray-500">
      <p>Randevular yüklenirken bir hata oluştu.</p>
      <button onClick={reset} className="mt-4 text-rose-600 underline">Tekrar dene</button>
    </div>
  );
}
