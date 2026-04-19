import { Suspense } from 'react';
import { listAppointments } from '@/lib/airtable';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { AppointmentTable } from '@/components/dashboard/AppointmentTable';
import { AppointmentCalendar } from '@/components/dashboard/AppointmentCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserButton } from '@clerk/nextjs';
import { Scissors } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function DashboardContent() {
  const appointments = await listAppointments();

  return (
    <div className="space-y-6">
      <StatsOverview appointments={appointments} />

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Haftalık Takvim</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentCalendar appointments={appointments} />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Tüm Randevular</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <AppointmentTable appointments={appointments} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Scissors size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Bella Güzellik</p>
              <p className="text-xs text-gray-400">Admin Dashboard</p>
            </div>
          </div>
          <UserButton />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="h-96 flex items-center justify-center text-gray-400 text-sm">Yükleniyor...</div>}>
          <DashboardContent />
        </Suspense>
      </main>
    </div>
  );
}
