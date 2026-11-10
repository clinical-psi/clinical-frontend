import { get, post, put } from "./httpClient";

export type AppointmentMode = "ONLINE" | "INPERSON";
export type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type AppointmentAction = "CONFIRM" | "CANCEL" | "COMPLETE" | "NO_SHOW" | "EDIT";
export type CancellationReason = "PATIENT_REQUEST" | "SPECIALIST_UNAVAILABLE" | "CLINIC_DECISION" | "RESCHEDULED" | "OTHER";
export type CancellationRequester = "PATIENT" | "SPECIALIST" | "CLINIC";
export type AppointmentTransition = {
  reasonCode?: CancellationReason;
  requestedBy?: CancellationRequester;
  note?: string;
};
export type AppointmentHistory = AppointmentTransition & {
  id: number;
  fromStatus: AppointmentStatus;
  toStatus: AppointmentStatus;
  actorName: string;
  createdAt: string;
};

export type Appointment = {
  status: AppointmentStatus;
  allowedActions: AppointmentAction[];
  id: string;
  appointmentStartDate: string;
  appointmentEndDate: string;
  notes?: string;
  patient?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  specialist?: {
    id: string;
    firstName?: string;
    lastName?: string;
    shortName?: string;
    agendaColor?: string;
  };
  appointmentMode: AppointmentMode;
  feeAmount?: string;
  currencyCode?: string;
  paidIndicator?: boolean;
  locationHall?: {
    id: string;
    locationId: number;
    name?: string;
    hallName?: string;
    address?: string;
  };
};

export type FilterAppointmentsRequest = {
  statuses?: AppointmentStatus[];
  startDate: string;
  endDate: string;
  specialistIds: string[];
  appointmentModes: AppointmentMode[];
};

export type CreateAppointmentRequest = {
  specialistId: string;
  locationHallId?: string;
  appointmentMode: AppointmentMode;
  appointmentStartDate: string;
  appointmentEndDate: string;
  feeAmount: string;
  currencyCode: string;
  notes?: string;
  paidIndicator: boolean;
};

export const appointmentsApi = {
  update: async (appointmentId: string, request: CreateAppointmentRequest) => {
    return put<Appointment>(`/appointments/${appointmentId}`, request);
  },

  create: async (patientId: string, request: CreateAppointmentRequest) => {
    return post<Appointment>(`/patients/${patientId}/appointments`, request);
  },

  getByFilters: async (request: FilterAppointmentsRequest) => {
    return post<Appointment[]>("/appointments/browse", request);
  },

  transition: (appointmentId: string, action: Exclude<AppointmentAction, "EDIT">, request: AppointmentTransition = {}) => {
    const paths = { CONFIRM: "confirm", CANCEL: "cancel", COMPLETE: "complete", NO_SHOW: "no-show" };
    return post<Appointment>(`/appointments/${appointmentId}/${paths[action]}`, request);
  },
  history: (appointmentId: string) => get<AppointmentHistory[]>(`/appointments/${appointmentId}/history`),
};
