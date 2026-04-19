// lib/types.ts
import { CLIENT_CONFIG, ServiceName } from '@/config/client';

export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled';

export type ServiceType = ServiceName;

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
  isNoShow?: boolean;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TimeSlot {
  date: string;   // "2026-04-20"
  time: string;   // "14:30"
  available: boolean;
}

export const SERVICE_DURATIONS: Record<ServiceType, number> = Object.fromEntries(
  CLIENT_CONFIG.services.map((s) => [s.name, s.duration])
) as Record<ServiceType, number>;

export const WORKING_HOURS = {
  start: CLIENT_CONFIG.workingHours.start,
  end: CLIENT_CONFIG.workingHours.end,
  slotMinutes: CLIENT_CONFIG.workingHours.slotMinutes,
};
