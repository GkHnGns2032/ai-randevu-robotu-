// lib/types.ts

export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled';

export type ServiceType =
  | 'Saç Kesimi'
  | 'Saç Boyama'
  | 'Manikür'
  | 'Pedikür'
  | 'Kaş Tasarımı'
  | 'Cilt Bakımı'
  | 'Masaj'
  | 'Kalıcı Makyaj';

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  service: ServiceType;
  date: string;        // ISO 8601: "2026-04-20"
  time: string;        // "14:30"
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;   // ISO 8601 datetime
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TimeSlot {
  date: string;   // "2026-04-20"
  time: string;   // "14:30"
  available: boolean;
}

export const SERVICE_DURATIONS: Record<ServiceType, number> = {
  'Saç Kesimi': 45,
  'Saç Boyama': 120,
  'Manikür': 60,
  'Pedikür': 60,
  'Kaş Tasarımı': 30,
  'Cilt Bakımı': 90,
  'Masaj': 60,
  'Kalıcı Makyaj': 120,
};

export const WORKING_HOURS = {
  start: 9,   // 09:00
  end: 19,    // 19:00
  slotMinutes: 30,
};
