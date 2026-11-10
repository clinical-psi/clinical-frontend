import {
  appointmentsApi,
  type CreateAppointmentRequest,
  type FilterAppointmentsRequest,
} from "../data/http/appointmentsApi";

export const appointmentService = {
  update: async (appointmentId: string, request: CreateAppointmentRequest) => {
    return appointmentsApi.update(appointmentId, request);
  },

  create: async (patientId: string, request: CreateAppointmentRequest) => {
    return appointmentsApi.create(patientId, request);
  },

  getByFilters: async (request: FilterAppointmentsRequest) => {
    return appointmentsApi.getByFilters(request);
  },

  transition: appointmentsApi.transition,
  history: appointmentsApi.history,
};
