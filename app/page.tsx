import { ChatInterface } from '@/components/chat/ChatInterface';
import { Scissors, Star, Clock, Shield } from 'lucide-react';
import { SignedIn } from '@clerk/nextjs';
import { CLIENT_CONFIG } from '@/config/client';

const FEATURES = [
  { icon: Clock, text: '7/24 Randevu Alma' },
  { icon: Star, text: 'Anlık Onay' },
  { icon: Shield, text: 'Güvenli & Kolay' },
];

const { businessName, assistantName, welcomeEmoji } = CLIENT_CONFIG;

export default function HomePage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'radial-gradient(ellipse at center, var(--c-surface) 0%, var(--c-page-to) 100%)' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
        {/* Hero */}
        <div className="text-center mb-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 mb-8"
            style={{
              background: 'var(--c-surface-raised)',
              border: '0.5px solid var(--c-border)',
              borderRadius: '24px',
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'var(--c-page-to)' }}
            >
              <Scissors size={14} style={{ color: 'var(--c-brand)' }} />
            </div>
            <span
              style={{
                fontFamily: 'var(--c-font-sans)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--c-brand)',
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
                fontFamily: 'var(--c-font-serif)',
                fontSize: 'clamp(42px, 6vw, 64px)',
                fontWeight: 400,
                color: 'var(--c-heading)',
                lineHeight: 1.1,
              }}
            >
              Güzelliğiniz için
            </span>
            <span
              style={{
                fontFamily: 'var(--c-font-serif)',
                fontSize: 'clamp(42px, 6vw, 64px)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'var(--c-brand)',
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
              fontFamily: 'var(--c-font-sans)',
              fontWeight: 300,
              fontSize: '16px',
              color: 'var(--c-text-muted)',
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
                  background: 'var(--c-surface-raised)',
                  border: '0.5px solid var(--c-border)',
                  borderRadius: '20px',
                }}
              >
                <f.icon size={14} style={{ color: 'var(--c-brand)' }} />
                <span
                  style={{
                    fontFamily: 'var(--c-font-sans)',
                    fontSize: '13px',
                    fontWeight: 400,
                    color: 'var(--c-text-chip)',
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
              background: 'var(--c-surface)',
              border: '0.5px solid var(--c-border-soft)',
              boxShadow: '0 4px 28px rgba(0,0,0,0.06)',
            }}
          >
            {/* Chat header */}
            <div
              className="flex items-center gap-3"
              style={{
                background: 'var(--c-surface)',
                padding: '22px 22px 16px',
                borderBottom: '0.5px solid var(--c-border-soft)',
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{
                  background: 'linear-gradient(145deg, var(--c-avatar-from), var(--c-avatar-to))',
                  border: '1px solid var(--c-avatar-border)',
                }}
              >
                {welcomeEmoji}
              </div>
              <div>
                <p
                  style={{
                    fontFamily: 'var(--c-font-serif)',
                    fontSize: '18px',
                    fontWeight: 500,
                    color: 'var(--c-brand-ink)',
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
                      background: 'var(--c-online)',
                      display: 'inline-block',
                    }}
                  />
                  <p
                    style={{
                      fontFamily: 'var(--c-font-sans)',
                      fontSize: '11px',
                      fontWeight: 300,
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase',
                      color: 'var(--c-brand-subtle)',
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
