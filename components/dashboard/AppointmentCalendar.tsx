import { Appointment } from '@/lib/types';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Props {
  appointments: Appointment[];
  weekStart?: Date;
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9-18

export function AppointmentCalendar({ appointments, weekStart = new Date() }: Props) {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 });
  const days = Array.from({ length: 6 }, (_, i) => addDays(start, i)); // Mon-Sat

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-7 gap-1 mb-2">
          <div className="text-xs text-gray-400 py-2" />
          {days.map((day) => (
            <div key={day.toISOString()} className="text-center py-2">
              <p className="text-xs text-gray-400 uppercase">{format(day, 'EEE', { locale: tr })}</p>
              <p className={`text-sm font-semibold mt-0.5 ${isSameDay(day, new Date()) ? 'text-rose-600' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-7 gap-1 min-h-[48px] border-t border-gray-50">
            <div className="text-xs text-gray-300 py-1 pr-2 text-right">{hour}:00</div>
            {days.map((day) => {
              const appts = appointments.filter((a) => {
                if (!isSameDay(new Date(a.date), day)) return false;
                const apptHour = parseInt(a.time.split(':')[0]);
                return apptHour === hour;
              });
              return (
                <div key={day.toISOString()} className="relative">
                  {appts.map((a) => (
                    <div
                      key={a.id}
                      className="absolute inset-x-0 top-0.5 mx-0.5 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded text-xs p-1 leading-tight truncate"
                      style={{ height: `${(a.durationMinutes / 60) * 48 - 4}px` }}
                    >
                      <p className="font-medium truncate">{a.customerName}</p>
                      <p className="opacity-80 truncate">{a.service}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
