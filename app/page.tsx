import { ChatInterface } from '@/components/chat/ChatInterface';
import { Scissors, Star, Clock, Shield } from 'lucide-react';
import { SignedIn } from '@clerk/nextjs';

const FEATURES = [
  { icon: Clock, text: '7/24 Randevu Alma' },
  { icon: Star, text: 'Anlık Onay' },
  { icon: Shield, text: 'Güvenli & Kolay' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm mb-6">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Scissors size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Bella Güzellik Salonu</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Güzelliğiniz için<br />
            <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              akıllı randevu
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-6">
            Yapay zeka asistanımız Bella ile saniyeler içinde randevu alın. 7/24 hizmetinizdeyiz.
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-2 text-sm text-gray-600">
                <f.icon size={16} className="text-rose-500" />
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden h-[580px] flex flex-col">
            {/* Chat header */}
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                B
              </div>
              <div>
                <p className="text-white font-semibold">Bella</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <p className="text-white/80 text-xs">Çevrimiçi — Randevu asistanı</p>
                </div>
              </div>
            </div>
            <ChatInterface />
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            © 2026 Bella Güzellik Salonu
            <SignedIn>
              {' '}·{' '}
              <a href="/dashboard" className="hover:text-gray-600 transition-colors">
                Admin Paneli
              </a>
            </SignedIn>
          </p>
        </div>
      </div>
    </div>
  );
}
