import { post, del } from "./httpClient";

export type AppointmentMode = "ONLINE" | "INPERSON";

export type Appointment = {
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
  };
  appointmentMode: AppointmentMode;
  feeAmount?: string;
  currencyCode?: string;
  location?: {
    id: string;
    name?: string;
    hallName?: string;
    address?: string;
  };
};

export type FilterAppointmentsRequest = {
  startDate: string;
  endDate: string;
  specialistIds: string[];
  appointmentModes: AppointmentMode[];
};

export type CreateAppointmentRequest = {
  specialistId: string;
  locationId?: string;
  appointmentMode: AppointmentMode;
  appointmentStartDate: string;
  appointmentEndDate: string;
  feeAmount: string;
  currencyCode: string;
  notes?: string;
  paidIndicator: boolean;
};

export const appointmentsApi = {
  create: async (patientId: string, request: CreateAppointmentRequest) => {
    return post<Appointment>(`/patients/${patientId}/appointments`, request);
  },

  getByFilters: async (request: FilterAppointmentsRequest) => {
    return post<Appointment[]>("/appointments/browse", request);
  },

  deleteById: async (appointmentId: string): Promise<void> => {
    await del(`/appointments/${appointmentId}`);
  },
};
