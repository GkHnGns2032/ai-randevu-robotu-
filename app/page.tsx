import { ChatInterface } from '@/components/chat/ChatInterface';
import { Scissors, Star, Clock, Shield } from 'lucide-react';
import { SignedIn } from '@clerk/nextjs';
import { CLIENT_CONFIG } from '@/config/client';

const FEATURES = [
  { icon: Clock, text: '7/24 Randevu Alma' },
  { icon: Star, text: 'Anlık Onay' },
  { icon: Shield, text: 'Güvenli & Kolay' },
];

const { businessName, assistantName } = CLIENT_CONFIG;

export default function HomePage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'radial-gradient(ellipse at center, #FDFCF9 0%, #F5EEE8 100%)' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
        {/* Hero */}
        <div className="text-center mb-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 mb-8"
            style={{
              background: '#FFFFFF',
              border: '0.5px solid #EDE4DA',
              borderRadius: '24px',
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: '#F5EEE8' }}
            >
              <Scissors size={14} style={{ color: '#7B5EA7' }} />
            </div>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#7B5EA7',
              }}
            >
              {businessName}
            </span>
          </div>

          {/* Başlık */}
          <h1 className="mb-5 leading-tight">
            <span
              className="block"
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 'clamp(42px, 6vw, 64px)',
                fontWeight: 400,
                color: '#2A2018',
                lineHeight: 1.1,
              }}
            >
              Güzelliğiniz için
            </span>
            <span
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 'clamp(42px, 6vw, 64px)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: '#7B5EA7',
                lineHeight: 1.1,
              }}
            >
              akıllı randevu
            </span>
          </h1>

          {/* Alt açıklama */}
          <p
            className="mx-auto mb-8"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 300,
              fontSize: '16px',
              color: '#8A7A70',
              maxWidth: '480px',
              lineHeight: 1.7,
            }}
          >
            Yapay zeka asistanımız {assistantName} ile saniyeler içinde randevu alın. 7/24 hizmetinizdeyiz.
          </p>

          {/* Feature chip'ler */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {FEATURES.map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-2 px-4 py-2"
                style={{
                  background: '#FFFFFF',
                  border: '0.5px solid #EDE4DA',
                  borderRadius: '20px',
                }}
              >
                <f.icon size={14} style={{ color: '#7B5EA7' }} />
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '13px',
                    fontWeight: 400,
                    color: '#5A4A40',
                  }}
                >
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-3xl overflow-hidden h-[580px] flex flex-col"
            style={{
              background: '#FDFCF9',
              border: '0.5px solid #F0E8DF',
              boxShadow: '0 4px 28px rgba(0,0,0,0.06)',
            }}
          >
            {/* Chat header */}
            <div
              className="flex items-center gap-3"
              style={{
                background: '#FDFCF9',
                padding: '22px 22px 16px',
                borderBottom: '0.5px solid #F0E8DF',
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{
                  background: 'linear-gradient(145deg, #F0E8F5, #F7E2EC)',
                  border: '1px solid #EDD8E8',
                }}
              >
                🌸
              </div>
              <div>
                <p
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '18px',
                    fontWeight: 500,
                    color: '#3A2855',
                    lineHeight: 1.2,
                  }}
                >
                  {assistantName}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="online-dot"
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: '#9EC9A8',
                      display: 'inline-block',
                    }}
                  />
                  <p
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '11px',
                      fontWeight: 300,
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase',
                      color: '#8B7B95',
                    }}
                  >
                    Çevrimiçi
                  </p>
                </div>
              </div>
            </div>
            <ChatInterface />
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            © 2026 {businessName}
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
