import type { AppointmentMode } from "../data/http/appointmentsApi";

/** 1 = lunes … 7 = domingo (ISO-8601, igual que el backend). */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AvailabilityExceptionType = "BLOCKED" | "EXTRA";

export interface AvailabilityRule {
  id?: number;
  specialistId?: number;
  dayOfWeek: DayOfWeek;
  /** HH:mm o HH:mm:ss */
  startTime: string;
  endTime: string;
  appointmentMode?: AppointmentMode | null;
  locationHallId?: number | null;
  slotMinutes?: number | null;
  bufferMinutes?: number | null;
  validFrom?: string | null;
  validTo?: string | null;
  timeZone?: string | null;
}

export interface AvailabilityExceptionRequest {
  type: AvailabilityExceptionType;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  reason?: string;
  appointmentMode?: AppointmentMode | null;
  locationHallId?: number | null;
  slotMinutes?: number | null;
  timeZone?: string | null;
}

export interface AvailabilityException {
  id: number;
  specialistId: number;
  type: AvailabilityExceptionType;
  startAt: string;
  endAt: string;
  allDay: boolean;
  reason?: string;
  appointmentMode?: AppointmentMode;
  locationHallId?: number;
  slotMinutes?: number;
  overlappingAppointments: number;
}

export interface AvailableSlot {
  specialistId: number;
  start: string;
  end: string;
  appointmentMode?: AppointmentMode;
  locationHallId?: number;
}

/** Evento de fondo listo para FullCalendar (EventInput). */
export interface AvailabilityCalendarEvent {
  id: string;
  groupId: string;
  resourceId: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  display: string;
  backgroundColor: string;
  classNames: string[];
  extendedProps: {
    type: "AVAILABLE" | "BLOCKED";
    specialistId: number;
    source?: "RULE" | "EXTRA";
    reason?: string;
    [key: string]: unknown;
  };
}

export interface AvailabilityCalendarFilter {
  start: string;
  end: string;
  specialistIds?: string[];
  appointmentMode?: AppointmentMode;
  locationHallId?: string;
}
