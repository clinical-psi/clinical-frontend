import type { AppointmentStatus, CancellationReason, CancellationRequester } from "../../data/http/appointmentsApi";

export const APPOINTMENT_STATUSES: Record<AppointmentStatus, { label: string; color: string; marker: string }> = {
  SCHEDULED: { label: "Agendada", color: "blue", marker: "○" },
  CONFIRMED: { label: "Confirmada", color: "teal", marker: "✓" },
  COMPLETED: { label: "Atendida", color: "gray", marker: "✓✓" },
  NO_SHOW: { label: "No asistió", color: "orange", marker: "!" },
  CANCELLED: { label: "Cancelada", color: "red", marker: "×" },
};

export const CANCELLATION_REASONS: Record<CancellationReason, string> = {
  PATIENT_REQUEST: "Solicitud del paciente",
  SPECIALIST_UNAVAILABLE: "Especialista no disponible",
  CLINIC_DECISION: "Decisión de la clínica",
  RESCHEDULED: "Reprogramación",
  OTHER: "Otro",
};

export const CANCELLATION_REQUESTERS: Record<CancellationRequester, string> = {
  PATIENT: "Paciente",
  SPECIALIST: "Especialista",
  CLINIC: "Clínica",
};
