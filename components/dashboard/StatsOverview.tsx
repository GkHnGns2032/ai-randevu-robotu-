import { Appointment } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';

interface Props {
  appointments: Appointment[];
}

export function StatsOverview({ appointments }: Props) {
  const confirmed = appointments.filter((a) => a.status === 'confirmed');
  const todayCount = confirmed.filter((a) => isToday(new Date(a.date))).length;
  const weekCount = confirmed.filter((a) => isThisWeek(new Date(a.date))).length;
  const monthCount = confirmed.filter((a) => isThisMonth(new Date(a.date))).length;
  const totalCount = confirmed.length;

  const stats = [
    { label: 'Bugün', value: todayCount, icon: Clock, color: 'from-rose-500 to-pink-600' },
    { label: 'Bu Hafta', value: weekCount, icon: Calendar, color: 'from-purple-500 to-indigo-600' },
    { label: 'Bu Ay', value: monthCount, icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
    { label: 'Toplam', value: totalCount, icon: Users, color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className={`bg-gradient-to-br ${stat.color} p-4 text-white`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium opacity-90">{stat.label}</span>
                <stat.icon size={18} className="opacity-80" />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-xs opacity-75 mt-1">Onaylanmış randevu</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
