import { Appointment } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Props {
  appointments: Appointment[];
}

const STATUS_CONFIG = {
  confirmed: { label: 'Onaylandı', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pending: { label: 'Bekliyor', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  cancelled: { label: 'İptal', className: 'bg-red-100 text-red-700 border-red-200' },
};

export function AppointmentTable({ appointments }: Props) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">Henüz randevu bulunmuyor</p>
        <p className="text-sm mt-1">Randevular burada görünecek</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label="Randevu listesi">
        <thead>
          <tr className="border-b border-gray-100">
            {['Müşteri', 'Hizmet', 'Tarih', 'Saat', 'Süre', 'Durum'].map((h) => (
              <th key={h} scope="col" className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => {
            const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG['pending'];
            return (
              <tr key={appt.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{appt.customerName}</p>
                  <p className="text-xs text-gray-400">{appt.customerPhone}</p>
                </td>
                <td className="py-3 px-4 text-gray-700">{appt.service}</td>
                <td className="py-3 px-4 text-gray-700">
                  {format(parseISO(appt.date), 'd MMMM yyyy', { locale: tr })}
                </td>
                <td className="py-3 px-4 text-gray-700">{appt.time}</td>
                <td className="py-3 px-4 text-gray-500">{appt.durationMinutes} dk</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
                    {cfg.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
